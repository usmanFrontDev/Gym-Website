import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { useDeleteStaff, useResetPassword, useSetBlocked } from '@/hooks/superAdmin/useAdmin'

interface StaffActionsProps {
  id: string
  name: string
  blocked: boolean
  onPassword: (password: string) => void
}

type Pending = 'block' | 'delete' | 'reset' | null

/** Block / unblock / reset password / soft delete. Every one asks for confirmation first. */
export function StaffActions({ id, name, blocked, onPassword }: StaffActionsProps) {
  const [pending, setPending] = useState<Pending>(null)
  const setBlocked = useSetBlocked()
  const deleteStaff = useDeleteStaff()
  const reset = useResetPassword()

  const handleBlockClick = () => setPending('block')
  const handleDeleteClick = () => setPending('delete')
  const handleResetClick = () => setPending('reset')
  const handleCancel = () => setPending(null)

  const handleConfirm = () => {
    if (pending === 'block') setBlocked.mutate({ id, blocked: !blocked }, { onSuccess: handleCancel })
    if (pending === 'delete') deleteStaff.mutate(id, { onSuccess: handleCancel })
    if (pending === 'reset') {
      reset.mutate(id, {
        onSuccess: (result) => {
          handleCancel()
          onPassword(result.password)
        },
      })
    }
  }

  const messages = {
    block: `${blocked ? 'Unblock' : 'Block'} ${name}? ${blocked ? 'They can sign in again.' : 'Their login stops, data is kept.'}`,
    delete: `Delete ${name}? Login is revoked and history is kept.`,
    reset: `Generate a new password for ${name}? The old one stops working.`,
  }

  return (
    <div className="flex gap-1">
      <Button variant="ghost" size="sm" onClick={handleBlockClick}>{blocked ? 'Unblock' : 'Block'}</Button>
      <Button variant="ghost" size="sm" onClick={handleResetClick}>Reset password</Button>
      <Button variant="ghost" size="sm" onClick={handleDeleteClick}>Delete</Button>
      <ConfirmDialog
        open={pending !== null}
        title="Please confirm"
        message={pending ? messages[pending] : ''}
        loading={setBlocked.isPending || deleteStaff.isPending || reset.isPending}
        onCancel={handleCancel}
        onConfirm={handleConfirm}
      />
    </div>
  )
}
