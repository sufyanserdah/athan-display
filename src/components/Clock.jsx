import { useSettings } from '../hooks/useSettings'
import { format12h } from '../utils/timeUtils'

export function Clock({ now }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  const full = format12h(now)
  const match = full.match(/^(\d{1,2}:\d{2})\s*(AM|PM)$/i)
  const digits = match ? match[1] : full
  const suffix = match ? match[2].toUpperCase() : ''

  return (
    <div
      className="select-none text-center leading-none"
      aria-live="polite"
      aria-atomic="true"
    >
      <time
        dateTime={now.toISOString()}
        className={`inline-flex items-baseline justify-center gap-2 font-mono text-[clamp(3.25rem,18vw,10rem)] font-semibold tracking-tighter tabular-nums ${
          light ? 'text-masjid-light-text' : 'text-masjid-primary'
        }`}
      >
        <span>{digits}</span>
        {suffix && (
          <span
            className={`text-[0.28em] font-medium ${
              light ? 'text-masjid-accent' : 'text-masjid-muted'
            }`}
          >
            {suffix}
          </span>
        )}
      </time>
    </div>
  )
}
