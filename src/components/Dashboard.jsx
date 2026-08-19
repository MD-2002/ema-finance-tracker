import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertCircle, 
  Calendar, 
  CheckCircle2, 
  Mail, 
  Settings, 
  LogOut,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { getWeekRange, isDateInRange, getPastCompletedWeeks, formatCurrency } from '../utils/financeHelpers';
import SavingsProgress from './SavingsProgress';
import confetti from 'canvas-confetti';
import { supabase } from '../db/supabase';

export default function Dashboard({ profile, expenses, extraIncomes, onOpenSettings, onSignOut }) {
  const [currentWeekSpent, setCurrentWeekSpent] = useState(0);
  const [pastWeeksReports, setPastWeeksReports] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState({ income: 0, expenses: 0, balance: 0 });
  const [lifetimeSavings, setLifetimeSavings] = useState(0);
  const [hasCelebrated, setHasCelebrated] = useState(false);

  const currencySymbol = profile?.currency || 'R';
  const weeklyBudget = parseFloat(profile?.weekly_budget || 0);
  const savingsGoal = parseFloat(profile?.savings_goal_amount || 0);

  // Active dates for current week
  const { monday, sunday } = getWeekRange();

  useEffect(() => {
    if (!profile) return;

    // 1. Calculate current week's spent (variable expenses only)
    const weekSpent = expenses
      .filter(exp => exp.type === 'variable' && isDateInRange(exp.date, monday, sunday))
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    setCurrentWeekSpent(weekSpent);

    // 2. Calculate current month's stats (from 1st of current month to end of month)
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyExtraIncome = extraIncomes
      .filter(inc => isDateInRange(inc.date, firstDayOfMonth, lastDayOfMonth))
      .reduce((sum, inc) => sum + parseFloat(inc.amount), 0);

    const monthlyBaseIncome = parseFloat(profile.monthly_income || 0);
    const totalMonthlyIncome = monthlyBaseIncome + monthlyExtraIncome;

    const monthlyFixedExpenses = expenses
      .filter(exp => exp.type === 'fixed' && isDateInRange(exp.date, firstDayOfMonth, lastDayOfMonth))
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const monthlyVarExpenses = expenses
      .filter(exp => exp.type === 'variable' && isDateInRange(exp.date, firstDayOfMonth, lastDayOfMonth))
      .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    const totalMonthlyExpenses = monthlyFixedExpenses + monthlyVarExpenses;

    setMonthlyStats({
      income: totalMonthlyIncome,
      expenses: totalMonthlyExpenses,
      balance: totalMonthlyIncome - totalMonthlyExpenses
    });

    // 3. Calculate lifetime savings for the radial progress
    // Count active months (min 1) since profile created_at
    const createdDate = new Date(profile.created_at || today);
    const diffTime = Math.abs(today - createdDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const activeMonths = Math.max(1, Math.ceil(diffDays / 30.44));

    const totalLifetimeBaseIncome = monthlyBaseIncome * activeMonths;
    const totalLifetimeExtraIncome = extraIncomes.reduce((sum, inc) => sum + parseFloat(inc.amount), 0);
    const totalLifetimeIncome = totalLifetimeBaseIncome + totalLifetimeExtraIncome;
    const totalLifetimeExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    const totalSavings = totalLifetimeIncome - totalLifetimeExpenses;

    setLifetimeSavings(totalSavings);

    // Trigger confetti celebration when saving goal is met
    if (savingsGoal > 0 && totalSavings >= savingsGoal && !hasCelebrated) {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 }
      });
      setHasCelebrated(true);
    }

    // 4. Calculate Past Weeks Reports (Inbox messages)
    const completedWeeks = getPastCompletedWeeks(profile.created_at);
    const reports = completedWeeks.map(week => {
      // Sum variables in that week
      const spent = expenses
        .filter(exp => exp.type === 'variable' && isDateInRange(exp.date, week.start, week.end))
        .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
      
      const budget = weeklyBudget;
      const saved = budget - spent;

      return {
        key: week.key,
        label: week.label,
        spent,
        budget,
        saved,
        type: saved > 0 ? 'saved' : saved < 0 ? 'overspent' : 'exact'
      };
    });
    setPastWeeksReports(reports);

  }, [profile, expenses, extraIncomes]);

  // Formatter for current week dates
  const formatWeekPeriod = () => {
    const startDay = String(monday.getDate()).padStart(2, '0');
    const startMonth = String(monday.getMonth() + 1).padStart(2, '0');
    const endDay = String(sunday.getDate()).padStart(2, '0');
    const endMonth = String(sunday.getMonth() + 1).padStart(2, '0');
    return `${startDay}/${startMonth} a ${endDay}/${endMonth}`;
  };

  // Weekly Budget status messaging
  const getWeeklyStatus = () => {
    if (weeklyBudget <= 0) {
      return {
        text: 'Configure seu orçamento semanal nas Configurações!',
        color: 'hsl(var(--text-muted))',
        pct: 0,
        variant: 'normal'
      };
    }

    const pct = (currentWeekSpent / weeklyBudget) * 100;
    const remaining = weeklyBudget - currentWeekSpent;

    if (remaining > 0) {
      return {
        text: `Restam ${formatCurrency(remaining, currencySymbol)} do seu limite semanal!`,
        color: 'hsl(var(--success))',
        pct: Math.min(pct, 100),
        variant: 'normal'
      };
    } else if (remaining === 0) {
      return {
        text: 'Você esgotou exatamente seu orçamento semanal!',
        color: 'hsl(var(--warning))',
        pct: 100,
        variant: 'warning'
      };
    } else {
      return {
        text: `Orçamento estourado em ${formatCurrency(Math.abs(remaining), currencySymbol)}!`,
        color: 'hsl(var(--danger))',
        pct: 100,
        variant: 'danger'
      };
    }
  };

  const status = getWeeklyStatus();
  const emailUsername = profile?.id ? (supabase.auth.currentUser?.email?.split('@')[0] || 'Usuário') : 'Usuário';

  return (
    <div>
      {/* Header */}
      <div className="dashboard-header">
        <div className="user-info">
          <div className="user-avatar">
            {emailUsername.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="welcome-msg">Olá,</div>
            <div className="username" style={{ textTransform: 'capitalize' }}>{emailUsername}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onOpenSettings} 
            title="Configurações"
          >
            <Settings size={18} />
          </button>
          <button 
            className="btn btn-secondary btn-icon" 
            onClick={onSignOut} 
            title="Sair"
            style={{ color: 'hsl(var(--danger))', borderColor: 'hsla(var(--danger), 0.2)' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Main Monthly Balance Panel */}
      <div style={{ padding: '0 24px 20px' }}>
        <div className="glass-panel" style={{
          background: 'linear-gradient(135deg, rgba(22, 31, 51, 0.7) 0%, rgba(15, 23, 42, 0.7) 100%)',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{
            position: 'absolute',
            top: '-20%',
            right: '-10%',
            width: '150px',
            height: '150px',
            background: 'radial-gradient(circle, hsla(var(--primary), 0.15) 0%, transparent 70%)',
            pointerEvents: 'none'
          }} />
          <div className="form-label" style={{ fontSize: '12px' }}>Saldo Líquido (Mês Atual)</div>
          <h2 style={{ 
            fontFamily: 'var(--font-family-title)', 
            fontSize: '36px', 
            fontWeight: '800',
            margin: '8px 0',
            color: monthlyStats.balance >= 0 ? 'hsl(var(--success))' : 'hsl(var(--danger))'
          }}>
            {formatCurrency(monthlyStats.balance, currencySymbol)}
          </h2>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '13px', color: 'hsl(var(--text-muted))', marginTop: '12px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingUp size={14} style={{ color: 'hsl(var(--success))' }} /> 
              Renda: {formatCurrency(monthlyStats.income, currencySymbol)}
            </span>
            <span>|</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <TrendingDown size={14} style={{ color: 'hsl(var(--danger))' }} /> 
              Despesas: {formatCurrency(monthlyStats.expenses, currencySymbol)}
            </span>
          </div>
        </div>
      </div>

      {/* Weekly Budget Section */}
      <div className="weekly-budget-card glass-panel">
        <div className="weekly-header">
          <div>
            <h4 style={{ fontSize: '16px' }}>Orçamento da Semana</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'hsl(var(--text-muted))', marginTop: '2px' }}>
              <Calendar size={12} /> {formatWeekPeriod()}
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '18px', fontWeight: '800', fontFamily: 'var(--font-family-title)' }}>
              {formatCurrency(currentWeekSpent, currencySymbol)}
            </div>
            <div style={{ fontSize: '11px', color: 'hsl(var(--text-muted))' }}>
              de {formatCurrency(weeklyBudget, currencySymbol)}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="weekly-progress-container">
          <div 
            className={`weekly-progress-bar ${status.variant === 'normal' ? 'weekly-progress-normal' : 'weekly-progress-warning'}`}
            style={{ width: `${status.pct}%` }}
          />
        </div>

        <div className="weekly-status-msg" style={{ color: status.color }}>
          {status.variant === 'danger' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
          <span>{status.text}</span>
        </div>
      </div>

      {/* Dynamic Savings Messages Box (Inbox) */}
      {weeklyBudget > 0 && (
        <div className="inbox-card glass-panel">
          <h4 className="inbox-title">
            <Mail size={16} style={{ color: 'hsl(var(--primary))' }} /> Mensagens de Economia
          </h4>
          {pastWeeksReports.length === 0 ? (
            <div className="inbox-empty">
              Você ainda não tem relatórios de semanas passadas. Continue acompanhando seus gastos!
            </div>
          ) : (
            <div className="inbox-list">
              {pastWeeksReports.map((report) => (
                <div key={report.key} className={`msg-item ${report.type}`}>
                  <div className="msg-content">
                    <span className="msg-date">Semana de {report.label}</span>
                    <span style={{ fontWeight: '500', lineHeight: '1.4' }}>
                      {report.type === 'saved' && (
                        <>🎉 <strong>Parabéns!</strong> Você poupou <strong>{formatCurrency(report.saved, currencySymbol)}</strong> do seu budget semanal. (Gastou {formatCurrency(report.spent, currencySymbol)} de {formatCurrency(report.budget, currencySymbol)})</>
                      )}
                      {report.type === 'exact' && (
                        <>👍 Você gastou exatamente o seu budget semanal de <strong>{formatCurrency(report.budget, currencySymbol)}</strong>.</>
                      )}
                      {report.type === 'overspent' && (
                        <>⚠️ Você ultrapassou seu budget de {formatCurrency(report.budget, currencySymbol)} em <strong>{formatCurrency(Math.abs(report.saved), currencySymbol)}</strong>.</>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Savings Goal Progress */}
      {savingsGoal > 0 && (
        <div style={{ padding: '0 24px 20px' }}>
          <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div style={{ flex: '1' }}>
              <h4 style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={16} style={{ color: 'hsl(var(--success))' }} /> Meta de Poupança
              </h4>
              <p style={{ fontSize: '11px', color: 'hsl(var(--text-muted))', textTransform: 'uppercase', marginTop: '2px', fontWeight: '600' }}>
                Meta {profile?.savings_goal_type === 'semi-annual' ? 'Semestral' : 'Anual'}
              </p>
              
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '20px', fontWeight: '800', fontFamily: 'var(--font-family-title)' }}>
                  {formatCurrency(lifetimeSavings, currencySymbol)}
                </div>
                <div style={{ fontSize: '12px', color: 'hsl(var(--text-muted))' }}>
                  poupados de {formatCurrency(savingsGoal, currencySymbol)}
                </div>
              </div>
            </div>
            
            <SavingsProgress 
              currentSavings={lifetimeSavings}
              goalAmount={savingsGoal}
              currencySymbol={currencySymbol}
            />
          </div>
        </div>
      )}
    </div>
  );
}
