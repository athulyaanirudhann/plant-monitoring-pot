import { PLANT_PRESETS } from './plantPresets';

export function generateHistoryData(rangeHours = 24, currentMoisture = 44) {
  const points = [];
  const now = Date.now();
  const numSteps = rangeHours === 1 ? 30 : rangeHours === 24 ? 48 : 56;
  const stepMs = (rangeHours * 3600 * 1000) / numSteps;

  let simulatedMoisture = currentMoisture - 18; // start lower in past
  let pumpTriggeredRecently = false;

  for (let i = 0; i <= numSteps; i++) {
    const timestamp = new Date(now - (numSteps - i) * stepMs);
    const hour = timestamp.getHours() + timestamp.getMinutes() / 60;

    // Diurnal temperature curve (peaking around 14:00)
    const tempNoise = (Math.sin((hour - 8) * (Math.PI / 12)) || 0);
    const temp = Number((24 + tempNoise * 3.5 + (Math.random() * 0.4 - 0.2)).toFixed(1));

    // Humidity inverse to temperature
    const humidity = Number((58 - tempNoise * 11 + (Math.random() * 0.8 - 0.4)).toFixed(1));

    // Light follows solar angle (0 at night, up to 3500 lux indoor ambient)
    let light = 0;
    if (hour >= 6.5 && hour <= 19) {
      const sunAngle = Math.sin((hour - 6.5) * (Math.PI / 12.5));
      light = Math.max(0, Math.round(sunAngle * 3200 + (Math.random() * 80 - 40)));
    } else {
      light = Math.round(15 + Math.random() * 10); // night room ambient
    }

    // Moisture decay with occasional pump jumps
    if (simulatedMoisture <= 31 && !pumpTriggeredRecently) {
      simulatedMoisture += 26; // irrigation actuation
      pumpTriggeredRecently = true;
    } else {
      simulatedMoisture = Math.max(22, simulatedMoisture - (0.4 + (light > 1000 ? 0.3 : 0.1)));
      pumpTriggeredRecently = false;
    }

    // Calculate VPD (Vapor Pressure Deficit)
    const svp = 0.61078 * Math.exp((17.27 * temp) / (temp + 237.3));
    const avp = svp * (humidity / 100);
    const vpd = Number((svp - avp).toFixed(2));

    points.push({
      time: timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' }),
      timestamp: timestamp.getTime(),
      moisture: Number(Math.min(95, Math.max(10, simulatedMoisture)).toFixed(1)),
      temperature: temp,
      humidity: humidity,
      light: light,
      vpd: vpd
    });
  }

  // Ensure last point aligns with current
  if (points.length > 0) {
    points[points.length - 1].moisture = currentMoisture;
  }

  return points;
}

export const INITIAL_POTS = [
  {
    id: 'pot-01',
    name: 'Living Room Monstera',
    location: 'South Window Alcove',
    plantPresetId: 'monstera',
    preset: PLANT_PRESETS[0],
    device: {
      deviceId: 'ESP32_SMARTPOT_01',
      hardware: 'ESP32-WROOM-32D (Dual-Core 240MHz)',
      firmwareVersion: 'v2.4.1-ota',
      ipAddress: '192.168.1.142',
      macAddress: 'C8:2E:18:9A:4F:2C',
      wifiSsid: 'BotanIQ_Mesh_2.4G',
      wifiRssi: -62, // dBm
      status: 'online',
      lastHeartbeat: Date.now(),
      freeHeapKb: 184,
      uptimeSeconds: 384210, // ~4.4 days
      powerMode: '5V DC Continuous (Relay Protected)'
    },
    telemetry: {
      moisture: 42.5,
      temperature: 25.2,
      humidity: 62.4,
      light: 2450,
      vpd: 0.98,
      tankLevelPercent: 78,
      tankCapacityMl: 1500,
      tankCurrentMl: 1170,
      rawAdc: 2210,
      lastUpdated: Date.now()
    },
    settings: {
      autoWateringEnabled: true,
      thresholdLow: 32,
      thresholdHigh: 58,
      burstDurationSec: 8,
      soakTimeMin: 12,
      maxDailyWaterMl: 300,
      dryRunProtection: true,
      floodTimeoutSec: 15
    },
    calibration: {
      airDryRawAdc: 3280, // Hrisko 2020: Dry air high impedance
      waterWetRawAdc: 1390, // Submerged in tap water
      lastCalibrated: '2026-10-22'
    }
  },
  {
    id: 'pot-02',
    name: 'Kitchen Sweet Basil',
    location: 'Kitchen Counter Bay',
    plantPresetId: 'sweet_basil',
    preset: PLANT_PRESETS[3],
    device: {
      deviceId: 'ESP32_SMARTPOT_02',
      hardware: 'ESP32-WROOM-32D',
      firmwareVersion: 'v2.4.1-ota',
      ipAddress: '192.168.1.143',
      macAddress: 'C8:2E:18:9A:51:8E',
      wifiSsid: 'BotanIQ_Mesh_2.4G',
      wifiRssi: -58,
      status: 'online',
      lastHeartbeat: Date.now() - 4000,
      freeHeapKb: 191,
      uptimeSeconds: 192800,
      powerMode: '5V DC Continuous'
    },
    telemetry: {
      moisture: 51.0,
      temperature: 26.8,
      humidity: 56.1,
      light: 4800,
      vpd: 1.15,
      tankLevelPercent: 64,
      tankCapacityMl: 1500,
      tankCurrentMl: 960,
      rawAdc: 2010,
      lastUpdated: Date.now() - 4000
    },
    settings: {
      autoWateringEnabled: true,
      thresholdLow: 42,
      thresholdHigh: 68,
      burstDurationSec: 9,
      soakTimeMin: 10,
      maxDailyWaterMl: 400,
      dryRunProtection: true,
      floodTimeoutSec: 15
    },
    calibration: {
      airDryRawAdc: 3290,
      waterWetRawAdc: 1410,
      lastCalibrated: '2026-10-20'
    }
  },
  {
    id: 'pot-03',
    name: 'Study Snake Plant',
    location: 'Bookshelf Corner',
    plantPresetId: 'snake_plant',
    preset: PLANT_PRESETS[4],
    device: {
      deviceId: 'ESP32_SMARTPOT_03',
      hardware: 'ESP32-WROOM-32D',
      firmwareVersion: 'v2.4.0-ota',
      ipAddress: '192.168.1.144',
      macAddress: 'C8:2E:18:9A:88:1A',
      wifiSsid: 'BotanIQ_Mesh_2.4G',
      wifiRssi: -71,
      status: 'online',
      lastHeartbeat: Date.now() - 12000,
      freeHeapKb: 178,
      uptimeSeconds: 520000,
      powerMode: '5V DC Continuous'
    },
    telemetry: {
      moisture: 24.0,
      temperature: 23.5,
      humidity: 48.0,
      light: 950,
      vpd: 0.94,
      tankLevelPercent: 91,
      tankCapacityMl: 1500,
      tankCurrentMl: 1365,
      rawAdc: 2840,
      lastUpdated: Date.now() - 12000
    },
    settings: {
      autoWateringEnabled: true,
      thresholdLow: 15,
      thresholdHigh: 35,
      burstDurationSec: 4,
      soakTimeMin: 20,
      maxDailyWaterMl: 150,
      dryRunProtection: true,
      floodTimeoutSec: 12
    },
    calibration: {
      airDryRawAdc: 3270,
      waterWetRawAdc: 1385,
      lastCalibrated: '2026-10-18'
    }
  }
];

export const INITIAL_ACTUATION_LOGS = [
  {
    id: 'act-001',
    potId: 'pot-01',
    timestamp: new Date(Date.now() - 3.5 * 3600 * 1000).toLocaleString(),
    triggerType: 'Autonomous',
    triggerReason: 'Soil moisture dropped to 31.4% (Below set point 32.0%)',
    durationSec: 8,
    moistureBefore: 31.4,
    moistureAfter: 54.8,
    volumeMl: 45,
    status: 'Completed Successfully'
  },
  {
    id: 'act-002',
    potId: 'pot-01',
    timestamp: new Date(Date.now() - 18.2 * 3600 * 1000).toLocaleString(),
    triggerType: 'Autonomous',
    triggerReason: 'Soil moisture dropped to 31.8% (Below set point 32.0%)',
    durationSec: 8,
    moistureBefore: 31.8,
    moistureAfter: 55.2,
    volumeMl: 45,
    status: 'Completed Successfully'
  },
  {
    id: 'act-003',
    potId: 'pot-01',
    timestamp: new Date(Date.now() - 32.5 * 3600 * 1000).toLocaleString(),
    triggerType: 'Manual',
    triggerReason: 'User initiated pulse test from Dashboard UI',
    durationSec: 5,
    moistureBefore: 42.0,
    moistureAfter: 48.5,
    volumeMl: 28,
    status: 'Completed Successfully'
  },
  {
    id: 'act-004',
    potId: 'pot-01',
    timestamp: new Date(Date.now() - 56.0 * 3600 * 1000).toLocaleString(),
    triggerType: 'Autonomous',
    triggerReason: 'Soil moisture dropped to 30.9% (Below set point 32.0%)',
    durationSec: 8,
    moistureBefore: 30.9,
    moistureAfter: 56.1,
    volumeMl: 45,
    status: 'Completed Successfully'
  },
  {
    id: 'act-005',
    potId: 'pot-01',
    timestamp: new Date(Date.now() - 84.0 * 3600 * 1000).toLocaleString(),
    triggerType: 'Autonomous',
    triggerReason: 'Soil moisture dropped to 31.5% (Below set point 32.0%)',
    durationSec: 8,
    moistureBefore: 31.5,
    moistureAfter: 57.0,
    volumeMl: 45,
    status: 'Completed Successfully'
  }
];

export const INITIAL_ALERTS = [
  {
    id: 'alt-01',
    potId: 'pot-01',
    type: 'info',
    title: 'Closed-Loop Irrigation Cycle Completed',
    message: 'Pump delivered 45 mL sub-surface hydration directly to root zone. Moisture restored from 31.4% to 54.8%.',
    timestamp: '3 hours ago',
    acknowledged: false
  },
  {
    id: 'alt-02',
    potId: 'pot-01',
    type: 'warning',
    title: 'Water Reservoir Low (< 25% Alert Threshold)',
    message: 'Tank volume is at 1170 mL (78%). Dry-run auto-lockout will engage if tank falls below 10% (150 mL).',
    timestamp: 'Yesterday',
    acknowledged: true
  }
];
