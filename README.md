# Ema Finance Tracker 💰

O Ema Finance Tracker é um aplicativo web mobile-first moderno (responsivo para iOS e Android) projetado para ajudar na gestão do seu dinheiro. Ele permite controlar a sua renda mensal (base e extras), monitorar despesas fixas e variáveis, definir metas de economia (savings goals) semestrais ou manuais e gerenciar um orçamento semanal com relatórios dinâmicos de poupança.

## ✨ Recursos

- 🔐 **Autenticação Segura**: Login e Cadastro com e-mail/senha integrado ao Supabase Auth.
- 💸 **Gestão de Renda**: Adicione e atualize sua Renda Mensal Base e registre Rendas Extras com descrição e data.
- 📉 **Despesas Fixas e Variáveis**: Classifique e gerencie seus gastos de forma simples.
- 📅 **Orçamento Semanal Inteligente**:
  - Defina um limite semanal de gastos.
  - Acompanhe o consumo em tempo real com uma barra de progresso.
  - Receba avisos de limite restante ou estouro de orçamento.
- 📩 **Mensagens de Economia**: Uma caixa de mensagens integrada que calcula dinamicamente o quanto você economizou (ou estourou) em cada semana fechada no passado.
- 🎯 **Meta de Poupança (Savings Goal)**:
  - Defina uma meta Semestral ou Anual.
  - Gráfico circular SVG dinâmico que exibe a porcentagem do progresso em tempo real (baseado em Renda Acumulada - Despesas Acumuladas).
- 🎨 **Estética Premium**: Interface com design escuro (dark mode), elementos translúcidos (glassmorphism), animações suaves e comemorações com confetes.
- 🌐 **Hospedagem Estática Fácil**: Possui um assistente de configuração em tela que permite conectar a qualquer instância do Supabase via navegador, ideal para hospedagem gratuita no GitHub Pages.

---

## 🛠️ Configuração do Banco de Dados (Supabase)

Para colocar o aplicativo em execução, você precisará configurar as tabelas no seu projeto Supabase. 

1. Acesse o [Console do Supabase](https://supabase.com/).
2. Abra o seu projeto.
3. No menu lateral, selecione **SQL Editor** e clique em **New query**.
4. Copie o script SQL abaixo, cole no editor e clique em **Run**:

```sql
-- 1. Tabela de Perfis (Renda base, metas e orçamento semanal)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  monthly_income NUMERIC(12, 2) DEFAULT 0.00,
  weekly_budget NUMERIC(12, 2) DEFAULT 0.00,
  savings_goal_amount NUMERIC(12, 2) DEFAULT 0.00,
  savings_goal_type VARCHAR(20) DEFAULT 'annual' CHECK (savings_goal_type IN ('semi-annual', 'annual')),
  currency VARCHAR(10) DEFAULT 'R',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and update own profile" 
  ON profiles FOR ALL USING (auth.uid() = id);

-- 2. Tabela de Despesas (Fixas e Variáveis)
CREATE TABLE expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('fixed', 'variable')),
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em expenses
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own expenses" 
  ON expenses FOR ALL USING (auth.uid() = user_id);

-- 3. Tabela de Rendas Extra
CREATE TABLE extra_incomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE DEFAULT auth.uid(),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS em extra_incomes
ALTER TABLE extra_incomes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own extra incomes" 
  ON extra_incomes FOR ALL USING (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente no SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, monthly_income, weekly_budget, savings_goal_amount, savings_goal_type, currency)
  VALUES (new.id, 0.00, 0.00, 0.00, 'annual', 'R');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🚀 Como Executar o Projeto Localmente

### Pré-requisitos
Certifique-se de ter o [Node.js](https://nodejs.org/) instalado no seu computador.

### Passo a Passo

1. **Instalar Dependências**:
   No terminal do projeto, execute:
   ```bash
   npm install
   ```

2. **Configurar Variáveis de Ambiente (Opcional)**:
   Você pode criar um arquivo `.env` na raiz do projeto com as chaves do seu Supabase para que a conexão seja automática:
   ```env
   VITE_SUPABASE_URL=SUA_URL_DO_SUPABASE
   VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON_DO_SUPABASE
   ```
   *Se você pular este passo, o aplicativo mostrará uma tela de configuração simples na primeira execução solicitando estas chaves e as salvará com segurança no navegador.*

3. **Iniciar Servidor de Desenvolvimento**:
   Para abrir o aplicativo no seu navegador, execute:
   ```bash
   npm run dev
   ```

4. **Compilar para Produção (Build)**:
   Para gerar os arquivos otimizados e prontos para hospedagem no GitHub Pages ou outro servidor estático, execute:
   ```bash
   npm run build
   ```
   Os arquivos compilados estarão na pasta `dist/`.
