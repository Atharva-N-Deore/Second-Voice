import React from 'react';
import { UserSpeechProfile } from '../services/api';

interface DesktopHeaderProps {
  currentView: string;
  onSelectView: (view: string) => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  profile: UserSpeechProfile;
  textScale: string;
  onToggleTextScale: () => void;
  latencyMs: number;
  onOpenSettings?: () => void;
}

export const DesktopHeader: React.FC<DesktopHeaderProps> = ({
  currentView,
  onSelectView,
  theme,
  onToggleTheme,
  profile,
  textScale,
  onToggleTextScale,
  latencyMs,
  onOpenSettings,
}) => {
  const navItems = [
    { id: 'communicate', label: 'Live Studio', icon: 'graphic_eq' },
    { id: 'vocabulary', label: 'Vocabulary Matrix', icon: 'auto_stories' },
    { id: 'calibration', label: 'Voice Calibration', icon: 'tune' },
    { id: 'history', label: 'History Log', icon: 'schedule' },
    { id: 'profile', label: 'Profile & Acoustics', icon: 'settings_accessibility' },
  ];

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backgroundColor: 'rgba(7, 9, 14, 0.85)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderBottom: '1px solid var(--border-subtle)',
      boxShadow: '0 4px 24px rgba(0, 0, 0, 0.4)'
    }}>
      <div style={{
        maxWidth: '1440px',
        margin: '0 auto',
        padding: '0 24px',
        height: '74px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px'
      }}>
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexShrink: 0 }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #c9a44c 0%, #775a01 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            boxShadow: '0 0 20px rgba(201, 164, 76, 0.4)',
            border: '1px solid rgba(255, 215, 0, 0.3)'
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: '26px' }}>graphic_eq</span>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h1 style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '20px',
                fontWeight: 800,
                color: 'var(--text-main)',
                letterSpacing: '-0.02em',
                lineHeight: 1
              }}>
                Second Voice
              </h1>
              <span className="badge-gold">
                <span className="material-symbols-outlined" style={{ fontSize: '13px' }}>bolt</span>
                AI Neural LPU
              </span>
            </div>
            <p style={{
              fontFamily: 'var(--font-body)',
              fontSize: '11px',
              color: 'var(--text-muted)',
              marginTop: '3px',
              letterSpacing: '0.02em'
            }}>
              Assistive Communication Engine for Speech Disabilities
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: 'var(--bg-card)',
          padding: '5px',
          borderRadius: 'var(--radius-full)',
          border: '1px solid var(--border-subtle)'
        }}>
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectView(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '7px',
                  padding: '8px 16px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: isActive ? 'var(--gold-surface)' : 'transparent',
                  color: isActive ? 'var(--gold-bright)' : 'var(--text-muted)',
                  border: isActive ? '1px solid var(--border-highlight)' : '1px solid transparent',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '13px',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 0 15px rgba(201, 164, 76, 0.2)' : 'none'
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Tools: Telemetry Pill, Font Scale, Theme Toggle, Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          {/* Live Telemetry Badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 12px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--emerald-surface)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--emerald-accent)'
          }}>
            <span style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'var(--emerald-accent)',
              display: 'inline-block'
            }} className="animate-pulse" />
            <span>{latencyMs > 0 ? `${latencyMs}ms latency` : 'Core Active'}</span>
          </div>

          {/* Text Scaling Quick Button */}
          <button
            onClick={onToggleTextScale}
            title={`Current Text Scale: ${textScale}`}
            style={{
              height: '38px',
              padding: '0 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>format_size</span>
            <span>{textScale.split(' ')[0]}</span>
          </button>

          {/* Theme Switcher */}
          <button
            onClick={onToggleTheme}
            title="Toggle Dark / Semi-Gold Theme"
            style={{
              width: '38px',
              height: '38px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
              {theme === 'dark' ? 'light_mode' : 'dark_mode'}
            </span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => (onOpenSettings ? onOpenSettings() : onSelectView('profile'))}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px 10px 4px 4px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              cursor: 'pointer',
              color: 'inherit',
              textAlign: 'left',
              transition: 'border-color 0.2s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.borderColor = 'var(--gold-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = 'var(--border-subtle)')}
          >
            <div style={{
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #c9a44c 0%, #775a01 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 800,
              fontSize: '13px'
            }}>
              A
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1 }}>
                Alex R.
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '2px' }}>
                {profile.impairmentType.split(' ')[0]}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
