import React from 'react';
import {
  Droplet,
  Thermometer,
  Sun,
  Zap,
  BarChart2,
  Activity,
  Bell,
  Settings,
  Cpu,
  TrendingDown,
  ArrowRight,
  Leaf,
  Check
} from 'lucide-react';

export default function BotaniQDashboard({
  activePot,
  sensorHealth,
  dataAgeSec,
  alerts,
  handleTestSoundAlert,
  setIsAlertsModalOpen,
  timeRange,
  setTimeRange,
  isPumping,
  stopWatering,
  triggerWatering,
  setIsThresholdModalOpen,
  setIsSpeciesModalOpen,
  setPots,
  activePotId,
  addToast,
  setActiveNav,
  setIsHardwareSimOpen,
  setIsWaterSavingsOpen
}) {
  return (
    <div className="dashboard-content-container">
      {/* 1. HERO GREETING BANNER WITH BOTANICAL MONSTERA FOLIAGE */}
      <div className="dashboard-header-hero">
        <div className="dashboard-hero-foliage" />

        <div className="hero-greeting-wrap">
          <h1 className="hero-greeting-title">
            Good morning, Alex!
          </h1>
          <p className="hero-greeting-sub">
            Your smart garden is thriving today.
          </p>
        </div>

        <div className="hero-actions-cluster">
          {/* Quick links to Simulator & Savings Audit */}
          <button
            onClick={() => setIsHardwareSimOpen(true)}
            className="btn-white-pill"
            style={{ padding: '6px 12px', fontSize: '11.5px', gap: '5px' }}
            title="Open IoT Hardware & Fault Simulator"
          >
            <Cpu size={13} color="var(--accent-green)" />
            <span>Simulator</span>
          </button>

          <button
            onClick={() => setIsWaterSavingsOpen(true)}
            className="btn-white-pill"
            style={{ padding: '6px 12px', fontSize: '11.5px', gap: '5px' }}
            title="View 61.9% Water Conservation Audit"
          >
            <TrendingDown size={13} color="var(--accent-green)" />
            <span>Savings (61%)</span>
          </button>

          {/* Live Node Status Pill */}
          <div
            className="hero-live-pill"
            title={`Active Node: ${activePot?.device?.deviceId || '#node-1974'} • Last ping: ${dataAgeSec}s ago`}
          >
            <span className="hero-live-dot" />
            <span>Live • {dataAgeSec === 0 ? 'just now' : `${dataAgeSec}s ago`}</span>
          </div>

          {/* Notifications Bell Button */}
          <button
            onClick={() => setIsAlertsModalOpen && setIsAlertsModalOpen(true)}
            className="hero-circle-btn"
            title={`${alerts?.length || 0} active notifications • Click to view System Notifications & Alerts`}
            style={{ position: 'relative' }}
          >
            <Bell size={17} color="var(--text-main)" />
            {alerts && alerts.some((a) => !a.acknowledged) && (
              <span
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '9px',
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: '#1F3B2E'
                }}
              />
            )}
          </button>

          {/* Alex Williamson Initial Avatar Button */}
          <div
            className="hero-avatar-btn"
            onClick={() =>
              addToast(
                'Alex Williamson (Node #node-1974) • ESP32-WROOM-32 Online • RSSI: -62 dBm',
                'info'
              )
            }
            title="Alex Williamson (Active Station Operator) • Click for Node Diagnostics"
          >
            A
          </div>
        </div>
      </div>

      {/* 2. ROW 1: 4 TOP METRIC CARDS (Soil Moisture, Temperature, Humidity, Light Level) */}
      <div className="top-metric-quad-grid">
        {/* Card 1: Soil Moisture */}
        <div className="metric-quad-card">
          <div className="metric-quad-header">
            <div className="metric-icon-disc">
              <Droplet size={19} />
            </div>
            <span className="metric-quad-label">Soil Moisture</span>
          </div>
          <div className="metric-quad-body">
            <div>
              <div className="metric-quad-num">
                {sensorHealth?.soilMoisture === 'online' && activePot?.telemetry?.moisture !== null
                  ? activePot.telemetry.moisture.toFixed(1)
                  : '42.5'}
                <span>%</span>
              </div>
              <div className="metric-quad-trend">
                <span>↑ +1.2%</span>
              </div>
            </div>
            {/* Wave Sparkline SVG */}
            <svg className="metric-sparkline-svg" viewBox="0 0 85 32" fill="none">
              <path
                d="M 2 24 C 18 24 24 10 38 14 C 52 18 60 4 83 12"
                stroke="var(--accent-green)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 2 24 C 18 24 24 10 38 14 C 52 18 60 4 83 12 L 83 32 L 2 32 Z"
                fill="url(#sparklineEmeraldGrad)"
                opacity="0.28"
              />
              <defs>
                <linearGradient id="sparklineEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-green)" />
                  <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* Card 2: Temperature */}
        <div className="metric-quad-card">
          <div className="metric-quad-header">
            <div className="metric-icon-disc">
              <Thermometer size={19} />
            </div>
            <span className="metric-quad-label">Temperature</span>
          </div>
          <div className="metric-quad-body">
            <div>
              <div className="metric-quad-num">
                {sensorHealth?.dht22 === 'online' && activePot?.telemetry?.temperature !== null
                  ? activePot.telemetry.temperature.toFixed(1)
                  : '25.0'}
                <span>°C</span>
              </div>
              <div className="metric-quad-trend">
                <span>↑ +0.3°C</span>
              </div>
            </div>
            {/* Wave Sparkline SVG */}
            <svg className="metric-sparkline-svg" viewBox="0 0 85 32" fill="none">
              <path
                d="M 2 20 C 16 26 30 12 46 16 C 60 20 68 8 83 14"
                stroke="var(--accent-green)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 2 20 C 16 26 30 12 46 16 C 60 20 68 8 83 14 L 83 32 L 2 32 Z"
                fill="url(#sparklineEmeraldGrad)"
                opacity="0.28"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: Humidity */}
        <div className="metric-quad-card">
          <div className="metric-quad-header">
            <div className="metric-icon-disc" style={{ background: 'rgba(31, 59, 46, 0.08)', color: '#1F3B2E' }}>
              <Sun size={19} />
            </div>
            <span className="metric-quad-label">Humidity</span>
          </div>
          <div className="metric-quad-body">
            <div>
              <div className="metric-quad-num">
                {activePot?.telemetry?.light ? activePot.telemetry.light.toLocaleString() : '2,450'}
                <span>Lux</span>
              </div>
              <div className="metric-quad-trend">
                <span>↑ +12%</span>
              </div>
            </div>
            {/* Wave Sparkline SVG */}
            <svg className="metric-sparkline-svg" viewBox="0 0 85 32" fill="none">
              <path
                d="M 2 16 C 18 10 32 26 48 20 C 62 14 68 24 83 10"
                stroke="var(--accent-green)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 2 16 C 18 10 32 26 48 20 C 62 14 68 24 83 10 L 83 32 L 2 32 Z"
                fill="url(#sparklineEmeraldGrad)"
                opacity="0.28"
              />
            </svg>
          </div>
        </div>

        {/* Card 4: Light Level */}
        <div className="metric-quad-card">
          <div className="metric-quad-header">
            <div className="metric-icon-disc">
              <Zap size={19} />
            </div>
            <span className="metric-quad-label">Light Level</span>
          </div>
          <div className="metric-quad-body" style={{ alignItems: 'center' }}>
            <div className="metric-quad-num" style={{ fontSize: '26px' }}>
              Good
            </div>
            {/* 3 Signal Indicator Bars */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '4px', height: '24px' }}>
              <div style={{ width: '4.5px', height: '9px', borderRadius: '2px', background: 'var(--accent-green)' }} />
              <div style={{ width: '4.5px', height: '16px', borderRadius: '2px', background: 'var(--accent-green)' }} />
              <div style={{ width: '4.5px', height: '24px', borderRadius: '2px', background: 'var(--accent-green)' }} />
            </div>
          </div>
          {/* Segmented fill bar */}
          <div className="metric-segmented-bar">
            <div className="metric-segmented-bar-fill" style={{ width: '74%' }} />
          </div>
        </div>
      </div>

      {/* 3. ROW 2: 3 MIDDLE CARDS (Plant Health, Sensor Trends, Irrigation Control) */}
      <div className="mid-control-grid">
        {/* Middle Card 1: Plant Health */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Leaf size={20} color="var(--accent-green)" />
              <span>Plant Health</span>
            </div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: 'var(--accent-green)',
                background: 'rgba(4, 106, 56, 0.1)',
                padding: '3px 10px',
                borderRadius: 'var(--radius-pill)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={11} strokeWidth={3} />
              <span>Healthy</span>
            </span>
          </div>

          <div className="plant-health-layout">
            {/* Circular Donut Gauge */}
            <div className="donut-gauge-wrapper">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="rgba(4, 106, 56, 0.12)"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="41"
                  fill="none"
                  stroke="var(--accent-green)"
                  strokeWidth="8"
                  strokeDasharray="257.6"
                  strokeDashoffset={257.6 - (257.6 * 87) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 600ms ease' }}
                />
              </svg>
              <div className="donut-center-content">
                <Leaf size={14} color="var(--accent-green)" style={{ marginBottom: '2px' }} />
                <div className="donut-pct-text">87%</div>
                <div className="donut-sub-text">Health</div>
              </div>
            </div>

            {/* Checklist */}
            <div className="plant-health-checklist">
              <div className="health-check-row">
                <div className="check-circle-icon"><Check size={12} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Soil Moisture</span>
                  <span className="check-status">Optimal • {activePot?.telemetry?.moisture ? `${activePot.telemetry.moisture.toFixed(1)}%` : '42.5%'}</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon"><Check size={12} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Temperature</span>
                  <span className="check-status">Ideal • {activePot?.telemetry?.temperature ? `${activePot.telemetry.temperature.toFixed(1)}°C` : '25.2°C'}</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon"><Check size={12} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Light Level</span>
                  <span className="check-status">Good • {activePot?.telemetry?.light ? `${activePot.telemetry.light.toLocaleString()} Lux` : '2,450 Lux'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Health Vital Summary */}
          <div className="health-vital-summary">
            <span>Biological Condition: <strong>Active Photosynthesis</strong></span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>● 98.4% Health Score</span>
          </div>

          {/* Corner Leaf Decoration */}
          <svg className="corner-leaf-decor" viewBox="0 0 100 100" fill="none">
            <path
              d="M 10 90 C 20 50 60 20 90 10 C 80 50 50 80 10 90 Z"
              fill="var(--accent-green)"
            />
          </svg>
        </div>

        {/* Middle Card 2: Sensor Trends Multi-Line Chart */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <BarChart2 size={20} color="var(--accent-green)" />
              <span>Sensor Trends</span>
            </div>
            <div className="time-range-pills">
              {['1h', '6h', '24h'].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeRange(t)}
                  className={`time-pill-btn ${timeRange === t ? 'active' : ''}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="sensor-trends-legend">
            <span>
              <span className="legend-dot" style={{ background: 'var(--accent-green)' }} />
              Moisture
            </span>
            <span>
              <span className="legend-dot" style={{ background: '#1F3B2E' }} />
              Temperature
            </span>
            <span>
              <span className="legend-dot" style={{ background: '#4A6C5D' }} />
              Humidity
            </span>
          </div>

          {/* SVG Multi-Line Spline Chart */}
          <div style={{ flex: 1, minHeight: '130px', position: 'relative', marginTop: '4px' }}>
            <svg viewBox="0 0 420 180" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="moistureGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#046A38" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#046A38" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Y-Axis Grid Lines & Labels */}
              {[
                { y: 16, val: '100' },
                { y: 52, val: '75' },
                { y: 88, val: '50' },
                { y: 124, val: '25' },
                { y: 160, val: '0' }
              ].map((grid, idx) => (
                <g key={idx}>
                  <text x="2" y={grid.y + 4} fontSize="10.5" fill="var(--text-light)" fontWeight="500">
                    {grid.val}
                  </text>
                  <line
                    x1="28"
                    y1={grid.y}
                    x2="415"
                    y2={grid.y}
                    stroke="var(--card-border)"
                    strokeDasharray={idx === 4 ? 'none' : '3 3'}
                    strokeWidth="0.8"
                  />
                </g>
              ))}

              {/* Moisture Soft Gradient Fill */}
              <path
                d="M 35 60 C 70 70 115 48 160 44 C 215 40 260 64 305 56 C 345 48 385 62 415 50 L 415 160 L 35 160 Z"
                fill="url(#moistureGradient)"
              />

              {/* Moisture Spline (Emerald Green) */}
              <path
                d="M 35 60 C 70 70 115 48 160 44 C 215 40 260 64 305 56 C 345 48 385 62 415 50"
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="2.8"
                strokeLinecap="round"
              />

              {/* Temperature Spline (Deep Pine Green) */}
              <path
                d="M 35 88 C 85 94 140 80 180 72 C 235 64 280 86 320 74 C 360 66 390 82 415 94"
                fill="none"
                stroke="#1F3B2E"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Humidity Spline (Dark Sage Green) */}
              <path
                d="M 35 128 C 85 124 130 134 175 114 C 220 94 265 120 310 108 C 350 100 390 116 415 128"
                fill="none"
                stroke="#4A6C5D"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* X-Axis Timestamps */}
              {[
                { x: 35, time: '9AM' },
                { x: 130, time: '9:15AM' },
                { x: 225, time: '9:30AM' },
                { x: 320, time: '9:45AM' },
                { x: 405, time: '10AM' }
              ].map((t, i) => (
                <text key={i} x={t.x} y="176" fontSize="10.5" fill="var(--text-light)" textAnchor="middle" fontWeight="500">
                  {t.time}
                </text>
              ))}
            </svg>
          </div>

          {/* Sensor Trends Footer Metrics */}
          <div className="sensor-trends-footer">
            <span>Peak: <strong>58.2%</strong></span>
            <span>Ambient: <strong>25.2°C</strong></span>
            <span>VPD: <strong>0.92 kPa</strong> (Optimal)</span>
          </div>
        </div>

        {/* Middle Card 3: Irrigation Control */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Droplet size={20} color="var(--accent-green)" />
              <span>Irrigation Control</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: isPumping ? '#ffffff' : 'var(--accent-green)',
                background: isPumping ? 'var(--accent-green)' : 'rgba(4, 106, 56, 0.1)',
                padding: '2px 8px',
                borderRadius: 'var(--radius-pill)'
              }}
            >
              {isPumping ? 'Active' : 'Autonomous'}
            </span>
          </div>

          {/* Inner Elevated Highlight Box */}
          <div className="irrigation-inner-container">
            <div className="irrigation-pump-info">
              <div className={`pump-droplet-badge ${!isPumping ? 'off' : ''}`}>
                <Droplet size={22} fill="#ffffff" />
              </div>
              <div className="pump-text-group">
                <span className="pump-label">Sub-surface Pump</span>
                <span className="pump-state-headline">
                  {isPumping ? 'PUMP ACTIVE' : 'PUMP OFF'}
                </span>
                <span className="pump-reason-desc">
                  {isPumping ? 'Delivering calibrated root pulse' : 'Moisture is within nominal target range'}
                </span>
              </div>
            </div>

            {/* Switch Toggle */}
            <div
              className="switch-container"
              onClick={() => {
                if (isPumping) {
                  stopWatering();
                } else {
                  triggerWatering(6, 'Manual', 'Manual pulse initiated via Irrigation Switch');
                }
              }}
              title="Toggle Water Pump State"
            >
              <div className={`switch-track ${isPumping ? 'active' : ''}`}>
                <div className="switch-thumb" />
              </div>
            </div>
          </div>

          {/* Quick Telemetry Status Strip */}
          <div className="irrigation-status-strip">
            <div className="status-strip-col">
              <span className="strip-label">Trigger</span>
              <span className="strip-val">&lt; 32% Soil</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Dose</span>
              <span className="strip-val">{activePot?.settings?.waterPerCycleMl || 45} mL</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Last Pulse</span>
              <span className="strip-val">10:12 AM</span>
            </div>
          </div>

          {/* Daily Cycle Telemetry Chip */}
          <div className="irrigation-cycle-chip">
            <span>Water Delivered Today: <strong>135 mL</strong> (3 pulses)</span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              Ready
            </span>
          </div>

          {/* Bottom Actions Row */}
          <div className="irrigation-actions-row">
            <button
              onClick={() =>
                triggerWatering(activePot?.settings?.burstDurationSec || 6, 'Manual', 'Manual water button pressed')
              }
              disabled={isPumping || (activePot?.telemetry?.tankLevelPercent || 0) <= 5}
              className="irrigation-action-btn"
              title="Dispense calibrated water pulse"
            >
              <Droplet size={14} color="var(--accent-green)" />
              <span>Manual Water</span>
            </button>

            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="irrigation-action-btn"
              title="Configure moisture threshold trigger points"
            >
              <Settings size={14} color="var(--text-muted)" />
              <span>Set Threshold</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4. ROW 3: 3 BOTTOM WIDGETS (Water Reservoir, Species Presets, Recent Activity) */}
      <div className="bottom-widgets-grid">
        {/* Bottom Card 1: Water Reservoir */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Droplet size={20} color="var(--accent-green)" />
              <span>Water Reservoir</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-green)',
                background: 'rgba(4, 106, 56, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Optimal Level
            </span>
          </div>

          <div className="widget-content-layout">
            <div className="widget-preview-frame">
              <img
                src="/water_tank.png"
                alt="Water Reservoir Container"
                className="widget-frame-asset"
              />
            </div>
            <div className="widget-info-col">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                  <span className="widget-headline-val">
                    {activePot?.telemetry?.tankLevelPercent || 78}%
                  </span>
                  <span className="widget-badge-tag success">Tank Full</span>
                </div>
                <button
                  onClick={() => {
                    setPots((prev) =>
                      prev.map((p) =>
                        p.id === activePotId
                          ? { ...p, telemetry: { ...p.telemetry, tankLevelPercent: 100, tankCurrentMl: 1500 } }
                          : p
                      )
                    );
                    addToast('Water reservoir refilled to 1500 mL (100%)!', 'success');
                  }}
                  className="widget-action-btn"
                  title="Refill reservoir tank to 100%"
                >
                  Refill Tank
                </button>
              </div>
              <div className="widget-sub-metric">
                <span>{(((activePot?.telemetry?.tankLevelPercent || 78) * 1.5) / 100).toFixed(2)} L of 1.50 L Reservoir Capacity</span>
              </div>
              <div className="widget-meter-track" title={`Reservoir Level: ${activePot?.telemetry?.tankLevelPercent || 78}%`}>
                <div
                  className="widget-meter-fill"
                  style={{ width: `${activePot?.telemetry?.tankLevelPercent || 78}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Telemetry Specs Strip */}
          <div className="irrigation-status-strip">
            <div className="status-strip-col">
              <span className="strip-label">Daily Avg</span>
              <span className="strip-val">~180 mL</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Remaining</span>
              <span className="strip-val">4.2 Days</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Safe Margin</span>
              <span className="strip-val">&gt; 10% (150 mL)</span>
            </div>
          </div>

          {/* Bottom Autonomy Vital Chip */}
          <div className="health-vital-summary">
            <span>Autonomy: <strong>Safe Reserve</strong></span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              Pump Armed
            </span>
          </div>
        </div>

        {/* Bottom Card 2: Species Presets */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Leaf size={20} color="var(--accent-green)" />
              <span>Species Presets</span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--accent-green)',
                background: 'rgba(4, 106, 56, 0.08)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}
            >
              Active Profile
            </span>
          </div>

          <div className="widget-content-layout">
            <div className="widget-preview-frame">
              <img
                src="/potted_plant.png"
                alt="Swiss Cheese Plant (Monstera)"
                className="widget-frame-asset"
              />
            </div>
            <div className="widget-info-col">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                <div className="widget-species-title-group">
                  <div className="widget-species-name">
                    {activePot?.preset ? activePot.preset.commonName.split('/')[0] : 'Swiss Cheese Plant'}
                  </div>
                  <div className="widget-species-sub">
                    Monstera Deliciosa • Tropical Foliage
                  </div>
                </div>
                <button
                  onClick={() => setIsSpeciesModalOpen(true)}
                  className="widget-action-btn"
                  title="Change botanical species preset"
                >
                  Change Preset
                </button>
              </div>
              <div className="widget-sub-metric">
                <span>Target Range: <strong>{activePot?.settings?.thresholdLow || 32}% – {activePot?.settings?.thresholdHigh || 58}%</strong></span>
                <span className="widget-badge-tag subtle">Ideal</span>
              </div>
              <div
                className="widget-range-track"
                title={`Target Band: ${activePot?.settings?.thresholdLow || 32}% – ${activePot?.settings?.thresholdHigh || 58}%, Live Moisture: ${activePot?.telemetry?.soilMoisture || 42.5}%`}
              >
                <div
                  className="widget-range-band"
                  style={{
                    left: `${activePot?.settings?.thresholdLow || 32}%`,
                    width: `${(activePot?.settings?.thresholdHigh || 58) - (activePot?.settings?.thresholdLow || 32)}%`
                  }}
                />
                <div
                  className="widget-range-pin"
                  style={{ left: `${Math.min(96, Math.max(4, activePot?.telemetry?.soilMoisture || 42.5))}%` }}
                />
              </div>
            </div>
          </div>

          {/* Quick Telemetry Specs Strip */}
          <div className="irrigation-status-strip">
            <div className="status-strip-col">
              <span className="strip-label">Root Dose</span>
              <span className="strip-val">{activePot?.settings?.waterPerCycleMl || 45} mL</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Pulse Burst</span>
              <span className="strip-val">{activePot?.settings?.burstDurationSec || 8}s</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Soak Cycle</span>
              <span className="strip-val">120 mins</span>
            </div>
          </div>

          {/* Bottom Botanical Vital Chip */}
          <div className="health-vital-summary">
            <span>Botanical Profile: <strong>High Aeration</strong></span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--accent-green)', display: 'inline-block' }} />
              Active Profile
            </span>
          </div>
        </div>

        {/* Bottom Card 3: Recent Activity */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Activity size={20} color="var(--accent-green)" />
              <span>Recent Activity</span>
            </div>
            <button
              onClick={() => setActiveNav('logs')}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--text-main)',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px'
              }}
              title="View complete actuation and telemetry logs"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="activity-feed-list">
            <div className="activity-feed-item">
              <span className="activity-dot green" />
              <div className="activity-text-col">
                <span className="activity-text-title">{isPumping ? 'Pump currently active' : 'Pump cycle completed'}</span>
                <span className="activity-text-desc">Delivered 45 mL to root zone</span>
              </div>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot dark" />
              <div className="activity-text-col">
                <span className="activity-text-title">Sensor telemetry synced</span>
                <span className="activity-text-desc">Moisture 42.5% • 25.2°C • 2,450 Lux</span>
              </div>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot pine" />
              <div className="activity-text-col">
                <span className="activity-text-title">Threshold safety verified</span>
                <span className="activity-text-desc">All parameters within optimal band</span>
              </div>
              <span className="activity-time-stamp">09:50 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot pine" />
              <div className="activity-text-col">
                <span className="activity-text-title">MQTT node heartbeat</span>
                <span className="activity-text-desc">ESP32 online • RSSI -58 dBm</span>
              </div>
              <span className="activity-time-stamp">09:15 AM</span>
            </div>
          </div>

          {/* Activity Footer Chip */}
          <div className="activity-footer-chip">
            <span>ESP32 Telemetry Node: <strong>#node-1974</strong></span>
            <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>● 100% Uptime</span>
          </div>

          {/* Decorative Botanical Leaf in bottom-right */}
          <svg
            style={{
              position: 'absolute',
              bottom: '-10px',
              right: '-10px',
              width: '75px',
              height: '75px',
              opacity: 0.18,
              pointerEvents: 'none'
            }}
            viewBox="0 0 100 100"
            fill="none"
          >
            <path
              d="M 90 90 C 70 50 40 30 10 20 C 30 60 60 80 90 90 Z"
              fill="var(--accent-green)"
            />
            <path
              d="M 90 90 C 50 70 30 40 20 10 C 60 30 80 60 90 90 Z"
              fill="var(--accent-green)"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}
