import React, { useState } from 'react';
import { Trash2, TrendingUp, TrendingDown, Calendar, Filter } from 'lucide-react';
import { formatDate, formatCurrency } from '../utils/financeHelpers';

export default function TransactionList({ expenses, extraIncomes, onDelete, currencySymbol = 'R' }) {
  const [filter, setFilter] = useState('all'); // all, variable, fixed, extra_income

  // Combine and sort transactions by date descending, then created_at descending
  const allTransactions = [
    ...expenses.map(e => ({ ...e, isExpense: true })),
    ...extraIncomes.map(i => ({ ...i, isExpense: false, type: 'extra_income' }))
  ].sort((a, b) => {
    const dateDiff = new Date(b.date) - new Date(a.date);
    if (dateDiff !== 0) return dateDiff;
    return new Date(b.created_at || 0) - new Date(a.created_at || 0);
  });

  // Apply filter
  const filteredTransactions = allTransactions.filter(item => {
    if (filter === 'all') return true;
    return item.type === filter;
  });

  const getCategoryClass = (category) => {
    if (!category) return 'cat-outros';
    const cat = category.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (cat.includes('alimentacao')) return 'cat-alimentacao';
    if (cat.includes('moradia')) return 'cat-moradia';
    if (cat.includes('transporte')) return 'cat-transporte';
    if (cat.includes('saude')) return 'cat-saude';
    if (cat.includes('lazer')) return 'cat-lazer';
    if (cat.includes('renda')) return 'cat-renda';
    return 'cat-outros';
  };

  const getFilterLabel = (type) => {
    switch (type) {
      case 'fixed': return 'Fixa';
      case 'variable': return 'Variável';
      case 'extra_income': return 'Renda Extra';
      default: return '';
    }
  };

  return (
    <div style={{ paddingBottom: '20px' }}>
      <div className="tab-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '18px' }}>
          <Filter size={18} style={{ color: 'hsl(var(--primary))' }} /> Transações Recentes
        </h3>
      </div>

      {/* Filter Pills */}
      <div className="filter-bar">
        <button 
          className={`filter-pill ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tudo
        </button>
        <button 
          className={`filter-pill ${filter === 'variable' ? 'active' : ''}`}
          onClick={() => setFilter('variable')}
        >
          Variáveis (Semanal)
        </button>
        <button 
          className={`filter-pill ${filter === 'fixed' ? 'active' : ''}`}
          onClick={() => setFilter('fixed')}
        >
          Fixas
        </button>
        <button 
          className={`filter-pill ${filter === 'extra_income' ? 'active' : ''}`}
          onClick={() => setFilter('extra_income')}
        >
          Renda Extra
        </button>
      </div>

      {/* Transaction List */}
      {filteredTransactions.length === 0 ? (
        <div className="glass-panel" style={{ textAlign: 'center', padding: '30px', color: 'hsl(var(--text-muted))' }}>
          Nenhuma transação encontrada para este filtro.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {filteredTransactions.map((item) => (
            <div key={item.id} className="trans-item">
              <div className="trans-left">
                <div className={`cat-dot ${getCategoryClass(item.category)}`} />
                <div className="trans-meta">
                  <span className="trans-title">{item.description}</span>
                  <div className="trans-details">
                    <span>{getFilterLabel(item.type) || item.category}</span>
                    <span>•</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={11} /> {formatDate(item.date)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="trans-right">
                <span className={`trans-amount ${item.isExpense ? 'expense' : 'income'}`}>
                  {item.isExpense ? '-' : '+'} {formatCurrency(item.amount, currencySymbol)}
                </span>
                
                <button 
                  className="trans-delete-btn"
                  onClick={() => {
                    if (confirm(`Excluir a transação "${item.description}"?`)) {
                      onDelete(item.id, item.isExpense ? 'expense' : 'extra_income');
                    }
                  }}
                  title="Excluir Transação"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
