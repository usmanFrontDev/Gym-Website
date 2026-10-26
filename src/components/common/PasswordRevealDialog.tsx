import { useState } from 'react'
import toast from 'react-hot-toast'
import { strings } from '@/constants/strings'
import { Button } from './Button'
import { Modal } from './Modal'

interface PasswordRevealDialogProps {
  password: string | null
  onClose: () => void
}

/** The only place a password is ever shown. Closing it discards the value. */
export function PasswordRevealDialog({ password, onClose }: PasswordRevealDialogProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    if (!password) return
    await navigator.clipboard.writeText(password)
    setCopied(true)
    toast.success(strings.common.copied)
  }
  const handleClose = () => {
    setCopied(false)
    onClose()
  }

  return (
    <Modal
      open={password !== null}
      onOpenChange={(next) => !next && handleClose()}
      title="Save this password now"
      description="It will not be shown again. You can only reset it later."
    >
      <div className="flex flex-col gap-4">
        <code className="select-all rounded-lg bg-background p-4 text-center text-xl font-bold tracking-wider text-primary">{password}</code>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={handleCopy}>
            {copied ? strings.common.copied : strings.common.copy}
          </Button>
          <Button onClick={handleClose}>{strings.common.close}</Button>
        </div>
      </div>
    </Modal>
  )
}
