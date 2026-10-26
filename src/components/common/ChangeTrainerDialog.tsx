import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Modal } from '@/components/common/Modal'
import { useAssignTrainer } from '@/hooks/common/useMembers'
import { useTrainerOptions } from '@/hooks/common/useStaff'

interface ChangeTrainerDialogProps {
  open: boolean
  memberId: string
  onClose: () => void
}

export function ChangeTrainerDialog({ open, memberId, onClose }: ChangeTrainerDialogProps) {
  const trainers = useTrainerOptions()
  const assign = useAssignTrainer()
  const [trainerId, setTrainerId] = useState('')
  const [commission, setCommission] = useState('')

  const handleSave = () => {
    assign.mutate(
      { memberId, trainerId: trainerId || null, commission: Number(commission) || 0 },
      { onSuccess: onClose },
    )
  }

  const inputStyles = 'h-10 w-full rounded-lg border border-border bg-surface-raised px-3'
  return (
    <Modal open={open} onOpenChange={(next) => !next && onClose()} title="Change trainer" description="The previous assignment is closed and history is kept.">
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Trainer
          <select className={inputStyles} value={trainerId} onChange={(e) => setTrainerId(e.target.value)}>
            <option value="">No trainer</option>
            {trainers.data?.map((t) => (
              <option key={t.id} value={t.id}>{t.full_name}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          Commission per month (PKR)
          <input type="number" min={0} className={inputStyles} value={commission} onChange={(e) => setCommission(e.target.value)} />
        </label>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button loading={assign.isPending} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  )
}
