import { useEffect, useRef } from 'react'
import { dateKeyLocal, sameMinute } from '../utils/timeUtils'

/**
 * Every 15s, if current minute matches a prayer (excluding Sunrise) and athan is enabled, play once per day.
 */
export function useAthan({
  todaySchedule,
  tomorrowSchedule,
  athanEnabled,
  audioUnlocked,
  playFajr,
  playRegular,
}) {
  const playedRef = useRef(new Set())
  const dayKeyRef = useRef('')
  const playFajrRef = useRef(playFajr)
  const playRegularRef = useRef(playRegular)

  useEffect(() => {
    playFajrRef.current = playFajr
    playRegularRef.current = playRegular
  }, [playFajr, playRegular])

  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const dk = dateKeyLocal(now)
      if (dayKeyRef.current !== dk) {
        dayKeyRef.current = dk
        playedRef.current = new Set()
      }

      if (!audioUnlocked) return

      const candidates = [...todaySchedule, ...tomorrowSchedule]
      for (const p of candidates) {
        if (!p.athanType || p.key === 'Sunrise') continue
        if (!athanEnabled[p.key]) continue
        if (!sameMinute(now, p.date)) continue

        const stableKey = `${p.date.toISOString()}-${p.key}`
        if (playedRef.current.has(stableKey)) continue
        playedRef.current.add(stableKey)

        if (p.athanType === 'fajr') playFajrRef.current?.()
        else playRegularRef.current?.()
      }
    }

    tick()
    const id = setInterval(tick, 15_000)
    return () => clearInterval(id)
  }, [todaySchedule, tomorrowSchedule, athanEnabled, audioUnlocked])
}
