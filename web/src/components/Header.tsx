import React from 'react';

interface HeaderProps {
  currentTab: string;
  onOpenFontScale: () => void;
  onOpenCalibration: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, onOpenFontScale, onOpenCalibration }) => {
  const getTitle = () => {
    switch (currentTab) {
      case 'communicate': return 'Communicate';
      case 'history': return 'History';
      case 'vocabulary': return 'Vocabulary';
      case 'profile': return 'User Profile';
      case 'calibration': return 'Calibration';
      default: return 'Communicate';
    }
  };

  return (
    <header style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(253, 248, 245, 0.9)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 4px 20px -4px rgba(119, 90, 1, 0.06)',
      borderBottom: '1px solid var(--outline-variant)'
    }}>
      <div style={{
        height: '76px',
        maxWidth: '720px',
        margin: '0 auto',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '12px'
      }}>
        {/* Brand & Subtitle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: 'var(--primary-container)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--on-primary-container)',
            flexShrink: 0,
            boxShadow: '0 2px 6px rgba(119, 90, 1, 0.15)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>graphic_eq</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '11px',
              fontWeight: 700,
              color: 'var(--primary)',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              lineHeight: 1
            }}>
              Second Voice
            </span>
            <span style={{
              fontFamily: 'var(--font-heading)',
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--on-surface)',
              marginTop: '3px',
              lineHeight: 1.1,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden'
            }}>
              {getTitle()}
            </span>
          </div>
        </div>

        {/* Right Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Font scale toggle */}
          <button
            onClick={onOpenFontScale}
            aria-label="Accessibility Font Scaling"
            style={{
              height: '42px',
              padding: '0 12px',
              borderRadius: '999px',
              backgroundColor: 'var(--surface-container-low)',
              border: '1px solid var(--outline-variant)',
              color: 'var(--on-surface-variant)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_size</span>
            <span>A±</span>
          </button>

          {/* User profile avatar with engine status */}
          <button
            onClick={onOpenCalibration}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '2px'
            }}
            title="Speech Calibration (87% active)"
          >
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'var(--secondary-container)',
              color: 'var(--on-secondary-container)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              border: '2px solid var(--surface)'
            }}>
              Alex
            </div>
            {/* Pulsing presence dot */}
            <span style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              backgroundColor: 'var(--tertiary)',
              border: '2px solid var(--surface)'
            }} />
          </button>
        </div>
      </div>
    </header>
  );
};
