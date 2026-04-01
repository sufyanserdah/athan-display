import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react'
import {
  DEFAULT_REGULAR_ATHAN_ID,
  REGULAR_ATHAN_OPTIONS,
  regularAthanSrc,
} from '../constants/regularAthanOptions'

export const AthanPlayer = forwardRef(function AthanPlayer(
  { volume, regularAthanId = DEFAULT_REGULAR_ATHAN_ID },
  ref,
) {
  const fajrRef = useRef(null)
  const regularRef1 = useRef(null)
  const regularRef2 = useRef(null)
  const regularRef3 = useRef(null)
  const volumeRef = useRef(volume)

  const regularRefs = useMemo(
    () => [regularRef1, regularRef2, regularRef3],
    [],
  )

  const regularIds = useMemo(
    () => REGULAR_ATHAN_OPTIONS.map((o) => o.id),
    [],
  )

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

  useEffect(() => {
    const v = Math.min(1, Math.max(0, volume))
    if (fajrRef.current) fajrRef.current.volume = v
    if (regularRef1.current) regularRef1.current.volume = v
    if (regularRef2.current) regularRef2.current.volume = v
    if (regularRef3.current) regularRef3.current.volume = v
  }, [volume])

  const setAllVolumes = (x) => {
    if (fajrRef.current) fajrRef.current.volume = x
    if (regularRef1.current) regularRef1.current.volume = x
    if (regularRef2.current) regularRef2.current.volume = x
    if (regularRef3.current) regularRef3.current.volume = x
  }

  useImperativeHandle(
    ref,
    () => ({
      setVolume(v) {
        const x = Math.min(1, Math.max(0, v))
        volumeRef.current = x
        setAllVolumes(x)
      },
      async unlock() {
        const v = volumeRef.current
        const elements = [
          fajrRef.current,
          regularRef1.current,
          regularRef2.current,
          regularRef3.current,
        ].filter(Boolean)
        for (const el of elements) {
          try {
            el.volume = 0
            await el.play()
            el.pause()
            el.currentTime = 0
          } catch {
            /* autoplay policy */
          }
          el.volume = v
        }
      },
      playFajr() {
        const el = fajrRef.current
        if (!el) return
        el.currentTime = 0
        el.play().catch(() => {})
      },
      playRegular() {
        const idx = regularIds.indexOf(regularAthanId)
        const r = regularRefs[idx >= 0 ? idx : 0]
        const el = r?.current
        if (!el) return
        el.currentTime = 0
        el.play().catch(() => {})
      },
      playRegularAt(id) {
        const idx = regularIds.indexOf(id)
        const r = regularRefs[idx >= 0 ? idx : 0]
        const el = r?.current
        if (!el) return
        el.currentTime = 0
        el.play().catch(() => {})
      },
      stopAll() {
        for (const el of [
          fajrRef.current,
          regularRef1.current,
          regularRef2.current,
          regularRef3.current,
        ]) {
          if (!el) continue
          el.pause()
          el.currentTime = 0
        }
      },
    }),
    [regularAthanId, regularIds, regularRefs],
  )

  return (
    <>
      <audio ref={fajrRef} src="/audio/fajr.mp3" preload="auto" />
      {REGULAR_ATHAN_OPTIONS.map((opt, i) => (
        <audio
          key={opt.id}
          ref={regularRefs[i]}
          src={regularAthanSrc(opt.id)}
          preload="auto"
        />
      ))}
    </>
  )
})
