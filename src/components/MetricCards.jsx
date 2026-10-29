import React from 'react';
import { Droplets, Thermometer, Wind, Sun, ShieldAlert, CheckCircle2, AlertTriangle, Layers, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function MetricCards({
  telemetry,
  thresholdLow,
  thresholdHigh,
  tempUnit,
  onToggleTempUnit
}) {
  const {
    moisture = 42,
    temperature = 24.5,
    humidity = 60,
    light = 2200,
    vpd = 0.95,
    tankLevelPercent = 75,
    tankCurrentMl = 1125,
    tankCapacityMl = 1500,
    rawAdc = 2210
  } = telemetry || {};

  const displayTemp = tempUnit === 'F' ? (temperature * 9 / 5 + 32).toFixed(1) : temperature.toFixed(1);

  // Moisture state classification
  let moistureBadge = { text: 'Optimal', variant: 'badge-emerald', sub: 'In target range' };
  if (moisture < thresholdLow) {
    moistureBadge = { text: 'Thirsty', variant: 'badge-amber', sub: `Trigger set at ${thresholdLow}%` };
  } else if (moisture > thresholdHigh + 15) {
    moistureBadge = { text: 'Saturated', variant: 'badge-cyan', sub: 'Maximum root soak' };
  }

  // Tank state classification
  const isTankLow = tankLevelPercent < 20;
  const isTankEmpty = tankLevelPercent <= 5;

  return (
    <div className="metric-grid">
      {/* 1. Volumetric Soil Moisture */}
      <div className="shadcn-stat-card">
        <div className="shadcn-stat-top">
          <span className="shadcn-stat-title">
            <Droplets size={15} color="#10b981" />
            Soil Moisture
          </span>
          <span className={`badge ${moistureBadge.variant}`}>
            {moistureBadge.text}
          </span>
        </div>

        <div>
          <div className="shadcn-stat-value tnum">
            {moisture.toFixed(1)}%
          </div>
          <div className="meter-track" style={{ marginTop: '6px', marginBottom: '8px' }}>
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.max(0, moisture))}%`,
                backgroundColor: moisture < thresholdLow ? '#f59e0b' : '#10b981'
              }}
            />
          </div>
        </div>

        <div className="shadcn-stat-footer">
          <span>ADC Raw: <strong className="tnum">{rawAdc}</strong> (Capacitive)</span>
          <span style={{ color: 'hsl(var(--muted-foreground))' }}>Target: {thresholdLow}–{thresholdHigh}%</span>
        </div>
      </div>

      {/* 2. Ambient Temperature */}
      <div className="shadcn-stat-card">
        <div className="shadcn-stat-top">
          <span className="shadcn-stat-title">
            <Thermometer size={15} color="#f97316" />
            Ambient Temperature
          </span>
          <button
            onClick={onToggleTempUnit}
            className="btn btn-outline btn-sm"
            style={{ padding: '1px 6px', height: '20px', fontSize: '10.5px' }}
            title="Toggle °C / °F"
          >
            °{tempUnit === 'C' ? 'F' : 'C'}
          </button>
        </div>

        <div>
          <div className="shadcn-stat-value tnum">
            {displayTemp}°{tempUnit}
          </div>
          <div className="meter-track" style={{ marginTop: '6px', marginBottom: '8px' }}>
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.max(0, (temperature / 40) * 100))}%`,
                backgroundColor: '#f97316'
              }}
            />
          </div>
        </div>

        <div className="shadcn-stat-footer">
          <span>DHT22 Digital Probe</span>
          <span className="badge badge-emerald">Ideal</span>
        </div>
      </div>

      {/* 3. Relative Humidity & VPD */}
      <div className="shadcn-stat-card">
        <div className="shadcn-stat-top">
          <span className="shadcn-stat-title">
            <Wind size={15} color="#06b6d4" />
            Relative Humidity
          </span>
          <span className="badge badge-outline tnum" style={{ fontSize: '10.5px' }}>
            VPD {vpd} kPa
          </span>
        </div>

        <div>
          <div className="shadcn-stat-value tnum">
            {humidity.toFixed(1)}%
          </div>
          <div className="meter-track" style={{ marginTop: '6px', marginBottom: '8px' }}>
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.max(0, humidity))}%`,
                backgroundColor: '#06b6d4'
              }}
            />
          </div>
        </div>

        <div className="shadcn-stat-footer">
          <span>Vapor Pressure Deficit</span>
          <span>Transpiration Active</span>
        </div>
      </div>

      {/* 4. Light Intensity */}
      <div className="shadcn-stat-card">
        <div className="shadcn-stat-top">
          <span className="shadcn-stat-title">
            <Sun size={15} color="#eab308" />
            Light Intensity
          </span>
          <span className="badge badge-amber">
            {light > 3500 ? 'Direct Sun' : light > 1000 ? 'Bright' : 'Ambient'}
          </span>
        </div>

        <div>
          <div className="shadcn-stat-value tnum">
            {light.toLocaleString()} <span style={{ fontSize: '14px', fontWeight: 500, color: 'hsl(var(--muted-foreground))' }}>Lux</span>
          </div>
          <div className="meter-track" style={{ marginTop: '6px', marginBottom: '8px' }}>
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.max(0, (light / 8000) * 100))}%`,
                backgroundColor: '#eab308'
              }}
            />
          </div>
        </div>

        <div className="shadcn-stat-footer">
          <span>Photoperiod Cycle</span>
          <span>Day Mode</span>
        </div>
      </div>

      {/* 5. Water Reservoir Tank */}
      <div className="shadcn-stat-card">
        <div className="shadcn-stat-top">
          <span className="shadcn-stat-title">
            <Layers size={15} color="#0284c7" />
            Water Reservoir
          </span>
          {isTankEmpty ? (
            <span className="badge badge-destructive">
              Lockout
            </span>
          ) : isTankLow ? (
            <span className="badge badge-amber">
              Low
            </span>
          ) : (
            <span className="badge badge-cyan">
              Sufficient
            </span>
          )}
        </div>

        <div>
          <div className="shadcn-stat-value tnum">
            {tankLevelPercent}%
            <span style={{ fontSize: '13px', fontWeight: 500, color: 'hsl(var(--muted-foreground))', marginLeft: '6px' }}>
              ({tankCurrentMl} / {tankCapacityMl} mL)
            </span>
          </div>
          <div className="meter-track" style={{ marginTop: '6px', marginBottom: '8px' }}>
            <div
              className="meter-fill"
              style={{
                width: `${Math.min(100, Math.max(0, tankLevelPercent))}%`,
                backgroundColor: isTankEmpty ? '#ef4444' : isTankLow ? '#f59e0b' : '#0284c7'
              }}
            />
          </div>
        </div>

        <div className="shadcn-stat-footer">
          <span>Dry-Run Cutoff</span>
          <span style={{ color: isTankEmpty ? '#ef4444' : '#10b981', fontWeight: 500 }}>
            {isTankEmpty ? 'PUMP LOCKED' : 'PROTECTED'}
          </span>
        </div>
      </div>
    </div>
  );
}
