import React, { useState } from 'react';

interface QuickAssistMatrixProps {
  onSpeakPhrase: (text: string) => void;
  selectedContext: string;
}

interface QuickPhrase {
  id: string;
  category: string;
  label: string;
  spokenText: string;
  icon: string;
}

const DEFAULT_PHRASES: QuickPhrase[] = [
  { id: '1', category: 'Essentials', label: 'Yes, please', spokenText: 'Yes, please.', icon: 'check' },
  { id: '2', category: 'Essentials', label: 'No, thank you', spokenText: 'No, thank you.', icon: 'close' },
  { id: '3', category: 'Essentials', label: 'Need Water', spokenText: 'Could I please have a glass of water?', icon: 'water_drop' },
  { id: '4', category: 'Essentials', label: 'Restroom', spokenText: 'I need to use the restroom, please.', icon: 'wc' },
  { id: '5', category: 'Needs', label: 'Need Assistance', spokenText: 'I need assistance right now, please come over.', icon: 'front_hand' },
  { id: '6', category: 'Needs', label: 'Feeling Cold', spokenText: 'I am feeling quite cold, could you get a blanket or turn up the heat?', icon: 'ac_unit' },
  { id: '7', category: 'Needs', label: 'Feeling Warm', spokenText: 'It is a bit warm here, could we get some fresh air or a fan?', icon: 'air' },
  { id: '8', category: 'Medical', label: 'Experiencing Pain', spokenText: 'I am experiencing some pain and discomfort.', icon: 'medical_services' },
  { id: '9', category: 'Medical', label: 'Medication Time', spokenText: 'Is it time for my scheduled medication?', icon: 'pill' },
  { id: '10', category: 'Social', label: 'Give me a moment', spokenText: 'Please give me a moment to gather my thoughts.', icon: 'hourglass_empty' },
  { id: '11', category: 'Social', label: 'Thank You', spokenText: 'Thank you very much for your patience and help.', icon: 'favorite' },
  { id: '12', category: 'Social', label: 'I understand', spokenText: 'I understand what you are saying.', icon: 'done_all' },
];

export const QuickAssistMatrix: React.FC<QuickAssistMatrixProps> = ({
  onSpeakPhrase,
  selectedContext,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activePhraseId, setActivePhraseId] = useState<string | null>(null);

  const categories = ['All', 'Essentials', 'Needs', 'Medical', 'Social'];

  const filteredPhrases =
    activeCategory === 'All'
      ? DEFAULT_PHRASES
      : DEFAULT_PHRASES.filter((p) => p.category === activeCategory);

  const handleTrigger = (phrase: QuickPhrase) => {
    setActivePhraseId(phrase.id);
    onSpeakPhrase(phrase.spokenText);
    setTimeout(() => setActivePhraseId(null), 1200);
  };

  return (
    <div className="lux-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Matrix Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-symbols-outlined" style={{ color: 'var(--gold-primary)', fontSize: '20px' }}>
            grid_view
          </span>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '15px', fontWeight: 800, margin: 0 }}>
            Quick Assist Matrix
          </h3>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
          1-TAP BROADCAST
        </span>
      </div>

      {/* Category Pills */}
      <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
        {categories.map((cat) => {
          const isSelected = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '4px 10px',
                borderRadius: '999px',
                backgroundColor: isSelected ? 'var(--gold-surface)' : 'rgba(255, 255, 255, 0.04)',
                border: isSelected ? '1px solid var(--border-gold)' : '1px solid var(--border-subtle)',
                color: isSelected ? 'var(--gold-bright)' : 'var(--text-muted)',
                fontSize: '11px',
                fontWeight: isSelected ? 700 : 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Phrase Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '8px',
        }}
      >
        {filteredPhrases.map((phrase) => {
          const isActive = activePhraseId === phrase.id;
          return (
            <button
              key={phrase.id}
              onClick={() => handleTrigger(phrase)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                padding: '12px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isActive ? 'var(--gold-surface)' : 'rgba(255, 255, 255, 0.02)',
                border: isActive ? '1px solid var(--gold-bright)' : '1px solid var(--border-subtle)',
                color: 'var(--text-main)',
                cursor: 'pointer',
                textAlign: 'left',
                minHeight: '74px',
                transition: 'all 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: isActive ? '0 0 16px rgba(201, 164, 76, 0.4)' : 'none',
                transform: isActive ? 'scale(0.97)' : 'scale(1)',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'var(--border-gold)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.02)';
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                <span
                  className="material-symbols-outlined"
                  style={{
                    fontSize: '18px',
                    color: isActive ? 'var(--gold-bright)' : 'var(--gold-primary)',
                  }}
                >
                  {phrase.icon}
                </span>
                <span className="material-symbols-outlined" style={{ fontSize: '14px', color: 'var(--text-dim)' }}>
                  volume_up
                </span>
              </div>
              <div style={{ marginTop: '6px' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '12px',
                    fontWeight: 700,
                    color: isActive ? 'var(--gold-bright)' : 'var(--text-main)',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {phrase.label}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
