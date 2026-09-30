/**
 * Generic detector for development/placeholder copy. Used to stop
 * placeholder result text from ever reaching production activation --
 * never keyed to a specific test id, only to the shape of the text itself.
 */
const PLACEHOLDER_MARKERS = [/\[PLACEHOLDER\b/i, /\bTODO\b/, /\bTBD\b/, /\bFIXME\b/, /\blorem ipsum\b/i];

export function containsPlaceholderText(value: unknown): boolean {
  if (typeof value !== 'string' || value.length === 0) return false;
  return PLACEHOLDER_MARKERS.some((pattern) => pattern.test(value));
}
