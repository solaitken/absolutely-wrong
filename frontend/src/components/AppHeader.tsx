import './AppHeader.css'

interface AppHeaderProps {
  onClear: () => void
}

export function AppHeader({ onClear }: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="app-header__copy">
        <h1 className="app-header__title">Absolutely Wrong</h1>
        <p className="app-header__subline">Always wrong, always sure.</p>
      </div>

      <button
        aria-label="Clear conversation"
        className="app-header__clear"
        onClick={onClear}
        title="Erase the evidence"
        type="button"
      >
        <span aria-hidden="true">×</span>
      </button>
    </header>
  )
}
