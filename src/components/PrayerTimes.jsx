import { useSettings } from '../hooks/useSettings'
import { format12h } from '../utils/timeUtils'

export function PrayerTimes({ schedule, nextPrayerKey }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  if (!schedule?.length) {
    return (
      <div
        className={`flex min-h-[140px] items-center justify-center text-2xl sm:text-3xl ${
          light ? 'text-masjid-accent' : 'text-masjid-muted'
        }`}
      >
        No times yet
      </div>
    )
  }

  return (
    <ul className="athan-prayer-grid grid w-full max-w-5xl grid-cols-2 gap-4 px-2 sm:grid-cols-3 sm:gap-5 sm:px-3 md:grid-cols-6 md:gap-4 md:px-3 lg:gap-5">
      {schedule.map(({ key, label, date }) => {
        const isNext = key === nextPrayerKey
        const baseCard =
          'rounded-xl border px-3 py-6 text-center shadow-sm transition-colors sm:px-5 sm:py-7 md:px-3 md:py-5 lg:px-4 lg:py-6'
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
                className={
                  light ? 'text-masjid-accent' : 'text-masjid-muted'
                }
              >
                {label}
              </h3>
              <p
                className={`athan-prayer-time mt-2 font-mono tabular-nums tracking-tight ${
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
