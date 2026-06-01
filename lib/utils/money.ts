// money — format a numeric amount as Vietnamese currency.
// Mirrors money() in open_design/js/app.js: returns the vi-VN formatted number
// suffixed with ' ₫' when the value is truthy, otherwise an em-dash placeholder.

/**
 * Format a price for display.
 *
 * @example money(280000) // '280.000 ₫'
 * @example money(0)      // '—'
 */
export function money(value: number): string {
  return value
    ? new Intl.NumberFormat('vi-VN').format(value) + ' ₫'
    : '—';
}
