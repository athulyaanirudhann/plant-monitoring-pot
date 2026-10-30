import React, { useState, useEffect } from 'react';
import {
  INITIAL_POTS,
  INITIAL_ACTUATION_LOGS,
  INITIAL_ALERTS,
  generateHistoryData
} from './data/initialState';
import { PLANT_PRESETS } from './data/plantPresets';
import PotIllustration from './components/PotIllustration';
import MetricCards from './components/MetricCards';
import HistoryChart from './components/HistoryChart';
import ThresholdSettings from './components/ThresholdSettings';
import ActuationLogs from './components/ActuationLogs';
import DeviceStatusCard from './components/DeviceStatusCard';
import CalibrationModal from './components/CalibrationModal';
import WaterSavingsModal from './components/WaterSavingsModal';
import HardwareSimulator from './components/HardwareSimulator';
import AlertsCenter from './components/AlertsCenter';
import HardwareCenter from './components/HardwareCenter';
import confetti from 'canvas-confetti';

import {
  LayoutDashboard,
  BarChart2,
  Users,
  FileText,
  HelpCircle,
  Sliders,
  Droplet,
  Layers,
  Cpu,
  ArrowUpRight,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  Check,
  Calendar,
  AlertTriangle,
  Send,
  Zap,
  Download,
  Box
} from 'lucide-react';

export default function App() {
  const [pots, setPots] = useState(INITIAL_POTS);
  const [activePotId, setActivePotId] = useState(INITIAL_POTS[0].id);

  const activePot = pots.find((p) => p.id === activePotId) || pots[0];

  const [activeNav, setActiveNav] = useState('dashboard'); // 'dashboard' | 'analytics' | 'fleet' | 'logs' | 'hardware'
  const [timeRange, setTimeRange] = useState('24h');
  const [historyData, setHistoryData] = useState(() =>
    generateHistoryData(24, activePot.telemetry.moisture)
  );
  const [actuationLogs, setActuationLogs] = useState(INITIAL_ACTUATION_LOGS);
  const [alerts, setAlerts] = useState(INITIAL_ALERTS);

  const [isPumping, setIsPumping] = useState(false);
  const [tempUnit, setTempUnit] = useState('C');

  const [isCalibrationOpen, setIsCalibrationOpen] = useState(false);
  const [isWaterSavingsOpen, setIsWaterSavingsOpen] = useState(false);
  const [isHardwareSimOpen, setIsHardwareSimOpen] = useState(false);
  const [card3View, setCard3View] = useState('map'); // 'map' | 'pot'

  // Sensor Calibration Workbench State
  const [calAirDry, setCalAirDry] = useState(activePot.calibration?.airDryRawAdc || 3280);
  const [calWaterWet, setCalWaterWet] = useState(activePot.calibration?.waterWetRawAdc || 1390);
  const [calTestAdc, setCalTestAdc] = useState(activePot.telemetry?.rawAdc || 2200);

  useEffect(() => {
    if (activePot?.calibration) {
      setCalAirDry(activePot.calibration.airDryRawAdc || 3280);
      setCalWaterWet(activePot.calibration.waterWetRawAdc || 1390);
    }
    if (activePot?.telemetry) {
      setCalTestAdc(activePot.telemetry.rawAdc || 2200);
    }
  }, [activePotId]);

  const computeTestMoisture = (raw, dry, wet) => {
    if (dry === wet) return 0;
    const pct = ((dry - raw) / (dry - wet)) * 100;
    return Math.min(100, Math.max(0, Number(pct.toFixed(1))));
  };

  // Locked to light theme matching AeauxGlobal white canvas
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('botaniq_theme', 'light');
  }, []);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (msg, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => {
      const filtered = prev.filter((t) => t.msg !== msg);
      return [...filtered.slice(-1), { id, msg, type }];
    });
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2500);
  };

  useEffect(() => {
    const hours = timeRange === '1h' ? 1 : timeRange === '24h' ? 24 : 168;
    setHistoryData(generateHistoryData(hours, activePot.telemetry.moisture));
  }, [activePotId, timeRange]);

  // Live Telemetry Heartbeat Simulation (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setPots((prevPots) =>
        prevPots.map((p) => {
          if (p.id !== activePotId) return p;

          const moistureDecay = isPumping ? 0 : 0.05;
          const newMoisture = Math.max(12, Math.min(95, p.telemetry.moisture - moistureDecay));

          const dry = p.calibration.airDryRawAdc;
          const wet = p.calibration.waterWetRawAdc;
          const rawAdc = Math.round(dry - (newMoisture / 100) * (dry - wet));

          const newTemp = Number((p.telemetry.temperature + (Math.random() * 0.2 - 0.1)).toFixed(1));
          const newHumidity = Number((p.telemetry.humidity + (Math.random() * 0.4 - 0.2)).toFixed(1));

          if (
            newMoisture < p.settings.thresholdLow &&
            p.settings.autoWateringEnabled &&
            !isPumping &&
            p.telemetry.tankLevelPercent > 5
          ) {
            triggerWatering(p.settings.burstDurationSec, 'Autonomous', `Soil moisture dropped to ${newMoisture.toFixed(1)}% (Below set point ${p.settings.thresholdLow}%)`);
          }

          return {
            ...p,
            device: {
              ...p.device,
              uptimeSeconds: p.device.uptimeSeconds + 3,
              lastHeartbeat: Date.now()
            },
            telemetry: {
              ...p.telemetry,
              moisture: Number(newMoisture.toFixed(1)),
              rawAdc: rawAdc,
              temperature: newTemp,
              humidity: newHumidity,
              lastUpdated: Date.now()
            }
          };
        })
      );
    }, 3000);

    return () => clearInterval(timer);
  }, [activePotId, isPumping]);

  // Core Watering Actuation Routine
  const triggerWatering = (durationSec = 6, triggerType = 'Manual', triggerReason = 'Manual user pulse test') => {
    if (isPumping) return;

    if (activePot.telemetry.tankLevelPercent <= 5) {
      addToast('Cannot water: Water reservoir tank is empty! Dry-run protection active.', 'critical');
      return;
    }

    setIsPumping(true);
    addToast(`Sub-surface pump active: dispensing ${durationSec}s root hydration...`, 'info');

    const moistureBefore = activePot.telemetry.moisture;
    const deliveredMl = Math.round(durationSec * 5.5);

    setTimeout(() => {
      const moistureGain = Number((durationSec * 3.2).toFixed(1));
      const moistureAfter = Number(Math.min(92, moistureBefore + moistureGain).toFixed(1));

      const newTankCurrent = Math.max(0, activePot.telemetry.tankCurrentMl - deliveredMl);
      const newTankPercent = Math.round((newTankCurrent / activePot.telemetry.tankCapacityMl) * 100);

      setPots((prevPots) =>
        prevPots.map((p) => {
          if (p.id !== activePotId) return p;
          return {
            ...p,
            telemetry: {
              ...p.telemetry,
              moisture: moistureAfter,
              tankCurrentMl: newTankCurrent,
              tankLevelPercent: newTankPercent,
              lastUpdated: Date.now()
            }
          };
        })
      );

      const newLog = {
        id: 'act-' + Date.now(),
        potId: activePotId,
        timestamp: new Date().toLocaleString(),
        triggerType: triggerType,
        triggerReason: triggerReason,
        durationSec: durationSec,
        moistureBefore: moistureBefore,
        moistureAfter: moistureAfter,
        volumeMl: deliveredMl,
        status: 'Completed Successfully'
      };

      setActuationLogs((prev) => [newLog, ...prev]);
      setIsPumping(false);
      addToast(`Watering completed: Soil moisture restored to ${moistureAfter}%.`, 'success');

      if (newTankPercent < 20) {
        setAlerts((prev) => [
          {
            id: 'alt-' + Date.now(),
            potId: activePotId,
            type: 'warning',
            title: 'Water Reservoir Low (< 20%)',
            message: `Current volume: ${newTankCurrent} mL (${newTankPercent}%). Refill soon.`,
            timestamp: 'Just now',
            acknowledged: false
          },
          ...prev
        ]);
      }
    }, durationSec * 1000);
  };

  const handleUpdateSettings = (newSettings) => {
    setPots((prevPots) =>
      prevPots.map((p) => {
        if (p.id !== activePotId) return p;
        return {
          ...p,
          settings: newSettings
        };
      })
    );
    addToast('Threshold settings synced with ESP32 NVS storage!', 'success');
  };

  const handleApplyPreset = (preset) => {
    setPots((prevPots) =>
      prevPots.map((p) => {
        if (p.id !== activePotId) return p;
        return {
          ...p,
          plantPresetId: preset.id,
          preset: preset,
          settings: {
            ...p.settings,
            thresholdLow: preset.thresholdLow,
            thresholdHigh: preset.thresholdHigh,
            burstDurationSec: preset.burstDurationSec,
            soakTimeMin: preset.soakTimeMin
          }
        };
      })
    );
    addToast(`Applied species profile for ${preset.commonName}!`, 'success');
  };

  const handleSaveCalibration = (newCal) => {
    setPots((prevPots) =>
      prevPots.map((p) => {
        if (p.id !== activePotId) return p;
        return {
          ...p,
          calibration: newCal
        };
      })
    );
    addToast('2-point calibration committed to hardware flash!', 'success');
  };

  const handleHardwareTelemetryUpdate = (data) => {
    setPots((prevPots) =>
      prevPots.map((p) => {
        if (p.id !== activePotId) return p;
        return {
          ...p,
          telemetry: {
            ...p.telemetry,
            moisture: data.moisture !== undefined ? data.moisture : p.telemetry.moisture,
            rawAdc: data.raw_adc !== undefined ? data.raw_adc : p.telemetry.rawAdc,
            temperature: data.temp !== undefined ? data.temp : p.telemetry.temperature,
            humidity: data.humidity !== undefined ? data.humidity : p.telemetry.humidity,
            light: data.light !== undefined ? data.light : p.telemetry.light,
            tankLevelPercent: data.tank_ok !== undefined ? (data.tank_ok ? p.telemetry.tankLevelPercent : 5) : p.telemetry.tankLevelPercent,
            lastUpdated: Date.now()
          }
        };
      })
    );
    addToast('Live data received from physical ESP32!', 'success');
  };

  const handleDismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };
  const handleAcknowledgeAlert = (id) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, acknowledged: true } : a))
    );
    addToast('Alert marked as acknowledged.', 'info');
  };

  const handleTestSoundAlert = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1320, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.45);
      addToast('Audible alert synthesized.', 'info');
    } catch (e) {
      addToast('Audio alert synthesized.', 'info');
    }
  };

  const handleExportTelemetryCsv = () => {
    if (!historyData || historyData.length === 0) return;
    const headers = ['Timestamp', 'Date', 'Time', 'SoilMoisture_Pct', 'Temperature_C', 'Humidity_Pct', 'Light_Lux', 'VPD_kPa'];
    const rows = historyData.map((d) => [
      d.timestamp,
      d.date,
      d.time,
      d.moisture,
      d.temperature,
      d.humidity,
      d.light,
      d.vpd
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `botaniq_telemetry_${activePot.id}_${timeRange}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Telemetry dataset exported to CSV!', 'success');
  };

  const handleExportActuationCsv = () => {
    if (!actuationLogs || actuationLogs.length === 0) return;
    const headers = ['LogId', 'PotId', 'Timestamp', 'TriggerType', 'TriggerReason', 'DurationSec', 'MoistureBefore', 'MoistureAfter', 'VolumeMl', 'Status'];
    const rows = actuationLogs.map((l) => [
      l.id,
      l.potId,
      `"${l.timestamp}"`,
      l.triggerType,
      `"${l.triggerReason}"`,
      l.durationSec,
      l.moistureBefore,
      l.moistureAfter,
      l.volumeMl,
      `"${l.status}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `botaniq_pump_actuation_logs.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Pump actuation logs exported to CSV!', 'success');
  };

  // Sparkline data for Top Cards
  const moistureBars = [14, 22, 35, 28, 42, 38];
  const tempBars = [18, 30, 24, 34, 28];
  const lightBars = [10, 20, 36, 18, 32];

  // Gauge calculation (Semi-circle donut: 180 degrees)
  const moistureGaugeVal = Math.min(100, Math.max(0, activePot.telemetry.moisture));
  // Circumference for r=70 is pi*70 ≈ 220
  const gaugeArc = (moistureGaugeVal / 100) * 220;

  return (
    <div className="dashboard-window">
      {/* 1. LEFT SIDEBAR PANEL (Exact AeuxGlobal structure ditto) */}
      <aside className="sidebar-panel">
        <div>
          {/* Brand Logo */}
          <div className="sidebar-brand">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
              <path d="M6 16C5 12 7 6 15 3C15 9 13 15 6 16Z" fill="#00c06d" />
              <path d="M11 21C10 18 11.5 13 18 11C18 15 16.5 20 11 21Z" fill="#34d399" />
            </svg>
            <span className="brand-text">BotanIQ IoT</span>
          </div>

          {/* Navigation Section */}
          <div className="sidebar-nav-title">NAVIGATION</div>

          <div className="sidebar-nav-list">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`sidebar-nav-item ${activeNav === 'dashboard' ? 'active' : ''}`}
              title="Overview of real-time moisture, VPD, and plant root metrics"
            >
              <LayoutDashboard className="sidebar-nav-icon" size={18} />
              <span>Dashboard</span>
            </button>

            <button
              onClick={() => setActiveNav('analytics')}
              className={`sidebar-nav-item ${activeNav === 'analytics' ? 'active' : ''}`}
              title="Historical telemetry charts for moisture, temperature, and VPD"
            >
              <BarChart2 className="sidebar-nav-icon" size={18} />
              <span>Telemetry Analytics</span>
            </button>

            <button
              onClick={() => setActiveNav('fleet')}
              className={`sidebar-nav-item ${activeNav === 'fleet' ? 'active' : ''}`}
              title="Manage multiple smart plant pots and species presets"
            >
              <Layers className="sidebar-nav-icon" size={18} />
              <span>Plant Fleet ({pots.length})</span>
            </button>

            <button
              onClick={() => setActiveNav('logs')}
              className={`sidebar-nav-item ${activeNav === 'logs' ? 'active' : ''}`}
              title="Pump actuation history and water volume logs"
            >
              <Droplet className="sidebar-nav-icon" size={18} />
              <span>Watering Logs</span>
            </button>

            <button
              onClick={() => setActiveNav('hardware')}
              className={`sidebar-nav-item ${activeNav === 'hardware' ? 'active' : ''}`}
              title="ESP32 microcontroller hardware architecture, circuit schematic & Web Serial link"
            >
              <Cpu className="sidebar-nav-icon" size={18} />
              <span>ESP32 Hardware</span>
            </button>

            <button
              onClick={() => setActiveNav('calibration')}
              className={`sidebar-nav-item ${activeNav === 'calibration' ? 'active' : ''}`}
              title="2-point capacitive sensor ADC calibration laboratory"
            >
              <Sliders className="sidebar-nav-icon" size={18} />
              <span>Sensor Calibration</span>
            </button>
          </div>
        </div>

        {/* User Account Footer Section */}
        <div className="sidebar-account-section">
          <div className="sidebar-nav-title">ACTIVE NODE</div>
          <div className="sidebar-user-row">
            <div className="sidebar-avatar-wrap">
              <img
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=80"
                alt="Alex Williamson"
                className="sidebar-avatar-img"
                onError={(e) => {
                  e.target.style.display = 'none';
                  if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="sidebar-avatar-fallback">AW</div>
              <span className="sidebar-online-dot" />
            </div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">Alex Williamson</div>
              <div className="sidebar-user-id">#node-1974 • Online</div>
            </div>
          </div>
        </div>
      </aside>

      {/* 2. RIGHT MAIN CANVAS */}
      <main className="main-canvas">
        {/* Header Bar */}
        <div className="canvas-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <h1 className="canvas-title">
              {activeNav === 'dashboard' && 'Dashboard'}
              {activeNav === 'analytics' && 'Telemetry Analytics'}
              {activeNav === 'fleet' && 'Plant Fleet Management'}
              {activeNav === 'logs' && 'Watering Logs & Records'}
              {activeNav === 'hardware' && 'ESP32 Hardware & IoT Architecture'}
              {activeNav === 'calibration' && 'Sensor Calibration Lab'}
            </h1>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#e4f7ee', padding: '3px 10px', borderRadius: '12px', border: '1px solid #c7eed9' }}>
              ● {activePot.name}
            </span>
          </div>

          <div className="canvas-header-actions">
            {activeNav !== 'dashboard' && (
              <button
                onClick={() => setActiveNav('dashboard')}
                className="btn-white-pill"
                title="Return to main dashboard overview"
              >
                <LayoutDashboard size={14} color="#00c06d" />
                <span>Dashboard Overview</span>
              </button>
            )}

            <button
              onClick={() => setIsWaterSavingsOpen(true)}
              className="btn-white-pill"
              title="View comparative conservation audit"
            >
              <TrendingDown size={14} color="#00c06d" />
              <span>Savings (61%)</span>
            </button>

            <button
              onClick={() => setIsHardwareSimOpen(true)}
              className="btn-white-pill"
              title="Simulate dry soil or faults"
            >
              <Cpu size={14} color="#f59e0b" />
              <span>Simulator</span>
            </button>

            <button
              onClick={() => triggerWatering(6, 'Manual', 'Manual pulse initiated from Header')}
              disabled={isPumping || activePot.telemetry.tankLevelPercent <= 5}
              className="btn-black-pill"
              title="Dispense water pulse"
            >
              <Droplet size={14} color="#38bdf8" />
              <span>{isPumping ? 'Dispensing...' : 'Dispense Pulse'}</span>
            </button>
          </div>
        </div>


        {/* Diagnostic Alerts Banner */}
        <AlertsCenter
          alerts={alerts.filter((a) => a.potId === activePotId)}
          onDismissAlert={handleDismissAlert}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onTestSoundAlert={handleTestSoundAlert}
        />

        {/* 1. VIEW: DASHBOARD */}
        {activeNav === 'dashboard' && (
          <>
            {/* 3. TOP ROW: 3 STAT CARDS (Exact match to Air Pollution, Environmental Index, Clean Tech) */}
            <div className="ref-top-metrics-grid">
          {/* Card 1: Soil Moisture Level */}
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Soil Moisture Level</div>
              <div className="ref-stat-value tnum">
                {activePot.telemetry.moisture.toFixed(1)} <span style={{ fontSize: '16px', fontWeight: 500, color: '#647d72' }}>%</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>↘ 2.3%</span> from last hour
              </div>
            </div>
            {/* Green Mini Bar Sparkline */}
            <div className="mini-bar-chart">
              {moistureBars.map((h, i) => (
                <div
                  key={i}
                  className="mini-bar"
                  style={{
                    height: `${h}px`,
                    backgroundColor: i >= moistureBars.length - 2 ? '#00c06d' : '#86efac'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card 2: Environmental Quality / Temperature */}
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Ambient Temperature</div>
              <div className="ref-stat-value tnum">
                {activePot.telemetry.temperature.toFixed(1)} <span style={{ fontSize: '16px', fontWeight: 500, color: '#647d72' }}>°C</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#f87171', fontWeight: 600 }}>↗ 1.4%</span> DHT22 calibrated
              </div>
            </div>
            {/* Coral/Orange Mini Bar Sparkline */}
            <div className="mini-bar-chart">
              {tempBars.map((h, i) => (
                <div
                  key={i}
                  className="mini-bar"
                  style={{
                    height: `${h}px`,
                    backgroundColor: i === tempBars.length - 1 ? '#f87171' : '#fca5a5'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Card 3: Light & Humidity Index */}
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Illumination & Humidity</div>
              <div className="ref-stat-value tnum" style={{ fontSize: '24px' }}>
                {activePot.telemetry.light.toLocaleString()} <span style={{ fontSize: '15px', fontWeight: 500, color: '#647d72' }}>Lux</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>VPD {activePot.telemetry.vpd} kPa</span> • Transpiration
              </div>
            </div>
            {/* Emerald Mini Bar Sparkline */}
            <div className="mini-bar-chart">
              {lightBars.map((h, i) => (
                <div
                  key={i}
                  className="mini-bar"
                  style={{
                    height: `${h}px`,
                    backgroundColor: i === lightBars.length - 1 ? '#00c06d' : '#86efac'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 4. MIDDLE ROW: 3 COLUMNS (Gauge, Species Breakdown, Pot Architecture Map) */}
        <div className="ref-mid-grid">
          {/* Column 1: Semi-Circular Donut Gauge (Matching Waste Processing Level 72%) */}
          <div className="ref-card" style={{ alignItems: 'center', textAlign: 'center' }}>
            <div style={{ alignSelf: 'flex-start', width: '100%', display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)' }}>
                Root Zone Soil Moisture
              </span>
            </div>

            {/* Big Numeric Value */}
            <div className="gauge-big-num tnum" style={{ margin: '6px 0 2px' }}>
              {Math.round(activePot.telemetry.moisture)}%
            </div>

            {/* SVG Semi-Circular Arc Gauge */}
            <div className="gauge-container">
              <svg viewBox="0 0 160 90" width="160" height="90">
                {/* Background Track (Adapts to light/dark theme) */}
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="var(--gauge-track, #e2ebe4)"
                  strokeWidth="16"
                  strokeLinecap="round"
                />
                {/* Active Colored Arc (Green) */}
                <path
                  d="M 15 80 A 65 65 0 0 1 145 80"
                  fill="none"
                  stroke="#00c06d"
                  strokeWidth="16"
                  strokeLinecap="round"
                  strokeDasharray="205"
                  strokeDashoffset={205 - (moistureGaugeVal / 100) * 205}
                  style={{ transition: 'stroke-dashoffset 400ms ease' }}
                />
              </svg>
            </div>

            <div className="gauge-sub-badge">
              Target Range: {activePot.settings.thresholdLow}% – {activePot.settings.thresholdHigh}%
            </div>
          </div>

          {/* Column 2: Species Breakdown & Energy (Matching Renewable Energy 86%) */}
          <div className="ref-card">
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-main)', marginBottom: '4px' }}>
              Species Threshold Presets
            </div>

            <div style={{ fontSize: '36px', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.03em', margin: '4px 0' }} className="tnum">
              {activePot.preset?.thresholdHigh}% <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-muted)' }}>ceiling</span>
            </div>

            {/* Breakdown List with bullets */}
            <div className="species-breakdown-list">
              {PLANT_PRESETS.slice(0, 4).map((p) => {
                const isSelected = activePot.plantPresetId === p.id;
                return (
                  <div
                    key={p.id}
                    className="species-row"
                    onClick={() => handleApplyPreset(p)}
                    title={`Click to set threshold for ${p.commonName}`}
                  >
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="species-bullet" style={{ backgroundColor: isSelected ? '#00c06d' : '#cbd5e1' }} />
                      <span style={{ fontWeight: isSelected ? 600 : 400, color: isSelected ? 'var(--text-main)' : 'var(--text-muted)' }}>
                        {p.commonName.split('/')[0]}
                      </span>
                    </div>
                    <span className="tnum" style={{ fontWeight: 600, color: isSelected ? '#00c06d' : 'var(--text-muted)' }}>
                      {p.thresholdLow}%–{p.thresholdHigh}%
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setIsCalibrationOpen(true)}
              className="btn-white-pill"
              style={{ width: '100%', justifyContent: 'center', marginTop: '12px', padding: '6px' }}
            >
              View Calibration (Hrisko)
            </button>
          </div>

          {/* Column 3: Sources Usage in Manufacturing (Exact match to mockup with map & toggle) */}
          <div className="ref-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div>
                <h3 style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-main)' }}>
                  Sources Usage in Manufacturing
                </h3>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Percentage of renewable energy sources used in manufacturing industries.
                </p>
              </div>

              {/* View Toggle (Map vs Pot Schematic) */}
              <div style={{ display: 'flex', gap: '3px', background: 'var(--subtle-input-bg)', padding: '2px', borderRadius: '8px', border: '1px solid var(--card-border)' }}>
                <button
                  onClick={() => setCard3View('map')}
                  style={{
                    border: 'none',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: card3View === 'map' ? 'var(--card-bg)' : 'transparent',
                    color: card3View === 'map' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: card3View === 'map' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                  title="View Regional Europe Map from Reference"
                >
                  Map
                </button>
                <button
                  onClick={() => setCard3View('pot')}
                  style={{
                    border: 'none',
                    padding: '2px 8px',
                    fontSize: '10px',
                    fontWeight: 600,
                    borderRadius: '6px',
                    cursor: 'pointer',
                    background: card3View === 'pot' ? 'var(--card-bg)' : 'transparent',
                    color: card3View === 'pot' ? 'var(--text-main)' : 'var(--text-muted)',
                    boxShadow: card3View === 'pot' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none'
                  }}
                  title="View Physical Pot Architecture Cross-Section"
                >
                  Pot
                </button>
              </div>
            </div>

            {/* Split layout: Country list on left, Graphic on right */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '6px' }}>
              {/* Country Percentages List */}
              <div className="manufacturing-list">
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-orange" />
                    <span>Ukraine</span>
                  </div>
                  <span className="mfg-val">89%</span>
                </div>
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-grey" />
                    <span>Belgium</span>
                  </div>
                  <span className="mfg-val">82%</span>
                </div>
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-grey" />
                    <span>Latvia</span>
                  </div>
                  <span className="mfg-val">85%</span>
                </div>
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-grey" />
                    <span>Spain</span>
                  </div>
                  <span className="mfg-val">80%</span>
                </div>
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-grey" />
                    <span>Italia</span>
                  </div>
                  <span className="mfg-val">79%</span>
                </div>
                <div className="mfg-row">
                  <div className="mfg-name">
                    <span className="mfg-dot dot-grey" />
                    <span>Portugal</span>
                  </div>
                  <span className="mfg-val">76%</span>
                </div>
              </div>

              {/* Graphic Display: Europe Map or Pot Schematic */}
              {card3View === 'map' ? (
                <div className="europe-map-container">
                  <svg viewBox="0 0 250 160" className="europe-map-svg">
                    {/* Western Europe / UK / Iberian Peninsula */}
                    <path
                      d="M 30 100 C 40 95 55 105 45 130 C 30 135 20 120 30 100 Z"
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M 60 70 C 55 60 70 50 85 60 C 80 78 68 78 60 70 Z"
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                    />
                    {/* Central Europe / France / Germany / Italy */}
                    <path
                      d="M 78 75 C 98 65 112 80 108 105 C 88 110 78 90 78 75 Z"
                      fill="#fecaca"
                      stroke="#fca5a5"
                      strokeWidth="0.8"
                    />
                    <path
                      d="M 98 108 C 102 102 118 118 122 138 C 112 142 102 128 98 108 Z"
                      fill="#fca5a5"
                      stroke="#f87171"
                      strokeWidth="0.8"
                    />
                    {/* Scandinavia / Nordic */}
                    <path
                      d="M 92 20 C 112 15 130 30 115 58 C 102 54 92 40 92 20 Z"
                      fill="#e2e8f0"
                      stroke="#cbd5e1"
                      strokeWidth="0.8"
                    />
                    {/* Eastern Europe / Ukraine (Warm Highlight) */}
                    <path
                      d="M 118 65 C 142 50 178 60 188 90 C 168 108 128 98 118 65 Z"
                      fill="#fed7aa"
                      stroke="#fb923c"
                      strokeWidth="1"
                    />
                    {/* Black Callout Tag pointing to Ukraine (Exact match to reference mockup) */}
                    <g transform="translate(126, 36)">
                      <rect x="0" y="0" width="86" height="34" rx="7" fill="#091a13" stroke="#1c4835" strokeWidth="1" filter="drop-shadow(0 2px 6px rgba(0,0,0,0.3))" />
                      <text x="10" y="14" fill="#a7f3d0" fontSize="8.5" fontWeight="600">Ukraine</text>
                      <text x="10" y="26" fill="#ffffff" fontSize="9.5" fontWeight="700">High Level</text>
                      <text x="60" y="21" fill="#ffffff" fontSize="12" fontWeight="800">89%</text>
                    </g>
                    {/* Pin point marker */}
                    <circle cx="145" cy="78" r="3.5" fill="#f97316" stroke="#ffffff" strokeWidth="1.2" />
                    <path d="M 145 74 L 148 70" stroke="#091a13" strokeWidth="1.2" strokeLinecap="round" />
                  </svg>
                </div>
              ) : (
                <div style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  <svg viewBox="0 0 320 180" style={{ width: '100%', maxWidth: '240px', height: 'auto' }}>
                    {/* Foliage */}
                    <path d="M 160 90 Q 140 40 160 20 Q 180 40 160 90 Z" fill="#00c06d" stroke="#047857" strokeWidth="1.5" />
                    <path d="M 160 70 Q 110 50 100 80 Q 130 95 160 70 Z" fill="#00c06d" stroke="#047857" strokeWidth="1.5" />
                    <path d="M 160 65 Q 210 45 220 75 Q 190 90 160 65 Z" fill="#00c06d" stroke="#047857" strokeWidth="1.5" />

                    {/* Pot body */}
                    <path d="M 90 90 L 230 90 L 210 165 L 110 165 Z" fill="#2d3748" stroke="#4a5568" strokeWidth="1.5" />
                    {/* Soil */}
                    <path d="M 94 94 L 226 94 L 208 145 L 112 145 Z" fill="#4a2e18" />

                    {/* Capacitive Probe */}
                    <rect x="120" y="98" width="10" height="42" rx="2" fill="#1a202c" stroke="#00c06d" strokeWidth="1.2" />
                    {/* Sub-surface Tube */}
                    <path d="M 190 90 L 190 135 L 170 135" fill="none" stroke="#06b6d4" strokeWidth="2.5" strokeLinecap="round" />
                    <circle cx="170" cy="135" r="3" fill="#06b6d4" />

                    {/* Reservoir */}
                    <rect x="112" y="145" width="96" height="18" fill="#1a365d" />
                    <rect
                      x="112"
                      y={163 - (16 * activePot.telemetry.tankLevelPercent) / 100}
                      width="96"
                      height={(16 * activePot.telemetry.tankLevelPercent) / 100}
                      fill="#38bdf8"
                      opacity="0.8"
                    />

                    {/* Location Callout Tag */}
                    <g transform="translate(185, 95)">
                      <rect x="0" y="0" width="76" height="28" rx="6" fill="#0b241b" stroke="#1d4e3b" strokeWidth="1" />
                      <text x="8" y="12" fill="#a7f3d0" fontSize="8" fontWeight="600">Sub-Surface</text>
                      <text x="8" y="22" fill="#ffffff" fontSize="9" fontWeight="700">Root Zone</text>
                      <text x="56" y="18" fill="#00c06d" fontSize="9" fontWeight="700">92%</text>
                    </g>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 5. BOTTOM ROW: 2 COLUMNS (Left 2 Stacked Pills, Right Hero Green Card) */}
        <div className="ref-bottom-grid">
          {/* Left Stacked Column */}
          <div>
            {/* Pill Card 1: Dark Forest Pill (Matching Climate Change Index 76.2) */}
            <div className="dark-pill-card">
              <div className="dark-pill-circle tnum">
                {activePot.settings.autoWateringEnabled ? 'AUTO' : 'MAN'}
              </div>
              <div style={{ flex: 1 }}>
                <div className="dark-pill-title">Closed-Loop Irrigation Automation</div>
                <div className="dark-pill-sub">
                  Edge microcontroller logic autonomous from cloud dropouts
                </div>
              </div>
              <div
                className="switch-container"
                onClick={() =>
                  handleUpdateSettings({
                    ...activePot.settings,
                    autoWateringEnabled: !activePot.settings.autoWateringEnabled
                  })
                }
              >
                <div className={`switch-track ${activePot.settings.autoWateringEnabled ? 'active' : ''}`}>
                  <div className="switch-thumb" />
                </div>
              </div>
            </div>

            {/* Pill Card 2: White Pill with Green Ring (Matching Water level in Dnipro 57m) */}
            <div className="white-pill-card">
              <div className="white-pill-circle tnum">
                {activePot.telemetry.tankLevelPercent}%
              </div>
              <div style={{ flex: 1 }}>
                <div className="white-pill-title">Water Level in Reservoir Tank</div>
                <div className="white-pill-sub">
                  {activePot.telemetry.tankCurrentMl} mL remaining • Dry-run pump lockout armed
                </div>
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
                  addToast('Reservoir refilled to 1500 mL (100%)!', 'success');
                }}
                className="btn-white-pill"
                style={{ padding: '5px 12px', fontSize: '11px' }}
              >
                Refill
              </button>
            </div>
          </div>

          {/* Right Column: Vibrant Forest Green Hero Card (Matching AeuxGlobal "Let's join our community") */}
          <div className="green-hero-card">
            {/* Background Botanical Leaves Vector Silhouette */}
            <svg className="hero-leaves-bg" viewBox="0 0 200 160" fill="none">
              <path
                d="M100 160 C90 100 130 50 190 20 C180 80 150 130 100 160 Z"
                fill="#10b981"
                opacity="0.35"
              />
              <path
                d="M60 160 C50 110 80 70 140 40 C130 90 100 140 60 160 Z"
                fill="#34d399"
                opacity="0.25"
              />
              <path
                d="M140 160 C135 120 160 85 200 60 C195 105 175 140 140 160 Z"
                fill="#059669"
                opacity="0.3"
              />
            </svg>

            {/* Top Bar inside Green Card */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="hero-tag-pill">
                  🌿 BotanIQ Precision
                </span>
                <span className="hero-tag-pill" style={{ background: 'rgba(255,255,255,0.08)' }}>
                  Sub-Surface Drip
                </span>
              </div>
              <button
                onClick={() => setIsWaterSavingsOpen(true)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer' }}
                title="View full research audit"
              >
                <ArrowUpRight size={20} />
              </button>
            </div>

            {/* Main Headline */}
            <div style={{ zIndex: 2 }}>
              <h2 className="hero-title">
                61.9% Water Conserved
              </h2>
              <p style={{ fontSize: '12px', opacity: 0.85, marginTop: '2px', maxWidth: '300px' }}>
                Closed-loop root-zone delivery minimizes surface evaporation and drainage runoff.
              </p>
            </div>

            {/* Floating Tags & Footer (Matching avatars + Ecology Systems badge in reference) */}
            <div className="hero-footer-stats">
              <span className="hero-tag-pill">
                Capacitive Sensor (Hrisko)
              </span>
              <span className="hero-tag-pill">
                VPD Transpiration Sync
              </span>
              <span style={{ fontSize: '11px', opacity: 0.8, marginLeft: 'auto' }}>
                ~545 mL / pot / wk saved
              </span>
            </div>
          </div>
        </div>
      </>
    )}

    {/* 2. VIEW: TELEMETRY ANALYTICS */}
    {activeNav === 'analytics' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top 4 KPI Stat Cards */}
        <div className="ref-top-metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">24h Avg Soil Moisture</div>
              <div className="ref-stat-value tnum">
                46.8 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>%</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>● Optimal</span> root zone
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e4f7ee', borderRadius: '10px' }}>
              <Droplet size={20} color="#00c06d" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">24h Avg Temperature</div>
              <div className="ref-stat-value tnum">
                23.4 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>°C</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>±1.2°C</span> diurnal stable
              </div>
            </div>
            <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '10px' }}>
              <Cpu size={20} color="#f59e0b" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Relative Humidity</div>
              <div className="ref-stat-value tnum">
                58.2 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>%</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>● Balanced</span> transpiration
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px' }}>
              <Sparkles size={20} color="#0284c7" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Vapor Pressure Deficit</div>
              <div className="ref-stat-value tnum">
                1.12 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>kPa</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>Stomatal</span> prime
              </div>
            </div>
            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px' }}>
              <ArrowUpRight size={20} color="#15803d" />
            </div>
          </div>
        </div>

        {/* Main Interactive Telemetry Chart */}
        <HistoryChart
          historyData={historyData}
          timeRange={timeRange}
          onChangeTimeRange={setTimeRange}
          thresholdLow={activePot.settings.thresholdLow}
          onExportCsv={handleExportTelemetryCsv}
        />

        {/* Evapotranspiration Dynamics Card */}
        <div className="ref-card" style={{ background: '#f8fafc', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Sparkles size={16} color="#00c06d" />
            <h4 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
              Evapotranspiration Kinetics & Closed-Loop Trigger Dynamics
            </h4>
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
            High ambient light cycles ({activePot.telemetry.light.toLocaleString()} Lux) correlate with daytime transpiration surges, accelerating root water uptake by ~0.42% volumetric moisture per hour. BotanIQ's autonomous PID logic continuously monitors capacitance on GPIO34 and triggers sub-surface pulsed bursts specifically when soil moisture reaches {activePot.settings.thresholdLow}%, ensuring roots remain oxygenated without drought stress.
          </p>
        </div>
      </div>
    )}

    {/* 3. VIEW: PLANT FLEET MANAGEMENT */}
    {activeNav === 'fleet' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Fleet Overview KPI Stats */}
        <div className="ref-top-metrics-grid">
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Connected Nodes</div>
              <div className="ref-stat-value tnum">
                {pots.length} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>Pots</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>● All Online</span> (ESP32 Mesh)
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e4f7ee', borderRadius: '10px' }}>
              <Layers size={20} color="#00c06d" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Fleet Avg Moisture</div>
              <div className="ref-stat-value tnum">
                {(pots.reduce((sum, p) => sum + p.telemetry.moisture, 0) / pots.length).toFixed(1)} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>%</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>Within targets</span> for all species
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px' }}>
              <Droplet size={20} color="#0284c7" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Weekly Conserved Water</div>
              <div className="ref-stat-value tnum">
                1,635 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>mL</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>61.9% reduction</span> vs surface spray
              </div>
            </div>
            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px' }}>
              <TrendingDown size={20} color="#15803d" />
            </div>
          </div>
        </div>

        {/* Fleet Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {pots.map((pot) => {
            const isCurrentActive = activePotId === pot.id;
            return (
              <div
                key={pot.id}
                style={{
                  backgroundColor: 'var(--card-bg)',
                  borderRadius: 'var(--radius-card)',
                  border: isCurrentActive ? '2px solid #00c06d' : '1px solid var(--card-border)',
                  padding: '20px',
                  boxShadow: isCurrentActive ? '0 4px 16px rgba(0, 192, 109, 0.12)' : 'var(--card-shadow)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  position: 'relative'
                }}
              >
                {isCurrentActive && (
                  <span
                    style={{
                      position: 'absolute',
                      top: '14px',
                      right: '14px',
                      background: '#00c06d',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      letterSpacing: '0.04em'
                    }}
                  >
                    ACTIVE VIEW
                  </span>
                )}

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '32px' }}>{pot.preset?.icon || '🪴'}</span>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                      {pot.name}
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {pot.location} • <code style={{ fontSize: '10.5px' }}>{pot.device?.deviceId || 'ESP32'}</code>
                    </div>
                  </div>
                </div>

                {/* Moisture bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Soil Moisture</span>
                    <span style={{ fontWeight: 700, color: '#00c06d' }}>{pot.telemetry.moisture.toFixed(1)}%</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, pot.telemetry.moisture))}%`,
                        backgroundColor: pot.telemetry.moisture < pot.settings.thresholdLow ? '#f87171' : '#00c06d',
                        borderRadius: '4px',
                        transition: 'width 300ms ease'
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--text-light)', marginTop: '4px' }}>
                    <span>Target: {pot.settings.thresholdLow}% - {pot.settings.thresholdHigh}%</span>
                    <span>{pot.settings.autoWateringEnabled ? 'Auto Mode' : 'Manual Mode'}</span>
                  </div>
                </div>

                {/* Reservoir bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Reservoir Tank</span>
                    <span style={{ fontWeight: 700, color: '#0284c7' }}>{pot.telemetry.tankLevelPercent}% ({pot.telemetry.tankCurrentMl} mL)</span>
                  </div>
                  <div style={{ height: '8px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div
                      style={{
                        height: '100%',
                        width: `${Math.min(100, Math.max(0, pot.telemetry.tankLevelPercent))}%`,
                        backgroundColor: pot.telemetry.tankLevelPercent < 15 ? '#ef4444' : '#38bdf8',
                        borderRadius: '4px',
                        transition: 'width 300ms ease'
                      }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                  {!isCurrentActive ? (
                    <button
                      onClick={() => {
                        setActivePotId(pot.id);
                        addToast(`Switched view to ${pot.name}`, 'info');
                      }}
                      className="btn-white-pill"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: '11.5px' }}
                    >
                      Select Active Pot
                    </button>
                  ) : (
                    <button
                      onClick={() => setActiveNav('dashboard')}
                      className="btn-white-pill"
                      style={{ flex: 1, justifyContent: 'center', padding: '6px 10px', fontSize: '11.5px', background: '#e4f7ee', borderColor: '#a7f3d0', color: '#065f46' }}
                    >
                      Open Dashboard
                    </button>
                  )}
                  <button
                    onClick={() => {
                      triggerWatering(5, 'Manual', `Fleet quick-water pulse for ${pot.name}`);
                    }}
                    disabled={isPumping || pot.telemetry.tankLevelPercent <= 5}
                    className="btn-white-pill"
                    style={{ padding: '6px 10px', fontSize: '11.5px' }}
                    title="Pulse 5s pump"
                  >
                    <Droplet size={13} color="#0284c7" />
                    <span>Water</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Species Botanical Presets Guide */}
        <div className="ref-card">
          <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '12px' }}>
            Species Botanical Moisture Presets
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {Object.entries(PLANT_PRESETS).slice(0, 4).map(([key, p]) => (
              <div key={key} style={{ padding: '12px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{p.icon}</div>
                <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-main)' }}>{p.name}</div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Optimal: {p.thresholdLow}% - {p.thresholdHigh}%</div>
                <div style={{ fontSize: '10.5px', color: 'var(--text-light)', marginTop: '4px' }}>Pulse: {p.recommendedPulseDurationSec}s • {p.lightRequirement}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* 4. VIEW: WATERING LOGS */}
    {activeNav === 'logs' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Logs KPI Cards */}
        <div className="ref-top-metrics-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Total Dispensed</div>
              <div className="ref-stat-value tnum">
                {actuationLogs.filter(l => l.potId === activePotId).reduce((s, l) => s + (l.millilitersDelivered || 0), 0)} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>mL</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>● Precision dosing</span>
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e0f2fe', borderRadius: '10px' }}>
              <Droplet size={20} color="#0284c7" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Actuation Cycles</div>
              <div className="ref-stat-value tnum">
                {actuationLogs.filter(l => l.potId === activePotId).length} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>pulses</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>100% delivered</span> safely
              </div>
            </div>
            <div style={{ padding: '8px', background: '#e4f7ee', borderRadius: '10px' }}>
              <Check size={20} color="#00c06d" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Average Pulse Length</div>
              <div className="ref-stat-value tnum">
                5.2 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>sec</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>Sub-surface drip</span> rate
              </div>
            </div>
            <div style={{ padding: '8px', background: '#fef3c7', borderRadius: '10px' }}>
              <Sliders size={20} color="#f59e0b" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Closed-Loop Automation</div>
              <div className="ref-stat-value tnum">
                87.5 <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>%</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>Auto triggered</span> by ADC
              </div>
            </div>
            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px' }}>
              <Zap size={20} color="#15803d" />
            </div>
          </div>
        </div>

        {/* Actuation Logs Table */}
        <ActuationLogs
          logs={actuationLogs.filter((l) => l.potId === activePotId)}
          onExportCsv={handleExportActuationCsv}
        />
      </div>
    )}

    {/* 5. VIEW: ESP32 HARDWARE & IOT ARCHITECTURE */}
    {activeNav === 'hardware' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Device Status Live Summary */}
        <DeviceStatusCard
          device={activePot.device}
          lastUpdatedMs={activePot.telemetry.lastUpdated}
        />

        {/* Complete Hardware Center (Concept, Schematic, Web Serial, Firmware, BOM) */}
        <HardwareCenter
          activePot={activePot}
          onHardwareTelemetryUpdate={handleHardwareTelemetryUpdate}
          onOpenSimulator={() => setIsHardwareSimOpen(true)}
          onTriggerWatering={triggerWatering}
          isPumping={isPumping}
        />
      </div>
    )}

    {/* 6. VIEW: SENSOR CALIBRATION LABORATORY */}
    {activeNav === 'calibration' && (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Academic Protocol Callout */}
        <div className="ref-card" style={{ background: '#e4f7ee', border: '1px solid #c7eed9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46', fontWeight: 700, fontSize: '13.5px', marginBottom: '6px' }}>
            <Sliders size={16} color="#00c06d" />
            Hrisko (2020) Capacitive Dielectric Calibration Protocol
          </div>
          <p style={{ fontSize: '12px', color: '#047857', margin: 0, lineHeight: 1.6 }}>
            Capacitive soil moisture sensors measure the dielectric permittivity of the surrounding medium through frequency alteration, outputting an inverted 12-bit analog voltage (0–4095). Because PCB manufacturing tolerances vary across batches, recording precise reference endpoints in ambient air (dry reference) and submerged in water (saturated reference) maps linear capacitance to accurate 0% to 100% volumetric water content.
          </p>
        </div>

        {/* Live ADC Monitor */}
        <div className="ref-card" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div className="ref-stat-label">LIVE ESP32 ADC READING (GPIO34)</div>
            <div className="ref-stat-value tnum" style={{ fontSize: '32px' }}>
              {activePot.telemetry.rawAdc} <span style={{ fontSize: '14px', color: '#647d72', fontWeight: 400 }}>/ 4095 (12-bit raw)</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: '#10b981', background: '#e4f7ee', padding: '6px 12px', borderRadius: '12px', border: '1px solid #c7eed9' }}>
              ● Analog Stream Active
            </span>
          </div>
        </div>

        {/* 2-Point Calibration Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {/* Air Dry */}
          <div className="ref-card">
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Point 1: Dry Air Reference (0% Moisture)</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Hold sensor suspended in dry room air. The oscillator produces highest frequency and lowest capacitance, resulting in maximum voltage.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={calAirDry}
                onChange={(e) => setCalAirDry(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--subtle-input-bg)',
                  fontWeight: 700,
                  fontSize: '14px',
                  width: '120px'
                }}
              />
              <button
                onClick={() => {
                  setCalAirDry(activePot.telemetry.rawAdc);
                  addToast(`Captured dry air ADC: ${activePot.telemetry.rawAdc}`, 'info');
                }}
                className="btn-white-pill"
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                Capture Live ADC ({activePot.telemetry.rawAdc})
              </button>
            </div>
          </div>

          {/* Submerged Water */}
          <div className="ref-card">
            <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Point 2: Submerged Water Reference (100% Saturated)</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
              Submerge sensor probe in water up to guideline. Water dielectric drops output voltage.
            </p>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                type="number"
                value={calWaterWet}
                onChange={(e) => setCalWaterWet(Number(e.target.value))}
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  background: 'var(--subtle-input-bg)',
                  fontWeight: 700,
                  fontSize: '14px',
                  width: '120px'
                }}
              />
              <button
                onClick={() => {
                  setCalWaterWet(activePot.telemetry.rawAdc);
                  addToast(`Captured water wet ADC: ${activePot.telemetry.rawAdc}`, 'info');
                }}
                className="btn-white-pill"
                style={{ fontSize: '12px', padding: '8px 12px' }}
              >
                Capture Live ADC ({activePot.telemetry.rawAdc})
              </button>
            </div>
          </div>
        </div>

        {/* Verification Slider & Save Commit */}
        <div className="ref-card">
          <h4 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>Interactive Verification & Curve Test</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '10px' }}>
            <input
              type="range"
              min="1000"
              max="4095"
              value={calTestAdc}
              onChange={(e) => setCalTestAdc(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#00c06d' }}
            />
            <span className="tnum" style={{ fontWeight: 700, fontSize: '14px', minWidth: '90px' }}>
              ADC: {calTestAdc}
            </span>
            <span
              className="tnum"
              style={{
                fontWeight: 800,
                fontSize: '16px',
                color: '#00c06d',
                padding: '4px 12px',
                background: '#e4f7ee',
                borderRadius: '8px',
                minWidth: '85px',
                textAlign: 'center'
              }}
            >
              {computeTestMoisture(calTestAdc, calAirDry, calWaterWet)}%
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '18px' }}>
            <button
              onClick={() => {
                setCalAirDry(3280);
                setCalWaterWet(1390);
                addToast('Reset to factory default calibration values', 'info');
              }}
              className="btn-white-pill"
              style={{ fontSize: '12px' }}
            >
              Reset Defaults
            </button>
            <button
              onClick={() => {
                handleSaveCalibration({
                  airDryRawAdc: calAirDry,
                  waterWetRawAdc: calWaterWet,
                  lastCalibrated: new Date().toISOString().split('T')[0]
                });
                try {
                  confetti({ particleCount: 60, spread: 70, origin: { y: 0.6 } });
                } catch (e) {}
              }}
              className="btn-black-pill"
              style={{ fontSize: '12px', background: '#00c06d', borderColor: '#00c06d', color: '#ffffff' }}
            >
              <Check size={14} />
              <span>Save Calibration to NVS Flash</span>
            </button>
          </div>
        </div>
      </div>
    )}
      </main>

      {/* MODALS */}
      <CalibrationModal
        isOpen={isCalibrationOpen}
        onClose={() => setIsCalibrationOpen(false)}
        currentRawAdc={activePot.telemetry.rawAdc}
        calibration={activePot.calibration}
        onSaveCalibration={handleSaveCalibration}
      />

      <WaterSavingsModal
        isOpen={isWaterSavingsOpen}
        onClose={() => setIsWaterSavingsOpen(false)}
      />

      <HardwareSimulator
        isOpen={isHardwareSimOpen}
        onClose={() => setIsHardwareSimOpen(false)}
        pot={activePot}
        onSimulateMoistureChange={(delta) => {
          setPots((prev) =>
            prev.map((p) =>
              p.id === activePotId
                ? { ...p, telemetry: { ...p.telemetry, moisture: Math.max(10, Math.min(95, p.telemetry.moisture + delta)) } }
                : p
            )
          );
          addToast(`Simulated moisture adjusted by ${delta}%`, 'info');
        }}
        onSimulateTankChange={(pct) => {
          setPots((prev) =>
            prev.map((p) =>
              p.id === activePotId
                ? { ...p, telemetry: { ...p.telemetry, tankLevelPercent: pct } }
                : p
            )
          );
          addToast(`Tank level set to ${pct}%`, 'info');
        }}
        onTriggerFault={(type) => {
          if (type === 'SENSOR_DISCONNECTED') {
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? { ...p, telemetry: { ...p.telemetry, rawAdc: 4095, moisture: 0 } }
                  : p
              )
            );
            addToast('Simulated sensor disconnect fault!', 'critical');
          }
        }}
        onRefillTank={() => {
          setPots((prev) =>
            prev.map((p) =>
              p.id === activePotId
                ? { ...p, telemetry: { ...p.telemetry, tankLevelPercent: 100, tankCurrentMl: 1500 } }
                : p
            )
          );
          addToast('Water reservoir refilled to 100%!', 'success');
        }}
      />

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
