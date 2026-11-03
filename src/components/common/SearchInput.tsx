import { Search } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useDebounce } from '@/hooks/common/useDebounce'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  label: string
  placeholder?: string
}

/** Local text state with a 400 ms debounce before it reaches the URL. */
export function SearchInput({ value, onChange, label, placeholder }: SearchInputProps) {
  const [text, setText] = useState(value)
  const debounced = useDebounce(text, 400)

  useEffect(() => {
    if (debounced !== value) onChange(debounced)
    // eslint-disable-next-line -- only react to the debounced text
  }, [debounced])

  return (
    <label className="relative block">
      <span className="sr-only">{label}</span>
      <Search aria-hidden="true" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? label}
        className="h-11 w-full rounded-lg border border-border bg-surface pl-9 pr-3 text-foreground transition-colors placeholder:text-muted hover:border-border-strong focus:border-primary"
      />
    </label>
  )
}
