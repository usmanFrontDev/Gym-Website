import { DirectoryView } from '@/components/common/DirectoryView'
import { PageContainer } from '@/components/ui/PageContainer'
import { directoryStrings } from '@/constants/strings'

export default function DirectoryPage() {
  return (
    <PageContainer title={directoryStrings.title} description={directoryStrings.subtitle}>
      <DirectoryView />
    </PageContainer>
  )
}
