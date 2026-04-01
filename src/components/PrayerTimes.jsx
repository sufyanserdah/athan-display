import { useSettings } from '../hooks/useSettings'
import { format12h } from '../utils/timeUtils'

export function PrayerTimes({ schedule, nextPrayerKey }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  if (!schedule?.length) {
    return (
      <div
        className={`flex min-h-[120px] items-center justify-center ${
          light ? 'text-masjid-accent' : 'text-masjid-muted'
        }`}
      >
        No times yet
      </div>
    )
  }

  return (
    <ul className="athan-prayer-grid grid w-full max-w-5xl grid-cols-2 gap-3 px-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-6 md:px-4">
      {schedule.map(({ key, label, date }) => {
        const isNext = key === nextPrayerKey
        const baseCard =
          'rounded-xl border px-3 py-4 text-center shadow-sm transition-colors'
        const nextCard = light
          ? 'border-masjid-accent bg-masjid-light-surface ring-2 ring-masjid-accent/35'
          : 'border-masjid-gold bg-masjid-surface/90 ring-2 ring-masjid-gold/40'
        const idleCard = light
          ? 'border-masjid-accent/50 bg-masjid-light-surface/80'
          : 'border-masjid-accent/40 bg-masjid-surface/60'

        return (
          <li key={key}>
            <article className={`${baseCard} ${isNext ? nextCard : idleCard}`}>
              <h3
                className={`text-base font-semibold sm:text-lg ${
                  light ? 'text-masjid-accent' : 'text-masjid-muted'
                }`}
              >
                {label}
              </h3>
              <p
                className={`athan-prayer-time mt-2 font-mono text-2xl font-semibold tabular-nums sm:text-3xl ${
                  isNext
                    ? 'text-masjid-gold'
                    : light
                      ? 'text-masjid-light-text'
                      : 'text-masjid-primary'
                }`}
              >
                {format12h(date)}
              </p>
            </article>
          </li>
        )
      })}
    </ul>
  )
}
