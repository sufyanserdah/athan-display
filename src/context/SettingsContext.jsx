import { useCallback, useMemo, useState } from 'react'
import {
  DEFAULT_REGULAR_ATHAN_ID,
  isValidRegularAthanId,
} from '../constants/regularAthanOptions'
import { SettingsContext } from './appSettingsContext'

const STORAGE_KEY = 'athan-display-settings'

const DEFAULT_SETTINGS = {
  method: 2,
  /** Aladhan `school`: 0 standard Asr, 1 Hanafi */
  school: 0,
  cityLabel: 'Pickering, ON',
  latitude: 43.8384,
  longitude: -79.0868,
  /** @type {'dark' | 'light'} */
  theme: 'dark',
  volume: 0.85,
  regularAthanId: DEFAULT_REGULAR_ATHAN_ID,
  athanEnabled: {
    Fajr: true,
    Dhuhr: true,
    Asr: true,
    Maghrib: true,
    Isha: true,
  },
}

function normalizeRegularAthanId(parsed) {
  const raw = parsed.regularAthanId ?? parsed.athanSoundSet
  const s = raw != null ? String(raw) : ''
  if (isValidRegularAthanId(s)) return s
  if (s === 'default' || s === '') return DEFAULT_REGULAR_ATHAN_ID
  return DEFAULT_REGULAR_ATHAN_ID
}

function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      athanEnabled: {
        ...DEFAULT_SETTINGS.athanEnabled,
        ...(parsed.athanEnabled || {}),
      },
      latitude: Number(parsed.latitude ?? DEFAULT_SETTINGS.latitude),
      longitude: Number(parsed.longitude ?? DEFAULT_SETTINGS.longitude),
      method: Number(parsed.method ?? DEFAULT_SETTINGS.method),
      school: [0, 1].includes(Number(parsed.school))
        ? Number(parsed.school)
        : DEFAULT_SETTINGS.school,
      volume: Math.min(
        1,
        Math.max(0, Number(parsed.volume ?? DEFAULT_SETTINGS.volume)),
      ),
      regularAthanId: normalizeRegularAthanId(parsed),
    }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function SettingsProvider({ children }) {
  const [settings, setSettingsState] = useState(loadSettings)

  const setSettings = useCallback((partial) => {
    setSettingsState((prev) => {
      const patch = typeof partial === 'function' ? partial(prev) : partial
      const next = { ...prev, ...patch }
      if (patch.athanEnabled) {
        next.athanEnabled = { ...prev.athanEnabled, ...patch.athanEnabled }
      }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* ignore quota */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ settings, setSettings }),
    [settings, setSettings],
  )

  return (
    <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
  )
}
