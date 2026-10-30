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
                <div className="check-circle-icon"><Check size={13} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Soil Moisture</span>
                  <span className="check-status">Optimal • {activePot?.telemetry?.moisture ? `${activePot.telemetry.moisture.toFixed(1)}%` : '42.5%'}</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon"><Check size={13} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Temperature</span>
                  <span className="check-status">Ideal • {activePot?.telemetry?.temperature ? `${activePot.telemetry.temperature.toFixed(1)}°C` : '25.2°C'}</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon"><Check size={13} strokeWidth={3} /></div>
                <div className="check-label-col">
                  <span className="check-title">Light Level</span>
                  <span className="check-status">Good • {activePot?.telemetry?.light ? `${activePot.telemetry.light.toLocaleString()} Lux` : '2,450 Lux'}</span>
                </div>
              </div>
            </div>
          </div>
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
          <div style={{ flex: 1, minHeight: '150px', position: 'relative', marginTop: '4px', display: 'flex', alignItems: 'center' }}>
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
                  <text x="2" y={grid.y + 4} fontSize="11" fill="var(--text-light)" fontWeight="500">
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
                <text key={i} x={t.x} y="176" fontSize="11" fill="var(--text-light)" textAnchor="middle" fontWeight="500">
                  {t.time}
                </text>
              ))}
            </svg>
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

          {/* Inner Highlight Box */}
          <div className="irrigation-inner-container">
            <div className="irrigation-pump-info">
              <div className={`pump-droplet-badge ${!isPumping ? 'off' : ''}`}>
                <Droplet size={22} fill="#ffffff" />
              </div>
              <div className="pump-text-group">
                <span className="pump-label">Water Pump</span>
                <span className="pump-state-headline">
                  {isPumping ? 'Active Pulse' : 'Standby (Off)'}
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
              <span className="strip-label">Cycle Dose</span>
              <span className="strip-val">{activePot?.settings?.waterPerCycleMl || 45} mL</span>
            </div>
            <div className="status-strip-divider" />
            <div className="status-strip-col">
              <span className="strip-label">Delivered Today</span>
              <span className="strip-val" style={{ color: 'var(--accent-green)' }}>135 mL</span>
            </div>
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
              <Droplet size={15} color="var(--accent-green)" />
              <span>Manual Water</span>
            </button>

            <button
              onClick={() => setIsThresholdModalOpen(true)}
              className="irrigation-action-btn"
              title="Configure moisture threshold trigger points"
            >
              <Settings size={15} color="var(--text-muted)" />
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
              <div className="reservoir-primary-stat">
                <span className="widget-headline-val">
                  {activePot?.telemetry?.tankLevelPercent || 78}%
                </span>
                <span className="reservoir-volume-text">
                  {(((activePot?.telemetry?.tankLevelPercent || 78) * 1.5) / 100).toFixed(2)} L / 1.50 L
                </span>
              </div>
              <div className="reservoir-meter-row">
                <div className="widget-meter-track" title={`Reservoir Level: ${activePot?.telemetry?.tankLevelPercent || 78}%`}>
                  <div
                    className="widget-meter-fill"
                    style={{ width: `${activePot?.telemetry?.tankLevelPercent || 78}%` }}
                  />
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
                  Refill
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Card 2: Species Presets */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Leaf size={20} color="var(--accent-green)" />
              <span>Species Presets</span>
            </div>
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
              <div className="species-name-bold">
                {activePot?.preset ? activePot.preset.commonName.split('/')[0] : 'Swiss Cheese Plant'}
              </div>
              <div className="species-target-row">
                <span className="species-target-band">
                  {activePot?.settings?.thresholdLow || 32}% – {activePot?.settings?.thresholdHigh || 58}%
                </span>
                <button
                  onClick={() => setIsSpeciesModalOpen(true)}
                  className="widget-action-btn"
                  title="Change botanical species preset"
                >
                  Change
                </button>
              </div>
            </div>
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
              className="recent-activity-view-all"
              title="View complete actuation and telemetry logs"
            >
              <span>View All</span>
              <ArrowRight size={13} />
            </button>
          </div>

          <div className="activity-feed-list">
            <div className="activity-feed-item">
              <span className="activity-dot green" />
              <span className="activity-clean-text">{isPumping ? 'Pump currently active' : 'Pump cycle completed'}</span>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot dark" />
              <span className="activity-clean-text">Sensor telemetry synced</span>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot pine" />
              <span className="activity-clean-text">Threshold safety verified</span>
              <span className="activity-time-stamp">09:50 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot pine" />
              <span className="activity-clean-text">MQTT node heartbeat</span>
              <span className="activity-time-stamp">09:15 AM</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
