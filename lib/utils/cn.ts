// cn — merge class names using clsx.
// Thin wrapper so components import a stable local helper for conditional
// className composition.

import clsx, { type ClassValue } from 'clsx';

/**
 * Merge any number of class name values (strings, arrays, objects, falsy) into
 * a single space-separated className string.
 *
 * @example cn('btn', isPrimary && 'primary', { disabled: !enabled })
 */
export function cn(...args: ClassValue[]): string {
  return clsx(...args);
}

export default cn;
