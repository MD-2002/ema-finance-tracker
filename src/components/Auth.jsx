import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../db/supabase';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    if (password.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password
        });
        if (error) throw error;

        // If automatic login is disabled, or email confirmation is required:
        if (data.session) {
          setMessage('Cadastro realizado e login efetuado com sucesso!');
        } else {
          setMessage('Cadastro realizado! Por favor, verifique sua caixa de entrada para confirmar o e-mail.');
        }
      }
    } catch (err) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrapper">
      <div className="app-container glass-panel" style={{ minHeight: 'auto', padding: '32px 24px', width: '100%', maxWidth: '400px' }}>
        <div className="auth-header">
          <div className="auth-logo">Ema Finance</div>
          <p style={{ color: 'hsl(var(--text-secondary))', fontSize: '14px' }}>
            {isLogin ? 'Faça login para gerenciar seu dinheiro' : 'Crie sua conta para começar a economizar'}
          </p>
        </div>

        <div className="auth-tabs">
          <div 
            className={`auth-tab ${isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(true); setError(''); setMessage(''); }}
          >
            Entrar
          </div>
          <div 
            className={`auth-tab ${!isLogin ? 'active' : ''}`} 
            onClick={() => { setIsLogin(false); setError(''); setMessage(''); }}
          >
            Cadastrar
          </div>
        </div>

        {error && (
          <div style={{
            color: 'white',
            backgroundColor: 'rgba(244, 63, 94, 0.2)',
            border: '1px solid hsl(var(--danger))',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            {error}
          </div>
        )}

        {message && (
          <div style={{
            color: 'white',
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            border: '1px solid hsl(var(--success))',
            padding: '12px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            textAlign: 'left'
          }}>
            {message}
          </div>
        )}

        <form onSubmit={handleAuth} style={{ textAlign: 'left' }}>
          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={16} /> E-mail
            </label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="seuemail@exemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={16} /> Senha
            </label>
            <input
              type="password"
              required
              className="form-input"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary" style={{ marginTop: '12px' }} disabled={loading}>
            {loading ? 'Aguarde...' : (
              <>
                {isLogin ? <LogIn size={20} /> : <UserPlus size={20} />}
                {isLogin ? 'Entrar na Conta' : 'Criar minha Conta'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
