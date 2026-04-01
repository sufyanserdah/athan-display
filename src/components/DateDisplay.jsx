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

export function DateDisplay({ now, hijri, gregorian }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'
  const left = formatGregorianBar(now, gregorian)
  const right = formatHijri(hijri)

  return (
    <header className="flex w-full max-w-4xl flex-wrap items-center justify-between gap-2 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] text-center sm:px-6">
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
    </header>
  )
}
