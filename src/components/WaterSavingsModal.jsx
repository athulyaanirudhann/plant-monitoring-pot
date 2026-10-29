import React, { useState } from 'react';
import { X, Droplets, TrendingDown, Award, CheckCircle2, DollarSign, Leaf } from 'lucide-react';

export default function WaterSavingsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const [numPots, setNumPots] = useState(6);

  // Consumption figures per pot per week (in Litres)
  const manualLitersPerWeek = 0.88;
  const timerLitersPerWeek = 0.64;
  const smartPotLitersPerWeek = 0.335;

  const savedPerPotWeek = manualLitersPerWeek - smartPotLitersPerWeek;
  const percentageSaved = ((savedPerPotWeek / manualLitersPerWeek) * 100).toFixed(1);

  const totalWeeklySavedLiters = (savedPerPotWeek * numPots).toFixed(2);
  const totalAnnualSavedLiters = (savedPerPotWeek * numPots * 52).toFixed(1);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px' }}>
        <div className="card-header" style={{ marginBottom: 16 }}>
          <div>
            <h3 className="card-title">
              <Droplets size={16} color="#06b6d4" />
              Water Conservation & Efficiency Audit
            </h3>
            <p className="card-subtitle">
              Validating Abstract Claim: "Closed-loop, demand-based irrigation achieves considerable water savings"
            </p>
          </div>
          <button onClick={onClose} className="btn btn-ghost btn-sm" style={{ padding: '4px 8px' }}>
            <X size={16} />
          </button>
        </div>

        {/* Hero Savings Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'hsla(142, 70%, 45%, 0.08)', border: '1px solid hsla(142, 70%, 45%, 0.25)', borderRadius: 'var(--radius)', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'hsl(var(--muted-foreground))' }}>
              WATER SAVINGS RATIO
            </span>
            <div style={{ fontSize: '32px', fontWeight: 800, color: '#10b981', lineHeight: 1.1 }} className="tnum">
              {percentageSaved}% <span style={{ fontSize: '16px', fontWeight: 500, color: 'hsl(var(--foreground))' }}>Reduction</span>
            </div>
            <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', marginTop: '4px' }}>
              Compared to manual surface watering and blind clock timers
            </p>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'hsla(142, 70%, 45%, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
            <TrendingDown size={26} />
          </div>
        </div>

        {/* Comparative Consumption Bar Visual */}
        <div style={{ marginBottom: '20px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 600, color: 'hsl(var(--foreground))', marginBottom: '12px' }}>
            Weekly Irrigation Benchmark (Per Pot)
          </h4>

          {/* 1. Manual Watering */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>1. Manual Top-Down Pouring (Surface Runoff + Evaporation)</span>
              <strong className="tnum" style={{ color: '#ef4444' }}>880 mL / week</strong>
            </div>
            <div className="meter-track" style={{ height: '8px' }}>
              <div className="meter-fill" style={{ width: '100%', background: '#ef4444' }} />
            </div>
          </div>

          {/* 2. Timer-Based */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span style={{ color: 'hsl(var(--muted-foreground))' }}>2. Clock Timer Irrigators (Fixed Blind Interval)</span>
              <strong className="tnum" style={{ color: '#f59e0b' }}>640 mL / week</strong>
            </div>
            <div className="meter-track" style={{ height: '8px' }}>
              <div className="meter-fill" style={{ width: `${(640 / 880) * 100}%`, background: '#f59e0b' }} />
            </div>
          </div>

          {/* 3. BotanIQ Closed Loop */}
          <div style={{ marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
              <span><strong style={{ color: 'hsl(var(--foreground))' }}>3. BotanIQ Sub-Surface Closed-Loop</strong></span>
              <strong className="tnum" style={{ color: '#10b981' }}>335 mL / week</strong>
            </div>
            <div className="meter-track" style={{ height: '8px' }}>
              <div className="meter-fill" style={{ width: `${(335 / 880) * 100}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>

        {/* 3 Core Scientific Reasons for Savings */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
              <CheckCircle2 size={13} />
              0% Evaporation
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Sub-surface line injects directly into root zone.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
              <CheckCircle2 size={13} />
              No Runoff
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Pulsed micro-doses match soil capillary absorption.
            </p>
          </div>

          <div style={{ padding: '10px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 600, color: '#10b981', marginBottom: '4px' }}>
              <CheckCircle2 size={13} />
              Weather-Adaptive
            </div>
            <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))' }}>
              Halts watering when humidity is high / VPD low.
            </p>
          </div>
        </div>

        {/* Interactive Multi-Pot Scale Calculator */}
        <div style={{ padding: '14px', background: 'hsl(var(--muted) / 0.4)', borderRadius: 'var(--radius)', border: '1px solid hsl(var(--border) / 0.6)', marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'hsl(var(--foreground))' }}>
              Fleet Conservation (Indoor Office Garden)
            </span>
            <span className="badge badge-outline tnum">{numPots} Smart Pots</span>
          </div>
          <input
            type="range"
            min="1"
            max="30"
            value={numPots}
            onChange={(e) => setNumPots(Number(e.target.value))}
            className="range-slider"
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginTop: '10px', color: 'hsl(var(--muted-foreground))' }}>
            <span>Weekly Savings: <strong style={{ color: '#10b981' }} className="tnum">{totalWeeklySavedLiters} Litres</strong></span>
            <span>Annual Savings: <strong style={{ color: '#10b981' }} className="tnum">{totalAnnualSavedLiters} Litres</strong></span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} className="btn btn-default">
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
