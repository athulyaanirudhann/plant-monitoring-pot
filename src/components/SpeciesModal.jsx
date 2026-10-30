import React from 'react';
import { X, Check } from 'lucide-react';
import { PLANT_PRESETS } from '../data/plantPresets';

export default function SpeciesModal({
  isOpen,
  onClose,
  activePresetId,
  onSelectPreset,
  addToast
}) {
  if (!isOpen) return null;

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
          maxWidth: '560px',
          padding: '28px',
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
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
              Select Botanical Species Preset
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
              Pre-calibrated moisture ranges and environmental thresholds
            </p>
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

        {/* Species List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {PLANT_PRESETS.map((preset) => {
            const isSelected = preset.id === activePresetId;
            return (
              <div
                key={preset.id}
                onClick={() => {
                  onSelectPreset(preset);
                  addToast(`Species changed to ${preset.commonName}`, 'success');
                  onClose();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isSelected ? 'rgba(4, 106, 56, 0.08)' : 'var(--subtle-input-bg)',
                  border: isSelected ? '1.5px solid var(--accent-green)' : '1px solid var(--card-border)',
                  cursor: 'pointer',
                  transition: 'all 160ms ease'
                }}
              >
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>
                    {preset.commonName}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    {preset.scientificName}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-green)' }}>
                      {preset.thresholdLow}% – {preset.thresholdHigh}%
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-light)' }}>
                      Optimal Moisture
                    </div>
                  </div>
                  {isSelected && (
                    <div
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '50%',
                        background: 'var(--accent-green)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Check size={14} />
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
