import React, { useState } from 'react';
import { Sliders, Droplet, Play, Check, Send, AlertCircle, Sparkles, Thermometer, Sun, Wind, ShieldAlert } from 'lucide-react';
import { PLANT_PRESETS } from '../data/plantPresets';

export default function ThresholdSettings({
  settings = {},
  onUpdateSettings,
  onManualWater,
  isPumping,
  selectedPresetId,
  onApplyPreset,
  tankLevelPercent
}) {
  const [localSettings, setLocalSettings] = useState({
    autoWateringEnabled: true,
    thresholdLow: 32,
    thresholdHigh: 58,
    criticalLow: 18,
    tempMin: 18,
    tempMax: 29,
    humidityMin: 40,
    humidityMax: 70,
    lightMin: 800,
    lightMax: 4000,
    burstDurationSec: 8,
    soakTimeMin: 12,
    ...settings
  });

  const [activeTab, setActiveTab] = useState('soil'); // 'soil' | 'climate' | 'light'
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [manualDuration, setManualDuration] = useState(6);

  const isTankEmpty = tankLevelPercent <= 5;

  const handleChange = (key, val) => {
    const updated = { ...localSettings, [key]: Number(val) };
    setLocalSettings(updated);
    setSyncSuccess(false);
    setValidationError('');
  };

  const validateSettings = () => {
    if (localSettings.thresholdLow >= localSettings.thresholdHigh) {
      return 'Soil Moisture: Minimum trigger must be strictly less than target ceiling.';
    }
    if (localSettings.criticalLow >= localSettings.thresholdLow) {
      return 'Soil Moisture: Critical low must be strictly less than the minimum trigger threshold.';
    }
    if (localSettings.tempMin >= localSettings.tempMax) {
      return 'Temperature: Minimum temperature must be less than maximum temperature.';
    }
    if (localSettings.humidityMin >= localSettings.humidityMax) {
      return 'Humidity: Minimum humidity must be less than maximum humidity.';
    }
    if (localSettings.lightMin >= localSettings.lightMax) {
      return 'Light: Minimum illumination must be less than maximum illumination.';
    }
    return '';
  };

  const handleSaveSettings = () => {
    const error = validateSettings();
    if (error) {
      setValidationError(error);
      return;
    }
    setValidationError('');
    setIsSyncing(true);
    setTimeout(() => {
      onUpdateSettings(localSettings);
      setIsSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 500);
  };

  const handleToggleAuto = () => {
    const updated = { ...localSettings, autoWateringEnabled: !localSettings.autoWateringEnabled };
    setLocalSettings(updated);
    onUpdateSettings(updated);
  };

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h3 className="card-title">
            <Sliders size={16} color="hsl(var(--primary))" />
            Configurable Thresholds & Automation Parameters
          </h3>
          <p className="card-subtitle">Species-specific closed-loop environmental set points and safety locks</p>
        </div>

        {/* Auto / Manual Mode Switch */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>
            {localSettings.autoWateringEnabled ? 'Autonomous Armed' : 'Manual Override'}
          </span>
          <div
            className="switch-container"
            onClick={handleToggleAuto}
            title="Toggle between Closed-Loop Autonomous Watering and Manual Override"
          >
            <div className={`switch-track ${localSettings.autoWateringEnabled ? 'active' : ''}`}>
              <div className="switch-thumb" />
            </div>
          </div>
        </div>
      </div>

      {/* Species Preset Selector */}
      <div style={{ marginBottom: '16px', padding: '12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'hsl(var(--foreground))', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Sparkles size={13} color="#10b981" />
            Species Profiles & Presets
          </span>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
            Click to auto-populate thresholds
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
          {PLANT_PRESETS.map((preset) => {
            const isSelected = selectedPresetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => {
                  onApplyPreset(preset);
                  setLocalSettings((prev) => ({
                    ...prev,
                    thresholdLow: preset.thresholdLow,
                    thresholdHigh: preset.thresholdHigh,
                    tempMin: preset.tempMin || 18,
                    tempMax: preset.tempMax || 29,
                    humidityMin: preset.humidityMin || 40,
                    humidityMax: preset.humidityMax || 70,
                    lightMin: preset.lightMin || 800,
                    lightMax: preset.lightMax || 4000,
                    burstDurationSec: preset.burstDurationSec || 8,
                    soakTimeMin: preset.soakTimeMin || 12
                  }));
                  setSyncSuccess(false);
                  setValidationError('');
                }}
                className={`btn btn-sm ${isSelected ? 'btn-default' : 'btn-outline'}`}
                style={{
                  justifyContent: 'flex-start',
                  padding: '5px 8px',
                  borderRadius: 'calc(var(--radius) - 2px)'
                }}
              >
                <span>{preset.icon}</span>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '11.5px' }}>
                  {preset.commonName.split('/')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Category Tabs */}
      <div className="nav-tabs" style={{ marginBottom: '16px', height: '34px' }}>
        <button
          onClick={() => setActiveTab('soil')}
          className={`nav-tab-btn ${activeTab === 'soil' ? 'active' : ''}`}
          style={{ fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Droplet size={13} />
          Soil Moisture & Pump
        </button>
        <button
          onClick={() => setActiveTab('climate')}
          className={`nav-tab-btn ${activeTab === 'climate' ? 'active' : ''}`}
          style={{ fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Thermometer size={13} />
          Temperature & Humidity
        </button>
        <button
          onClick={() => setActiveTab('light')}
          className={`nav-tab-btn ${activeTab === 'light' ? 'active' : ''}`}
          style={{ fontSize: '12px', padding: '4px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <Sun size={13} />
          Light Intensity
        </button>
      </div>

      {/* Validation Alert */}
      {validationError && (
        <div style={{ marginBottom: '14px', padding: '10px 14px', background: 'hsla(0, 84%, 60%, 0.1)', border: '1px solid hsla(0, 84%, 60%, 0.3)', borderRadius: 'var(--radius)', color: '#ef4444', fontSize: '12.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ShieldAlert size={16} />
          <span>{validationError}</span>
        </div>
      )}

      {/* TAB 1: SOIL MOISTURE */}
      {activeTab === 'soil' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Low Trigger Moisture (%) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Minimum Moisture Threshold</span>
              <span className="badge badge-amber tnum">{localSettings.thresholdLow}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="1"
              value={localSettings.thresholdLow}
              onChange={(e) => handleChange('thresholdLow', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Pump activates when capacitance drops below this set point.
            </p>
          </div>

          {/* High Target Moisture (%) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Target Maximum Moisture</span>
              <span className="badge badge-emerald tnum">{localSettings.thresholdHigh}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="85"
              step="1"
              value={localSettings.thresholdHigh}
              onChange={(e) => handleChange('thresholdHigh', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Upper target boundary to prevent root rot and hypoxia.
            </p>
          </div>

          {/* Critical Low Threshold (%) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Critical Low Threshold</span>
              <span className="badge badge-destructive tnum">{localSettings.criticalLow || 18}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={localSettings.criticalLow || 18}
              onChange={(e) => handleChange('criticalLow', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Emergency alert raised if moisture drops below this limit.
            </p>
          </div>

          {/* Pump Run Duration (Seconds) */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Pump Burst Duration</span>
              <span className="badge badge-cyan tnum">{localSettings.burstDurationSec}s</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={localSettings.burstDurationSec}
              onChange={(e) => handleChange('burstDurationSec', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Dispenses ~{(localSettings.burstDurationSec * 5.5).toFixed(0)} mL calibrated sub-surface delivery.
            </p>
          </div>
        </div>
      )}

      {/* TAB 2: TEMPERATURE & HUMIDITY */}
      {activeTab === 'climate' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Min Temp */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Minimum Acceptable Temperature</span>
              <span className="badge badge-cyan tnum">{localSettings.tempMin || 18}°C</span>
            </div>
            <input
              type="range"
              min="10"
              max="25"
              step="1"
              value={localSettings.tempMin || 18}
              onChange={(e) => handleChange('tempMin', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Alerts if room drops below cold shock threshold.
            </p>
          </div>

          {/* Max Temp */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Maximum Acceptable Temperature</span>
              <span className="badge badge-amber tnum">{localSettings.tempMax || 29}°C</span>
            </div>
            <input
              type="range"
              min="24"
              max="38"
              step="1"
              value={localSettings.tempMax || 29}
              onChange={(e) => handleChange('tempMax', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Alerts if heat stress or excessive transpiration occurs.
            </p>
          </div>

          {/* Min Humidity */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Minimum Acceptable Humidity</span>
              <span className="badge badge-outline tnum">{localSettings.humidityMin || 40}% RH</span>
            </div>
            <input
              type="range"
              min="20"
              max="50"
              step="1"
              value={localSettings.humidityMin || 40}
              onChange={(e) => handleChange('humidityMin', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Low humidity accelerates foliage leaf desiccation.
            </p>
          </div>

          {/* Max Humidity */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Maximum Acceptable Humidity</span>
              <span className="badge badge-emerald tnum">{localSettings.humidityMax || 70}% RH</span>
            </div>
            <input
              type="range"
              min="55"
              max="90"
              step="1"
              value={localSettings.humidityMax || 70}
              onChange={(e) => handleChange('humidityMax', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              High humidity reduces transpiration and invites mildew.
            </p>
          </div>
        </div>
      )}

      {/* TAB 3: LIGHT INTENSITY */}
      {activeTab === 'light' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          {/* Min Light */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Minimum Light Intensity</span>
              <span className="badge badge-amber tnum">{localSettings.lightMin || 800} Lux</span>
            </div>
            <input
              type="range"
              min="200"
              max="2000"
              step="50"
              value={localSettings.lightMin || 800}
              onChange={(e) => handleChange('lightMin', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Minimum light required for baseline photosynthesis.
            </p>
          </div>

          {/* Max Light */}
          <div className="form-group" style={{ margin: 0 }}>
            <div className="form-label">
              <span>Maximum Light Intensity</span>
              <span className="badge badge-cyan tnum">{localSettings.lightMax || 4000} Lux</span>
            </div>
            <input
              type="range"
              min="2000"
              max="10000"
              step="100"
              value={localSettings.lightMax || 4000}
              onChange={(e) => handleChange('lightMax', e.target.value)}
              className="range-slider"
            />
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Threshold above which direct sun scorching may occur.
            </p>
          </div>
        </div>
      )}

      {/* Action Toolbar: SAVE SETTINGS + Manual Water Pulse */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid hsl(var(--border))', paddingTop: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleSaveSettings}
            disabled={isSyncing}
            className="btn btn-default"
            style={{ fontWeight: 700, minWidth: '150px' }}
          >
            {isSyncing ? (
              <>
                <Send size={13} />
                Saving...
              </>
            ) : syncSuccess ? (
              <>
                <Check size={14} color="#10b981" />
                SETTINGS SAVED!
              </>
            ) : (
              <>
                <Check size={14} />
                SAVE SETTINGS
              </>
            )}
          </button>
        </div>

        {/* Manual Water Pulse Safeguard */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={manualDuration}
            onChange={(e) => setManualDuration(Number(e.target.value))}
            className="form-select"
            style={{ width: 'auto', height: '32px', padding: '4px 8px', fontSize: '12px' }}
            disabled={isPumping || isTankEmpty}
          >
            <option value={4}>4s Pulse (~22 mL)</option>
            <option value={6}>6s Pulse (~33 mL)</option>
            <option value={10}>10s Pulse (~55 mL)</option>
          </select>

          <button
            onClick={() => onManualWater(manualDuration)}
            disabled={isPumping || isTankEmpty}
            className="btn btn-secondary"
            style={{ height: '32px' }}
            title={isTankEmpty ? 'Reservoir is empty' : 'Manual pump pulse test'}
          >
            <Droplet size={13} color="#06b6d4" />
            {isPumping ? 'Dispensing...' : 'Water Now'}
          </button>
        </div>
      </div>

      {isTankEmpty && (
        <div style={{ marginTop: '12px', padding: '8px 12px', background: 'hsla(0, 84%, 60%, 0.1)', border: '1px solid hsla(0, 84%, 60%, 0.3)', borderRadius: 'var(--radius)', color: '#ef4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <AlertCircle size={14} />
          <strong>Dry-Run Safety Lockout:</strong> Water reservoir is empty. Pump disabled.
        </div>
      )}
    </div>
  );
}
