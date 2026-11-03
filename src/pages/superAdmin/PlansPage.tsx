import { Plus } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { MemberDiscountSection } from '@/components/superAdmin/MemberDiscountSection'
import { PlanFormDialog } from '@/components/superAdmin/PlanFormDialog'
import { PlansTable } from '@/components/superAdmin/PlansTable'
import { PageContainer } from '@/components/ui/PageContainer'
import { planStrings } from '@/constants/strings'

export default function PlansPage() {
  const [addOpen, setAddOpen] = useState(false)
  const handleAddClick = () => setAddOpen(true)

  return (
    <PageContainer
      title={planStrings.title}
      description={planStrings.subtitle}
      actions={
        <Button onClick={handleAddClick}>
          <Plus aria-hidden="true" size={18} />
          {planStrings.add}
        </Button>
      }
    >
      <PlansTable />
      <p className="-mt-3 text-xs text-muted">{planStrings.priceNote}</p>
      <MemberDiscountSection />
      <PlanFormDialog open={addOpen} onClose={() => setAddOpen(false)} />
    </PageContainer>
  )
}
