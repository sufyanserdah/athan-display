const GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search'

/**
 * @param {string} query
 * @param {{ signal?: AbortSignal, limit?: number }} [options]
 * @returns {Promise<Array<Record<string, unknown>>>}
 */
export async function searchPlaces(query, options = {}) {
  const { signal, limit = 8 } = options
  const q = query.trim()
  if (q.length < 2) return []

  const params = new URLSearchParams({
    name: q,
    count: String(limit),
    language: 'en',
  })

  const res = await fetch(`${GEO_BASE}?${params}`, { signal })
  if (!res.ok) {
    throw new Error(`Geocoding error: ${res.status}`)
  }
  const json = await res.json()
  return Array.isArray(json.results) ? json.results : []
}

/**
 * @param {Record<string, unknown>} r - Open-Meteo geocode result
 */
export function formatPlaceLabel(r) {
  if (!r || typeof r !== 'object') return ''
  const name = r.name
  const admin1 = r.admin1
  const country = r.country ?? r.country_code
  const parts = [name, admin1, country].filter(Boolean)
  return parts.join(', ')
}
