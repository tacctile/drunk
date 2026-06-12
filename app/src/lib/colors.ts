export const PIN_COLORS = [
  '#FF8C42', // amber orange
  '#34D399', // emerald
  '#60A5FA', // sky blue
  '#F472B6', // pink
  '#A78BFA', // violet
  '#FBBF24', // amber yellow
  '#F87171', // coral red
  '#22D3EE', // cyan
  '#86EFAC', // mint green
  '#818CF8', // indigo
  '#E879F9', // magenta
  '#FB923C', // orange
  '#4ADE80', // green
  '#38BDF8', // light blue
  '#E11D48', // rose
  '#7C3AED', // purple
  '#059669', // teal
  '#DC2626', // red
  '#2563EB', // royal blue
  '#D97706', // dark amber
  '#0891B2', // dark cyan
  '#9333EA', // grape
  '#BE185D', // hot pink
  '#15803D', // forest green
  '#B45309', // brown orange
] as const

export type PinColor = typeof PIN_COLORS[number]

// Returns the color to assign to the Nth registered user
// Cycles back to 0 when count exceeds 24
export function assignColor(registeredCount: number): string {
  return PIN_COLORS[registeredCount % PIN_COLORS.length]
}

// "Nick B" → "NB"; a single word gives its first letter.
// Shared by the avatar circles and the city-map "You" pin label.
export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return (parts[0]?.[0] ?? '').toUpperCase()
}

// Returns contrast text color (black or white) for
// a given background hex — used for avatar initials
export function contrastColor(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.55 ? '#0A0D14' : '#F8FAFC'
}
