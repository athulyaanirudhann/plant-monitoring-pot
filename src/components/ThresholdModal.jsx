import React, { useState } from 'react';
import { X, Check, Sliders, Droplets, Clock, Zap } from 'lucide-react';

export default function ThresholdModal({
  isOpen,
  onClose,
  pot,
  onUpdateSettings,
  addToast
}) {
  if (!isOpen || !pot) return null;

  const [thresholdLow, setThresholdLow] = useState(pot.settings?.thresholdLow || 35);
  const [thresholdHigh, setThresholdHigh] = useState(pot.settings?.thresholdHigh || 65);
  const [burstDuration, setBurstDuration] = useState(pot.settings?.burstDurationSec || 6);
  const [autoWatering, setAutoWatering] = useState(pot.settings?.autoWateringEnabled ?? true);

  const handleSave = () => {
    onUpdateSettings({
      ...pot.settings,
      thresholdLow: Number(thresholdLow),
      thresholdHigh: Number(thresholdHigh),
      burstDurationSec: Number(burstDuration),
      autoWateringEnabled: autoWatering
    });
    addToast('Irrigation thresholds saved successfully!', 'success');
    onClose();
  };

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
          maxWidth: '480px',
          padding: '28px',
          boxShadow: '0 20px 45px -10px rgba(31, 59, 46, 0.25)',
          border: '1px solid var(--card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'rgba(4, 106, 56, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-green)'
              }}
            >
              <Sliders size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Set Moisture Thresholds
              </h3>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                Autonomous Closed-Loop Irrigation Trigger Setpoints
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Low Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Dry Trigger Setpoint (Low)
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>
                {thresholdLow}%
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              value={thresholdLow}
              onChange={(e) => setThresholdLow(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-green)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pump turns ON autonomously when capacitive soil moisture drops below this ceiling.
            </span>
          </div>

          {/* High Threshold */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Target Saturation Ceiling (High)
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>
                {thresholdHigh}%
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="85"
              value={thresholdHigh}
              onChange={(e) => setThresholdHigh(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-green)' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Pump turns OFF once soil moisture reaches this optimal hydration level.
            </span>
          </div>

          {/* Burst Duration */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Dispense Pulse Duration
              </span>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--accent-green)' }}>
                {burstDuration} sec (~{burstDuration * 12} mL)
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              value={burstDuration}
              onChange={(e) => setBurstDuration(e.target.value)}
              style={{ width: '100%', accentColor: 'var(--accent-green)' }}
            />
          </div>

          {/* Auto Watering Switch */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              background: 'rgba(4, 106, 56, 0.06)',
              borderRadius: '14px',
              border: '1px solid rgba(4, 106, 56, 0.12)'
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                Autonomous Closed-Loop Mode
              </div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                ESP32 continuously polls sensor & triggers root pulse automatically
              </div>
            </div>
            <div
              className="switch-container"
              onClick={() => setAutoWatering(!autoWatering)}
            >
              <div className={`switch-track ${autoWatering ? 'active' : ''}`}>
                <div className="switch-thumb" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
          <button
            onClick={onClose}
            className="btn-white-pill"
            style={{ padding: '8px 18px', fontSize: '12px' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-black-pill"
            style={{
              padding: '8px 20px',
              fontSize: '12px',
              background: 'var(--accent-green)',
              color: '#ffffff',
              border: 'none',
              gap: '6px'
            }}
          >
            <Check size={14} />
            <span>Save Setpoints</span>
          </button>
        </div>
      </div>
    </div>
  );
}
