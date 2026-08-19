import React, { useState, useEffect } from 'react';
import { X, DollarSign, Calendar, Tag, CreditCard } from 'lucide-react';

const CATEGORIES = [
  { value: 'Alimentação', label: 'Alimentação / Restauração' },
  { value: 'Moradia', label: 'Moradia / Contas' },
  { value: 'Transporte', label: 'Transporte / Combustível' },
  { value: 'Saúde', label: 'Saúde / Bem-estar' },
  { value: 'Lazer', label: 'Lazer / Entretenimento' },
  { value: 'Outros', label: 'Outros gastos' }
];

export default function TransactionModal({ isOpen, onClose, onSave, currencySymbol = 'R' }) {
  const [type, setType] = useState('variable'); // fixed, variable, extra_income
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Alimentação');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(false);

  // Set default date to today in local timezone
  useEffect(() => {
    if (isOpen) {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      setAmount('');
      setDescription('');
      setCategory('Alimentação');
      setType('variable');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    if (!description.trim()) return;

    setLoading(true);
    
    // For extra income, category is always 'Renda'
    const finalCategory = type === 'extra_income' ? 'Renda' : category;

    try {
      await onSave({
        amount: parseFloat(amount),
        description: description.trim(),
        category: finalCategory,
        type: type === 'extra_income' ? 'extra_income' : type, // 'fixed', 'variable', or 'extra_income'
        date
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content glass-panel">
        <div className="modal-header">
          <h3>Nova Transação</h3>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Transaction Type Tabs */}
          <div className="auth-tabs" style={{ marginBottom: '20px' }}>
            <div 
              className={`auth-tab ${type === 'variable' ? 'active' : ''}`}
              onClick={() => setType('variable')}
            >
              Var. (Semanal)
            </div>
            <div 
              className={`auth-tab ${type === 'fixed' ? 'active' : ''}`}
              onClick={() => setType('fixed')}
            >
              Despesa Fixa
            </div>
            <div 
              className={`auth-tab ${type === 'extra_income' ? 'active' : ''}`}
              onClick={() => setType('extra_income')}
            >
              Renda Extra
            </div>
          </div>

          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <DollarSign size={16} /> Valor ({currencySymbol})
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              required
              className="form-input"
              placeholder="0,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
            />
          </div>

          {/* Description Input */}
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CreditCard size={16} /> Descrição
            </label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="ex: Compras do mês, Freelancer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Category Select - Show only for expenses */}
          {type !== 'extra_income' && (
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Tag size={16} /> Categoria
              </label>
              <select
                className="form-input form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value} style={{ backgroundColor: 'hsl(var(--bg-card))' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Date Input */}
          <div className="form-group" style={{ marginBottom: '28px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Calendar size={16} /> Data
            </label>
            <input
              type="date"
              required
              className="form-input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <button 
            type="submit" 
            className={`btn ${type === 'extra_income' ? 'btn-success' : 'btn-danger'}`}
            disabled={loading}
          >
            {loading ? 'Adicionando...' : 'Adicionar Transação'}
          </button>
        </form>
      </div>
    </div>
  );
}
