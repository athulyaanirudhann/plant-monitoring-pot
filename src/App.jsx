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
import BotaniQDashboard from './components/BotaniQDashboard';
import ThresholdModal from './components/ThresholdModal';
import SpeciesModal from './components/SpeciesModal';
import confetti from 'canvas-confetti';
import {
  getMoistureStatus,
  getTemperatureStatus,
  getHumidityStatus,
  getLightStatus,
  calculatePlantStatus,
  formatTimeAgo,
  isDataStale,
  formatSensorReading,
  getIrrigationStateReason,
  calculateWaterMetrics
} from './utils/iotLogic';
import { telemetryService } from './services/telemetryService';

import {
  LayoutDashboard,
  BarChart2,
  Users,
  FileText,
  HelpCircle,
  Sliders,
  Droplet,
  Droplets,
  Thermometer,
  Sun,
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
  Box,
  Wifi,
  Square,
  Play,
  Bell,
  Settings,
  Activity
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
  const [isThresholdModalOpen, setIsThresholdModalOpen] = useState(false);
  const [isSpeciesModalOpen, setIsSpeciesModalOpen] = useState(false);
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

  // Sensor Health state (Section 5)
  const [sensorHealth, setSensorHealth] = useState({
    soilMoisture: 'online', // 'online' | 'offline' | 'error'
    dht22: 'online',
    lightSensor: 'online',
    esp32: 'online'
  });

  // Current Actuator / Pump Tracking (Section 8)
  const [lastTriggerType, setLastTriggerType] = useState('Autonomous');
  const [lastTriggerReason, setLastTriggerReason] = useState('Soil moisture within target range');
  const [pumpStartTime, setPumpStartTime] = useState(null);
  const pumpTimerRef = React.useRef(null);

  // 1-second clock for real-time freshness ("Updated 4s ago")
  const [nowTs, setNowTs] = useState(Date.now());
  useEffect(() => {
    const clock = setInterval(() => setNowTs(Date.now()), 1000);
    return () => clearInterval(clock);
  }, []);

  const dataAgeSec = Math.max(0, Math.floor((nowTs - (activePot.telemetry.lastUpdated || nowTs)) / 1000));
  const isStale = dataAgeSec > 30 || sensorHealth.esp32 === 'offline';

  // Dynamic Overall Plant Condition (Section 3)
  const plantStatus = calculatePlantStatus(activePot.telemetry, activePot.settings, sensorHealth);

  // Status badges for each metric (Section 2)
  const moistureStatus = getMoistureStatus(activePot.telemetry.moisture, activePot.settings.thresholdLow, activePot.settings.thresholdHigh);
  const tempStatus = getTemperatureStatus(activePot.telemetry.temperature, activePot.settings.tempMin || 18, activePot.settings.tempMax || 29);
  const humidityStatus = getHumidityStatus(activePot.telemetry.humidity, activePot.settings.humidityMin || 40, activePot.settings.humidityMax || 70);
  const lightStatus = getLightStatus(activePot.telemetry.light, activePot.settings.lightMin || 800, activePot.settings.lightMax || 4000);

  // Water usage calculations (Section 16 & 17)
  const waterMetrics = calculateWaterMetrics(actuationLogs.filter((l) => l.potId === activePotId));

  useEffect(() => {
    const hoursMap = {
      '1h': 1,
      'today': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    const hours = hoursMap[timeRange] || 24;
    setHistoryData(generateHistoryData(hours, activePot.telemetry.moisture));
  }, [activePotId, timeRange]);

  // Live Telemetry Heartbeat Simulation (every 3 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setPots((prevPots) =>
        prevPots.map((p) => {
          if (p.id !== activePotId) return p;

          // If soil sensor is offline, skip moisture decay simulation
          if (sensorHealth.soilMoisture !== 'online') {
            return {
              ...p,
              device: {
                ...p.device,
                uptimeSeconds: p.device.uptimeSeconds + 3,
                lastHeartbeat: Date.now()
              },
              telemetry: {
                ...p.telemetry,
                lastUpdated: Date.now()
              }
            };
          }

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
            triggerWatering(p.settings.burstDurationSec, 'Autonomous', `Soil moisture dropped to ${newMoisture.toFixed(1)}% (Below threshold ${p.settings.thresholdLow}%)`);
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
  }, [activePotId, isPumping, sensorHealth.soilMoisture]);

  // Core Watering Actuation Routine with Safeguards (Sections 8, 12, 19)
  const triggerWatering = (durationSec = 6, triggerType = 'Manual', triggerReason = 'Manual user pulse test') => {
    if (isPumping) return;

    if (activePot.telemetry.tankLevelPercent <= 5) {
      addToast('Dry-Run Safety Lockout: Reservoir empty! Pump actuation blocked.', 'critical');
      return;
    }

    if (sensorHealth.soilMoisture !== 'online' && triggerType === 'Manual') {
      addToast('Notice: Soil moisture sensor is offline. Manual pulse executing under override.', 'warning');
    }

    setIsPumping(true);
    setLastTriggerType(triggerType);
    setLastTriggerReason(triggerReason);
    setPumpStartTime(Date.now());

    // Record "Irrigation Started" notification
    setAlerts((prev) => [
      {
        id: 'alt-' + Date.now(),
        potId: activePotId,
        type: 'info',
        title: triggerType === 'Autonomous' ? 'Automatic Irrigation Started' : 'Manual Irrigation Started',
        message: `💧 Sub-surface pump activated. Reason: ${triggerReason}`,
        timestamp: 'Just now',
        acknowledged: false
      },
      ...prev
    ]);

    addToast(`Sub-surface pump active: dispensing ${durationSec}s root hydration...`, 'info');

    const moistureBefore = activePot.telemetry.moisture || 30.0;
    const deliveredMl = Math.round(durationSec * 5.5);

    pumpTimerRef.current = setTimeout(() => {
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
      setLastTriggerReason(`Target moisture reached (${moistureAfter}%)`);
      addToast(`Watering completed: Soil moisture restored to ${moistureAfter}%.`, 'success');

      // Record "Irrigation Completed" notification
      setAlerts((prev) => [
        {
          id: 'alt-' + (Date.now() + 1),
          potId: activePotId,
          type: 'info',
          title: 'Irrigation Completed Successfully',
          message: `✓ Target moisture reached. Delivered ${deliveredMl} mL directly to root zone.`,
          timestamp: 'Just now',
          acknowledged: false
        },
        ...prev
      ]);

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

  const stopWatering = () => {
    if (!isPumping) return;
    if (pumpTimerRef.current) {
      clearTimeout(pumpTimerRef.current);
    }
    setIsPumping(false);
    setLastTriggerReason('Manual stop initiated by user');
    addToast('Pump stopped: Irrigation stopped manually.', 'info');
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

            <button
              onClick={() => setIsCalibrationOpen(true)}
              className="sidebar-nav-item"
              title="Configure sensor thresholds and species rules"
            >
              <Settings className="sidebar-nav-icon" size={18} />
              <span>Settings</span>
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
        {/* Header Bar for sub-pages */}
        {activeNav !== 'dashboard' && (
          <div className="canvas-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <h1 className="canvas-title">
                {activeNav === 'analytics' && 'Telemetry Analytics'}
                {activeNav === 'fleet' && 'Plant Fleet Management'}
                {activeNav === 'logs' && 'Watering Logs & Records'}
                {activeNav === 'hardware' && 'ESP32 Hardware & IoT Architecture'}
                {activeNav === 'calibration' && 'Sensor Calibration Lab'}
              </h1>

              {/* Plant Identification Badge */}
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--accent-green)', background: 'rgba(4, 106, 56, 0.1)', padding: '4px 11px', borderRadius: '12px', border: '1px solid rgba(4, 106, 56, 0.2)' }}>
                ● {activePot.name}
              </span>

              {/* Dynamic Overall Plant Status Badge */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: plantStatus.color,
                  background: plantStatus.bg,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: `1px solid ${plantStatus.border}`,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  letterSpacing: '0.03em'
                }}
                title={plantStatus.reason}
              >
                ● {plantStatus.label}
              </span>

              {/* Real-Time Sensor Data Freshness */}
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: isStale ? 'var(--accent-coral)' : 'var(--text-muted)',
                  background: isStale ? 'rgba(227, 66, 34, 0.1)' : 'var(--subtle-input-bg)',
                  padding: '3px 8px',
                  borderRadius: '8px',
                  border: '1px solid var(--card-border)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title={`Telemetry received from ${activePot.device.deviceId}`}
              >
                {isStale ? (
                  <>
                    <span style={{ color: 'var(--accent-coral)', fontWeight: 700 }}>⚠ Data may be outdated</span> ({dataAgeSec}s ago)
                  </>
                ) : (
                  <>
                    <span style={{ color: 'var(--accent-green)' }}>●</span> Last updated: {dataAgeSec === 0 ? 'just now' : `${dataAgeSec}s ago`}
                  </>
                )}
              </span>
            </div>

            <div className="canvas-header-actions">
              <button
                onClick={() => setActiveNav('dashboard')}
                className="btn-white-pill"
                title="Return to main dashboard overview"
              >
                <LayoutDashboard size={14} color="var(--accent-green)" />
                <span>Dashboard Overview</span>
              </button>

              <button
                onClick={() => setIsWaterSavingsOpen(true)}
                className="btn-white-pill"
                title="View comparative conservation audit"
              >
                <TrendingDown size={14} color="var(--accent-green)" />
                <span>Savings (61%)</span>
              </button>

              <button
                onClick={() => setIsHardwareSimOpen(true)}
                className="btn-white-pill"
                title="Simulate dry soil or faults"
              >
                <Cpu size={14} color="var(--accent-green)" />
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
        )}


        {/* Diagnostic Alerts Banner */}
        <AlertsCenter
          alerts={alerts.filter((a) => a.potId === activePotId)}
          onDismissAlert={handleDismissAlert}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onTestSoundAlert={handleTestSoundAlert}
        />

        {/* 1. VIEW: DASHBOARD (EXACT BOTANIQ IOT REFERENCE MOCKUP) */}
        {activeNav === 'dashboard' && (
          <BotaniQDashboard
            activePot={activePot}
            sensorHealth={sensorHealth}
            dataAgeSec={dataAgeSec}
            alerts={alerts.filter((a) => a.potId === activePotId)}
            handleTestSoundAlert={handleTestSoundAlert}
            timeRange={timeRange}
            setTimeRange={setTimeRange}
            isPumping={isPumping}
            stopWatering={stopWatering}
            triggerWatering={triggerWatering}
            setIsThresholdModalOpen={setIsThresholdModalOpen}
            setIsSpeciesModalOpen={setIsSpeciesModalOpen}
            setPots={setPots}
            activePotId={activePotId}
            addToast={addToast}
            setActiveNav={setActiveNav}
            setIsHardwareSimOpen={setIsHardwareSimOpen}
            setIsWaterSavingsOpen={setIsWaterSavingsOpen}
          />
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
            <div style={{ padding: '8px', background: 'rgba(31, 59, 46, 0.08)', borderRadius: '10px' }}>
              <Cpu size={20} color="#1F3B2E" />
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

        {/* Water Usage & Irrigation Insights Card (Sections 16, 17, 18) */}
        <div className="ref-card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Droplet size={16} color="#00c06d" />
              <h4 style={{ fontSize: '13.5px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                Water Usage & Conservation Analytics (Estimated)
              </h4>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              *Estimated from pump runtime & nozzle delivery (5.5 mL/s). Flow sensor hardware not installed.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            <div style={{ padding: '10px 14px', background: 'var(--subtle-input-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Water Used Today (Est.)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }} className="tnum">
                {waterMetrics.waterTodayMl} mL
              </div>
              <div style={{ fontSize: '10.5px', color: '#10b981', marginTop: '3px' }}>Sub-surface direct root feed</div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--subtle-input-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Water Used This Week (Est.)</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: '#0284c7', marginTop: '2px' }} className="tnum">
                {waterMetrics.waterThisWeekMl} mL
              </div>
              <div style={{ fontSize: '10.5px', color: '#10b981', marginTop: '3px' }}>61.9% reduction vs surface spray</div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--subtle-input-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Total Irrigation Events</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }} className="tnum">
                {waterMetrics.totalEvents} cycles
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>100% Demand-based triggers</div>
            </div>

            <div style={{ padding: '10px 14px', background: 'var(--subtle-input-bg)', borderRadius: '10px', border: '1px solid var(--card-border)' }}>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Average Pulse Duration</div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-main)', marginTop: '2px' }} className="tnum">
                {waterMetrics.avgDurationSec} sec
              </div>
              <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '3px' }}>~{(waterMetrics.avgDurationSec * 5.5).toFixed(0)} mL average dose</div>
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

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '32px' }}>{pot.preset?.icon || '🪴'}</span>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                        {pot.name}
                      </h3>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {pot.location} • <code style={{ fontSize: '10.5px' }}>{pot.device?.deviceId || 'ESP32'}</code>
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                        Profile: <strong style={{ color: 'var(--text-main)' }}>{pot.preset?.commonName?.split('/')[0] || 'Standard'}</strong> ({pot.preset?.category || 'Indoor'})
                      </div>
                    </div>
                  </div>

                  {/* Plant Status Badge (Section 9) */}
                  {(() => {
                    const st = calculatePlantStatus(pot.telemetry, pot.settings);
                    return (
                      <span
                        style={{
                          fontSize: '10px',
                          fontWeight: 700,
                          color: st.color,
                          background: st.bg,
                          padding: '3px 8px',
                          borderRadius: '8px',
                          border: `1px solid ${st.border}`,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        ● {st.label}
                      </span>
                    );
                  })()}
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
              <div className="ref-stat-label">Water Used Today (Est.)</div>
              <div className="ref-stat-value tnum">
                {waterMetrics.waterTodayMl} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>mL</span>
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
              <div className="ref-stat-label">Water Used This Week (Est.)</div>
              <div className="ref-stat-value tnum">
                {waterMetrics.waterThisWeekMl} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>mL</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>61.9% conserved</span> vs spray
              </div>
            </div>
            <div style={{ padding: '8px', background: '#dcfce7', borderRadius: '10px' }}>
              <TrendingDown size={20} color="#15803d" />
            </div>
          </div>

          <div className="ref-stat-card">
            <div>
              <div className="ref-stat-label">Irrigation Cycles</div>
              <div className="ref-stat-value tnum">
                {waterMetrics.totalEvents} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>pulses</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#00c06d', fontWeight: 600 }}>100% Demand-based</span> triggers
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
                {waterMetrics.avgDurationSec} <span style={{ fontSize: '15px', color: '#647d72', fontWeight: 500 }}>sec</span>
              </div>
              <div className="ref-stat-sub">
                <span style={{ color: '#1F3B2E', fontWeight: 600 }}>Sub-surface drip</span> rate
              </div>
            </div>
            <div style={{ padding: '8px', background: 'rgba(31, 59, 46, 0.08)', borderRadius: '10px' }}>
              <Sliders size={20} color="#1F3B2E" />
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

      <ThresholdModal
        isOpen={isThresholdModalOpen}
        onClose={() => setIsThresholdModalOpen(false)}
        pot={activePot}
        onUpdateSettings={handleUpdateSettings}
        addToast={addToast}
      />

      <SpeciesModal
        isOpen={isSpeciesModalOpen}
        onClose={() => setIsSpeciesModalOpen(false)}
        activePresetId={activePot.plantPresetId}
        onSelectPreset={handleApplyPreset}
        addToast={addToast}
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
          if (type === 'SCENARIO_NORMAL') {
            setSensorHealth({ soilMoisture: 'online', dht22: 'online', lightSensor: 'online', esp32: 'online' });
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? {
                      ...p,
                      telemetry: {
                        ...p.telemetry,
                        moisture: 65.0,
                        temperature: 27.0,
                        humidity: 60.0,
                        light: 450,
                        lastUpdated: Date.now()
                      }
                    }
                  : p
              )
            );
            setIsPumping(false);
            setLastTriggerReason('Soil moisture within optimal target range (65%)');
            addToast('Normal Condition loaded: 65% soil, 27°C, 60% humidity, 450 lux, Pump OFF', 'success');
          } else if (type === 'SCENARIO_DRY') {
            setSensorHealth({ soilMoisture: 'online', dht22: 'online', lightSensor: 'online', esp32: 'online' });
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? {
                      ...p,
                      telemetry: {
                        ...p.telemetry,
                        moisture: 31.0,
                        lastUpdated: Date.now()
                      }
                    }
                  : p
              )
            );
            triggerWatering(activePot.settings.burstDurationSec || 8, 'Autonomous', 'Soil moisture dropped to 31.0% (Below minimum threshold)');
            addToast('Dry Condition loaded: 31% soil triggers pump ON', 'warning');
          } else if (type === 'SCENARIO_CRITICAL') {
            setSensorHealth({ soilMoisture: 'online', dht22: 'online', lightSensor: 'online', esp32: 'online' });
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? {
                      ...p,
                      telemetry: {
                        ...p.telemetry,
                        moisture: 18.0,
                        lastUpdated: Date.now()
                      }
                    }
                  : p
              )
            );
            setAlerts((prev) => [
              {
                id: 'alt-' + Date.now(),
                potId: activePotId,
                type: 'critical',
                title: 'Critical Soil Moisture Detected',
                message: '⚠ Critical moisture (18%). Immediate emergency root hydration active.',
                timestamp: 'Just now',
                acknowledged: false
              },
              ...prev
            ]);
            triggerWatering(activePot.settings.burstDurationSec || 8, 'Autonomous', 'Critical moisture (18%) detected');
            addToast('Critical Condition loaded: 18% soil, Alert active, pump ON', 'critical');
          } else if (type === 'SCENARIO_SENSOR_FAIL' || type === 'SENSOR_DISCONNECTED') {
            setSensorHealth((prev) => ({ ...prev, soilMoisture: 'offline' }));
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? {
                      ...p,
                      telemetry: {
                        ...p.telemetry,
                        rawAdc: 4095,
                        moisture: null,
                        lastUpdated: Date.now()
                      }
                    }
                  : p
              )
            );
            setAlerts((prev) => [
              {
                id: 'alt-' + Date.now(),
                potId: activePotId,
                type: 'critical',
                title: 'Soil Moisture Sensor Offline',
                message: '⚠ Soil moisture sensor is not responding (GPIO34). Displaying "--".',
                timestamp: 'Just now',
                acknowledged: false
              },
              ...prev
            ]);
            addToast('Sensor Failure loaded: Soil displays "--", Sensor Status: Offline', 'critical');
          } else if (type === 'HEATWAVE') {
            setPots((prev) =>
              prev.map((p) =>
                p.id === activePotId
                  ? {
                      ...p,
                      telemetry: {
                        ...p.telemetry,
                        temperature: 33.2,
                        humidity: 38.0,
                        light: 7400,
                        lastUpdated: Date.now()
                      }
                    }
                  : p
              )
            );
            setAlerts((prev) => [
              {
                id: 'alt-' + Date.now(),
                potId: activePotId,
                type: 'warning',
                title: 'High Ambient Temperature (Heatwave)',
                message: '⚠ Ambient temperature (33.2°C) is above the configured safe ceiling.',
                timestamp: 'Just now',
                acknowledged: false
              },
              ...prev
            ]);
            addToast('Midday heatwave simulated: High temp & intense direct sun', 'warning');
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
