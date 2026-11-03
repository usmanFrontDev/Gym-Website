import { Link } from 'react-router-dom'
import { Path } from '@/constants/paths'
import { strings } from '@/constants/strings'

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-3 p-4 text-center">
      <h1 className="font-display text-5xl font-extrabold uppercase text-primary">{strings.auth.notFoundTitle}</h1>
      <p className="text-muted">{strings.auth.notFoundBody}</p>
      <Link to={Path.Root} className="font-semibold text-primary underline">
        {strings.auth.goHome}
      </Link>
    </main>
  )
}
