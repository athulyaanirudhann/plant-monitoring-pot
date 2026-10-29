import React from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle, Info, Volume2, Check, X } from 'lucide-react';

export default function AlertsCenter({ alerts, onDismissAlert, onAcknowledgeAlert, onTestSoundAlert }) {
  const unacknowledgedCount = alerts.filter((a) => !a.acknowledged).length;

  return (
    <div className="card" style={{ padding: '16px 20px', marginBottom: '24px' }}>
      <div className="card-header" style={{ marginBottom: alerts.length > 0 ? '12px' : 0 }}>
        <div>
          <h3 className="card-title">
            <Bell size={15} color="#f59e0b" />
            System Notifications & Alerts
          </h3>
          <p className="card-subtitle">
            Safety watchdogs, dry-run protection, and sensor status
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {unacknowledgedCount > 0 ? (
            <span className="badge badge-destructive">
              {unacknowledgedCount} Active
            </span>
          ) : (
            <span className="badge badge-emerald">
              All Systems Normal
            </span>
          )}

          <button
            onClick={onTestSoundAlert}
            className="btn btn-outline btn-sm"
            title="Simulate audible notification"
          >
            <Volume2 size={13} />
            Test Sound
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {alerts.map((alert) => {
            const isCritical = alert.type === 'critical';
            const isWarning = alert.type === 'warning';

            return (
              <div
                key={alert.id}
                className={`alert-strip ${isCritical ? 'critical' : isWarning ? 'warning' : 'info'}`}
                style={{
                  opacity: alert.acknowledged ? 0.75 : 1,
                  padding: '10px 14px',
                  margin: 0
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <div style={{ marginTop: '2px' }}>
                    {isCritical ? <ShieldAlert size={16} /> : isWarning ? <AlertTriangle size={16} /> : <Info size={16} />}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                      <strong style={{ fontSize: '12.5px' }}>{alert.title}</strong>
                      <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>• {alert.timestamp}</span>
                      {alert.acknowledged && (
                        <span className="badge badge-outline" style={{ fontSize: '10px', padding: '0 4px' }}>
                          Acknowledged
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '12px', opacity: 0.9 }}>{alert.message}</p>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '4px', marginLeft: '12px', flexShrink: 0 }}>
                  {!alert.acknowledged && (
                    <button
                      onClick={() => onAcknowledgeAlert(alert.id)}
                      className="btn btn-ghost btn-sm"
                      style={{ padding: '2px 6px', fontSize: '11px', height: '24px' }}
                      title="Mark as reviewed"
                    >
                      <Check size={12} />
                      Ack
                    </button>
                  )}
                  <button
                    onClick={() => onDismissAlert(alert.id)}
                    className="btn btn-ghost btn-sm"
                    style={{ padding: '2px 4px', height: '24px' }}
                    title="Dismiss alert"
                  >
                    <X size={13} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
