import React from 'react';
import { formatCurrency } from '../utils/financeHelpers';

export default function SavingsProgress({ currentSavings, goalAmount, currencySymbol = 'R' }) {
  const goal = parseFloat(goalAmount || 0);
  const current = parseFloat(currentSavings || 0);
  
  // Calculate percentage
  let pct = 0;
  if (goal > 0) {
    pct = (current / goal) * 100;
  }
  
  // Cap percentage for the visual bar but keep actual value for text
  const visualPct = Math.min(Math.max(pct, 0), 100);
  
  // SVG Arc Math
  const radius = 50;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (visualPct / 100) * circumference;

  return (
    <div className="savings-radial">
      <svg className="savings-radial-svg" viewBox="0 0 120 120">
        <defs>
          <linearGradient id="radial-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" />
            <stop offset="100%" stopColor="hsl(var(--success))" />
          </linearGradient>
        </defs>
        
        {/* Background Track */}
        <circle
          className="savings-radial-bg"
          cx="60"
          cy="60"
          r={radius}
        />
        
        {/* Progress Arc */}
        <circle
          className="savings-radial-progress"
          cx="60"
          cy="60"
          r={radius}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
        />
      </svg>
      
      {/* Center Text */}
      <div className="savings-radial-text">
        <span className="savings-radial-pct">
          {pct > 999 ? '>999%' : `${Math.round(pct)}%`}
        </span>
        <span className="savings-radial-lbl">da meta</span>
      </div>
    </div>
  );
}
