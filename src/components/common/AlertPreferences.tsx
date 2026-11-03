import { Volume2 } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { settingsStrings } from '@/constants/strings'
import { useUiStore } from '@/stores/uiStore'
import { enableAlertSound, playAlert } from '@/utils/alertPlayer'

const toggleStyles = 'flex cursor-pointer items-center gap-3 text-sm font-medium'

/** Sound preferences are per browser, so they are changed on the laptop that plays the alerts. */
export function AlertPreferences() {
  const { soundEnabled, speechEnabled, volume, setSoundEnabled, setSpeechEnabled, setVolume } = useUiStore()
  const s = settingsStrings.alerts

  const handleSoundChange = (checked: boolean) => setSoundEnabled(checked ? enableAlertSound() : false)
  const handleTest = () => {
    enableAlertSound()
    playAlert('EXPIRED', { speech: speechEnabled, volume })
  }

  return (
    <div className="flex flex-col gap-5">
      <label className={toggleStyles}>
        <input type="checkbox" className="h-4 w-4 accent-primary" checked={soundEnabled} onChange={(e) => handleSoundChange(e.target.checked)} />
        {s.sound}
      </label>
      <label className={toggleStyles}>
        <input type="checkbox" className="h-4 w-4 accent-primary" checked={speechEnabled} onChange={(e) => setSpeechEnabled(e.target.checked)} />
        {s.speech}
      </label>
      <label className="flex max-w-sm flex-col gap-2 text-sm font-medium">
        {s.volume}
        <input
          type="range" min={0.1} max={1} step={0.1} value={volume}
          onChange={(e) => setVolume(Number(e.target.value))}
          className="accent-primary"
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="outline" onClick={handleTest}>
          <Volume2 aria-hidden="true" size={16} />
          {s.test}
        </Button>
        <span className="text-xs text-muted">{s.unlockHint}</span>
      </div>
    </div>
  )
}
