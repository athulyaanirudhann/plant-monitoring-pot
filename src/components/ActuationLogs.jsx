import React, { useState } from 'react';
import { History, Download, Filter, Droplet, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

export default function ActuationLogs({ logs, onExportCsv }) {
  const [filterType, setFilterType] = useState('ALL');

  const filteredLogs = logs.filter((log) => {
    if (filterType === 'ALL') return true;
    return log.triggerType === filterType;
  });

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '10px', paddingBottom: '8px' }}>
        <div>
          <h3 className="card-title">
            <History size={16} color="hsl(var(--primary))" />
            Actuation Activity Log
          </h3>
          <p className="card-subtitle">Sub-surface water deliveries and delta moisture response</p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {/* Filter Pills (shadcn TabsList) */}
          <div className="nav-tabs" style={{ height: '32px' }}>
            <button
              onClick={() => setFilterType('ALL')}
              className={`nav-tab-btn ${filterType === 'ALL' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterType('Autonomous')}
              className={`nav-tab-btn ${filterType === 'Autonomous' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
            >
              Auto
            </button>
            <button
              onClick={() => setFilterType('Manual')}
              className={`nav-tab-btn ${filterType === 'Manual' ? 'active' : ''}`}
              style={{ fontSize: '11.5px', padding: '3px 8px' }}
            >
              Manual
            </button>
          </div>

          <button
            onClick={onExportCsv}
            className="btn btn-outline btn-sm"
            style={{ height: '32px' }}
            title="Download CSV for academic paper and presentation"
          >
            <Download size={13} />
            CSV
          </button>
        </div>
      </div>

      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Type</th>
              <th>Trigger Reason</th>
              <th>Duration</th>
              <th>Moisture Delta</th>
              <th>Volume</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '24px', color: 'hsl(var(--muted-foreground))' }}>
                  No actuation events recorded.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const isAuto = log.triggerType === 'Autonomous';
                const moistureGain = (log.moistureAfter - log.moistureBefore).toFixed(1);

                return (
                  <tr key={log.id}>
                    <td className="tnum" style={{ whiteSpace: 'nowrap', fontSize: '12px', color: 'hsl(var(--muted-foreground))' }}>
                      {log.timestamp}
                    </td>

                    <td>
                      <span className={`badge ${isAuto ? 'badge-emerald' : 'badge-outline'}`}>
                        {isAuto ? 'Auto' : 'Manual'}
                      </span>
                    </td>

                    <td style={{ maxWidth: '260px', fontSize: '12.5px', color: 'hsl(var(--foreground))' }}>
                      {log.triggerReason}
                    </td>

                    <td className="tnum" style={{ fontWeight: 600 }}>
                      {log.durationSec}s
                    </td>

                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }} className="tnum">
                        <span style={{ color: '#f59e0b' }}>{log.moistureBefore}%</span>
                        <ArrowRight size={10} color="hsl(var(--muted-foreground))" />
                        <span style={{ color: '#10b981', fontWeight: 600 }}>{log.moistureAfter}%</span>
                        <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>(+{moistureGain}%)</span>
                      </div>
                    </td>

                    <td className="tnum" style={{ fontWeight: 600 }}>
                      {log.volumeMl} mL
                    </td>

                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', color: '#10b981' }}>
                        <CheckCircle2 size={12} />
                        Success
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
