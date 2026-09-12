import React from 'react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenEmergency: () => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  onOpenEmergency,
  isOpenMobile,
  onCloseMobile,
}) => {
  const primaryTools = [
    { id: 'communicate', name: 'Communicate', icon: 'record_voice_over' },
    { id: 'history', name: 'History & Logs', icon: 'schedule' },
    { id: 'vocabulary', name: 'My Vocabulary', icon: 'menu_book', badge: '142' },
  ];

  const customizationTools = [
    { id: 'calibration', name: 'Speech Calibration', icon: 'tune' },
    { id: 'voice_profile', name: 'Voice Profile', icon: 'mic' },
    { id: 'accessibility', name: 'Accessibility', icon: 'text_fields' },
    { id: 'neural_settings', name: 'AI Neural Settings', icon: 'psychology' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(28, 27, 26, 0.4)',
            backdropFilter: 'blur(4px)',
            zIndex: 90,
          }}
          className="sidebar-backdrop"
        />
      )}

      <aside
        className={`dashboard-sidebar ${isOpenMobile ? 'mobile-open' : ''}`}
        style={{
          width: '260px',
          backgroundColor: '#faf7f2',
          borderRight: '1px solid #ede7df',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '24px 18px',
          flexShrink: 0,
          height: '100vh',
          position: 'sticky',
          top: 0,
          overflowY: 'auto',
          zIndex: 95,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Logo & Brand Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                backgroundColor: '#1f1e1d',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fdf8f5',
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px', color: '#f3e5c8' }}>
                graphic_eq
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '15px',
                  fontWeight: 800,
                  letterSpacing: '0.04em',
                  color: '#1a1a19',
                  lineHeight: 1.1,
                }}
              >
                SECOND VOICE
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: '11px',
                  color: '#7e786e',
                  marginTop: '2px',
                  fontStyle: 'italic',
                }}
              >
                Speak naturally. Be understood.
              </span>
            </div>
          </div>

          {/* Emergency SOS Button */}
          <button
            id="sidebarHelpBtn"
            onClick={() => {
              onOpenEmergency();
              if (onCloseMobile) onCloseMobile();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '999px',
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(186, 26, 26, 0.08)',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: '#dc2626',
                  display: 'inline-block',
                }}
                className="animate-pulse"
              />
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 800,
                  color: '#b91c1c',
                  letterSpacing: '0.02em',
                }}
              >
                I NEED HELP
              </span>
            </div>
            <span
              className="material-symbols-outlined"
              style={{ fontSize: '18px', color: '#dc2626', fontWeight: 700 }}
            >
              emergency
            </span>
          </button>

          {/* Navigation Section 1: PRIMARY TOOLS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#8d877c',
                textTransform: 'uppercase',
                paddingLeft: '8px',
                marginBottom: '4px',
              }}
            >
              PRIMARY TOOLS
            </span>

            {primaryTools.map((tool) => {
              const isActive = currentTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    onSelectTab(tool.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#eee7dc' : 'transparent',
                    color: isActive ? '#1c1b1a' : '#4f4a41',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'background-color 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '20px',
                        color: isActive ? '#775a01' : '#736d62',
                      }}
                    >
                      {tool.icon}
                    </span>
                    <span>{tool.name}</span>
                  </div>

                  {isActive ? (
                    <span
                      style={{
                        width: '7px',
                        height: '7px',
                        borderRadius: '50%',
                        backgroundColor: '#5d7335',
                        display: 'inline-block',
                      }}
                    />
                  ) : tool.badge ? (
                    <span
                      style={{
                        backgroundColor: '#ede7df',
                        color: '#655f54',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '999px',
                      }}
                    >
                      {tool.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Navigation Section 2: CUSTOMIZATION */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '0.08em',
                color: '#8d877c',
                textTransform: 'uppercase',
                paddingLeft: '8px',
                marginBottom: '4px',
              }}
            >
              CUSTOMIZATION
            </span>

            {customizationTools.map((tool) => {
              const isActive = currentTab === tool.id || (tool.id === 'voice_profile' && currentTab === 'profile') || (tool.id === 'accessibility' && currentTab === 'profile');
              return (
                <button
                  key={tool.id}
                  onClick={() => {
                    onSelectTab(tool.id === 'voice_profile' || tool.id === 'accessibility' || tool.id === 'neural_settings' ? 'profile' : tool.id);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? '#eee7dc' : 'transparent',
                    color: isActive ? '#1c1b1a' : '#4f4a41',
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: isActive ? 700 : 500,
                    transition: 'background-color 0.15s ease',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: '20px',
                        color: isActive ? '#775a01' : '#736d62',
                      }}
                    >
                      {tool.icon}
                    </span>
                    <span>{tool.name}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Status Card & User Profile */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '24px' }}>
          {/* Status Box */}
          <div
            style={{
              backgroundColor: '#f4ede2',
              borderRadius: '16px',
              padding: '14px',
              border: '1px solid #e7dfd2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 700,
                  color: '#1a1a19',
                }}
              >
                Engine Active
              </span>
              <span
                style={{
                  backgroundColor: '#dcfce7',
                  color: '#15803d',
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '999px',
                }}
              >
                87%
              </span>
            </div>
            <p
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '12px',
                color: '#6e685e',
                lineHeight: 1.35,
              }}
            >
              Acoustic sensor calibrated to natural cadence.
            </p>
          </div>

          {/* User Profile Footer */}
          <div
            onClick={() => {
              onSelectTab('profile');
              if (onCloseMobile) onCloseMobile();
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '8px',
              borderTop: '1px solid #ede7df',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    backgroundColor: '#d1c5b2',
                    backgroundImage: 'url("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80")',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid #c7baa5',
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '9px',
                    height: '9px',
                    borderRadius: '50%',
                    backgroundColor: '#16a34a',
                    border: '2px solid #faf7f2',
                  }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '14px',
                    fontWeight: 700,
                    color: '#1a1a19',
                    lineHeight: 1.2,
                  }}
                >
                  Alex Rivera
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-body)',
                    fontSize: '12px',
                    color: '#7a7368',
                  }}
                >
                  Premium Neural Voice
                </span>
              </div>
            </div>

            <button
              style={{
                background: 'none',
                border: 'none',
                color: '#7a7368',
                cursor: 'pointer',
                padding: '4px',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>
                more_vert
              </span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
