import { strings } from '@/constants/strings'
import { Button } from './Button'
import { Modal } from './Modal'

interface ConfirmDialogProps {
  open: boolean
  title: string
  message: string
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}

/** Exactly two buttons: Cancel and Confirm. */
export function ConfirmDialog({ open, title, message, loading, onCancel, onConfirm }: ConfirmDialogProps) {
  return (
    <Modal open={open} onOpenChange={(next) => !next && onCancel()} title={title} description={message}>
      <div className="flex justify-end gap-3">
        <Button variant="secondary" onClick={onCancel}>
          {strings.common.cancel}
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          {strings.common.confirm}
        </Button>
      </div>
    </Modal>
  )
}
