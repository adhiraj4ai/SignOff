import type { CategoryColor } from '@shared/ipc-types'

// macOS-Finder hues, tuned to sit with the app's muted palette (iris/ok/wait/stop)
// rather than raw system colors. Applied via inline style (categories are dynamic,
// so Tailwind classes would be purged).
export const CATEGORY_HEX: Record<CategoryColor, string> = {
  red: '#d1495b',
  orange: '#c77b16',
  yellow: '#d4a017',
  green: '#1f9d6b',
  blue: '#3b82c4',
  purple: '#5b57d6',
  gray: '#8a8f99',
}
