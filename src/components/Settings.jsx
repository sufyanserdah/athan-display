import { useState } from 'react'
import { ASR_SCHOOL_OPTIONS } from '../constants/asrSchool'
import { CALCULATION_METHODS } from '../constants/calculationMethods'
import {
  DEFAULT_REGULAR_ATHAN_ID,
  REGULAR_ATHAN_OPTIONS,
} from '../constants/regularAthanOptions'
import { LocationPicker } from './LocationPicker'
import { useSettings } from '../hooks/useSettings'
import { persistAudioUnlocked } from '../utils/audioUnlock'

export function Settings({ onClose, athanRef, onSoundVerified }) {
  const { settings, setSettings } = useSettings()
  const light = settings.theme === 'light'

  const [draft, setDraft] = useState(() => ({
    ...settings,
    school: settings.school ?? 0,
    regularAthanId: settings.regularAthanId ?? DEFAULT_REGULAR_ATHAN_ID,
  }))
  const [testHint, setTestHint] = useState(null)

  const panelClass = light
    ? 'border-masjid-accent/30 bg-masjid-light-bg text-masjid-light-text'
    : 'border-masjid-accent/40 bg-masjid-surface text-masjid-primary'

  const labelClass = light ? 'text-masjid-accent' : 'text-masjid-muted'
  const mutedClass = light ? 'text-masjid-accent/80' : 'text-masjid-muted'
  const inputClass = light
    ? 'rounded-lg border border-masjid-accent/40 bg-white px-3 py-2 text-masjid-light-text'
    : 'rounded-lg border border-masjid-accent/50 bg-masjid-bg/50 px-3 py-2 text-masjid-primary'

  const save = () => {
    const toSave = { ...draft }
    delete toSave.athanSoundSet
    setSettings(toSave)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close settings"
        onClick={onClose}
      />
      <div
        className={`relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl border p-6 shadow-2xl sm:rounded-2xl ${panelClass}`}
      >
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 id="settings-title" className="text-xl font-semibold">
            Settings
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-lg px-3 py-1 text-sm ${labelClass}`}
          >
            Close
          </button>
        </div>

        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-1">
            <span className={`text-sm font-medium ${labelClass}`}>
              Calculation method
            </span>
            <select
              className={inputClass}
              value={draft.method}
              onChange={(e) =>
                setDraft((d) => ({ ...d, method: Number(e.target.value) }))
              }
            >
              {CALCULATION_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1">
            <span className={`text-sm font-medium ${labelClass}`}>
              Asr calculation (juristic school)
            </span>
            <select
              className={inputClass}
              value={draft.school ?? 0}
              onChange={(e) =>
                setDraft((d) => ({ ...d, school: Number(e.target.value) }))
              }
            >
              {ASR_SCHOOL_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <span className={`text-xs ${mutedClass}`}>
              Hanafi uses one shadow length for Asr; other schools use the
              earlier time.
            </span>
          </label>

          <div>
            <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
              Location
            </span>
            <LocationPicker
              draft={draft}
              setDraft={setDraft}
              inputClass={inputClass}
              labelClass={labelClass}
              mutedClass={mutedClass}
              light={draft.theme === 'light'}
            />
          </div>

          <label className="flex flex-col gap-1">
            <span className={`text-sm font-medium ${labelClass}`}>
              Regular adhan (Dhuhr, Asr, Maghrib, Isha)
            </span>
            <select
              className={inputClass}
              value={draft.regularAthanId ?? DEFAULT_REGULAR_ATHAN_ID}
              onChange={(e) =>
                setDraft((d) => ({ ...d, regularAthanId: e.target.value }))
              }
            >
              {REGULAR_ATHAN_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label} ({opt.file})
                </option>
              ))}
            </select>
            <span className={`text-xs ${mutedClass}`}>
              Place these files in <code className="text-inherit">public/audio/</code>
              .
            </span>
          </label>

          <div>
            <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
              Athan per prayer
            </span>
            <ul className="flex flex-col gap-2">
              {['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'].map((name) => (
                <li key={name} className="flex items-center justify-between gap-4">
                  <span>{name}</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draft.athanEnabled[name]}
                    onClick={() =>
                      setDraft((d) => ({
                        ...d,
                        athanEnabled: {
                          ...d.athanEnabled,
                          [name]: !d.athanEnabled[name],
                        },
                      }))
                    }
                    className={`relative h-8 w-14 rounded-full transition ${
                      draft.athanEnabled[name]
                        ? 'bg-masjid-accent'
                        : 'bg-masjid-muted/40'
                    }`}
                  >
                    <span
                      className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition ${
                        draft.athanEnabled[name] ? 'translate-x-6' : ''
                      }`}
                    />
                  </button>
                </li>
              ))}
            </ul>
            <p className={`mt-2 text-xs ${labelClass}`}>
              Sunrise has no athan.
            </p>
          </div>

          <label className="flex flex-col gap-1">
            <span className={`text-sm font-medium ${labelClass}`}>
              Volume ({Math.round(draft.volume * 100)}%)
            </span>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.volume}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  volume: parseFloat(e.target.value),
                }))
              }
              className="w-full accent-masjid-accent"
            />
          </label>

          <div>
            <span className={`mb-2 block text-sm font-medium ${labelClass}`}>
              Test athan sound
            </span>
            <p className={`mb-3 text-xs ${mutedClass}`}>
              Plays your MP3s at the volume slider value above (even before you
              tap Save). Use Stop to end playback.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${
                  light
                    ? 'border-masjid-accent/50 text-masjid-light-text'
                    : 'border-masjid-accent/50 text-masjid-primary'
                }`}
                onClick={async () => {
                  setTestHint(null)
                  const ref = athanRef?.current
                  if (!ref) {
                    setTestHint('Audio is not ready.')
                    return
                  }
                  try {
                    ref.stopAll?.()
                    await ref.unlock?.()
                    ref.setVolume?.(draft.volume)
                    ref.playFajr?.()
                    persistAudioUnlocked()
                    onSoundVerified?.()
                    setTestHint('Playing Fajr athan…')
                  } catch {
                    setTestHint('Could not play. Check /public/audio/fajr.mp3')
                  }
                }}
              >
                Play Fajr athan
              </button>
              <button
                type="button"
                className={`flex-1 rounded-xl border py-3 text-sm font-semibold ${
                  light
                    ? 'border-masjid-accent/50 text-masjid-light-text'
                    : 'border-masjid-accent/50 text-masjid-primary'
                }`}
                onClick={async () => {
                  setTestHint(null)
                  const ref = athanRef?.current
                  if (!ref) {
                    setTestHint('Audio is not ready.')
                    return
                  }
                  try {
                    ref.stopAll?.()
                    await ref.unlock?.()
                    ref.setVolume?.(draft.volume)
                    ref.playRegularAt?.(
                      draft.regularAthanId ?? DEFAULT_REGULAR_ATHAN_ID,
                    )
                    persistAudioUnlocked()
                    onSoundVerified?.()
                    setTestHint(
                      `Playing regular adhan ${draft.regularAthanId ?? DEFAULT_REGULAR_ATHAN_ID}…`,
                    )
                  } catch {
                    setTestHint(
                      'Could not play. Check public/audio/regular.mp3, regular2.mp3, regular3.mp3',
                    )
                  }
                }}
              >
                Play selected regular athan
              </button>
            </div>
            <button
              type="button"
              className={`mt-2 w-full rounded-xl border py-3 text-sm font-semibold ${
                light
                  ? 'border-red-600/50 text-red-800 hover:bg-red-100/90'
                  : 'border-red-500/50 text-red-300 hover:bg-red-950/30'
              }`}
              onClick={() => {
                athanRef?.current?.stopAll?.()
                setTestHint('Athan stopped.')
              }}
            >
              Stop athan
            </button>
            {testHint && (
              <p className={`mt-2 text-sm ${mutedClass}`} aria-live="polite">
                {testHint}
              </p>
            )}
          </div>

          <label className="flex items-center justify-between gap-4">
            <span className={`text-sm font-medium ${labelClass}`}>
              Light theme
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={draft.theme === 'light'}
              onClick={() =>
                setDraft((d) => ({
                  ...d,
                  theme: d.theme === 'light' ? 'dark' : 'light',
                }))
              }
              className={`relative h-8 w-14 rounded-full transition ${
                draft.theme === 'light' ? 'bg-masjid-accent' : 'bg-masjid-muted/40'
              }`}
            >
              <span
                className={`absolute top-1 left-1 h-6 w-6 rounded-full bg-white transition ${
                  draft.theme === 'light' ? 'translate-x-6' : ''
                }`}
              />
            </button>
          </label>
        </div>

        <div className="mt-8 flex gap-3">
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-xl bg-masjid-accent py-3 font-semibold text-white"
          >
            Save
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`flex-1 rounded-xl border py-3 font-semibold ${
              light
                ? 'border-masjid-accent/50 text-masjid-light-text'
                : 'border-masjid-accent/50 text-masjid-primary'
            }`}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
