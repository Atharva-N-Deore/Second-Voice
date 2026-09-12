import React, { useState } from 'react';
import { speakWithBrowserTTS } from '../services/audioRecorder';

interface VocabItem {
  id: string;
  word: string;
  category: string;
  expansion: string;
  phoneticShortcut: string;
  usageCount: number;
}

const INITIAL_VOCAB: VocabItem[] = [
  {
    id: '1',
    word: 'Amma',
    category: 'Family & People',
    expansion: 'My mother, Lakshmi.',
    phoneticShortcut: 'ah-mah / uh-ma',
    usageCount: 48
  },
  {
    id: '2',
    word: 'Rahul',
    category: 'Work',
    expansion: 'Rahul Sharma, Lead Project Engineer on my team.',
    phoneticShortcut: 'rah-hool / r-hul',
    usageCount: 32
  },
  {
    id: '3',
    word: 'Need BiPAP adjust',
    category: 'Medical & Care',
    expansion: 'My respiratory BiPAP mask pressure needs immediate adjustment.',
    phoneticShortcut: 'bee-pap / mask press',
    usageCount: 19
  },
  {
    id: '4',
    word: 'Chai Low Sugar',
    category: 'Everyday',
    expansion: 'Could I please get a hot cup of masala chai with half sugar?',
    phoneticShortcut: 'ch-chai / tea low sug',
    usageCount: 56
  }
];

export const VocabularyScreen: React.FC = () => {
  const [vocabList, setVocabList] = useState<VocabItem[]>(INITIAL_VOCAB);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

  const [newWord, setNewWord] = useState({
    word: '',
    category: 'Everyday',
    expansion: '',
    phoneticShortcut: ''
  });

  const categories = ['All', 'Family & People', 'Medical & Care', 'Everyday', 'Work'];

  const filteredVocab = vocabList.filter((item) => {
    const matchesCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.expansion.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word || !newWord.expansion) return;
    const newItem: VocabItem = {
      id: Date.now().toString(),
      word: newWord.word,
      category: newWord.category,
      expansion: newWord.expansion,
      phoneticShortcut: newWord.phoneticShortcut || newWord.word.toLowerCase(),
      usageCount: 1
    };
    setVocabList([newItem, ...vocabList]);
    setNewWord({ word: '', category: 'Everyday', expansion: '', phoneticShortcut: '' });
    setIsAddModalOpen(false);
  };

  const handleDelete = (id: string) => {
    setVocabList(vocabList.filter(item => item.id !== id));
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Delight Intro Banner */}
      <div style={{
        backgroundColor: 'var(--surface-container-low)',
        borderRadius: '20px',
        padding: '20px',
        position: 'relative',
        overflow: 'hidden',
        border: '1px solid var(--outline-variant)'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
              <span className="material-symbols-outlined" style={{ fontSize: '18px', color: 'var(--primary)' }}>
                psychology_alt
              </span>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--primary)'
              }}>
                Personal AI Model Tuned
              </span>
            </div>
            <h1 style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '24px',
              fontWeight: 700,
              color: 'var(--on-surface)'
            }}>
              My Vocabulary
            </h1>
            <p style={{
              fontSize: '14px',
              color: 'var(--on-surface-variant)',
              marginTop: '4px',
              lineHeight: 1.4
            }}>
              Words, names, and personal shorthand that help Second Voice reconstruct your speech with dignity and warmth.
            </p>
          </div>

          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '50%',
            backgroundColor: 'var(--secondary-container)',
            color: 'var(--on-secondary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>auto_stories</span>
          </div>
        </div>

        {/* Quick Stat Pill Bar */}
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          marginTop: '16px',
          paddingTop: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface-container-lowest)',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid var(--outline-variant)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--tertiary)' }} />
            <span>{vocabList.length} Custom Phrasings</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface-container-lowest)',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--primary)' }}>verified</span>
            <span>97.4% Avg Recognition</span>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'var(--surface-container-lowest)',
            padding: '6px 12px',
            borderRadius: '999px',
            fontSize: '12px',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            border: '1px solid var(--outline-variant)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '15px', color: 'var(--secondary)' }}>sync</span>
            <span>Synced to Core Engine</span>
          </div>
        </div>
      </div>

      {/* Primary Action Duo */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
        <button
          onClick={() => setIsAddModalOpen(true)}
          style={{
            height: '50px',
            backgroundColor: 'var(--primary)',
            color: 'var(--on-primary)',
            borderRadius: '14px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '15px',
            boxShadow: '0 2px 6px rgba(119, 90, 1, 0.2)'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>add_circle</span>
          <span>Add Word</span>
        </button>

        <button
          onClick={() => alert('Exporting/Importing vocabulary JSON list')}
          style={{
            height: '50px',
            backgroundColor: 'var(--surface-container-lowest)',
            color: 'var(--on-surface)',
            borderRadius: '14px',
            border: '1px solid var(--outline-variant)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontFamily: 'var(--font-heading)',
            fontWeight: 700,
            fontSize: '15px'
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: '20px', color: 'var(--secondary)' }}>upload_file</span>
          <span>Import List</span>
        </button>
      </div>

      {/* Search & Category Filter */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ position: 'relative' }}>
          <span className="material-symbols-outlined" style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--outline)',
            fontSize: '20px'
          }}>
            search
          </span>
          <input
            type="text"
            placeholder="Search words, names, or meanings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              height: '46px',
              backgroundColor: 'var(--surface-container-lowest)',
              color: 'var(--on-surface)',
              paddingLeft: '40px',
              paddingRight: '16px',
              borderRadius: '12px',
              border: '1px solid var(--outline-variant)',
              fontFamily: 'var(--font-body)',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>

        {/* Categories horizontal list */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '999px',
                  backgroundColor: isSelected ? 'var(--primary)' : 'var(--surface-container-lowest)',
                  color: isSelected ? 'var(--on-primary)' : 'var(--on-surface-variant)',
                  border: isSelected ? 'none' : '1px solid var(--outline-variant)',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Vocabulary List Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredVocab.map((item) => (
          <div
            key={item.id}
            style={{
              backgroundColor: 'var(--surface-container-lowest)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--outline-variant)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.03)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(201, 164, 76, 0.2)',
                  color: 'var(--primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                    {item.category === 'Family & People' ? 'favorite' :
                     item.category === 'Work' ? 'business_center' :
                     item.category === 'Medical & Care' ? 'medical_services' : 'local_cafe'}
                  </span>
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: '17px',
                      fontWeight: 700,
                      color: 'var(--on-surface)'
                    }}>
                      "{item.word}"
                    </h3>
                    <span style={{
                      backgroundColor: 'var(--tertiary-fixed)',
                      color: 'var(--on-tertiary-fixed-variant)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '999px'
                    }}>
                      {item.category}
                    </span>
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--on-surface-variant)', marginTop: '2px' }}>
                    Acoustic prompt shortcut: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{item.phoneticShortcut}</code>
                  </p>
                </div>
              </div>

              {/* Speak preview audio button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <button
                  onClick={() => speakWithBrowserTTS(item.expansion)}
                  aria-label="Listen preview"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-container-low)',
                    color: 'var(--primary)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>volume_up</span>
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  aria-label="Delete word"
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: 'var(--surface-container-low)',
                    color: 'var(--error)',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>delete</span>
                </button>
              </div>
            </div>

            {/* Expansion Card Box */}
            <div style={{
              backgroundColor: 'var(--surface-container-low)',
              padding: '10px 12px',
              borderRadius: '10px',
              fontSize: '14px',
              color: 'var(--on-surface)',
              lineHeight: 1.4
            }}>
              <strong>Expands To:</strong> {item.expansion}
            </div>
          </div>
        ))}
      </div>

      {/* Add Word Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(28, 27, 26, 0.6)',
          backdropFilter: 'blur(8px)',
          zIndex: 60,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '16px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '480px',
            backgroundColor: 'var(--surface)',
            borderRadius: '20px',
            padding: '24px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            border: '1px solid var(--outline-variant)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: 700 }}>
                Add Custom Vocabulary
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--on-surface-variant)' }}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleAddSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Word or Shorthand (What you say/vocalize)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Doc Smith / Need Ice"
                  value={newWord.word}
                  onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface-container-lowest)'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Category
                </label>
                <select
                  value={newWord.category}
                  onChange={(e) => setNewWord({ ...newWord, category: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface-container-lowest)'
                  }}
                >
                  <option value="Family & People">Family & People</option>
                  <option value="Medical & Care">Medical & Care</option>
                  <option value="Everyday">Everyday</option>
                  <option value="Work">Work</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Full Natural Sentence Expansion
                </label>
                <textarea
                  placeholder="e.g. Could I please have a cold ice pack for my knee?"
                  value={newWord.expansion}
                  onChange={(e) => setNewWord({ ...newWord, expansion: e.target.value })}
                  style={{
                    width: '100%',
                    height: '70px',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface-container-lowest)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '14px'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>
                  Phonetic / Slurred Sounds (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. n-need... i-ice"
                  value={newWord.phoneticShortcut}
                  onChange={(e) => setNewWord({ ...newWord, phoneticShortcut: e.target.value })}
                  style={{
                    width: '100%',
                    height: '42px',
                    padding: '0 12px',
                    borderRadius: '10px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'var(--surface-container-lowest)'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  style={{
                    padding: '10px 16px',
                    borderRadius: '10px',
                    border: '1px solid var(--outline-variant)',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--primary)',
                    color: 'var(--on-primary)',
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  Save Word
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
