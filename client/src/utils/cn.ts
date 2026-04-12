/* ── Utility: cn() — class name merger ── */

/**
 * Merges CSS module class names. Filters out falsy values
 * for conditional class application.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
