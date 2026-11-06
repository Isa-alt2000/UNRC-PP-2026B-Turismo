import { useId } from 'react'

interface RadioCardsProps {
  legend: string
  help: string
  options: { id: string; nombre: string }[]
  value: string | null
  onChange: (value: string) => void
}

/** Opciones excluyentes con forma de tarjeta. */
export function RadioCards({ legend, help, options, value, onChange }: RadioCardsProps) {
  const name = useId()

  return (
    <fieldset className="section">
      <legend className="field-label mb-3">{legend}</legend>
      <div className="opts">
        {options.map((option) => (
          <label key={option.id} className="opt">
            <input
              type="radio"
              name={name}
              value={option.id}
              checked={value === option.id}
              onChange={() => onChange(option.id)}
            />
            <span className="opt-face">
              <span className="opt-dot" aria-hidden="true" />
              {option.nombre}
            </span>
          </label>
        ))}
      </div>
      <p className="help">{help}</p>
    </fieldset>
  )
}
