import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vlxrkucyrsiciybhhfid.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseAnonKey) {
  console.warn('Supabase Anon Key is missing. Make sure your .env has VITE_SUPABASE_ANON_KEY defined.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey || '')
