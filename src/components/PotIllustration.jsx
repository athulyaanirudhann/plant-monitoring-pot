import React from 'react';
import { Droplet, Cpu, Activity, Gauge } from 'lucide-react';

export default function PotIllustration({ moisture, isPumping, tankLevel, plantPreset }) {
  // Moisture condition: critical (<20), dry (20-35), optimal (35-65), saturated (>65)
  const isDry = moisture < 30;
  const isHealthy = moisture >= 30 && moisture <= 65;
  const isSaturated = moisture > 65;

  const leafColor = isDry ? '#E34222' : isSaturated ? '#046A38' : '#046A38';
  const leafDroop = isDry ? 14 : 0; // slight drooping effect when dry

  return (
    <div className="card" style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="card-header" style={{ marginBottom: 8 }}>
        <div>
          <h3 className="card-title">
            <span style={{ fontSize: '18px' }}>{plantPreset?.icon || '🌿'}</span>
            Physical Pot Architecture
          </h3>
          <p className="card-subtitle">Root-zone sub-surface delivery & capacitive probe schematic</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isPumping && (
            <span className="badge badge-emerald" style={{ animation: 'pulse-glow 1s infinite' }}>
              <Droplet size={12} />
              PUMP ACTIVE (Dispensing...)
            </span>
          )}
          <span className={`badge ${isHealthy ? 'badge-emerald' : isDry ? 'badge-destructive' : 'badge-emerald'}`}>
            {isHealthy ? 'Optimal Moisture' : isDry ? 'Soil Dehydrated' : 'Saturated'}
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0', background: 'radial-gradient(circle at 50% 50%, rgba(4, 106, 56, 0.08) 0%, transparent 70%)' }}>
        <svg
          viewBox="0 0 440 380"
          style={{ width: '100%', maxWidth: '420px', height: 'auto', display: 'block' }}
        >
          <defs>
            <linearGradient id="potGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#1F3B2E" />
              <stop offset="50%" stopColor="#2c5240" />
              <stop offset="100%" stopColor="#1F3B2E" />
            </linearGradient>

            <linearGradient id="soilGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#4a3b2c" />
              <stop offset="60%" stopColor="#35281e" />
              <stop offset="100%" stopColor="#231a13" />
            </linearGradient>

            <linearGradient id="waterTankGrad" x1="0%" y1="100%" x2="0%" y2="0%">
              <stop offset="0%" stopColor="#046A38" />
              <stop offset="100%" stopColor="#0ba35b" />
            </linearGradient>

            <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Plant Foliage (Stem and Leaves) */}
          <g transform={`translate(0, ${leafDroop})`} style={{ transition: 'transform 800ms ease' }}>
            {/* Central Stems */}
            <path d="M 220 200 Q 215 140 220 80" stroke="#1F3B2E" strokeWidth="6" strokeLinecap="round" fill="none" />
            <path d="M 218 160 Q 180 120 140 100" stroke="#1F3B2E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 220 150 Q 260 110 300 90" stroke="#1F3B2E" strokeWidth="4.5" strokeLinecap="round" fill="none" />
            <path d="M 218 120 Q 170 70 120 50" stroke="#1F3B2E" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <path d="M 220 110 Q 270 60 320 40" stroke="#1F3B2E" strokeWidth="3.5" strokeLinecap="round" fill="none" />

            {/* Lush Leaves */}
            {/* Top Central Leaf */}
            <path
              d="M 220 80 Q 200 40 220 15 Q 240 40 220 80 Z"
              fill={leafColor}
              stroke="#1F3B2E"
              strokeWidth="2"
            />
            {/* Left Big Leaf */}
            <path
              d="M 140 100 Q 90 70 80 110 Q 120 140 140 100 Z"
              fill={leafColor}
              stroke="#1F3B2E"
              strokeWidth="2"
            />
            {/* Right Big Leaf */}
            <path
              d="M 300 90 Q 350 60 360 100 Q 320 130 300 90 Z"
              fill={leafColor}
              stroke="#1F3B2E"
              strokeWidth="2"
            />
            {/* Left Upper Leaf */}
            <path
              d="M 120 50 Q 70 20 80 60 Q 110 75 120 50 Z"
              fill={leafColor}
              stroke="#1F3B2E"
              strokeWidth="2"
            />
            {/* Right Upper Leaf */}
            <path
              d="M 320 40 Q 370 10 360 50 Q 330 65 320 40 Z"
              fill={leafColor}
              stroke="#1F3B2E"
              strokeWidth="2"
            />
          </g>

          {/* Plant Pot Exterior Cutaway */}
          {/* Outer Pot Silhouette */}
          <path
            d="M 120 195 L 320 195 L 295 330 L 145 330 Z"
            fill="url(#potGrad)"
            stroke="#52525b"
            strokeWidth="3"
          />
          {/* Pot Rim Lip */}
          <rect x="110" y="190" width="220" height="12" rx="4" fill="#3f3f46" stroke="#71717a" strokeWidth="1.5" />

          {/* Soil Bed Interior */}
          <path
            d="M 124 200 L 316 200 L 292 300 L 148 300 Z"
            fill="url(#soilGrad)"
          />

          {/* Sub-Surface Root Zone Network */}
          <g stroke="rgba(240, 230, 200, 0.45)" strokeWidth="1.5" strokeLinecap="round" fill="none">
            <path d="M 220 202 Q 210 230 200 260 Q 185 275 170 285" />
            <path d="M 220 202 Q 230 230 240 260 Q 255 275 270 285" />
            <path d="M 205 235 Q 180 245 165 260" />
            <path d="M 235 235 Q 260 245 275 260" />
            <path d="M 220 240 L 220 280" />
          </g>

          {/* Capacitive Soil Moisture Sensor (Left side in soil) */}
          <g transform="translate(155, 205)">
            {/* Sensor PCB Body (FR4 style) */}
            <rect x="0" y="0" width="16" height="75" rx="3" fill="#18181b" stroke="#10b981" strokeWidth="1.5" />
            {/* Capacitive probe copper traces under solder mask */}
            <line x1="4" y1="20" x2="4" y2="70" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            <line x1="12" y1="20" x2="12" y2="70" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
            {/* Sensor electronics head */}
            <rect x="-2" y="0" width="20" height="15" rx="2" fill="#27272a" />
            {/* 3-pin wiring cable to ESP32 */}
            <path d="M 8 0 Q 5 -15 20 -20" stroke="#1F3B2E" strokeWidth="1.5" fill="none" />
            <path d="M 8 0 Q 8 -15 23 -20" stroke="#1F3B2E" strokeWidth="1.5" fill="none" />
            <path d="M 8 0 Q 11 -15 26 -20" stroke="#046A38" strokeWidth="1.5" fill="none" />

            {/* Dielectric moisture detection rings */}
            <circle cx="8" cy="48" r="16" stroke="rgba(16, 185, 129, 0.4)" strokeWidth="1" fill="none" strokeDasharray="3 3" />
            <circle cx="8" cy="48" r="24" stroke="rgba(16, 185, 129, 0.2)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
          </g>

          {/* Sub-Surface Irrigation Line (Right side) */}
          <g transform="translate(250, 202)">
            {/* Delivery Tube (Direct to Root Zone) */}
            <path
              d="M 50 -15 L 20 20 L 20 65 Q 20 75 0 75"
              fill="none"
              stroke="#06b6d4"
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            {/* Perforation Emitter directly at root level */}
            <circle cx="0" cy="75" r="4" fill="#06b6d4" />
            {/* Micro water droplets emitted when pump active */}
            {isPumping && (
              <g fill="#38bdf8">
                <circle cx="-6" cy="80" r="2.5">
                  <animate attributeName="cy" values="75;90;75" dur="0.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="0.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="6" cy="78" r="2">
                  <animate attributeName="cy" values="75;88;75" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;0;1" dur="1s" repeatCount="indefinite" />
                </circle>
              </g>
            )}
          </g>

          {/* Integrated Water Reservoir (At Base of Pot) */}
          <rect x="148" y="300" width="144" height="28" fill="#18181b" stroke="#3f3f46" strokeWidth="1" />
          {/* Animated Water Level in Tank */}
          <rect
            x="150"
            y={328 - (26 * Math.max(0, Math.min(100, tankLevel))) / 100}
            width="140"
            height={(26 * Math.max(0, Math.min(100, tankLevel))) / 100}
            fill="url(#waterTankGrad)"
            opacity="0.85"
          />

          {/* Miniature 5V DC Submersible Pump in Reservoir */}
          <g transform="translate(252, 305)">
            <rect x="0" y="0" width="22" height="18" rx="3" fill="#09090b" stroke="#06b6d4" strokeWidth="1" />
            <circle cx="11" cy="9" r="4" fill="#38bdf8" />
            {isPumping && (
              <circle cx="11" cy="9" r="7" stroke="#38bdf8" strokeWidth="1" fill="none" opacity="0.8">
                <animate attributeName="r" values="4;8;4" dur="0.6s" repeatCount="indefinite" />
              </circle>
            )}
          </g>

          {/* Schematic Labels & Callouts */}
          {/* Label 1: Capacitive Sensor */}
          <g transform="translate(30, 240)">
            <rect x="0" y="0" width="112" height="24" rx="4" fill="rgba(24, 24, 27, 0.9)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            <text x="6" y="16" fill="#10b981" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              Capacitive Probe v1.2
            </text>
            <path d="M 112 12 L 155 240" stroke="#10b981" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          </g>

          {/* Label 2: Sub-surface delivery */}
          <g transform="translate(295, 240)">
            <rect x="0" y="0" width="125" height="24" rx="4" fill="rgba(24, 24, 27, 0.9)" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1" />
            <text x="6" y="16" fill="#06b6d4" fontSize="9.5" fontWeight="600" fontFamily="sans-serif">
              Sub-Surface Emitter
            </text>
            <path d="M 0 12 L -45 275" stroke="#06b6d4" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          </g>

          {/* Label 3: Root Zone */}
          <g transform="translate(160, 275)">
            <rect x="0" y="0" width="105" height="20" rx="3" fill="rgba(10, 15, 12, 0.85)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
            <text x="52" y="14" fill="#d4d4d8" fontSize="9" fontWeight="600" textAnchor="middle" fontFamily="sans-serif">
              Rhizosphere Root Zone
            </text>
          </g>

          {/* Water Reservoir Level Label */}
          <g transform="translate(50, 315)">
            <text x="90" y="14" fill="#38bdf8" fontSize="10" fontWeight="600" textAnchor="end" fontFamily="sans-serif">
              Reservoir Tank: {tankLevel}%
            </text>
            <path d="M 94 10 L 148 315" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 2" fill="none" />
          </g>
        </svg>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px', borderTop: '1px solid hsl(var(--border))', paddingTop: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }}></div>
          <span style={{ fontSize: '11.5px', color: 'hsl(var(--muted-foreground))' }}>
            Dielectric Corrosion-Free Sensing
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#06b6d4' }}></div>
          <span style={{ fontSize: '11.5px', color: 'hsl(var(--muted-foreground))' }}>
            Zero-Evaporation Sub-Surface Line
          </span>
        </div>
      </div>
    </div>
  );
}
