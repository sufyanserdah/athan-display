import { useSettings } from '../hooks/useSettings'
import { persistAudioUnlocked } from '../utils/audioUnlock'

export function EnableSound({ athanRef, onUnlocked }) {
  const { settings } = useSettings()
  const light = settings.theme === 'light'

  const handleTap = async () => {
    await athanRef.current?.unlock?.()
    persistAudioUnlocked()
    onUnlocked()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="enable-sound-title"
    >
      <div
        className={`absolute inset-0 ${
          light ? 'bg-masjid-light-text/40' : 'bg-black/70'
        }`}
        aria-hidden
      />
      <div
        className={`relative max-w-md rounded-2xl border px-8 py-10 text-center shadow-xl ${
          light
            ? 'border-masjid-accent/40 bg-masjid-light-bg text-masjid-light-text'
            : 'border-masjid-accent/50 bg-masjid-surface text-masjid-primary'
        }`}
      >
        <h2 id="enable-sound-title" className="text-xl font-semibold sm:text-2xl">
          Tap to enable athan
        </h2>
        <p
          className={`mt-3 text-sm sm:text-base ${
            light ? 'text-masjid-accent' : 'text-masjid-muted'
          }`}
        >
          Browsers require one tap before prayer call audio can play automatically.
        </p>
        <button
          type="button"
          onClick={handleTap}
          className={`mt-8 w-full rounded-xl px-6 py-4 text-lg font-semibold transition hover:opacity-90 active:scale-[0.99] ${
            light
              ? 'bg-masjid-accent text-white'
              : 'bg-masjid-accent text-masjid-primary'
          }`}
        >
          Enable sound
        </button>
      </div>
    </div>
  )
}
