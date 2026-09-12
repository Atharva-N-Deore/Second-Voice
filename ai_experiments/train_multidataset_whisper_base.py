"""
Second Voice: Multi-Dataset Whisper-Base Fine-Tuning Pipeline
Datasets:
  1. TORGO Database (Dysarthric Speech)
  2. UGAkan-ImpairedSpeechData (Mendeley Data)
  3. Dysarthria and Non-Dysarthria Speech Dataset (Kaggle)
  4. Project Boli (GitHub / Open-Source)

Target Model: openai/whisper-base
Optimized for: Google Colab NVIDIA Tesla T4 (16 GB VRAM)
Technique: Parameter-Efficient Fine-Tuning (PEFT / LoRA) with fp16
"""

import os
import sys
import gc
import json
import shutil
import zipfile
import glob
from dataclasses import dataclass
from typing import Any, Dict, List, Union, Optional

import torch
import numpy as np
import soundfile as sf
import librosa
import evaluate
from datasets import Dataset, DatasetDict, concatenate_datasets, Audio
from transformers import (
    WhisperFeatureExtractor,
    WhisperTokenizer,
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments,
    EarlyStoppingCallback
)
from transformers.models.whisper.english_normalizer import BasicTextNormalizer
from peft import LoraConfig, get_peft_model, PeftModel

# Fix Colab torchao version mismatch if pre-installed
try:
    import peft.import_utils
    peft.import_utils.is_torchao_available = lambda: False
except Exception:
    pass

# ==========================================
# 1. CONFIGURATION & HYPERPARAMETERS
# ==========================================
MODEL_NAME = "openai/whisper-base"
LANGUAGE = "English"
TASK = "transcribe"
SAMPLING_RATE = 16000

# Training settings optimized for T4 GPU (16GB)
NUM_EPOCHS = 75               # Range: 50 - 100 epochs for deep convergence
BATCH_SIZE = 8                # Fits comfortably on T4 with fp16
GRADIENT_ACCUMULATION = 2     # Effective batch size = 16
LEARNING_RATE = 1.5e-4        # Smooth learning rate tailored for 50-100 epochs
WARMUP_RATIO = 0.05           # 5% warmup across extended epochs
LORA_R = 32
LORA_ALPHA = 64
LORA_DROPOUT = 0.05
TARGET_MODULES = ["q_proj", "v_proj"]

OUTPUT_DIR = "./whisper_base_multidataset_checkpoints"
FINAL_ADAPTER_DIR = "./second_voice_whisper_base_lora"
EXPORT_ZIP_NAME = "second_voice_whisper_base_weights.zip"

print(f"[+] Using PyTorch version: {torch.__version__}")
device = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[+] Active compute device: {device}")
if torch.cuda.is_available():
    print(f"[+] GPU: {torch.cuda.get_device_name(0)}")
    print(f"[+] Total VRAM: {torch.cuda.get_device_properties(0).total_memory / (1024**3):.2f} GB")


# ==========================================
# 2. DATASET INGESTION & PARSERS
# ==========================================

def load_audio_file(file_path: str, target_sr: int = 16000) -> Optional[np.ndarray]:
    """Load and resample audio file to mono 16kHz float32."""
    try:
        audio, sr = librosa.load(file_path, sr=target_sr, mono=True)
        return audio.astype(np.float32)
    except Exception as e:
        print(f"[!] Warning: Failed to load audio {file_path}: {e}")
        return None


def ingest_torgo_dataset(torgo_dir: str = "/content/torgo_data") -> Optional[Dataset]:
    """
    Ingest TORGO Dysarthria Dataset.
    Expected structure:
      torgo_dir/
        [speaker_id]/
          [session]/
            wav_arrayMic/ or wav_headMic/ (audio files)
            prompts/ (text files matching audio names)
    OR standard Hugging Face format / CSV.
    """
    print("\n[+] Scanning TORGO dataset...")
    
    # Check if a manifest or directory exists
    audio_paths = []
    transcriptions = []

    # 1. Check directory structure
    if os.path.isdir(torgo_dir):
        # Look for prompt text files
        prompt_files = glob.glob(os.path.join(torgo_dir, "**", "prompts", "*.txt"), recursive=True)
        if not prompt_files:
            prompt_files = glob.glob(os.path.join(torgo_dir, "**", "*.txt"), recursive=True)

        for pf in prompt_files:
            try:
                with open(pf, "r", encoding="utf-8", errors="ignore") as f:
                    text = f.read().strip()
                if not text or len(text) < 2:
                    continue
                
                # Match corresponding wav file
                base_name = os.path.splitext(os.path.basename(pf))[0]
                parent = os.path.dirname(os.path.dirname(pf))
                
                # Candidate wav locations
                candidates = [
                    os.path.join(parent, "wav_arrayMic", f"{base_name}.wav"),
                    os.path.join(parent, "wav_headMic", f"{base_name}.wav"),
                    os.path.join(parent, f"{base_name}.wav"),
                    os.path.join(os.path.dirname(pf), f"{base_name}.wav"),
                ]
                wav_path = next((c for c in candidates if os.path.isfile(c)), None)
                if wav_path:
                    audio_paths.append(wav_path)
                    transcriptions.append(text)
            except Exception:
                continue

    if audio_paths:
        print(f"  -> Found {len(audio_paths)} TORGO audio samples.")
        return Dataset.from_dict({
            "audio_path": audio_paths,
            "transcription": transcriptions,
            "dataset_source": ["torgo"] * len(audio_paths)
        })
    else:
        print("  -> TORGO directory not found or empty at path:", torgo_dir)
        return None


def ingest_ugakan_dataset(ugakan_dir: str = "/content/ugakan_data") -> Optional[Dataset]:
    """
    Ingest Mendeley Data: UGAkan-ImpairedSpeechData.
    Expected structure:
      ugakan_dir/
        *.wav
        transcriptions.csv / prompts.csv / metadata.csv
        OR paired .txt files.
    """
    print("\n[+] Scanning UGAkan-ImpairedSpeechData (Mendeley)...")
    if not os.path.isdir(ugakan_dir):
        print("  -> UGAkan directory not found at path:", ugakan_dir)
        return None

    audio_paths = []
    transcriptions = []

    # Check for metadata csv
    meta_files = glob.glob(os.path.join(ugakan_dir, "**", "*.csv"), recursive=True)
    if meta_files:
        import csv
        for mf in meta_files:
            try:
                with open(mf, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        # Inspect common header keys
                        path_key = next((k for k in row.keys() if "audio" in k.lower() or "file" in k.lower() or "wav" in k.lower()), None)
                        text_key = next((k for k in row.keys() if "text" in k.lower() or "transcript" in k.lower() or "prompt" in k.lower() or "label" in k.lower()), None)
                        if path_key and text_key:
                            fname = row[path_key]
                            # Resolve path
                            full_path = fname if os.path.isabs(fname) else os.path.join(os.path.dirname(mf), fname)
                            if not os.path.isfile(full_path):
                                full_path = os.path.join(ugakan_dir, os.path.basename(fname))
                            if os.path.isfile(full_path) and row[text_key].strip():
                                audio_paths.append(full_path)
                                transcriptions.append(row[text_key].strip())
            except Exception as e:
                print(f"  -> Error parsing CSV {mf}: {e}")

    # Fallback to paired txt and wav files
    if not audio_paths:
        wav_files = glob.glob(os.path.join(ugakan_dir, "**", "*.wav"), recursive=True)
        for wf in wav_files:
            base = os.path.splitext(wf)[0]
            txt_candidates = [f"{base}.txt", f"{base}.tsv", f"{base}_transcript.txt"]
            txt_path = next((t for t in txt_candidates if os.path.isfile(t)), None)
            if txt_path:
                try:
                    with open(txt_path, "r", encoding="utf-8", errors="ignore") as f:
                        text = f.read().strip()
                    if text:
                        audio_paths.append(wf)
                        transcriptions.append(text)
                except Exception:
                    continue

    if audio_paths:
        print(f"  -> Found {len(audio_paths)} UGAkan impaired speech samples.")
        return Dataset.from_dict({
            "audio_path": audio_paths,
            "transcription": transcriptions,
            "dataset_source": ["ugakan"] * len(audio_paths)
        })
    else:
        print("  -> No matched audio-transcript pairs found in UGAkan.")
        return None


def ingest_kaggle_dysarthria(kaggle_dir: str = "/content/kaggle_dysarthria") -> Optional[Dataset]:
    """
    Ingest Kaggle Dysarthria and Non-Dysarthria Speech Dataset.
    Expected structure:
      kaggle_dir/
        dysarthria/ or dysarthric/
        non_dysarthria/ or control/
        labels.csv / prompts / filenames as word labels
    """
    print("\n[+] Scanning Dysarthria & Non-Dysarthria Speech Dataset (Kaggle)...")
    if not os.path.isdir(kaggle_dir):
        print("  -> Kaggle Dysarthria directory not found at path:", kaggle_dir)
        return None

    audio_paths = []
    transcriptions = []

    # Check for metadata csv
    csv_files = glob.glob(os.path.join(kaggle_dir, "**", "*.csv"), recursive=True)
    if csv_files:
        import csv
        for mf in csv_files:
            try:
                with open(mf, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f)
                    for row in reader:
                        path_key = next((k for k in row.keys() if any(sub in k.lower() for sub in ["path", "file", "wav", "audio"])), None)
                        text_key = next((k for k in row.keys() if any(sub in k.lower() for sub in ["transcription", "prompt", "word", "text", "label"])), None)
                        if path_key and text_key:
                            fname = row[path_key]
                            full_path = fname if os.path.isabs(fname) else os.path.join(os.path.dirname(mf), fname)
                            if not os.path.isfile(full_path):
                                full_path = os.path.join(kaggle_dir, os.path.basename(fname))
                            if os.path.isfile(full_path) and row[text_key].strip():
                                audio_paths.append(full_path)
                                transcriptions.append(row[text_key].strip())
            except Exception:
                pass

    # If no CSV, filename often encodes the prompt (e.g. '01_hello_dysarthric.wav' or folder name)
    if not audio_paths:
        wav_files = glob.glob(os.path.join(kaggle_dir, "**", "*.wav"), recursive=True)
        for wf in wav_files:
            # Check for paired text file first
            base = os.path.splitext(wf)[0]
            txt_file = f"{base}.txt"
            if os.path.isfile(txt_file):
                with open(txt_file, "r", encoding="utf-8", errors="ignore") as f:
                    t = f.read().strip()
                if t:
                    audio_paths.append(wf)
                    transcriptions.append(t)
                    continue

            # Fallback: extract prompt word from filename if isolated word format
            raw_name = os.path.splitext(os.path.basename(wf))[0]
            # e.g., 'FC01_Session1_0001_word' -> clean text
            parts = raw_name.replace("-", "_").split("_")
            meaningful = [p for p in parts if not p.isdigit() and len(p) > 1 and not p.lower().startswith(("wav", "mic", "spk"))]
            if meaningful:
                prompt_guess = " ".join(meaningful)
                audio_paths.append(wf)
                transcriptions.append(prompt_guess)

    if audio_paths:
        print(f"  -> Found {len(audio_paths)} Kaggle Dysarthria speech samples.")
        return Dataset.from_dict({
            "audio_path": audio_paths,
            "transcription": transcriptions,
            "dataset_source": ["kaggle_dysarthria"] * len(audio_paths)
        })
    else:
        print("  -> No audio samples resolved for Kaggle dataset.")
        return None


def ingest_project_boli(boli_dir: str = "/content/project_boli") -> Optional[Dataset]:
    """
    Ingest Project Boli (GitHub / Open-Source) Speech Dataset.
    Expected structure:
      boli_dir/
        audio/ (*.wav, *.mp3, *.ogg)
        transcripts.json / metadata.tsv / data.csv
    """
    print("\n[+] Scanning Project Boli Speech Dataset (GitHub)...")
    if not os.path.isdir(boli_dir):
        print("  -> Project Boli directory not found at path:", boli_dir)
        return None

    audio_paths = []
    transcriptions = []

    # Check for metadata JSON
    json_files = glob.glob(os.path.join(boli_dir, "**", "*.json"), recursive=True)
    for jf in json_files:
        try:
            with open(jf, "r", encoding="utf-8") as f:
                data = json.load(f)
            if isinstance(data, list):
                for item in data:
                    if isinstance(item, dict):
                        f_path = item.get("audio") or item.get("path") or item.get("audio_filepath")
                        text = item.get("text") or item.get("transcription") or item.get("sentence")
                        if f_path and text:
                            full = f_path if os.path.isabs(f_path) else os.path.join(os.path.dirname(jf), f_path)
                            if not os.path.isfile(full):
                                full = os.path.join(boli_dir, os.path.basename(f_path))
                            if os.path.isfile(full):
                                audio_paths.append(full)
                                transcriptions.append(text.strip())
        except Exception:
            pass

    # Check for metadata TSV/CSV
    if not audio_paths:
        tsv_files = glob.glob(os.path.join(boli_dir, "**", "*.tsv"), recursive=True) + \
                    glob.glob(os.path.join(boli_dir, "**", "*.csv"), recursive=True)
        for tf in tsv_files:
            sep = "\t" if tf.endswith(".tsv") else ","
            try:
                import csv
                with open(tf, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.DictReader(f, delimiter=sep)
                    for row in reader:
                        p_k = next((k for k in row.keys() if "audio" in k.lower() or "file" in k.lower() or "path" in k.lower()), None)
                        t_k = next((k for k in row.keys() if "text" in k.lower() or "transcript" in k.lower() or "sentence" in k.lower()), None)
                        if p_k and t_k and row[p_k] and row[t_k]:
                            fname = row[p_k]
                            full = fname if os.path.isabs(fname) else os.path.join(os.path.dirname(tf), fname)
                            if not os.path.isfile(full):
                                full = os.path.join(boli_dir, os.path.basename(fname))
                            if os.path.isfile(full):
                                audio_paths.append(full)
                                transcriptions.append(row[t_k].strip())
            except Exception:
                pass

    if audio_paths:
        print(f"  -> Found {len(audio_paths)} Project Boli speech samples.")
        return Dataset.from_dict({
            "audio_path": audio_paths,
            "transcription": transcriptions,
            "dataset_source": ["project_boli"] * len(audio_paths)
        })
    else:
        print("  -> No audio samples resolved for Project Boli.")
        return None


def create_synthetic_calibration_corpus() -> Dataset:
    """
    Fallback acoustic calibration dataset ensuring pipeline execution even if
    local dataset downloads are in progress.
    """
    print("\n[!] Notice: Generating acoustic calibration samples to verify pipeline...")
    sr = 16000
    phrases = [
        "i would like a glass of cold water please",
        "please call the nurse my chest is hurting",
        "i need help moving to the wheelchair",
        "turn on the lights in the living room",
        "can you pass me the salt and pepper",
        "thank you very much for your assistance",
        "where is the nearest accessible bathroom",
        "i am having trouble speaking clearly today"
    ]
    
    audio_data = []
    transcripts = []
    for phrase in phrases * 4:
        duration = np.random.uniform(1.5, 3.0)
        t = np.linspace(0, duration, int(sr * duration), endpoint=False)
        # Multi-harmonic tone simulating vocal resonance + gentle noise
        waveform = (0.3 * np.sin(2 * np.pi * 220 * t) + 
                    0.2 * np.sin(2 * np.pi * 440 * t) + 
                    0.05 * np.random.normal(0, 1, len(t))).astype(np.float32)
        audio_data.append(waveform)
        transcripts.append(phrase)

    return Dataset.from_dict({
        "audio_array": audio_data,
        "transcription": transcripts,
        "dataset_source": ["synthetic_calibration"] * len(transcripts)
    })


# ==========================================
# 3. PREPROCESSING & FEATURE EXTRACTION
# ==========================================

@dataclass
class DataCollatorSpeechSeq2SeqWithPadding:
    processor: Any

    def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:
        input_features = [{"input_features": feature["input_features"]} for feature in features]
        batch = self.processor.feature_extractor.pad(input_features, return_tensors="pt")

        label_features = [{"input_ids": feature["labels"]} for feature in features]
        labels_batch = self.processor.tokenizer.pad(label_features, return_tensors="pt")

        # Replace padding with -100 so cross entropy ignores them
        labels = labels_batch["input_ids"].masked_fill(labels_batch.attention_mask.ne(1), -100)

        # Cut start token if present
        if (labels[:, 0] == self.processor.tokenizer.bos_token_id).all().cpu().item():
            labels = labels[:, 1:]

        batch["labels"] = labels
        return batch


def run_training_pipeline(
    torgo_path: str = "/content/torgo_data",
    ugakan_path: str = "/content/ugakan_data",
    kaggle_path: str = "/content/kaggle_dysarthria",
    boli_path: str = "/content/project_boli"
):
    print("=" * 65)
    print("  SECOND VOICE: MULTI-DATASET WHISPER-BASE FINE-TUNING")
    print("=" * 65)

    # 1. Ingest datasets
    datasets_to_merge = []
    for loader, path in [
        (ingest_torgo_dataset, torgo_path),
        (ingest_ugakan_dataset, ugakan_path),
        (ingest_kaggle_dysarthria, kaggle_path),
        (ingest_project_boli, boli_path)
    ]:
        ds = loader(path)
        if ds is not None and len(ds) > 0:
            datasets_to_merge.append(ds)

    has_audio_arrays = False
    if datasets_to_merge:
        combined_ds = concatenate_datasets(datasets_to_merge)
        print(f"\n✅ Successfully aggregated {len(combined_ds)} samples across {len(datasets_to_merge)} corpora.")
    else:
        print("\n⚠️ No external dataset directories found. Using acoustic calibration corpus.")
        combined_ds = create_synthetic_calibration_corpus()
        has_audio_arrays = True

    # 2. Split train and test
    split = combined_ds.train_test_split(test_size=0.15, seed=42)
    raw_dataset = DatasetDict({"train": split["train"], "test": split["test"]})
    print(f"[+] Dataset Split: {len(raw_dataset['train'])} train, {len(raw_dataset['test'])} test.")

    # 3. Load processor, tokenizer, and feature extractor for whisper-base
    print(f"\n[+] Loading Whisper-Base Feature Extractor & Tokenizer for '{MODEL_NAME}'...")
    feature_extractor = WhisperFeatureExtractor.from_pretrained(MODEL_NAME)
    tokenizer = WhisperTokenizer.from_pretrained(MODEL_NAME, language=LANGUAGE, task=TASK)
    processor = WhisperProcessor.from_pretrained(MODEL_NAME, language=LANGUAGE, task=TASK)
    normalizer = BasicTextNormalizer()

    # 4. Feature extraction mapping function
    def prepare_sample(batch):
        if has_audio_arrays:
            waveform = np.array(batch["audio_array"], dtype=np.float32)
        else:
            path = batch["audio_path"]
            waveform = load_audio_file(path, target_sr=SAMPLING_RATE)
            if waveform is None or len(waveform) == 0:
                waveform = np.zeros(SAMPLING_RATE, dtype=np.float32)

        # Truncate to 30s max (Whisper limit)
        max_len = 30 * SAMPLING_RATE
        if len(waveform) > max_len:
            waveform = waveform[:max_len]

        batch["input_features"] = feature_extractor(
            waveform, sampling_rate=SAMPLING_RATE
        ).input_features[0]

        # Clean transcription
        cleaned_text = normalizer(batch["transcription"])
        if not cleaned_text.strip():
            cleaned_text = batch["transcription"]
        batch["labels"] = tokenizer(cleaned_text).input_ids
        return batch

    print("[+] Extracting log-mel spectrogram features and tokenizing targets...")
    processed_dataset = raw_dataset.map(
        prepare_sample,
        remove_columns=raw_dataset["train"].column_names,
        num_proc=1
    )

    data_collator = DataCollatorSpeechSeq2SeqWithPadding(processor=processor)

    # 5. Initialize Whisper-Base and Configure PEFT / LoRA
    print(f"\n[+] Instantiating '{MODEL_NAME}' with LoRA adapters...")
    model = WhisperForConditionalGeneration.from_pretrained(MODEL_NAME)
    model.config.forced_decoder_ids = None
    model.config.suppress_tokens = []
    model.config.use_cache = False
    model.gradient_checkpointing_enable()

    peft_config = LoraConfig(
        r=LORA_R,
        lora_alpha=LORA_ALPHA,
        target_modules=TARGET_MODULES,
        lora_dropout=LORA_DROPOUT,
        bias="none"
    )
    peft_model = get_peft_model(model, peft_config)

    trainable_params, all_params = peft_model.get_nb_trainable_parameters()
    print(f"  • Trainable Parameters: {trainable_params:,} ({100 * trainable_params / all_params:.2f}%)")
    print(f"  • Frozen Base Parameters: {all_params - trainable_params:,}")

    # 6. Evaluation metrics: WER and CER
    wer_metric = evaluate.load("wer")
    cer_metric = evaluate.load("cer")

    def compute_metrics(pred):
        pred_ids = pred.predictions
        label_ids = pred.label_ids
        label_ids[label_ids == -100] = tokenizer.pad_token_id
        pred_str = tokenizer.batch_decode(pred_ids, skip_special_tokens=True)
        label_str = tokenizer.batch_decode(label_ids, skip_special_tokens=True)
        
        # Apply normalizer for fair WER/CER scoring
        norm_pred = [normalizer(p) for p in pred_str]
        norm_label = [normalizer(l) for l in label_str]

        wer = 100 * wer_metric.compute(predictions=norm_pred, references=norm_label)
        cer = 100 * cer_metric.compute(predictions=norm_pred, references=norm_label)
        return {"wer": wer, "cer": cer}

    # 7. Training Arguments optimized for T4 GPU (cross-version safe)
    import inspect
    args_sig = inspect.signature(Seq2SeqTrainingArguments.__init__).parameters

    args_dict = {
        "output_dir": OUTPUT_DIR,
        "per_device_train_batch_size": BATCH_SIZE,
        "gradient_accumulation_steps": GRADIENT_ACCUMULATION,
        "learning_rate": LEARNING_RATE,
        "num_train_epochs": NUM_EPOCHS,
        "lr_scheduler_type": "cosine",
        "fp16": torch.cuda.is_available(),
        "save_strategy": "epoch",
        "save_total_limit": 2,
        "load_best_model_at_end": True,
        "metric_for_best_model": "wer",
        "greater_is_better": False,
        "predict_with_generate": True,
        "generation_max_length": 128,
        "logging_steps": 10,
        "report_to": ["none"],
        "remove_unused_columns": False
    }

    # Handle eval_strategy vs evaluation_strategy
    if "eval_strategy" in args_sig:
        args_dict["eval_strategy"] = "epoch"
    elif "evaluation_strategy" in args_sig:
        args_dict["evaluation_strategy"] = "epoch"

    # Handle warmup_ratio vs warmup_steps
    if "warmup_ratio" in args_sig:
        args_dict["warmup_ratio"] = WARMUP_RATIO
    elif "warmup_steps" in args_sig:
        args_dict["warmup_steps"] = 50

    # Filter strictly accepted parameters
    safe_training_args = {k: v for k, v in args_dict.items() if k in args_sig}
    training_args = Seq2SeqTrainingArguments(**safe_training_args)

    # Handle Seq2SeqTrainer processing_class vs tokenizer
    trainer_sig = inspect.signature(Seq2SeqTrainer.__init__).parameters
    trainer_kwargs = {
        "args": training_args,
        "model": peft_model,
        "train_dataset": processed_dataset["train"],
        "eval_dataset": processed_dataset["test"],
        "data_collator": data_collator,
        "compute_metrics": compute_metrics,
        "callbacks": [EarlyStoppingCallback(early_stopping_patience=15)]
    }
    if "processing_class" in trainer_sig:
        trainer_kwargs["processing_class"] = processor.feature_extractor
    elif "tokenizer" in trainer_sig:
        trainer_kwargs["tokenizer"] = processor.feature_extractor

    trainer = Seq2SeqTrainer(**trainer_kwargs)

    print("\n🚀 Starting Multi-Dataset Whisper-Base Fine-Tuning...")
    trainer.train()

    # 8. Post-training evaluation
    print("\n📊 Evaluating fine-tuned model on test split...")
    eval_res = trainer.evaluate()
    print("\n" + "=" * 55)
    print("  FINAL FINE-TUNING EVALUATION METRICS")
    print("=" * 55)
    print(f"  Word Error Rate (WER):      {eval_res.get('eval_wer', 0.0):.2f}%")
    print(f"  Character Error Rate (CER): {eval_res.get('eval_cer', 0.0):.2f}%")
    print(f"  Validation Loss:            {eval_res.get('eval_loss', 0.0):.4f}")
    print("=" * 55)

    # 9. Save LoRA Adapter and Processor
    os.makedirs(FINAL_ADAPTER_DIR, exist_ok=True)
    peft_model.save_pretrained(FINAL_ADAPTER_DIR)
    processor.save_pretrained(FINAL_ADAPTER_DIR)
    print(f"\n[+] Saved LoRA adapter weights to: {FINAL_ADAPTER_DIR}")

    # 10. Package into zip for easy download
    print(f"[+] Compressing weights into '{EXPORT_ZIP_NAME}'...")
    with zipfile.ZipFile(EXPORT_ZIP_NAME, "w", zipfile.ZIP_DEFLATED) as zipf:
        for root, _, files in os.walk(FINAL_ADAPTER_DIR):
            for file in files:
                abs_p = os.path.join(root, file)
                rel_p = os.path.relpath(abs_p, FINAL_ADAPTER_DIR)
                zipf.write(abs_p, arcname=rel_p)

    print(f"✅ Export ready: {EXPORT_ZIP_NAME} ({os.path.getsize(EXPORT_ZIP_NAME) / (1024**2):.2f} MB)")
    return EXPORT_ZIP_NAME


if __name__ == "__main__":
    run_training_pipeline()
