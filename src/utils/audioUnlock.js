const STORAGE_KEY = 'athan-display-audio-unlocked'

export function isAudioUnlocked() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function persistAudioUnlocked() {
  try {
    localStorage.setItem(STORAGE_KEY, '1')
  } catch {
    /* private mode */
  }
}
