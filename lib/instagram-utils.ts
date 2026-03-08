/**
 * Clean Instagram handles: remove URLs, @symbols, slashes, query params, whitespace
 * Always returns a clean handle or null
 */
export function cleanInstagramHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;

  let clean = String(handle).trim();

  // Remove http(s)://
  clean = clean.replace(/^https?:\/\//, '');

  // Remove instagram.com/ and www.instagram.com/
  clean = clean.replace(/^(www\.)?instagram\.com\//, '');

  // Remove leading @ symbols
  clean = clean.replace(/^@+\s*/, '');

  // Remove trailing slashes
  while (clean.endsWith('/')) {
    clean = clean.slice(0, -1);
  }

  // Remove query parameters (igsh=..., utm_source=..., hl=..., etc.)
  if (clean.includes('?')) {
    clean = clean.split('?')[0];
  }

  // Final trim
  clean = clean.trim();

  // Return null if empty after cleaning
  return clean || null;
}

/**
 * Format Instagram handle for display: adds @ prefix if not present
 */
export function formatInstagramHandle(handle: string | null | undefined): string | null {
  if (!handle) return null;
  const clean = cleanInstagramHandle(handle);
  if (!clean) return null;
  return clean.startsWith('@') ? clean : `@${clean}`;
}

/**
 * Get Instagram URL for a handle
 */
export function getInstagramUrl(handle: string | null | undefined): string | null {
  const clean = cleanInstagramHandle(handle);
  if (!clean) return null;
  return `https://instagram.com/${clean}`;
}
