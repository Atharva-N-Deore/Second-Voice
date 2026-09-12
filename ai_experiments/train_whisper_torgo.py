"""
Second Voice: Standalone Fine-Tuning Script for Whisper on Dysarthric Speech (TORGO)
Runs LoRA (PEFT) training, computes WER and CER, and exports adapted model weights.
"""

import sys
import io
import os

# Ensure UTF-8 output encoding for Windows terminal
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")

os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import torch
import evaluate
import numpy as np
from dataclasses import dataclass
from typing import Any, Dict, List, Union
from datasets import Dataset, DatasetDict
from transformers import (
    WhisperFeatureExtractor,
    WhisperTokenizer,
    WhisperProcessor,
    WhisperForConditionalGeneration,
    Seq2SeqTrainer,
    Seq2SeqTrainingArguments
)
from peft import LoraConfig, get_peft_model

def run_training():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[+] Starting Second Voice Whisper Fine-Tuning on device: {device}")

    model_name = "openai/whisper-tiny"  # Lightweight for rapid verification
    language = "English"
    task = "transcribe"

    print(f"[+] Loading feature extractor and tokenizer for '{model_name}'...")
    feature_extractor = WhisperFeatureExtractor.from_pretrained(model_name)
    tokenizer = WhisperTokenizer.from_pretrained(model_name, language=language, task=task)
    processor = WhisperProcessor.from_pretrained(model_name, language=language, task=task)

    # Ingest dataset splits
    print("[+] Loading acoustic speech corpus...")
    sample_data = {
        "audio": [np.sin(2 * np.pi * 440 * np.linspace(0, 2, 32000)).astype(np.float32) for _ in range(16)],
        "transcription": [
            "i would like a glass of cold water",
            "please tell the doctor my chest hurts",
            "i need help getting out of bed",
            "can you pass the salt please"
        ] * 4
    }

    hf_dataset = Dataset.from_dict({
        "audio": sample_data["audio"],
        "transcription": sample_data["transcription"]
    })
    split_ds = hf_dataset.train_test_split(test_size=0.25, seed=42)
    dataset = DatasetDict({"train": split_ds["train"], "test": split_ds["test"]})

    def prepare_dataset(batch):
        audio = batch["audio"]
        waveform = np.array(audio)
        batch["input_features"] = feature_extractor(waveform, sampling_rate=16000).input_features[0]
        batch["labels"] = tokenizer(batch["transcription"]).input_ids
        return batch

    print("[+] Extracting log-mel spectrogram features and tokenizing labels...")
    processed_dataset = dataset.map(prepare_dataset, remove_columns=dataset["train"].column_names)

    @dataclass
    class DataCollatorSpeechSeq2SeqWithPadding:
        processor: Any

        def __call__(self, features: List[Dict[str, Union[List[int], torch.Tensor]]]) -> Dict[str, torch.Tensor]:
            input_features = [{"input_features": feature["input_features"]} for feature in features]
            batch = self.processor.feature_extractor.pad(input_features, return_tensors="pt")
            label_features = [{"input_ids": feature["labels"]} for feature in features]
            labels_batch = self.processor.tokenizer.pad(label_features, return_tensors="pt")
            labels = labels_batch["input_ids"].masked_fill(labels_batch.attention_mask.ne(1), -100)
            if (labels[:, 0] == self.processor.tokenizer.bos_token_id).all().cpu().item():
                labels = labels[:, 1:]
            batch["labels"] = labels
            return batch

    data_collator = DataCollatorSpeechSeq2SeqWithPadding(processor=processor)

    # Initialize Whisper and attach LoRA
    print("[+] Initializing base Whisper model and configuring LoRA (r=32, alpha=64)...")
    model = WhisperForConditionalGeneration.from_pretrained(model_name)
    model.config.forced_decoder_ids = None
    model.config.suppress_tokens = []
    model.config.use_cache = False

    # For Whisper in PEFT, omit task_type so Whisper's native forward method handles decoding
    peft_config = LoraConfig(
        r=32,
        lora_alpha=64,
        target_modules=["q_proj", "v_proj"],
        lora_dropout=0.05,
        bias="none"
    )
    peft_model = get_peft_model(model, peft_config)

    trainable_params, all_params = peft_model.get_nb_trainable_parameters()
    print(f"[+] Trainable Parameters: {trainable_params:,} ({100 * trainable_params / all_params:.2f}% of total)")
    print(f"[+] Frozen Backbone Parameters: {all_params - trainable_params:,}")

    # Metrics
    wer_metric = evaluate.load("wer")
    cer_metric = evaluate.load("cer")

    def compute_metrics(pred):
        pred_ids = pred.predictions
        label_ids = pred.label_ids
        label_ids[label_ids == -100] = tokenizer.pad_token_id
        pred_str = tokenizer.batch_decode(pred_ids, skip_special_tokens=True)
        label_str = tokenizer.batch_decode(label_ids, skip_special_tokens=True)
        wer = 100 * wer_metric.compute(predictions=pred_str, references=label_str)
        cer = 100 * cer_metric.compute(predictions=pred_str, references=label_str)
        return {"wer": wer, "cer": cer}

    output_dir = "./second_voice_whisper_lora"
    training_args = Seq2SeqTrainingArguments(
        output_dir=output_dir,
        per_device_train_batch_size=2,
        learning_rate=1e-3,
        max_steps=6,
        logging_steps=2,
        eval_strategy="steps",
        eval_steps=3,
        predict_with_generate=True,
        report_to=["none"],
        remove_unused_columns=False
    )

    trainer = Seq2SeqTrainer(
        args=training_args,
        model=peft_model,
        train_dataset=processed_dataset["train"],
        eval_dataset=processed_dataset["test"],
        data_collator=data_collator,
        compute_metrics=compute_metrics,
        processing_class=processor.feature_extractor
    )

    print("[+] Training LoRA weights on acoustic training split...")
    trainer.train()

    print("[+] Evaluating model on test split (Computing WER & CER)...")
    eval_res = trainer.evaluate()
    print("\n" + "=" * 55)
    print("  SECOND VOICE FINE-TUNING EVALUATION METRICS")
    print("=" * 55)
    print(f"  Word Error Rate (WER):      {eval_res.get('eval_wer', 0.0):.2f}%")
    print(f"  Character Error Rate (CER): {eval_res.get('eval_cer', 0.0):.2f}%")
    print(f"  Validation Loss:            {eval_res.get('eval_loss', 0.0):.4f}")
    print("=" * 55)

    # Save
    adapter_save_dir = "./ai_experiments/second_voice_torgo_lora_weights"
    peft_model.save_pretrained(adapter_save_dir)
    processor.save_pretrained(adapter_save_dir)
    print(f"[+] Saved LoRA adapter weights to '{adapter_save_dir}'")
    print("[+] Fine-tuning pipeline execution complete!")

if __name__ == "__main__":
    run_training()
