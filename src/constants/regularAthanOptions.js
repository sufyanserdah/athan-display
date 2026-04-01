/** Filenames in `public/audio/`. Fajr stays `fajr.mp3`. */
export const REGULAR_ATHAN_OPTIONS = [
  { id: '1', label: 'Regular adhan 1', file: 'regular1.mp3' },
  { id: '2', label: 'Regular adhan 2', file: 'regular2.mp3' },
  { id: '3', label: 'Regular adhan 3', file: 'regular3.mp3' },
]

export const DEFAULT_REGULAR_ATHAN_ID = '1'

export function regularAthanSrc(id) {
  const opt = REGULAR_ATHAN_OPTIONS.find((o) => o.id === id)
  const file = opt?.file ?? REGULAR_ATHAN_OPTIONS[0].file
  return `/audio/${file}`
}

export function isValidRegularAthanId(id) {
  return REGULAR_ATHAN_OPTIONS.some((o) => o.id === id)
}
