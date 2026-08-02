import { supabase } from './supabase'

export async function getSessionUser() {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) throw error
  return session?.user ?? null
}
