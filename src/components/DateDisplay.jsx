import { useSettings } from '../hooks/useSettings'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function formatGregorianBar(now, gregorianApi) {
  const wd = WEEKDAYS[now.getDay()]
  if (gregorianApi?.readable) {
    return `${wd}, ${gregorianApi.readable}`
  }
  const local = now.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
  return local
}

function formatHijri(hijri) {
  if (!hijri) return '—'
  const d = hijri.day ?? hijri.date
  const m = hijri.month?.en ?? hijri.month
  const y = hijri.year
  if (m && d != null && y != null) return `${d} ${m} ${y}`
  if (hijri.readable) return hijri.readable
  return '—'
}

export function DateDisplay({ now, hijri, gregorian, alerts = null }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'
  const left = formatGregorianBar(now, gregorian)
  const right = formatHijri(hijri)
  const city = settings.cityLabel?.trim()

  return (
    <header className="athan-dash__date-header flex w-full max-w-4xl flex-col items-stretch gap-1 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6">
      <div className="athan-dash__dates flex w-full flex-wrap items-center justify-between gap-2 text-center sm:gap-3">
        <p
          className={`text-lg font-medium sm:text-xl ${
            light ? 'text-masjid-light-text' : 'text-masjid-primary'
          }`}
        >
          {left}
        </p>
        <p
          className={`text-base sm:text-lg ${
            light ? 'text-masjid-accent' : 'text-masjid-muted'
          }`}
        >
          {right}
        </p>
      </div>
      <div className="athan-dash__city-block w-full">
        {city && (
          <p
            className={`athan-dash__city text-center text-lg font-semibold tracking-wide sm:text-xl ${
              light ? 'text-masjid-accent' : 'text-masjid-muted'
            }`}
            aria-label="Location"
          >
            {city}
          </p>
        )}
        {alerts}
      </div>
    </header>
  )
}
