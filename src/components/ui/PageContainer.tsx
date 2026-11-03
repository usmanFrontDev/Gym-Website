import type { ReactNode } from 'react'

interface PageContainerProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function PageContainer({ title, description, actions, children }: PageContainerProps) {
  return (
    <section className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-4xl font-bold uppercase leading-none tracking-wide">
            {title}
            <span aria-hidden="true" className="text-primary">.</span>
          </h1>
          {description && <p className="mt-2 max-w-2xl text-sm text-muted">{description}</p>}
        </div>
        {actions}
      </div>
      {children}
    </section>
  )
}
