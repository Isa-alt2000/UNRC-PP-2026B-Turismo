interface SwitchProps {
  label: string
  help: string
  checked: boolean
  onChange: (checked: boolean) => void
}

/** Interruptor de sí o no, con su explicación. Toda la fila responde al toque. */
export function Switch({ label, help, checked, onChange }: SwitchProps) {
  return (
    <button
      type="button"
      className="switch-row"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
    >
      <span className="switch-text">
        <span className="switch-title">{label}</span>
        <span className="help">{help}</span>
      </span>
      <span className="switch-track" aria-hidden="true">
        <span className="switch-thumb" />
      </span>
    </button>
  )
}
