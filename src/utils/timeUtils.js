/** Strip suffix like " (EST)" from Aladhan time strings */
export function cleanTimeString(str) {
  if (!str || typeof str !== 'string') return ''
  return str.split('(')[0].trim()
}

/** Parse "HH:mm" or "H:mm" (24h) into hours and minutes */
export function parseTimeParts(timeStr) {
  const cleaned = cleanTimeString(timeStr)
  const [h, m] = cleaned.split(':').map((x) => parseInt(x, 10))
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return { hours: h, minutes: m }
}

/**
 * Build a Date for a prayer on a given calendar day (local).
 * @param {string} timeStr - Aladhan timing value
 * @param {number} year
 * @param {number} month - 1-12
 * @param {number} day - 1-31
 */
export function prayerTimeToDate(timeStr, year, month, day) {
  const parts = parseTimeParts(timeStr)
  if (!parts) return null
  return new Date(year, month - 1, day, parts.hours, parts.minutes, 0, 0)
}

/** Format Date as 12-hour with AM/PM */
export function format12h(date) {
  if (!date || !(date instanceof Date) || Number.isNaN(date.getTime())) return '—'
  let h = date.getHours()
  const m = date.getMinutes()
  const am = h < 12
  h = h % 12
  if (h === 0) h = 12
  const mm = m.toString().padStart(2, '0')
  return `${h}:${mm} ${am ? 'AM' : 'PM'}`
}

/** Today's local date key YYYY-MM-DD */
export function dateKeyLocal(d = new Date()) {
  const y = d.getFullYear()
  const m = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Parse DD-MM-YYYY from Aladhan gregorian.date */
export function parseGregorianDateString(ddMmYyyy) {
  if (!ddMmYyyy || typeof ddMmYyyy !== 'string') return null
  const [d, m, y] = ddMmYyyy.split('-').map((x) => parseInt(x, 10))
  if (Number.isNaN(d) || Number.isNaN(m) || Number.isNaN(y)) return null
  return { day: d, month: m, year: y }
}

export const PRAYER_ORDER = [
  { key: 'Fajr', label: 'Fajr', athanType: 'fajr' },
  { key: 'Sunrise', label: 'Sunrise', athanType: null },
  { key: 'Dhuhr', label: 'Dhuhr', athanType: 'regular' },
  { key: 'Asr', label: 'Asr', athanType: 'regular' },
  { key: 'Maghrib', label: 'Maghrib', athanType: 'regular' },
  { key: 'Isha', label: 'Isha', athanType: 'regular' },
]

/**
 * @param {Record<string, string>} timings
 * @param {{ day: number, month: number, year: number }} ymd
 * @returns {Array<{ key: string, label: string, athanType: string | null, date: Date }>}
 */
export function buildPrayerSchedule(timings, ymd) {
  if (!timings || !ymd) return []
  const { year, month, day } = ymd
  return PRAYER_ORDER.map(({ key, label, athanType }) => {
    const date = prayerTimeToDate(timings[key], year, month, day)
    return { key, label, athanType, date }
  }).filter((p) => p.date && !Number.isNaN(p.date.getTime()))
}

/**
 * Next prayer after `now`, using today's schedule and optional tomorrow's Fajr+.
 * @param {Array<{ key: string, label: string, athanType: string | null, date: Date }>} todaySchedule
 * @param {Array<{ key: string, label: string, athanType: string | null, date: Date }>} tomorrowSchedule
 */
/**
 * True while the sun is up for display purposes: from today's Sunrise until Maghrib
 * (so the screen can switch to a bright daytime color vs night/dawn).
 */
export function isSolarDaytime(now, todaySchedule) {
  if (!todaySchedule?.length) return false
  const sunrise = todaySchedule.find((p) => p.key === 'Sunrise')?.date
  const maghrib = todaySchedule.find((p) => p.key === 'Maghrib')?.date
  if (!sunrise || !maghrib) return false
  const t = now.getTime()
  return t >= sunrise.getTime() && t < maghrib.getTime()
}

export function getNextPrayer(now, todaySchedule, tomorrowSchedule = []) {
  for (const p of todaySchedule) {
    if (p.date > now) return p
  }
  for (const p of tomorrowSchedule) {
    if (p.date > now) return p
  }
  return todaySchedule[0] ?? null
}

/** Milliseconds until target; 0 if past */
export function msUntil(now, target) {
  if (!target) return 0
  const t = target.getTime() - now.getTime()
  return Math.max(0, t)
}

/** Human-readable countdown: "1h 23m" or "45m" or "30s" */
export function formatCountdown(ms) {
  if (ms <= 0) return 'now'
  const sec = Math.floor(ms / 1000)
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  const s = sec % 60
  if (h > 0) return `${h}h ${m}m`
  if (m > 0) return `${m}m`
  return `${s}s`
}

/** Same calendar minute (for athan trigger) */
export function sameMinute(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate() &&
    a.getHours() === b.getHours() &&
    a.getMinutes() === b.getMinutes()
  )
}
