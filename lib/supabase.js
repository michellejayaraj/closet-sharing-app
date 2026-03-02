import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://wdbrmpsvgintnpvezkrv.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkYnJtcHN2Z2ludG5wdmV6a3J2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI0MjM1MjMsImV4cCI6MjA4Nzk5OTUyM30.2jJRltQivmQV5zpxS11YoMVlBR6LMi9m9pgUTVo8glk'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})