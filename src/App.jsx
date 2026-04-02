import { useEffect, useMemo, useRef, useState } from 'react'
import { AthanPlayer } from './components/AthanPlayer'
import { Clock } from './components/Clock'
import { Countdown } from './components/Countdown'
import { DateDisplay } from './components/DateDisplay'
import { EnableSound } from './components/EnableSound'
import { PrayerTimes } from './components/PrayerTimes'
import { Settings } from './components/Settings'
import { SettingsProvider } from './context/SettingsContext'
import { useSettings } from './hooks/useSettings'
import { useAthan } from './hooks/useAthan'
import { useClock } from './hooks/useClock'
import { usePrayerTimes } from './hooks/usePrayerTimes'
import { DEFAULT_REGULAR_ATHAN_ID } from './constants/regularAthanOptions'
import { isAudioUnlocked } from './utils/audioUnlock'
import { getNextPrayer, isSolarDaytime } from './utils/timeUtils'

function AppContent() {
  const { settings } = useSettings()
  const now = useClock()
  const athanRef = useRef(null)
  const wakeLockRef = useRef(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(isAudioUnlocked)

  const { data, todaySchedule, tomorrowSchedule, loading, error } =
    usePrayerTimes({
      latitude: settings.latitude,
      longitude: settings.longitude,
      method: settings.method,
      school: settings.school ?? 0,
    })

  const next = useMemo(
    () => getNextPrayer(now, todaySchedule, tomorrowSchedule),
    [now, todaySchedule, tomorrowSchedule],
  )

  const nextPrayerKey = useMemo(() => {
    if (!next) return null
    const match = todaySchedule.find(
      (p) => p.key === next.key && p.date.getTime() === next.date.getTime(),
    )
    return match ? next.key : null
  }, [next, todaySchedule])

  const isSolarDay = useMemo(
    () => isSolarDaytime(now, todaySchedule),
    [now, todaySchedule],
  )

  useAthan({
    todaySchedule,
    tomorrowSchedule,
    athanEnabled: settings.athanEnabled,
    audioUnlocked,
    playFajr: () => athanRef.current?.playFajr?.(),
    playRegular: () => athanRef.current?.playRegular?.(),
  })

  useEffect(() => {
    document.documentElement.classList.toggle(
      'theme-light',
      settings.theme === 'light',
    )
  }, [settings.theme])

  useEffect(() => {
    document.documentElement.classList.toggle('solar-day', isSolarDay)
    return () => document.documentElement.classList.remove('solar-day')
  }, [isSolarDay])

  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) return
    const light = settings.theme === 'light'
    if (isSolarDay) {
      meta.setAttribute('content', light ? '#fff3d0' : '#e6a800')
    } else {
      meta.setAttribute('content', light ? '#f4fbfa' : '#052220')
    }
  }, [isSolarDay, settings.theme])

  useEffect(() => {
    const request = async () => {
      try {
        if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') {
          return
        }
        wakeLockRef.current?.release?.().catch(() => {})
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch {
        /* unsupported or denied */
      }
    }
    request()
    const onVis = () => {
      if (document.visibilityState === 'visible') request()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      document.removeEventListener('visibilitychange', onVis)
      wakeLockRef.current?.release?.().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  const light = settings.theme === 'light'

  const rootSurface = isSolarDay
    ? light
      ? 'bg-[#fff3d0]'
      : 'bg-[#e8b012]'
    : light
      ? 'bg-masjid-light-bg'
      : 'bg-masjid-bg'

  const rootOverlay = isSolarDay
    ? light
      ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(245,158,11,0.42),transparent_52%)]'
      : 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,240,180,0.55),transparent_48%)]'
    : light
      ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,153,142,0.14),transparent_50%)]'
      : 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,153,142,0.38),transparent_55%)]'

  return (
    <div
      className={`athan-root relative flex w-full min-h-full min-h-dvh flex-1 flex-col items-center transition-[background-color] duration-700 ease-out ${rootSurface}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 transition-[background] duration-700 ease-out ${rootOverlay}`}
        aria-hidden
      />

      <AthanPlayer
        ref={athanRef}
        volume={settings.volume}
        regularAthanId={settings.regularAthanId ?? DEFAULT_REGULAR_ATHAN_ID}
      />

      {!audioUnlocked && (
        <EnableSound
          athanRef={athanRef}
          onUnlocked={() => setAudioUnlocked(true)}
        />
      )}

      {settingsOpen && (
        <Settings
          onClose={() => setSettingsOpen(false)}
          athanRef={athanRef}
          onSoundVerified={() => setAudioUnlocked(true)}
        />
      )}

      <div className="athan-dash relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center gap-7 pb-28 pt-2 sm:gap-9 sm:pb-32">
        <DateDisplay
          now={now}
          hijri={data?.hijri}
          gregorian={data?.gregorian}
          alerts={
            <>
              {error && (
                <p
                  className="mx-4 mt-2 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2 text-center text-base text-red-200"
                  role="alert"
                >
                  {error} — showing cache if available.
                </p>
              )}
              {loading && !data && (
                <p
                  className={`mt-2 text-center text-lg ${
                    light ? 'text-masjid-accent' : 'text-masjid-muted'
                  }`}
                >
                  Loading prayer times…
                </p>
              )}
            </>
          }
        />

        <div className="athan-dash__clock flex w-full shrink-0 justify-center">
          <Clock now={now} />
        </div>

        <div className="athan-dash__countdown w-full">
          <Countdown now={now} nextPrayer={next} />
        </div>

        <div className="athan-dash__prayers w-full min-h-0">
          <PrayerTimes
            schedule={todaySchedule}
            nextPrayerKey={nextPrayerKey}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setSettingsOpen(true)}
        className={`fixed bottom-6 right-5 z-30 rounded-full p-3 opacity-40 transition hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-masjid-gold ${
          light ? 'text-masjid-accent' : 'text-masjid-muted'
        }`}
        style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        aria-label="Open settings"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  )
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  )
}
