import * as Dialog from '@radix-ui/react-dialog'
import type { ReactNode } from 'react'
import { strings } from '@/constants/strings'

interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
}

/** Radix dialog: traps focus and closes on Escape. */
export function Modal({ open, onOpenChange, title, description, children }: ModalProps) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-card border border-border bg-surface p-6">
          <Dialog.Title className="text-lg font-bold text-primary">{title}</Dialog.Title>
          <Dialog.Description className={description ? 'mt-1 text-sm text-muted' : 'sr-only'}>
            {description ?? title}
          </Dialog.Description>
          <div className="mt-4">{children}</div>
          <Dialog.Close className="absolute right-4 top-4 text-muted hover:text-foreground" aria-label={strings.common.close}>
            ✕
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
