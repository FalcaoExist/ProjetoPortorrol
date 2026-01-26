import { createClient } from '@supabase/supabase-js';

// Se você usa VITE (padrão hoje em dia):
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Se você usa Create React App (mais antigo), troque por process.env.REACT_APP_...

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Faltam variáveis de ambiente do Supabase no Frontend (.env)");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);