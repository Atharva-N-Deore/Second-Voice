import React from 'react';

interface BottomNavProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs = [
    { id: 'communicate', label: 'Communicate', icon: 'record_voice_over' },
    { id: 'history', label: 'History', icon: 'schedule' },
    { id: 'vocabulary', label: 'Vocabulary', icon: 'auto_stories' },
    { id: 'profile', label: 'Profile', icon: 'settings_accessibility' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      zIndex: 50,
      backgroundColor: 'rgba(253, 248, 245, 0.94)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      boxShadow: '0 -8px 24px -4px rgba(119, 90, 1, 0.08)',
      borderTop: '1px solid var(--outline-variant)'
    }}>
      <div style={{
        height: '76px',
        maxWidth: '520px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        alignItems: 'center',
        padding: '0 8px'
      }}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px 0',
                color: isActive ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: isActive ? 700 : 500,
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? 'rgba(201, 164, 76, 0.25)' : 'transparent',
                boxShadow: isActive ? '0 0 0 2px rgba(201, 164, 76, 0.4)' : 'none',
                marginBottom: '2px'
              }}>
                <span className="material-symbols-outlined" style={{
                  fontSize: '22px',
                  color: isActive ? 'var(--primary)' : 'inherit'
                }}>
                  {tab.icon}
                </span>
              </div>
              <span style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                letterSpacing: '-0.01em',
                lineHeight: 1
              }}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
