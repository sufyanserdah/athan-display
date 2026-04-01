import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { fetchTimingsForDate } from '../utils/api'
import {
  buildPrayerSchedule,
  dateKeyLocal,
  parseGregorianDateString,
} from '../utils/timeUtils'

const CACHE_TODAY = 'athan-display-prayers-today'
const CACHE_TOMORROW = 'athan-display-prayers-tomorrow'

function readCache(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function writeCache(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* ignore */
  }
}

/**
 * @param {{ latitude: number, longitude: number, method: number, school?: number }} geo
 */
export function usePrayerTimes(geo) {
  const { latitude, longitude, method, school = 0 } = geo
  const [data, setData] = useState(null)
  const [tomorrowData, setTomorrowData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const prefetchedTomorrowKey = useRef('')
  const triedTomorrowFallbackFor = useRef('')

  const fetchAndSet = useCallback(
    async (date, options = {}) => {
      const { useTomorrowSlot = false } = options
      const apiData = await fetchTimingsForDate(
        date,
        latitude,
        longitude,
        method,
        school,
      )
      const g = apiData?.date?.gregorian
      const ymd = parseGregorianDateString(g?.date)
      const timings = apiData?.timings
      if (!ymd || !timings) {
        throw new Error('Malformed prayer data')
      }
      const payload = {
        timings,
        hijri: apiData.date?.hijri,
        gregorian: apiData.date?.gregorian,
        ymd,
        dateKey: dateKeyLocal(date),
      }
      if (useTomorrowSlot) {
        setTomorrowData(payload)
        writeCache(CACHE_TOMORROW, {
          ...payload,
          method,
          school,
          latitude,
          longitude,
        })
      } else {
        setData(payload)
        writeCache(CACHE_TODAY, {
          ...payload,
          method,
          school,
          latitude,
          longitude,
        })
      }
      return payload
    },
    [latitude, longitude, method, school],
  )

  const loadFromCache = useCallback(
    (todayKey) => {
      const t = readCache(CACHE_TODAY)
      if (
        t &&
        t.dateKey === todayKey &&
        t.method === method &&
        (t.school ?? 0) === school &&
        t.latitude === latitude &&
        t.longitude === longitude
      ) {
        setData({
          timings: t.timings,
          hijri: t.hijri,
          gregorian: t.gregorian,
          ymd: t.ymd,
          dateKey: t.dateKey,
        })
        return true
      }
      const tm = readCache(CACHE_TOMORROW)
      if (
        tm &&
        tm.dateKey === todayKey &&
        tm.method === method &&
        (tm.school ?? 0) === school &&
        tm.latitude === latitude &&
        tm.longitude === longitude
      ) {
        setData({
          timings: tm.timings,
          hijri: tm.hijri,
          gregorian: tm.gregorian,
          ymd: tm.ymd,
          dateKey: tm.dateKey,
        })
        writeCache(CACHE_TODAY, {
          ...tm,
          method,
          school,
          latitude,
          longitude,
        })
        return true
      }
      return false
    },
    [latitude, longitude, method, school],
  )

  const refresh = useCallback(async () => {
    const today = new Date()
    setLoading(true)
    setError(null)
    try {
      await fetchAndSet(today, { useTomorrowSlot: false })
    } catch (e) {
      setError(e?.message || 'Failed to load times')
      if (!loadFromCache(dateKeyLocal(today))) {
        setData(null)
      }
    } finally {
      setLoading(false)
    }
  }, [fetchAndSet, loadFromCache])

  // Initial load + when geo/method changes
  useEffect(() => {
    const today = new Date()
    const todayKey = dateKeyLocal(today)

    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      const hadCache = loadFromCache(todayKey)
      if (hadCache && !cancelled) setLoading(false)

      try {
        await fetchAndSet(today, { useTomorrowSlot: false })
      } catch (e) {
        if (!cancelled) {
          setError(e?.message || 'Failed to load times')
          if (!hadCache) setData(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [latitude, longitude, method, school, fetchAndSet, loadFromCache])

  // Day rollover + 11 PM prefetch (checked every minute)
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const todayKey = dateKeyLocal(now)
      if (data?.dateKey && data.dateKey !== todayKey) {
        triedTomorrowFallbackFor.current = ''
        refresh()
        prefetchedTomorrowKey.current = ''
        return
      }
      const h = now.getHours()
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const tomorrowKey = dateKeyLocal(tomorrow)
      if (h === 23 && prefetchedTomorrowKey.current !== tomorrowKey) {
        prefetchedTomorrowKey.current = tomorrowKey
        fetchAndSet(tomorrow, { useTomorrowSlot: true }).catch(() => {
          prefetchedTomorrowKey.current = ''
        })
      }
    }
    const id = setInterval(tick, 60_000)
    tick()
    return () => clearInterval(id)
  }, [data?.dateKey, fetchAndSet, refresh])

  const todaySchedule = useMemo(() => {
    if (!data?.timings || !data?.ymd) return []
    return buildPrayerSchedule(data.timings, data.ymd)
  }, [data])

  const tomorrowSchedule = useMemo(() => {
    if (!tomorrowData?.timings || !tomorrowData?.ymd) return []
    return buildPrayerSchedule(tomorrowData.timings, tomorrowData.ymd)
  }, [tomorrowData])

  // After today's last prayer: fetch tomorrow if missing (countdown / Fajr athan)
  useEffect(() => {
    const now = new Date()
    const dk = dateKeyLocal(now)
    const allPast =
      todaySchedule.length > 0 &&
      todaySchedule.every((p) => p.date <= now) &&
      !tomorrowData
    if (!allPast || loading) return
    if (triedTomorrowFallbackFor.current === dk) return
    triedTomorrowFallbackFor.current = dk
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    fetchAndSet(tomorrow, { useTomorrowSlot: true }).catch(() => {})
  }, [todaySchedule, tomorrowData, loading, fetchAndSet])

  return {
    data,
    tomorrowData,
    todaySchedule,
    tomorrowSchedule,
    loading,
    error,
    refresh,
  }
}
