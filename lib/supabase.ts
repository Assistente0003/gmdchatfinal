
import { createClient } from '@supabase/supabase-js';

// Tenta obter do ambiente (Vite/React), senão usa fallback
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://vvoysnafyedjrexonknx.supabase.co';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ2b3lzbmFmeWVkanJleG9ua254Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzOTM4NjYsImV4cCI6MjA3OTk2OTg2Nn0.d1RtP04YkNjLOCoQFh1rlEG2Q_KHEGe3tdbBQsvlKhE';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'gmd-auth-token', // Chave específica para evitar conflitos
  },
  realtime: {
    params: {
      eventsPerSecond: 20, // Aumentado para lidar melhor com bursts de mensagens
    },
    // Heartbeat otimizado para evitar desconexões falsas em redes móveis (4G/5G)
    heartbeatIntervalMs: 25000, 
    timeout: 60000,
  },
  // Otimização de queries globais
  db: {
    schema: 'public',
  },
});
