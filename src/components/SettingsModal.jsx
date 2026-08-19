import React, { useState, useEffect } from 'react';
import { X, DollarSign, Target, Calendar, Settings, Sliders, RefreshCw } from 'lucide-react';
import { clearCustomSupabaseKeys, getSupabaseConfig } from '../db/supabase';

const CURRENCIES = [
  { value: 'R', label: 'Rand (R)' },
  { value: 'R$', label: 'Real (R$)' },
  { value: '$', label: 'Dólar ($)' },
  { value: '€', label: 'Euro (€)' },
  { value: '£', label: 'Libra (£)' }
];

export default function SettingsModal({ isOpen, onClose, profile, onSave }) {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [weeklyBudget, setWeeklyBudget] = useState('');
  const [savingsGoalAmount, setSavingsGoalAmount] = useState('');
  const [savingsGoalType, setSavingsGoalType] = useState('annual'); // annual or semi-annual
  const [currency, setCurrency] = useState('R');
  const [loading, setLoading] = useState(false);
  const [dbConfig, setDbConfig] = useState({ isCustom: false });

  useEffect(() => {
    if (isOpen && profile) {
      setMonthlyIncome(profile.monthly_income || 0);
      setWeeklyBudget(profile.weekly_budget || 0);
      setSavingsGoalAmount(profile.savings_goal_amount || 0);
      setSavingsGoalType(profile.savings_goal_type || 'annual');
      setCurrency(profile.currency || 'R');
      setDbConfig(getSupabaseConfig());
    }
  }, [isOpen, profile]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await onSave({
        monthly_income: parseFloat(monthlyIncome) || 0,
        weekly_budget: parseFloat(weeklyBudget) || 0,
        savings_goal_amount: parseFloat(savingsGoalAmount) || 0,
        savings_goal_type: savingsGoalType,
        currency: currency
      });
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar configurações:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Settings size={20} style={{ color: 'hsl(var(--primary))' }} /> Configurações de Perfil
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Base Income */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} /> Renda Mensal Base
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="form-input"
              value={monthlyIncome}
              onChange={(e) => setMonthlyIncome(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Weekly Budget */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sliders size={16} /> Orçamento Semanal (Limite de Gastos)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="form-input"
              value={weeklyBudget}
              onChange={(e) => setWeeklyBudget(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Savings Goal Amount */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} /> Meta de Economia (Savings Goal)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              className="form-input"
              value={savingsGoalAmount}
              onChange={(e) => setSavingsGoalAmount(e.target.value)}
              placeholder="0,00"
            />
          </div>

          {/* Goal Period Type */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> Período da Meta
            </label>
            <div className="switch-container">
              <div 
                className={`switch-option ${savingsGoalType === 'semi-annual' ? 'active' : ''}`}
                onClick={() => setSavingsGoalType('semi-annual')}
              >
                Semestral
              </div>
              <div 
                className={`switch-option ${savingsGoalType === 'annual' ? 'active' : ''}`}
                onClick={() => setSavingsGoalType('annual')}
              >
                Anual
              </div>
            </div>
          </div>

          {/* Currency Selector */}
          <div className="form-group" style={{ marginBottom: '24px' }}>
            <label className="form-label">Moeda Principal</label>
            <select
              className="form-input form-select"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
            >
              {CURRENCIES.map((cur) => (
                <option key={cur.value} value={cur.value} style={{ backgroundColor: 'hsl(var(--bg-card))' }}>
                  {cur.label}
                </option>
              ))}
            </select>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
            style={{ marginBottom: '20px' }}
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        {/* Database Config Section */}
        {dbConfig.isCustom && (
          <div style={{
            borderTop: '1px solid hsla(var(--border), 0.6)',
            paddingTop: '20px',
            textAlign: 'left'
          }}>
            <h4 style={{ fontSize: '14px', marginBottom: '8px', color: 'hsl(var(--text-secondary))' }}>
              Conexão Supabase Personalizada
            </h4>
            <p style={{ fontSize: '12px', color: 'hsl(var(--text-muted))', marginBottom: '12px' }}>
              Você está conectado ao seu próprio projeto do Supabase. Para desconectar e voltar ao projeto padrão:
            </p>
            <button 
              onClick={() => {
                if (confirm('Tem certeza de que deseja redefinir a conexão com o banco de dados?')) {
                  clearCustomSupabaseKeys();
                }
              }}
              className="btn btn-secondary"
              style={{ display: 'flex', gap: '8px', padding: '8px 12px', fontSize: '13px' }}
            >
              <RefreshCw size={14} /> Redefinir Conexão DB
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
