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
import { getNextPrayer } from './utils/timeUtils'

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

  return (
    <div
      className={`relative flex min-h-full flex-col items-center ${
        light ? 'bg-masjid-light-bg' : 'bg-masjid-bg'
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          light
            ? 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,153,142,0.14),transparent_50%)]'
            : 'bg-[radial-gradient(ellipse_at_50%_0%,rgba(17,153,142,0.38),transparent_55%)]'
        }`}
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

      <div className="athan-dash relative z-10 flex w-full max-w-6xl flex-1 flex-col items-center gap-6 pb-28 pt-2 sm:gap-8 sm:pb-32">
        <div className="athan-dash__meta flex w-full flex-col items-center gap-2">
          <DateDisplay
            now={now}
            hijri={data?.hijri}
            gregorian={data?.gregorian}
          />

          {error && (
            <p
              className="mx-4 rounded-lg border border-red-500/40 bg-red-950/40 px-4 py-2 text-center text-sm text-red-200"
              role="alert"
            >
              {error} — showing cache if available.
            </p>
          )}

          {loading && !data && (
            <p className={light ? 'text-masjid-accent' : 'text-masjid-muted'}>
              Loading prayer times…
            </p>
          )}
        </div>

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
