/**
 * shade.ts
 * --------------------------------------------------------------------------
 * Tiny colour helpers for the drawings: a darker or lighter version of any
 * colour, so one chosen colour gives the drawing light and shadow.
 */

/** Mixes a hex colour with black (amount > 0) or white (amount < 0). */
export function shade(hex: string, amount: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  const target = amount > 0 ? 0 : 255;
  const t = Math.abs(amount);
  const mix = (c: number) => Math.round(c + (target - c) * t);
  return `#${[mix(r), mix(g), mix(b)]
    .map(c => c.toString(16).padStart(2, '0'))
    .join('')}`;
}

export const darker = (hex: string, amount = 0.2) => shade(hex, amount);
export const lighter = (hex: string, amount = 0.3) => shade(hex, -amount);

/** True for light colours (so we can draw dark lines on them). */
export function isLight(hex: string): boolean {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 170;
}
