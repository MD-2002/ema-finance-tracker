import { createClient } from '@supabase/supabase-js';

// Get keys from env variables first, then fallback to localStorage
const getKeys = () => {
  const envUrl = import.meta.env.VITE_SUPABASE_URL;
  const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const localUrl = localStorage.getItem('ema_supabase_url');
  const localKey = localStorage.getItem('ema_supabase_anon_key');

  return {
    url: envUrl && envUrl !== 'YOUR_SUPABASE_URL' ? envUrl : localUrl,
    key: envKey && envKey !== 'YOUR_SUPABASE_ANON_KEY' ? envKey : localKey,
    isCustom: !envUrl || envUrl === 'YOUR_SUPABASE_URL'
  };
};

export const getSupabaseConfig = () => {
  const { url, key, isCustom } = getKeys();
  return { url, key, isConfigured: !!(url && key), isCustom };
};

export const setCustomSupabaseKeys = (url, key) => {
  if (url && key) {
    localStorage.setItem('ema_supabase_url', url.trim());
    localStorage.setItem('ema_supabase_anon_key', key.trim());
  } else {
    localStorage.removeItem('ema_supabase_url');
    localStorage.removeItem('ema_supabase_anon_key');
  }
  window.location.reload();
};

export const clearCustomSupabaseKeys = () => {
  localStorage.removeItem('ema_supabase_url');
  localStorage.removeItem('ema_supabase_anon_key');
  window.location.reload();
};

const config = getSupabaseConfig();

export const supabase = config.isConfigured 
  ? createClient(config.url, config.key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
