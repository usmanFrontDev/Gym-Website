import { AlertPreferences } from '@/components/common/AlertPreferences'
import { PasswordSettingsForm } from '@/components/common/PasswordSettingsForm'
import { ProfileSettingsForm } from '@/components/common/ProfileSettingsForm'
import { SettingsSection } from '@/components/common/SettingsSection'
import { GymSettingsForm } from '@/components/superAdmin/GymSettingsForm'
import { PageContainer } from '@/components/ui/PageContainer'
import { Role } from '@/constants/roles'
import { settingsStrings } from '@/constants/strings'
import { useAuthStore } from '@/stores/authStore'

/** One settings page for every portal. The gym section is for the owner only (and enforced by RLS). */
export default function SettingsPage() {
  const role = useAuthStore((s) => s.user?.role)
  const s = settingsStrings
  return (
    <PageContainer title={s.title} description={s.subtitle}>
      <SettingsSection id="account" title={s.account.title} description={s.account.subtitle}>
        <ProfileSettingsForm />
      </SettingsSection>
      <SettingsSection id="security" title={s.security.title} description={s.security.subtitle}>
        <PasswordSettingsForm />
      </SettingsSection>
      <SettingsSection id="alerts" title={s.alerts.title} description={s.alerts.subtitle}>
        <AlertPreferences />
      </SettingsSection>
      {role === Role.SUPER_ADMIN && (
        <SettingsSection id="gym" title={s.gym.title} description={s.gym.subtitle}>
          <GymSettingsForm />
        </SettingsSection>
      )}
    </PageContainer>
  )
}
