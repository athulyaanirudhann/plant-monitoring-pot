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
  ArrowRight
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
      {/* 1. HERO GREETING BANNER WITH BOTANICAL MONSTERA FOLIAGE */}
      <div className="dashboard-header-hero">
        <div className="dashboard-hero-foliage" />

        <div className="hero-greeting-wrap">
          <h1 className="hero-greeting-title">
            Good morning, Alex! 🌿
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
              <span style={{ fontSize: '18px' }}>🌿</span>
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
              ✓ Healthy
            </span>
          </div>

          <div className="plant-health-layout">
            {/* Circular Donut Gauge */}
            <div className="donut-gauge-wrapper">
              <svg className="donut-svg" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="rgba(4, 106, 56, 0.12)"
                  strokeWidth="10"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="var(--accent-green)"
                  strokeWidth="10"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 87) / 100}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 600ms ease' }}
                />
              </svg>
              <div className="donut-center-content">
                <div className="donut-sprout-icon">🌱</div>
                <div className="donut-pct-text">87%</div>
                <div className="donut-sub-text">Overall Health</div>
              </div>
            </div>

            {/* Checklist */}
            <div className="plant-health-checklist">
              <div className="health-check-row">
                <div className="check-circle-icon">✓</div>
                <div className="check-label-col">
                  <span className="check-title">Soil Moisture</span>
                  <span className="check-status">Optimal</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon">✓</div>
                <div className="check-label-col">
                  <span className="check-title">Temperature</span>
                  <span className="check-status">Ideal</span>
                </div>
              </div>
              <div className="health-check-row">
                <div className="check-circle-icon">✓</div>
                <div className="check-label-col">
                  <span className="check-title">Light Level</span>
                  <span className="check-status">Good</span>
                </div>
              </div>
            </div>
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
              <BarChart2 size={18} color="var(--accent-green)" />
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
          <div style={{ flex: 1, minHeight: '130px', position: 'relative' }}>
            <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              {/* Y-Axis Grid Lines & Labels */}
              {[
                { y: 15, val: '100' },
                { y: 45, val: '75' },
                { y: 75, val: '50' },
                { y: 105, val: '25' },
                { y: 135, val: '0' }
              ].map((grid, idx) => (
                <g key={idx}>
                  <text x="2" y={grid.y + 4} fontSize="9.5" fill="var(--text-light)" fontWeight="500">
                    {grid.val}
                  </text>
                  <line
                    x1="28"
                    y1={grid.y}
                    x2="395"
                    y2={grid.y}
                    stroke="var(--card-border)"
                    strokeDasharray={idx === 4 ? 'none' : '3 3'}
                    strokeWidth="0.8"
                  />
                </g>
              ))}

              {/* Moisture Spline (Emerald Green) */}
              <path
                d="M 35 48 C 70 54 110 38 150 36 C 200 34 240 50 280 44 C 320 38 350 48 390 42"
                fill="none"
                stroke="var(--accent-green)"
                strokeWidth="2.4"
                strokeLinecap="round"
              />

              {/* Temperature Spline (Deep Pine Green) */}
              <path
                d="M 35 68 C 80 72 130 64 170 58 C 220 52 260 68 300 60 C 340 54 370 66 390 74"
                fill="none"
                stroke="#1F3B2E"
                strokeWidth="2.2"
                strokeLinecap="round"
              />

              {/* Humidity Spline (Dark Sage Green) */}
              <path
                d="M 35 98 C 80 96 120 102 160 88 C 200 74 240 92 280 84 C 320 78 360 90 390 98"
                fill="none"
                stroke="#4A6C5D"
                strokeWidth="2"
                strokeLinecap="round"
              />

              {/* X-Axis Timestamps */}
              {[
                { x: 35, time: '9AM' },
                { x: 120, time: '9:15AM' },
                { x: 205, time: '9:30AM' },
                { x: 290, time: '9:45AM' },
                { x: 375, time: '10AM' }
              ].map((t, i) => (
                <text key={i} x={t.x} y="148" fontSize="9" fill="var(--text-light)" textAnchor="middle">
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
              <Droplet size={18} color="var(--accent-green)" />
              <span>Irrigation Control</span>
            </div>
          </div>

          {/* Inner Elevated Highlight Box */}
          <div className="irrigation-inner-container">
            <div className="irrigation-pump-info">
              <div className={`pump-droplet-badge ${!isPumping ? 'off' : ''}`}>
                <Droplet size={24} fill="#ffffff" />
              </div>
              <div className="pump-text-group">
                <span className="pump-label">Pump</span>
                <span className="pump-state-headline">
                  {isPumping ? 'ON' : 'OFF'}
                </span>
                <span className="pump-reason-desc">
                  {isPumping ? 'Delivering root hydration' : 'Soil moisture is sufficient'}
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
              <span style={{ fontSize: '16px' }}>💧</span>
              <span>Water Reservoir</span>
            </div>
          </div>

          <div className="widget-content-layout">
            <img
              src="/water_tank.jpg"
              alt="Water Reservoir Container"
              className="tank-render-img"
            />
            <div className="widget-info-col">
              <div className="widget-headline-val">
                {activePot?.telemetry?.tankLevelPercent || 78}%
              </div>
              <div className="widget-sub-metric">
                {(((activePot?.telemetry?.tankLevelPercent || 78) * 1.5) / 100).toFixed(2)} L / 1.50 L
              </div>
              <div className="metric-segmented-bar" style={{ marginTop: '0', marginBottom: '12px' }}>
                <div
                  className="metric-segmented-bar-fill"
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
                className="widget-action-pill"
                title="Refill reservoir tank to 100%"
              >
                Refill
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Card 2: Species Presets */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <span style={{ fontSize: '16px' }}>🌱</span>
              <span>Species Presets</span>
            </div>
          </div>

          <div className="widget-content-layout">
            <img
              src="/potted_plant.jpg"
              alt="Swiss Cheese Plant (Monstera)"
              className="potted-plant-render-img"
            />
            <div className="widget-info-col">
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px' }}>
                {activePot?.preset ? activePot.preset.commonName.split('/')[0] : 'Swiss Cheese Plant'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--accent-green)', marginBottom: '14px' }}>
                {activePot?.settings?.thresholdLow || 32}% – {activePot?.settings?.thresholdHigh || 58}%
              </div>
              <button
                onClick={() => setIsSpeciesModalOpen(true)}
                className="widget-action-pill outline"
                title="Change botanical species preset"
              >
                Change
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Card 3: Recent Activity */}
        <div className="mockup-card">
          <div className="mockup-card-header">
            <div className="mockup-card-title">
              <Activity size={18} color="var(--accent-green)" />
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
              <span className="activity-text-title">
                {isPumping ? 'Pump currently ON' : 'Pump turned ON'}
              </span>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot dark" />
              <span className="activity-text-title">Sensor data updated</span>
              <span className="activity-time-stamp">10:12 AM</span>
            </div>
            <div className="activity-feed-item">
              <span className="activity-dot pine" />
              <span className="activity-text-title">Soil moisture low (alert)</span>
              <span className="activity-time-stamp">09:50 AM</span>
            </div>
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
