import React, { useState, useMemo } from 'react';
import { LineChart, Download, ArrowUpRight } from 'lucide-react';

export default function HistoryChart({
  historyData,
  timeRange,
  onChangeTimeRange,
  thresholdLow,
  onExportCsv
}) {
  const [selectedMetric, setSelectedMetric] = useState('moisture');
  const [hoveredPoint, setHoveredPoint] = useState(null);

  const metricConfigs = {
    moisture: {
      label: 'Soil Moisture',
      unit: '%',
      color: '#046A38',
      gradientId: 'moistureGrad',
      minVal: 0,
      maxVal: 100
    },
    temperature: {
      label: 'Temperature',
      unit: '°C',
      color: '#E34222',
      gradientId: 'tempGrad',
      minVal: 15,
      maxVal: 35
    },
    humidity: {
      label: 'Humidity',
      unit: '% RH',
      color: '#1F3B2E',
      gradientId: 'humidityGrad',
      minVal: 20,
      maxVal: 90
    },
    light: {
      label: 'Light Level',
      unit: 'Lux',
      color: '#c27d1a',
      gradientId: 'lightGrad',
      minVal: 0,
      maxVal: 8000
    }
  };

  const currentConfig = metricConfigs[selectedMetric];

  const width = 840;
  const height = 260;
  const padding = { top: 20, right: 24, bottom: 32, left: 40 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const { pathD, areaD, pointsWithCoords, stats } = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return { pathD: '', areaD: '', pointsWithCoords: [], stats: { min: 0, max: 0, avg: 0, last: 0 } };
    }

    const values = historyData.map((d) => d[selectedMetric] || 0);
    const minRaw = Math.min(...values);
    const maxRaw = Math.max(...values);
    const avgRaw = values.reduce((a, b) => a + b, 0) / values.length;
    const lastRaw = values[values.length - 1];

    let yMin = currentConfig.minVal;
    let yMax = currentConfig.maxVal;

    if (selectedMetric === 'temperature') {
      yMin = Math.floor(Math.min(minRaw - 2, 18));
      yMax = Math.ceil(Math.max(maxRaw + 2, 32));
    } else if (selectedMetric === 'light') {
      yMin = 0;
      yMax = Math.max(6000, Math.ceil(maxRaw * 1.15));
    }

    const yRange = yMax - yMin || 1;

    const coords = historyData.map((d, i) => {
      const x = padding.left + (i / (historyData.length - 1)) * chartW;
      const val = d[selectedMetric];
      const y = padding.top + chartH - ((val - yMin) / yRange) * chartH;
      return { ...d, x, y, value: val };
    });

    let p = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 1; i < coords.length; i++) {
      const prev = coords[i - 1];
      const curr = coords[i];
      const cpX = (prev.x + curr.x) / 2;
      p += ` C ${cpX} ${prev.y}, ${cpX} ${curr.y}, ${curr.x} ${curr.y}`;
    }

    const aD = `${p} L ${coords[coords.length - 1].x} ${padding.top + chartH} L ${coords[0].x} ${padding.top + chartH} Z`;

    return {
      pathD: p,
      areaD: aD,
      pointsWithCoords: coords,
      yMin,
      yMax,
      stats: {
        min: minRaw.toFixed(1),
        max: maxRaw.toFixed(1),
        avg: avgRaw.toFixed(1),
        last: lastRaw.toFixed(1)
      }
    };
  }, [historyData, selectedMetric, currentConfig]);

  const thresholdY = selectedMetric === 'moisture'
    ? padding.top + chartH - (thresholdLow / 100) * chartH
    : null;

  return (
    <div className="card">
      <div className="card-header" style={{ flexWrap: 'wrap', gap: '12px', paddingBottom: '8px' }}>
        <div>
          <h3 className="card-title">
            <LineChart size={16} color="hsl(var(--primary))" />
            Environmental Analytics
          </h3>
          <p className="card-subtitle">Telemetry trends and closed-loop soil responses</p>
        </div>

        {/* Controls: Segmented Metric Pills + Range Selector + Export */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Metric Selector (shadcn TabsList) */}
          <div className="nav-tabs" style={{ height: '32px' }}>
            {['moisture', 'temperature', 'humidity', 'light'].map((key) => (
              <button
                key={key}
                onClick={() => setSelectedMetric(key)}
                className={`nav-tab-btn ${selectedMetric === key ? 'active' : ''}`}
                style={{ fontSize: '11.5px', padding: '3px 9px' }}
              >
                {metricConfigs[key].label}
              </button>
            ))}
          </div>

          {/* Time Range Selector: 1h, Today, 24h, 7d, 30d */}
          <div className="nav-tabs" style={{ height: '32px' }}>
            {[
              { id: '1h', label: '1H' },
              { id: 'today', label: 'Today' },
              { id: '24h', label: '24H' },
              { id: '7d', label: '7D' },
              { id: '30d', label: '30D' }
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => onChangeTimeRange(id)}
                className={`nav-tab-btn ${timeRange === id ? 'active' : ''}`}
                style={{ fontSize: '11px', padding: '3px 8px' }}
                title={`Show trends for ${label}`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={onExportCsv}
            className="btn btn-outline btn-sm"
            style={{ height: '32px' }}
            title="Export CSV dataset"
          >
            <Download size={13} />
            Export
          </button>
        </div>
      </div>

      {/* Sub-header Stats Ribbon (shadcn style minimal row) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', padding: '12px 16px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'calc(var(--radius) - 2px)', border: '1px solid hsl(var(--border) / 0.6)', marginBottom: '16px' }}>
        <div>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Latest</span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: currentConfig.color }} className="tnum">
            {stats.last} {currentConfig.unit}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Minimum</span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--foreground))' }} className="tnum">
            {stats.min} {currentConfig.unit}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Average</span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--foreground))' }} className="tnum">
            {stats.avg} {currentConfig.unit}
          </div>
        </div>
        <div>
          <span style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Maximum</span>
          <div style={{ fontSize: '15px', fontWeight: '700', color: 'hsl(var(--foreground))' }} className="tnum">
            {stats.max} {currentConfig.unit}
          </div>
        </div>
      </div>

      {/* SVG Interactive Chart Canvas */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{ width: '100%', height: 'auto', display: 'block', minWidth: '600px' }}
          onMouseLeave={() => setHoveredPoint(null)}
        >
          <defs>
            <linearGradient id={currentConfig.gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={currentConfig.color} stopOpacity="0.2" />
              <stop offset="100%" stopColor={currentConfig.color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines (horizontal) */}
          {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
            const y = padding.top + chartH * pct;
            return (
              <line
                key={i}
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="hsl(var(--border))"
                strokeWidth="1"
                strokeDasharray="4 4"
                opacity="0.6"
              />
            );
          })}

          {/* Threshold Line (if moisture is active) */}
          {thresholdY && (
            <g>
              <line
                x1={padding.left}
                y1={thresholdY}
                x2={width - padding.right}
                y2={thresholdY}
                stroke="#1F3B2E"
                strokeWidth="1.2"
                strokeDasharray="4 3"
              />
              <text
                x={width - padding.right - 6}
                y={thresholdY - 5}
                fill="#1F3B2E"
                fontSize="10"
                fontWeight="500"
                textAnchor="end"
              >
                Auto-Trigger: {thresholdLow}%
              </text>
            </g>
          )}

          {/* Gradient Area Fill */}
          {areaD && <path d={areaD} fill={`url(#${currentConfig.gradientId})`} />}

          {/* Spline Line */}
          {pathD && (
            <path
              d={pathD}
              fill="none"
              stroke={currentConfig.color}
              strokeWidth="2"
              strokeLinecap="round"
            />
          )}

          {/* Time axis ticks */}
          {pointsWithCoords.map((pt, i) => {
            const step = Math.max(1, Math.floor(pointsWithCoords.length / 6));
            if (i % step === 0 || i === pointsWithCoords.length - 1) {
              return (
                <text
                  key={i}
                  x={pt.x}
                  y={height - 8}
                  fill="hsl(var(--muted-foreground))"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="inherit"
                >
                  {timeRange === '7d' ? pt.date : pt.time}
                </text>
              );
            }
            return null;
          })}

          {/* Hover detector overlay hitboxes */}
          {pointsWithCoords.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="6"
              fill="transparent"
              style={{ cursor: 'crosshair' }}
              onMouseEnter={() => setHoveredPoint(pt)}
            />
          ))}

          {/* Active Hover Crosshair & Indicator Point */}
          {hoveredPoint && (
            <g>
              <line
                x1={hoveredPoint.x}
                y1={padding.top}
                x2={hoveredPoint.x}
                y2={padding.top + chartH}
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="1"
                strokeDasharray="2 2"
                opacity="0.8"
              />
              <circle
                cx={hoveredPoint.x}
                cy={hoveredPoint.y}
                r="4"
                fill={currentConfig.color}
                stroke="hsl(var(--background))"
                strokeWidth="2"
              />
            </g>
          )}
        </svg>

        {/* Hover Tooltip Card (shadcn Popover styling) */}
        {hoveredPoint && (
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: `${Math.min(width - 160, Math.max(40, (hoveredPoint.x / width) * 100))}%`,
              transform: 'translateX(-50%)',
              backgroundColor: 'hsl(var(--popover))',
              color: 'hsl(var(--popover-foreground))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              padding: '6px 12px',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
              pointerEvents: 'none',
              zIndex: 10,
              fontSize: '12px'
            }}
          >
            <div style={{ color: 'hsl(var(--muted-foreground))', fontSize: '10.5px' }}>
              {hoveredPoint.date} • {hoveredPoint.time}
            </div>
            <div style={{ fontWeight: '600', color: currentConfig.color, marginTop: '2px' }} className="tnum">
              {currentConfig.label}: {hoveredPoint.value} {currentConfig.unit}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
