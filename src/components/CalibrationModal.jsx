import React, { useState } from 'react';
import { X, Check, BookOpen, Sparkles, Sliders, RefreshCw, Cpu } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CalibrationModal({
  isOpen,
  onClose,
  currentRawAdc,
  calibration,
  onSaveCalibration
}) {
  if (!isOpen) return null;

  const [airDryVal, setAirDryVal] = useState(calibration?.airDryRawAdc || 3280);
  const [waterWetVal, setWaterWetVal] = useState(calibration?.waterWetRawAdc || 1390);
  const [testRawVal, setTestRawVal] = useState(currentRawAdc || 2200);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Compute moisture based on equation
  const computeMoisture = (raw) => {
    if (airDryVal === waterWetVal) return 0;
    const pct = ((airDryVal - raw) / (airDryVal - waterWetVal)) * 100;
    return Math.min(100, Math.max(0, Number(pct.toFixed(1))));
  };

  const handleCaptureDry = () => {
    setAirDryVal(currentRawAdc);
  };

  const handleCaptureWet = () => {
    setWaterWetVal(currentRawAdc);
  };

  const handleSave = () => {
    onSaveCalibration({
      airDryRawAdc: Number(airDryVal),
      waterWetRawAdc: Number(waterWetVal),
      lastCalibrated: new Date().toISOString().split('T')[0]
    });
    setSavedSuccess(true);
    try {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } catch (e) {
      // safe fallback
    }
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="card-title">
              <Sliders size={16} color="hsl(var(--primary))" />
              Capacitive Sensor 2-Point Calibration
            </h3>
            <p className="card-subtitle">
              Hrisko (2020): Dielectric Permittivity Voltage-to-Moisture Mapping
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
            style={{ padding: '4px 8px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Academic Reference Callout */}
        <div style={{ padding: '10px 14px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)', marginBottom: '16px', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '4px' }}>
            <BookOpen size={14} color="#10b981" />
            Hrisko (2020) Calibration Protocol
          </div>
          Capacitive probes yield an inverted analog voltage proportional to soil capacitance. Because manufacturing tolerances differ, recording raw 12-bit ADC values in dry air (~3200-3400) and submerged in water (~1300-1500) ensures accurate 0% to 100% moisture mapping.
        </div>

        {/* Live ADC Monitor */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'hsl(var(--muted) / 0.5)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
              LIVE ESP32 ADC READING (GPIO34)
            </span>
            <div style={{ fontSize: '24px', fontWeight: 700, color: 'hsl(var(--foreground))', marginTop: '2px' }} className="tnum">
              {currentRawAdc} <span style={{ fontSize: '12px', fontWeight: 400, color: 'hsl(var(--muted-foreground))' }}>/ 4095 (12-bit)</span>
            </div>
          </div>
          <span className="badge badge-emerald">
            <Cpu size={12} /> Live Analog Stream
          </span>
        </div>

        {/* Calibration Steps */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '18px' }}>
          {/* Step 1: Dry Air */}
          <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#f59e0b', marginBottom: '4px' }}>
              Step 1: Dry Air Reference (0%)
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
              Hold sensor in dry air, away from hands.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={airDryVal}
                onChange={(e) => setAirDryVal(Number(e.target.value))}
                className="form-input tnum"
                style={{ padding: '6px 8px', fontSize: '13px' }}
              />
              <button onClick={handleCaptureDry} className="btn btn-outline btn-sm" title="Capture current raw reading">
                Capture
              </button>
            </div>
          </div>

          {/* Step 2: 100% Water Saturated */}
          <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)' }}>
            <div style={{ fontSize: '12px', fontWeight: 600, color: '#06b6d4', marginBottom: '4px' }}>
              Step 2: Water Saturated (100%)
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '10px' }}>
              Submerge probe up to the marker line in water.
            </p>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                type="number"
                value={waterWetVal}
                onChange={(e) => setWaterWetVal(Number(e.target.value))}
                className="form-input tnum"
                style={{ padding: '6px 8px', fontSize: '13px' }}
              />
              <button onClick={handleCaptureWet} className="btn btn-outline btn-sm" title="Capture current raw reading">
                Capture
              </button>
            </div>
          </div>
        </div>

        {/* Live Mapping Mathematical Formula */}
        <div style={{ padding: '12px', background: 'hsl(var(--muted) / 0.4)', border: '1px solid hsl(var(--border) / 0.6)', borderRadius: 'var(--radius)', marginBottom: '16px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '6px' }}>
            Linear Transfer Formula:
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: '#10b981', padding: '6px 8px', background: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: 'calc(var(--radius) - 2px)' }}>
            Moisture% = clamp( ({airDryVal} - RawADC) / ({airDryVal} - {waterWetVal}) * 100%, 0%, 100% )
          </div>

          {/* Test Live Slider */}
          <div style={{ marginTop: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}>
              <span>Simulate Raw ADC: <strong className="tnum" style={{ color: 'hsl(var(--foreground))' }}>{testRawVal}</strong></span>
              <span>Calculated Output: <strong style={{ color: '#10b981' }} className="tnum">{computeMoisture(testRawVal)}%</strong></span>
            </div>
            <input
              type="range"
              min={Math.min(waterWetVal - 200, 1000)}
              max={Math.max(airDryVal + 200, 3600)}
              value={testRawVal}
              onChange={(e) => setTestRawVal(Number(e.target.value))}
              className="range-slider"
            />
          </div>
        </div>

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <button onClick={onClose} className="btn btn-outline">
            Cancel
          </button>
          <button onClick={handleSave} className="btn btn-default">
            {savedSuccess ? (
              <>
                <Check size={14} />
                Committed to ESP32!
              </>
            ) : (
              <>
                <Check size={14} />
                Save & Commit to Hardware
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
