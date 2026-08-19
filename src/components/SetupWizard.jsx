import React, { useState } from 'react';
import { Database, Key, HelpCircle, CheckCircle } from 'lucide-react';
import { setCustomSupabaseKeys } from '../db/supabase';

export default function SetupWizard() {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!url.trim().startsWith('https://')) {
      setError('A URL do Supabase deve começar com "https://".');
      return;
    }

    if (anonKey.trim().length < 20) {
      setError('A Anon Key fornecida parece inválida (muito curta).');
      return;
    }

    try {
      setSuccess(true);
      setTimeout(() => {
        setCustomSupabaseKeys(url.trim(), anonKey.trim());
      }, 1000);
    } catch (err) {
      setError('Erro ao salvar as configurações.');
    }
  };

  return (
    <div className="setup-wizard-wrapper">
      <div className="setup-wizard-card glass-panel">
        <div className="auth-logo" style={{ fontSize: '28px', marginBottom: '16px' }}>
          Ema Finance Tracker
        </div>
        <h2 className="wizard-title">Configurar Supabase</h2>
        <p className="wizard-subtitle">
          Insira as credenciais do seu projeto Supabase para ativar a autenticação e o banco de dados.
        </p>

        {error && (
          <div style={{
            color: 'white',
            backgroundColor: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid hsl(343, 89%, 60%)',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {success ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            color: 'hsl(150, 84%, 43%)',
            padding: '24px 0'
          }}>
            <CheckCircle size={48} />
            <p style={{ fontWeight: '600' }}>Configurações salvas!</p>
            <p style={{ fontSize: '12px', color: 'gray' }}>Recarregando aplicativo...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ textAlign: 'left' }}>
            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={16} /> URL do Supabase
              </label>
              <input
                type="url"
                required
                className="form-input"
                placeholder="https://xxxx.supabase.co"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Key size={16} /> Anon Key (Chave Pública API)
              </label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="eyJhbGciOi..."
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }}>
              Salvar e Iniciar
            </button>
          </form>
        )}

        <div className="wizard-help">
          <h4 style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            <HelpCircle size={16} /> Como obter essas chaves?
          </h4>
          <ol style={{ paddingLeft: '20px', fontSize: '13px' }}>
            <li>Faça login no console do <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" style={{ color: 'hsl(250, 89%, 65%)', fontWeight: '600' }}>Supabase</a>.</li>
            <li>Selecione ou crie um projeto.</li>
            <li>Vá em <strong>Project Settings</strong> (ícone de engrenagem) &gt; <strong>API</strong>.</li>
            <li>Copie a <strong>Project URL</strong> e a <strong>anon public key</strong>.</li>
          </ol>
          <p style={{ marginTop: '10px', fontSize: '12px', color: 'gray' }}>
            * As chaves ficam guardadas apenas no seu navegador (localStorage) e a conexão é direta com seu banco.
          </p>
        </div>
      </div>
    </div>
  );
}
