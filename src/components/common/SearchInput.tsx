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
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder ?? label}
        className="h-10 w-full rounded-lg border border-border bg-surface px-3 text-foreground placeholder:text-muted"
      />
    </label>
  )
}
