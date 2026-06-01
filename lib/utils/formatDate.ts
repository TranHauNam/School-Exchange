// formatDate — convert an ISO date string ('YYYY-MM-DD' or full ISO timestamp)
// into a Vietnamese-friendly 'dd/mm/yyyy' display string for PostCard and tables.
//
// Deterministic and SSR-safe: parses the leading 'YYYY-MM-DD' portion directly
// (no Date/locale/timezone usage) so server and client render identically.

/**
 * Format an ISO date/timestamp into 'dd/mm/yyyy'.
 *
 * Accepts:
 *   - 'YYYY-MM-DD'           -> '24/05/2026'
 *   - 'YYYY-MM-DDTHH:mm:ssZ' -> '24/05/2026' (time portion ignored)
 *
 * Returns the original string unchanged if it does not start with an
 * ISO date, so unexpected input degrades gracefully.
 */
export function formatDate(iso: string): string {
  if (!iso) {
    return '';
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) {
    return iso;
  }

  const [, year, month, day] = match;
  return `${day}/${month}/${year}`;
}
