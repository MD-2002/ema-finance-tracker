import React, { useState, useEffect } from 'react';
import { LayoutGrid, ReceiptText, Plus, Database, AlertTriangle } from 'lucide-react';
import { supabase, getSupabaseConfig } from './db/supabase';
import SetupWizard from './components/SetupWizard';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import TransactionModal from './components/TransactionModal';
import SettingsModal from './components/SettingsModal';

export default function App() {
  const [dbConfig, setDbConfig] = useState(getSupabaseConfig());
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [extraIncomes, setExtraIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Navigation & Modals
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard, transactions
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [dbError, setDbError] = useState(null); // To detect if tables are missing

  // 1. Listen for auth changes
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        setProfile(null);
        setExpenses([]);
        setExtraIncomes([]);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [dbConfig]);

  // 2. Fetch all user data
  const fetchUserData = async (userId) => {
    setLoading(true);
    setDbError(null);
    try {
      // A. Fetch profile
      let { data: profileData, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileErr) {
        // If profile doesn't exist yet, we retry inserting or show error
        if (profileErr.code === 'PGRST116') {
          // Profile not created by trigger yet, create manually
          const { data: newProfile, error: createErr } = await supabase
            .from('profiles')
            .insert([{ id: userId, monthly_income: 0, weekly_budget: 0, savings_goal_amount: 0, savings_goal_type: 'annual', currency: 'R' }])
            .select()
            .single();

          if (createErr) throw createErr;
          profileData = newProfile;
        } else {
          throw profileErr;
        }
      }
      setProfile(profileData);

      // B. Fetch expenses
      const { data: expensesData, error: expensesErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId);

      if (expensesErr) throw expensesErr;
      setExpenses(expensesData || []);

      // C. Fetch extra incomes
      const { data: incomesData, error: incomesErr } = await supabase
        .from('extra_incomes')
        .select('*')
        .eq('user_id', userId);

      if (incomesErr) throw incomesErr;
      setExtraIncomes(incomesData || []);

    } catch (err) {
      console.error('Erro ao buscar dados do banco:', err);
      // Check if tables don't exist
      if (err.message?.includes('relation') || err.code === '42P01') {
        setDbError('Tabelas ausentes no banco. Por favor, configure o banco executando o script SQL no seu console Supabase.');
      } else {
        setDbError(err.message || 'Erro de conexão.');
      }
    } finally {
      setLoading(false);
    }
  };

  // 3. Action: Update profile settings
  const handleSaveProfile = async (updatedFields) => {
    if (!session?.user) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updatedFields,
          updated_at: new Date().toISOString()
        })
        .eq('id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (err) {
      alert('Erro ao atualizar perfil: ' + err.message);
    }
  };

  // 4. Action: Save a transaction (Expense or Income)
  const handleSaveTransaction = async (tx) => {
    if (!session?.user) return;
    try {
      if (tx.type === 'extra_income') {
        const { error } = await supabase
          .from('extra_incomes')
          .insert([{
            user_id: session.user.id,
            amount: tx.amount,
            description: tx.description,
            date: tx.date
          }]);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert([{
            user_id: session.user.id,
            amount: tx.amount,
            description: tx.description,
            category: tx.category,
            type: tx.type, // fixed or variable
            date: tx.date
          }]);
        if (error) throw error;
      }

      // Refresh
      await fetchUserData(session.user.id);
    } catch (err) {
      alert('Erro ao cadastrar transação: ' + err.message);
    }
  };

  // 5. Action: Delete transaction
  const handleDeleteTransaction = async (id, dbTableType) => {
    if (!session?.user) return;
    try {
      const table = dbTableType === 'expense' ? 'expenses' : 'extra_incomes';
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Refresh
      await fetchUserData(session.user.id);
    } catch (err) {
      alert('Erro ao excluir transação: ' + err.message);
    }
  };

  // 6. Action: Sign Out
  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  // Render setup wizard if Supabase is not configured
  if (!dbConfig.isConfigured) {
    return <SetupWizard />;
  }

  // Render authentication screen if not logged in
  if (!session) {
    return <Auth />;
  }

  return (
    <div className="app-container">
      {/* Loading Overlay */}
      {loading ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100vh',
          gap: '12px'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid hsla(var(--primary), 0.2)',
            borderTopColor: 'hsl(var(--primary))',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }} />
          <p style={{ color: 'hsl(var(--text-muted))', fontSize: '14px' }}>Carregando dados...</p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : (
        <>
          {/* SQL Setup Required Error Banner */}
          {dbError && (
            <div style={{
              margin: '24px 24px 10px',
              padding: '16px',
              backgroundColor: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid hsl(var(--danger))',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'white', fontWeight: '600' }}>
                <AlertTriangle style={{ color: 'hsl(var(--danger))' }} />
                <span>Configuração de Tabelas Necessária</span>
              </div>
              <p style={{ fontSize: '13px', color: 'hsl(var(--text-secondary))', lineHeight: '1.5' }}>
                {dbError}
              </p>
              <button 
                className="btn btn-secondary"
                style={{ padding: '8px 12px', fontSize: '12px', width: 'auto', alignSelf: 'flex-start' }}
                onClick={() => fetchUserData(session.user.id)}
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Active View Selector */}
          {activeTab === 'dashboard' ? (
            <Dashboard 
              profile={profile}
              expenses={expenses}
              extraIncomes={extraIncomes}
              onOpenSettings={() => setIsSettingsOpen(true)}
              onSignOut={handleSignOut}
            />
          ) : (
            <div className="tab-content" style={{ marginTop: '24px' }}>
              <TransactionList 
                expenses={expenses}
                extraIncomes={extraIncomes}
                onDelete={handleDeleteTransaction}
                currencySymbol={profile?.currency}
              />
            </div>
          )}

          {/* Navigation Bar */}
          <div className="nav-bar">
            <button 
              className={`nav-item ${activeTab === 'dashboard' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
            >
              <LayoutGrid size={24} />
              <span className="nav-item-label">Painel</span>
            </button>

            {/* Middle FAB (Add Transaction) */}
            <button 
              className="fab-btn"
              onClick={() => setIsAddTxOpen(true)}
              title="Nova Transação"
            >
              <Plus size={28} />
            </button>

            <button 
              className={`nav-item ${activeTab === 'transactions' ? 'nav-item-active' : ''}`}
              onClick={() => setActiveTab('transactions')}
            >
              <ReceiptText size={24} />
              <span className="nav-item-label">Lançamentos</span>
            </button>
          </div>

          {/* Modals */}
          <TransactionModal 
            isOpen={isAddTxOpen}
            onClose={() => setIsAddTxOpen(false)}
            onSave={handleSaveTransaction}
            currencySymbol={profile?.currency}
          />

          <SettingsModal 
            isOpen={isSettingsOpen}
            onClose={() => setIsSettingsOpen(false)}
            profile={profile}
            onSave={handleSaveProfile}
          />
        </>
      )}
    </div>
  );
}
