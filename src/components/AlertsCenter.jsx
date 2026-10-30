import React from 'react';
import { Bell, AlertTriangle, ShieldAlert, Info, Volume2, Check, X } from 'lucide-react';

export default function AlertsCenter({
  isOpen,
  onClose,
  alerts = [],
  onDismissAlert,
  onAcknowledgeAlert,
  onTestSoundAlert
}) {
  if (!isOpen) return null;

  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(31, 59, 46, 0.45)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--card-bg)',
          borderRadius: '24px',
          width: '100%',
          maxWidth: '680px',
          padding: '26px 28px',
          boxShadow: '0 20px 45px -10px rgba(31, 59, 46, 0.25)',
          border: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
          maxHeight: '85vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 800,
                color: 'var(--text-main)',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <Bell size={18} color="var(--accent-green)" />
              <span>System Notifications & Alerts</span>
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Safety watchdogs, dry-run protection, and sensor status
            </p>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {unacknowledgedCount > 0 ? (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#ffffff',
                  background: '#1F3B2E',
                  padding: '3px 10px',
                  borderRadius: '9999px'
                }}
              >
                {unacknowledgedCount} Active
              </span>
            ) : (
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: 'var(--accent-green)',
                  background: 'rgba(4, 106, 56, 0.1)',
                  padding: '3px 10px',
                  borderRadius: '9999px'
                }}
              >
                All Systems Normal
              </span>
            )}

            <button
              onClick={onTestSoundAlert}
              className="btn-white-pill"
              style={{ padding: '5px 12px', fontSize: '11.5px', gap: '5px' }}
              title="Simulate audible notification buzzer"
            >
              <Volume2 size={13} color="var(--accent-green)" />
              <span>Test Sound</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                padding: '4px',
                display: 'flex',
                alignItems: 'center'
              }}
              title="Close notifications dialog"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Alerts Content List */}
        {alerts.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {alerts.map((alert) => {
              const isCritical = alert.type === 'critical';
              const isWarning = alert.type === 'warning';

              return (
                <div
                  key={alert.id}
                  className={`alert-strip ${isCritical ? 'critical' : isWarning ? 'warning' : 'info'}`}
                  style={{
                    opacity: alert.acknowledged ? 0.75 : 1,
                    padding: '12px 16px',
                    margin: 0,
                    borderRadius: '16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                    <div style={{ marginTop: '2px' }}>
                      {isCritical ? (
                        <ShieldAlert size={17} color="#1F3B2E" />
                      ) : isWarning ? (
                        <AlertTriangle size={17} color="#1F3B2E" />
                      ) : (
                        <Info size={17} color="var(--accent-green)" />
                      )}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--text-main)' }}>{alert.title}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>• {alert.timestamp}</span>
                        {alert.acknowledged && (
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              color: 'var(--text-muted)',
                              background: 'rgba(31, 59, 46, 0.08)',
                              padding: '1px 6px',
                              borderRadius: '6px'
                            }}
                          >
                            Acknowledged
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                        {alert.message}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginLeft: '12px', flexShrink: 0 }}>
                    {!alert.acknowledged && (
                      <button
                        onClick={() => onAcknowledgeAlert(alert.id)}
                        className="btn-white-pill"
                        style={{ padding: '3px 8px', fontSize: '11px', gap: '4px' }}
                        title="Mark alert as acknowledged"
                      >
                        <Check size={12} color="var(--accent-green)" />
                        <span>Ack</span>
                      </button>
                    )}
                    <button
                      onClick={() => onDismissAlert(alert.id)}
                      className="btn-white-pill"
                      style={{ padding: '3px 6px' }}
                      title="Dismiss alert"
                    >
                      <X size={13} color="var(--text-muted)" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            style={{
              padding: '32px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13px',
              background: 'rgba(4, 106, 56, 0.04)',
              borderRadius: '16px',
              border: '1px dashed var(--card-border)'
            }}
          >
            No active alerts or hardware warnings. All smart pot systems are optimal.
          </div>
        )}
      </div>
    </div>
  );
}
