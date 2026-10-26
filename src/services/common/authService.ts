import { Table } from '@/constants/tables'
import type { Profile } from '@/types/common/user.types'
import { AppError } from '../appError'
import { supabase, unwrap } from '../supabase-client'

async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase.from(Table.Profiles).select('*').eq('id', userId).maybeSingle()
  if (error) throw new AppError(error.message, error.code)
  const profile = data as Profile | null
  if (profile && (profile.blocked || profile.deleted_at)) return null
  return profile
}

export const authService = {
  async signIn(email: string, password: string): Promise<Profile> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw new AppError('Invalid email or password', error.code)
    const profile = await fetchProfile(data.user.id)
    if (!profile) {
      await supabase.auth.signOut()
      throw new AppError('This account has no staff profile, or it is blocked or removed. Ask the owner.')
    }
    return profile
  },

  async signOut(): Promise<void> {
    unwrap({ data: true, error: (await supabase.auth.signOut()).error })
  },

  async currentProfile(): Promise<Profile | null> {
    const { data } = await supabase.auth.getSession()
    return data.session ? fetchProfile(data.session.user.id) : null
  },

  /** Subscribes to auth changes. Returns an unsubscribe function. */
  onAuthChange(callback: (profile: Profile | null) => void): () => void {
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) return callback(null)
      // defer: supabase-js forbids awaiting other supabase calls inside this callback
      setTimeout(() => {
        fetchProfile(session.user.id).then(callback, () => callback(null))
      }, 0)
    })
    return () => data.subscription.unsubscribe()
  },
}
