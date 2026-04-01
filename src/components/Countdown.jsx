import { useSettings } from '../hooks/useSettings'
import { formatCountdown, msUntil } from '../utils/timeUtils'

export function Countdown({ now, nextPrayer }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  if (!nextPrayer) {
    return (
      <p
        className={`min-h-[2rem] text-center text-xl ${
          light ? 'text-masjid-accent' : 'text-masjid-muted'
        }`}
      >
        Loading next prayer…
      </p>
    )
  }

  const ms = msUntil(now, nextPrayer.date)
  const label = formatCountdown(ms)

  return (
    <p
      className={`min-h-[2rem] text-center text-2xl font-medium sm:text-3xl ${
        light ? 'text-masjid-accent' : 'text-masjid-muted'
      }`}
      aria-live="polite"
    >
      {ms <= 0 ? (
        <>
          <span className="text-masjid-gold">{nextPrayer.label}</span> now
        </>
      ) : (
        <>
          <span
            className={
              light ? 'text-masjid-light-text' : 'text-masjid-primary'
            }
          >
            {nextPrayer.label}
          </span>{' '}
          in {label}
        </>
      )}
    </p>
  )
}
