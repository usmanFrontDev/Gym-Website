import { Rpc, Table } from '@/constants/tables'
import type { GymSettings } from '@/types/common/settings.types'
import type { ProfileValues } from '@/schemas/common/settings.schema'
import { AppError } from '../appError'
import { supabase, unwrap } from '../supabase-client'

export const settingsService = {
  async gym(): Promise<GymSettings> {
    return unwrap(
      await supabase.from(Table.GymSettings).select('gym_name, phone, address, default_admission_fee').eq('id', 1).single(),
    ) as GymSettings
  },

  async updateGym(values: GymSettings): Promise<void> {
    unwrap(
      await supabase
        .from(Table.GymSettings)
        .update({
          gym_name: values.gym_name, phone: values.phone || null, address: values.address || null,
          default_admission_fee: values.default_admission_fee, updated_at: new Date().toISOString(),
        })
        .eq('id', 1),
    )
  },

  async updateProfile(values: ProfileValues): Promise<void> {
    unwrap(
      await supabase.rpc(Rpc.UpdateMyProfile, {
        p_full_name: values.full_name, p_father_name: values.father_name, p_phone: values.phone, p_address: values.address,
      }),
    )
  },

  /** Re-checks the current password first, so a stolen open session cannot change it. */
  async changePassword(email: string, currentPassword: string, newPassword: string): Promise<void> {
    const check = await supabase.auth.signInWithPassword({ email, password: currentPassword })
    if (check.error) throw new AppError('Your current password is not correct')
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) throw new AppError(error.message, error.code)
  },

  /** Ends every other signed-in device; this browser stays signed in. */
  async signOutOtherDevices(): Promise<void> {
    const { error } = await supabase.auth.signOut({ scope: 'others' })
    if (error) throw new AppError(error.message, error.code)
  },
}
