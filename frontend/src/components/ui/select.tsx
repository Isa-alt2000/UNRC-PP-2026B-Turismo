import { useId } from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectProps {
  label: string
  placeholder: string
  help: string
  options: { value: number; label: string }[]
  value: number | null
  onChange: (value: number | null) => void
}

/** Lista desplegable numérica; sin elegir, su valor es null. */
export function Select({ label, placeholder, help, options, value, onChange }: SelectProps) {
  const id = useId()

  return (
    <div className="section">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="select-wrap">
        <select
          id={id}
          className="select"
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value ? Number(event.target.value) : null)}
        >
          <option value="">{placeholder}</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="select-chev" size={18} strokeWidth={1.8} aria-hidden="true" />
      </div>
      <p className="help">{help}</p>
    </div>
  )
}
