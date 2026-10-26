import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  actions?: ReactNode
  children: ReactNode
}

export function PageContainer({ title, actions, children }: PageContainerProps) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{title}</h1>
        {actions}
      </div>
      {children}
    </section>
  )
}
