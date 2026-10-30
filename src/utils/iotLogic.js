/**
 * BotanIQ Smart Plant IoT - Core IoT Logic & Decision Engine
 * Implements species threshold checks, dynamic plant health scoring,
 * sensor status determination, water volume estimation, and demand-based irrigation logic.
 */

/**
 * Determine soil moisture condition status
 * @param {number|null} moisture - Soil moisture percentage
 * @param {number} thresholdLow - Minimum threshold percentage
 * @param {number} thresholdHigh - Target ceiling percentage
 * @returns {'Dry' | 'Optimal' | 'Wet' | 'Unknown'}
 */
export function getMoistureStatus(moisture, thresholdLow = 32, thresholdHigh = 58) {
  if (moisture === null || moisture === undefined || isNaN(moisture)) {
    return 'Unknown';
  }
  if (moisture < thresholdLow) return 'Dry';
  if (moisture > thresholdHigh) return 'Wet';
  return 'Optimal';
}

/**
 * Determine ambient temperature status
 * @param {number|null} temp - Temperature in degrees Celsius
 * @param {number} min - Minimum acceptable temperature
 * @param {number} max - Maximum acceptable temperature
 * @returns {'Low' | 'Normal' | 'High' | 'Unknown'}
 */
export function getTemperatureStatus(temp, min = 18, max = 29) {
  if (temp === null || temp === undefined || isNaN(temp)) {
    return 'Unknown';
  }
  if (temp < min) return 'Low';
  if (temp > max) return 'High';
  return 'Normal';
}

/**
 * Determine relative humidity status
 * @param {number|null} humidity - Relative humidity percentage
 * @param {number} min - Minimum acceptable humidity
 * @param {number} max - Maximum acceptable humidity
 * @returns {'Low' | 'Normal' | 'High' | 'Unknown'}
 */
export function getHumidityStatus(humidity, min = 40, max = 70) {
  if (humidity === null || humidity === undefined || isNaN(humidity)) {
    return 'Unknown';
  }
  if (humidity < min) return 'Low';
  if (humidity > max) return 'High';
  return 'Normal';
}

/**
 * Determine ambient illumination status
 * @param {number|null} lux - Illumination in Lux
 * @param {number} min - Minimum acceptable light
 * @param {number} max - Maximum acceptable light
 * @returns {'Low' | 'Moderate' | 'Good' | 'Excessive' | 'Unknown'}
 */
export function getLightStatus(lux, min = 800, max = 4000) {
  if (lux === null || lux === undefined || isNaN(lux)) {
    return 'Unknown';
  }
  if (lux < 300) return 'Low';
  if (lux < min) return 'Moderate';
  if (lux <= max) return 'Good';
  return 'Excessive';
}

/**
 * Dynamically calculate overall plant condition
 * @param {object} telemetry - Current sensor values
 * @param {object} settings - Configured thresholds
 * @param {object} sensorHealth - Online status of each sensor
 * @returns {{ state: 'HEALTHY'|'NEEDS ATTENTION'|'CRITICAL', label: string, color: string, bg: string, border: string, reason: string }}
 */
export function calculatePlantStatus(telemetry = {}, settings = {}, sensorHealth = {}) {
  const { moisture, temperature, humidity, tankLevelPercent } = telemetry;
  const { thresholdLow = 32, thresholdHigh = 58 } = settings;

  // 1. Check for hardware failure / disconnected sensors
  const isAnySensorOffline = Object.values(sensorHealth).some((s) => s === 'offline' || s === 'error');
  const isTankCriticallyLow = tankLevelPercent !== undefined && tankLevelPercent <= 5;
  const isMoistureCritical = moisture !== undefined && moisture !== null && moisture < 18;

  if (isAnySensorOffline || isTankCriticallyLow || isMoistureCritical) {
    let reason = 'Critical soil moisture requires immediate irrigation';
    if (isAnySensorOffline) reason = 'One or more sensors are offline or reporting errors';
    else if (isTankCriticallyLow) reason = 'Water reservoir is empty (Dry-run lockout armed)';

    return {
      state: 'CRITICAL',
      label: 'CRITICAL',
      color: '#E34222',
      bg: 'rgba(227, 66, 34, 0.12)',
      border: 'rgba(227, 66, 34, 0.35)',
      badgeClass: 'badge-destructive',
      reason
    };
  }

  // 2. Check for environmental condition deviations
  const isMoistureDry = moisture !== undefined && moisture !== null && moisture < thresholdLow;
  const isMoistureExcess = moisture !== undefined && moisture !== null && moisture > thresholdHigh;
  const isTempAbnormal = temperature !== undefined && (temperature < 16 || temperature > 32);
  const isHumidityAbnormal = humidity !== undefined && (humidity < 35 || humidity > 85);

  if (isMoistureDry || isMoistureExcess || isTempAbnormal || isHumidityAbnormal) {
    let reason = 'Environmental conditions outside optimal species target';
    if (isMoistureDry) reason = `Soil moisture (${moisture}%) is below minimum threshold (${thresholdLow}%)`;
    else if (isMoistureExcess) reason = `Soil moisture (${moisture}%) exceeds target ceiling (${thresholdHigh}%)`;
    else if (isTempAbnormal) reason = `Ambient temperature (${temperature}°C) outside comfortable range`;

    return {
      state: 'NEEDS ATTENTION',
      label: 'NEEDS ATTENTION',
      color: '#d9531e',
      bg: 'rgba(227, 66, 34, 0.08)',
      border: 'rgba(227, 66, 34, 0.28)',
      badgeClass: 'badge-amber',
      reason
    };
  }

  // 3. All monitored parameters are within optimal ranges
  return {
    state: 'HEALTHY',
    label: 'HEALTHY',
    color: '#046A38',
    bg: 'rgba(4, 106, 56, 0.12)',
    border: 'rgba(4, 106, 56, 0.3)',
    badgeClass: 'badge-emerald',
    reason: 'All monitored conditions are within species target ranges'
  };
}

/**
 * Format relative elapsed time from timestamp
 * @param {number} timestampMs - Unix epoch in milliseconds
 * @returns {string} e.g. "5 seconds ago" or "2 minutes ago"
 */
export function formatTimeAgo(timestampMs) {
  if (!timestampMs) return 'No data';
  const diffSec = Math.max(0, Math.floor((Date.now() - timestampMs) / 1000));
  if (diffSec < 4) return 'Just now';
  if (diffSec < 60) return `${diffSec} seconds ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHours = Math.floor(diffMin / 60);
  return `${diffHours} hr ago`;
}

/**
 * Check if sensor data is stale (> 30s)
 * @param {number} timestampMs - Timestamp of last reading
 * @param {number} thresholdSec - Staleness timeout
 * @returns {boolean}
 */
export function isDataStale(timestampMs, thresholdSec = 30) {
  if (!timestampMs) return true;
  return (Date.now() - timestampMs) / 1000 > thresholdSec;
}

/**
 * Safely display sensor reading with fallback when sensor is offline
 * @param {number|null|undefined} value
 * @param {string} unit
 * @param {boolean} isOffline
 * @returns {string}
 */
export function formatSensorReading(value, unit = '', isOffline = false) {
  if (isOffline || value === null || value === undefined || isNaN(value)) {
    return '--';
  }
  return `${value}${unit ? ' ' + unit : ''}`;
}

/**
 * Compute demand-based irrigation reason
 * @param {boolean} isPumping - Whether the pump is currently active
 * @param {object} telemetry - Current telemetry
 * @param {object} settings - Settings thresholds
 * @param {string} lastTriggerType - 'Autonomous' or 'Manual'
 * @returns {string}
 */
export function getIrrigationStateReason(isPumping, telemetry = {}, settings = {}, lastTriggerType = 'Autonomous') {
  const { moisture = 42, tankLevelPercent = 80 } = telemetry;
  const { thresholdLow = 32, thresholdHigh = 58 } = settings;

  if (isPumping) {
    if (lastTriggerType === 'Manual') {
      return 'Manual user override active';
    }
    return `Soil moisture (${moisture}%) dropped below threshold (${thresholdLow}%)`;
  }

  if (tankLevelPercent <= 5) {
    return 'Safety lock: Reservoir empty (< 5%)';
  }
  if (moisture < thresholdLow) {
    return `Moisture low (${moisture}% < ${thresholdLow}%) • Awaiting soak window`;
  }
  if (moisture >= thresholdHigh) {
    return `Ceiling reached (${moisture}% >= ${thresholdHigh}%) • Saturated`;
  }
  return `Soil moisture is within target range (${thresholdLow}% – ${thresholdHigh}%)`;
}

/**
 * Calculate water usage and estimated savings metrics
 * @param {Array} logs - List of actuation log events
 * @returns {object}
 */
export function calculateWaterMetrics(logs = []) {
  const now = Date.now();
  const oneDayMs = 24 * 3600 * 1000;
  const oneWeekMs = 7 * oneDayMs;

  let waterTodayMl = 0;
  let waterThisWeekMl = 0;
  let totalDurationSec = 0;

  logs.forEach((log) => {
    const logTime = new Date(log.timestamp).getTime();
    const volume = log.volumeMl || (log.durationSec ? Math.round(log.durationSec * 5.5) : 0);
    const duration = log.durationSec || 0;

    totalDurationSec += duration;

    if (now - logTime <= oneDayMs) {
      waterTodayMl += volume;
    }
    if (now - logTime <= oneWeekMs) {
      waterThisWeekMl += volume;
    }
  });

  const totalEvents = logs.length;
  const avgDurationSec = totalEvents > 0 ? Number((totalDurationSec / totalEvents).toFixed(1)) : 0;

  // Sub-surface delivery avoids ~61.9% of conventional surface spray evaporation/runoff
  const totalDispensedMl = logs.reduce((s, l) => s + (l.volumeMl || 0), 0);
  const estimatedConventionalMl = Math.round(totalDispensedMl / (1 - 0.619));
  const estimatedSavedMl = Math.max(0, estimatedConventionalMl - totalDispensedMl);

  return {
    waterTodayMl,
    waterThisWeekMl,
    totalEvents,
    avgDurationSec,
    totalDispensedMl,
    estimatedSavedMl,
    conservationRatePct: 61.9
  };
}
