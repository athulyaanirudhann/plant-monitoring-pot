import React from 'react';
import { Wifi, Cpu, Activity, Clock, ShieldCheck, Zap, HardDrive, Network } from 'lucide-react';

export default function DeviceStatusCard({ device, lastUpdatedMs }) {
  const {
    deviceId = 'ESP32_SMARTPOT_01',
    hardware = 'ESP32-WROOM-32D',
    firmwareVersion = 'v2.4.1-ota',
    ipAddress = '192.168.1.142',
    macAddress = 'C8:2E:18:9A:4F:2C',
    wifiSsid = 'BotanIQ_Mesh_2.4G',
    wifiRssi = -62,
    status = 'online',
    freeHeapKb = 184,
    uptimeSeconds = 384210,
    powerMode = '5V DC Continuous'
  } = device || {};

  const secondsAgo = Math.max(0, Math.floor((Date.now() - (lastUpdatedMs || Date.now())) / 1000));
  const isAlive = status === 'online' && secondsAgo < 45;

  const signalBars = wifiRssi > -65 ? 4 : wifiRssi > -75 ? 3 : wifiRssi > -85 ? 2 : 1;

  const days = Math.floor(uptimeSeconds / 86400);
  const hours = Math.floor((uptimeSeconds % 86400) / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);

  return (
    <div className="card">
      <div className="card-header" style={{ marginBottom: 14 }}>
        <div>
          <h3 className="card-title">
            <Cpu size={16} color="hsl(var(--primary))" />
            Device Telemetry
          </h3>
          <p className="card-subtitle">Edge microcontroller health and network link</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className={`badge ${isAlive ? 'badge-emerald' : 'badge-destructive'}`}>
            <span className="pulse-dot" />
            {isAlive ? 'Online (18ms)' : 'Offline'}
          </span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
        {/* Wi-Fi RSSI & SSID */}
        <div style={{ padding: '10px 12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Wi-Fi Link</span>
            <div style={{ display: 'flex', gap: '2px', alignItems: 'flex-end', height: '12px' }}>
              {[1, 2, 3, 4].map((bar) => (
                <div
                  key={bar}
                  style={{
                    width: '3px',
                    height: `${bar * 3}px`,
                    borderRadius: '1px',
                    backgroundColor: bar <= signalBars ? '#10b981' : 'hsl(var(--muted-foreground) / 0.3)'
                  }}
                />
              ))}
            </div>
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {wifiSsid}
          </div>
          <div style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }} className="tnum">
            {wifiRssi} dBm
          </div>
        </div>

        {/* IP & MAC */}
        <div style={{ padding: '10px 12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Network IP</span>
            <Network size={13} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }} className="tnum">
            {ipAddress}
          </div>
          <div style={{ fontSize: '10.5px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }} className="tnum">
            {macAddress}
          </div>
        </div>

        {/* Free SRAM & Firmware */}
        <div style={{ padding: '10px 12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Firmware & Heap</span>
            <HardDrive size={13} color="#10b981" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
            {firmwareVersion}
          </div>
          <div style={{ fontSize: '11px', color: '#10b981', marginTop: '2px' }} className="tnum">
            SRAM: {freeHeapKb} KB
          </div>
        </div>

        {/* Uptime */}
        <div style={{ padding: '10px 12px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--border) / 0.6)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase' }}>Uptime</span>
            <Clock size={13} color="#eab308" />
          </div>
          <div style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))' }} className="tnum">
            {days}d {hours}h {minutes}m
          </div>
          <div style={{ fontSize: '11px', color: secondsAgo < 5 ? '#10b981' : 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
            {secondsAgo === 0 ? 'Just now' : `${secondsAgo}s ago`}
          </div>
        </div>
      </div>
    </div>
  );
}
