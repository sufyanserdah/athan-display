const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'

/**
 * Places users expect but Open-Meteo/GeoNames often lack as a searchable "city" name
 * (e.g. North York was amalgamated into Toronto — no top-level record, so the API
 * returns US "North York" towns instead). We pin sensible coordinates for prayer times.
 */
const NORTH_YORK_TORONTO = {
  id: 'curated-north-york-toronto-on',
  name: 'North York',
  latitude: 43.7617,
  longitude: -79.4111,
  country_code: 'CA',
  country: 'Canada',
  admin1: 'Ontario',
  admin2: 'Toronto',
  admin3: 'North York',
  timezone: 'America/Toronto',
}

function wantsCanadianNorthYork(q) {
  if (!/\bnorth york\b/i.test(q)) return false
  const s = q.toLowerCase()
  if (
    /\b(pennsylvania|wisconsin|united states|u\.s\.a\.|usa)\b/.test(s) ||
    /\bnorth yorks\b/.test(s)
  ) {
    return false
  }
  return true
}

function curatedResultsForQuery(q) {
  if (wantsCanadianNorthYork(q)) return [{ ...NORTH_YORK_TORONTO }]
  return []
}

/**
 * Guess ISO country from free text (Canadian cities often need this so "North York"
 * is not confused with US places of the same name).
 * @param {string} q
 * @returns {string | null} ISO 3166-1 alpha-2 or null
 */
function inferCountryCode(q) {
  const s = q.toLowerCase()
  if (
    /\b(ontario|canada|toronto|gta|etobicoke|scarborough|mississauga|brampton|markham|vaughan|richmond hill|oakville|hamilton|ottawa|vancouver|montreal|quebec city|winnipeg|calgary|edmonton|halifax|saskatoon|regina|pei|prince edward island|newfoundland|nova scotia|new brunswick|manitoba|saskatchewan|alberta|british columbia|québec|quebec)\b/.test(
      s,
    ) ||
    /\bon\s*,/i.test(q) ||
    /,\s*on\s*,/i.test(q) ||
    /\bon\s+canada\b/i.test(q) ||
    /\bca\s*,/i.test(q)
  ) {
    return 'CA'
  }
  if (
    /\b(united states|u\.s\.a\.|usa)\b|\b(california|texas|florida|new york|pennsylvania|illinois)\b/.test(
      s,
    )
  ) {
    return 'US'
  }
  return null
}

async function fetchGeocode({ name, count, countryCode, signal }) {
  const params = new URLSearchParams({
    name,
    count: String(count),
    language: 'en',
  })
  if (countryCode) params.set('countryCode', countryCode)

  const res = await fetch(`${GEO_BASE}?${params}`, { signal })
  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`)
  }
  const json = await res.json()
  return Array.isArray(json.results) ? json.results : []
}

function dedupeById(results) {
  const map = new Map()
  for (const r of results) {
    const id = r.id ?? `${r.latitude},${r.longitude}`
    if (!map.has(id)) map.set(id, r)
  }
  return [...map.values()]
}

function prioritizeCountry(results, countryCode) {
  if (!countryCode) return results
  const match = []
  const rest = []
  for (const r of results) {
    if (r.country_code === countryCode) match.push(r)
    else rest.push(r)
  }
  return [...match, ...rest]
}

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function searchPlaces(query, options = {}) {
  const { signal, limit = 12 } = options
  const q = query.trim()
  if (q.length < 2) return []

  const curated = curatedResultsForQuery(q)
  const cc = inferCountryCode(q) ?? (wantsCanadianNorthYork(q) ? 'CA' : null)
  const want = Math.max(limit, 12)

  const batches = []

  if (cc) {
    const biased = await fetchGeocode({
      name: q,
      count: want + 8,
      countryCode: cc,
      signal,
    })
    batches.push(...biased)
  }

  const broad = await fetchGeocode({
    name: q,
    count: want + 8,
    signal,
  })
  batches.push(...broad)

  let merged = dedupeById([...curated, ...batches])
  merged = prioritizeCountry(merged, cc)

  const hasCa = merged.some((r) => r.country_code === 'CA')
  if (cc === 'CA' && !hasCa) {
    const toronto = await fetchGeocode({
      name: 'Toronto',
      count: 4,
      countryCode: 'CA',
      signal,
    })
    merged = dedupeById([...toronto, ...merged])
  }

  return merged.slice(0, limit)
}

/**
 * @param {Record<string, unknown>} r - Open-Meteo geocode result
 */
export function formatPlaceLabel(r) {
  if (!r || typeof r !== 'object') return ''
  const name = r.name
  const admin1 = r.admin1
  const admin2 = r.admin2
  const admin3 = r.admin3
  const country = r.country ?? r.country_code
  const parts = [name, admin3, admin2, admin1, country].filter(Boolean)
  const seen = new Set()
  const unique = []
  for (const p of parts) {
    const key = String(p).toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    unique.push(p)
  }
  return unique.join(', ')
}
