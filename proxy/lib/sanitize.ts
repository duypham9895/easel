/**
 * Sanitize user-provided strings before passing to AI prompts.
 * Strips control characters and newlines to prevent prompt injection.
 */
export function sanitizeInput(input: string, maxLength: number): string {
  if (typeof input !== 'string') return '';
  return input
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\n+/g, ' ')             // Newlines to single space
    .trim()
    .slice(0, maxLength);
}
