/**
 * BotanIQ Smart Pot - IoT Telemetry & Control Service
 * Provides a clean interface for hardware telemetry, MQTT, and REST API communication.
 * When real hardware or backend APIs are active, this service directs traffic to the server.
 * In development/offline mode, it transparently provides high-fidelity simulation.
 */

import { INITIAL_POTS, INITIAL_ACTUATION_LOGS, INITIAL_ALERTS, generateHistoryData } from '../data/initialState';

class TelemetryService {
  constructor() {
    this.useMock = true; // Toggle between Mock and real API/MQTT backend
    this.apiBaseUrl = import.meta.env.VITE_IOT_API_URL || 'http://localhost:8080/api';
    this.subscribers = new Set();
  }

  /**
   * Fetch current sensor telemetry for a smart pot node
   * @param {string} potId
   * @returns {Promise<object>}
   */
  async getCurrentTelemetry(potId) {
    if (this.useMock) {
      const pot = INITIAL_POTS.find((p) => p.id === potId) || INITIAL_POTS[0];
      return {
        deviceId: pot.device.deviceId,
        plant: pot.name,
        timestamp: Date.now(),
        soilMoisture: pot.telemetry.moisture,
        rawAdc: pot.telemetry.rawAdc,
        temperature: pot.telemetry.temperature,
        humidity: pot.telemetry.humidity,
        light: pot.telemetry.light,
        vpd: pot.telemetry.vpd,
        tankLevelPercent: pot.telemetry.tankLevelPercent,
        tankCurrentMl: pot.telemetry.tankCurrentMl,
        pump: false,
        plantStatus: 'healthy',
        sensors: {
          soilMoisture: 'online',
          dht22: 'online',
          lightSensor: 'online',
          esp32: 'online'
        }
      };
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/telemetry`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[TelemetryService] Failed to fetch live telemetry, falling back to cached state:', err);
      throw err;
    }
  }

  /**
   * Fetch historical sensor trend data for graphs
   * @param {string} potId
   * @param {string} timeRange - '1h' | 'today' | '24h' | '7d' | '30d'
   * @param {number} currentMoisture
   * @returns {Promise<Array>}
   */
  async getHistoricalReadings(potId, timeRange = '24h', currentMoisture = 42) {
    const hoursMap = {
      '1h': 1,
      'today': 6,
      '24h': 24,
      '7d': 168,
      '30d': 720
    };
    const hours = hoursMap[timeRange] || 24;

    if (this.useMock) {
      return generateHistoryData(hours, currentMoisture);
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/history?range=${timeRange}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[TelemetryService] Falling back to local history generator:', err);
      return generateHistoryData(hours, currentMoisture);
    }
  }

  /**
   * Fetch historical actuation & irrigation events
   * @param {string} potId
   * @returns {Promise<Array>}
   */
  async getActuationLogs(potId) {
    if (this.useMock) {
      return INITIAL_ACTUATION_LOGS.filter((l) => !potId || l.potId === potId);
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/actuations`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('[TelemetryService] Falling back to initial logs:', err);
      return INITIAL_ACTUATION_LOGS;
    }
  }

  /**
   * Update species thresholds and control settings
   * @param {string} potId
   * @param {object} settings
   * @returns {Promise<boolean>}
   */
  async updateThresholds(potId, settings) {
    if (this.useMock) {
      // Stored locally in React state
      return true;
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      return res.ok;
    } catch (err) {
      console.error('[TelemetryService] Failed to sync settings with backend:', err);
      return false;
    }
  }

  /**
   * Trigger demand-based or manual root irrigation pulse
   * @param {string} potId
   * @param {number} durationSec
   * @param {string} reason
   * @returns {Promise<{ success: boolean, message: string }>}
   */
  async triggerIrrigation(potId, durationSec = 6, reason = 'Manual pulse') {
    if (this.useMock) {
      return { success: true, message: `Dispatched ${durationSec}s pulse command to ESP32.` };
    }

    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/irrigate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ durationSec, reason })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }

  /**
   * Emergency stop irrigation pump
   * @param {string} potId
   * @returns {Promise<boolean>}
   */
  async stopIrrigation(potId) {
    if (this.useMock) {
      return true;
    }
    try {
      const res = await fetch(`${this.apiBaseUrl}/pots/${potId}/irrigate/stop`, { method: 'POST' });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  /**
   * Subscribe to real-time telemetry events
   * @param {Function} callback
   * @returns {Function} unsubscribe function
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Publish new telemetry payload to all active UI subscribers
   * @param {object} data
   */
  publish(data) {
    this.subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
        console.error('[TelemetryService] Subscriber error:', e);
      }
    });
  }
}

export const telemetryService = new TelemetryService();
