const BASE = 'https://api.aladhan.com/v1'

/**
 * @param {Date} date - local calendar date to fetch
 * @param {number} latitude
 * @param {number} longitude
 * @param {number} method - Aladhan method id (2 = ISNA)
 * @param {number} [school=0] - 0 standard Asr, 1 Hanafi (later Asr)
 */
export async function fetchTimingsForDate(
  date,
  latitude,
  longitude,
  method,
  school = 0,
) {
  const dd = date.getDate().toString().padStart(2, '0')
  const mm = (date.getMonth() + 1).toString().padStart(2, '0')
  const yyyy = date.getFullYear()
  const s = school === 1 ? 1 : 0
  const url = `${BASE}/timings/${dd}-${mm}-${yyyy}?latitude=${latitude}&longitude=${longitude}&method=${method}&school=${s}`
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Aladhan API error: ${res.status}`)
  }
  const json = await res.json()
  if (!json.data) {
    throw new Error(json.status || 'Invalid API response')
  }
  return json.data
}
