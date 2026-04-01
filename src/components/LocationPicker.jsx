import { useEffect, useState } from 'react'
import { formatPlaceLabel, searchPlaces } from '../utils/geocode'

export function LocationPicker({
  draft,
  setDraft,
  inputClass,
  labelClass,
  mutedClass,
  /** Match settings panel (draft theme while editing) */
  light,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchError, setSearchError] = useState(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) {
      setResults([])
      setSearchError(null)
      return
    }

    const ctrl = new AbortController()
    const timer = setTimeout(async () => {
      setLoading(true)
      setSearchError(null)
      try {
        const list = await searchPlaces(q, { signal: ctrl.signal, limit: 8 })
        if (!ctrl.signal.aborted) {
          setResults(list)
        }
      } catch (e) {
        if (e.name === 'AbortError') return
        if (!ctrl.signal.aborted) {
          setSearchError('Could not search. Check your connection and try again.')
          setResults([])
        }
      } finally {
        if (!ctrl.signal.aborted) setLoading(false)
      }
    }, 400)

    return () => {
      clearTimeout(timer)
      ctrl.abort()
    }
  }, [query])

  const pickPlace = (r) => {
    const lat = Number(r.latitude)
    const lon = Number(r.longitude)
    if (Number.isNaN(lat) || Number.isNaN(lon)) return
    setDraft((d) => ({
      ...d,
      latitude: lat,
      longitude: lon,
      cityLabel: formatPlaceLabel(r),
    }))
    setQuery('')
    setResults([])
    setSearchError(null)
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <span className={`text-sm font-medium ${labelClass}`}>
          Current location
        </span>
        <label className="mt-2 flex flex-col gap-1">
          <span className={`text-xs ${mutedClass}`}>
            Name on screen (you can shorten it; does not change prayer times)
          </span>
          <input
            type="text"
            className={inputClass}
            value={draft.cityLabel}
            onChange={(e) =>
              setDraft((d) => ({ ...d, cityLabel: e.target.value }))
            }
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className={`text-sm font-medium ${labelClass}`}>
          Search city or address
        </span>
        <input
          type="search"
          autoComplete="street-address"
          placeholder="e.g. Pickering Ontario, or 123 Main St Toronto"
          className={inputClass}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-describedby="location-search-hint"
        />
        <p id="location-search-hint" className={`text-xs ${mutedClass}`}>
          Include province or country for Canadian areas (e.g.{' '}
          <span className="whitespace-nowrap">North York, Ontario</span>
          ). If your neighbourhood is not listed, choose{' '}
          <strong className="font-medium">Toronto</strong> — prayer times match
          the GTA. Data from{' '}
          <a
            href="https://open-meteo.com/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Open-Meteo
          </a>
          .
        </p>
      </label>

      {loading && (
        <p className={`text-sm ${mutedClass}`} aria-live="polite">
          Searching…
        </p>
      )}
      {searchError && (
        <p className="text-sm text-red-400" role="alert">
          {searchError}
        </p>
      )}

      {results.length > 0 && (
        <ul
          className={`max-h-52 overflow-y-auto rounded-lg border ${
            light ? 'border-masjid-accent/40' : 'border-masjid-accent/35'
          }`}
          role="listbox"
          aria-label="Search results"
        >
          {results.map((r) => {
            const id = String(r.id ?? `${r.latitude}-${r.longitude}`)
            const label = formatPlaceLabel(r)
            return (
              <li key={id} role="option">
                <button
                  type="button"
                  className={`w-full border-b border-masjid-accent/20 px-3 py-3 text-left text-sm last:border-b-0 ${
                    light ? 'hover:bg-masjid-accent/10' : 'hover:bg-masjid-accent/15'
                  }`}
                  onClick={() => pickPlace(r)}
                >
                  <span
                    className={`font-medium ${
                      light ? 'text-masjid-light-text' : 'text-masjid-primary'
                    }`}
                  >
                    {label}
                  </span>
                  {r.timezone && (
                    <span className={`mt-0.5 block text-xs ${mutedClass}`}>
                      {r.timezone}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <details
        className={`rounded-lg border p-3 ${
          light ? 'border-masjid-accent/35' : 'border-masjid-accent/25'
        }`}
      >
        <summary
          className={`cursor-pointer text-sm font-medium ${labelClass}`}
        >
          Manual coordinates (optional)
        </summary>
        <p className={`mt-2 text-xs ${mutedClass}`}>
          Only if search does not list your area. Most people do not need this.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className={`text-xs font-medium ${labelClass}`}>
              Latitude
            </span>
            <input
              type="number"
              step="0.0001"
              className={inputClass}
              value={draft.latitude}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  latitude: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className={`text-xs font-medium ${labelClass}`}>
              Longitude
            </span>
            <input
              type="number"
              step="0.0001"
              className={inputClass}
              value={draft.longitude}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  longitude: parseFloat(e.target.value) || 0,
                }))
              }
            />
          </label>
        </div>
      </details>
    </div>
  )
}
