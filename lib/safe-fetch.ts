/** Parse response safely — never throws on non-JSON (413, 500 plain text, etc.) */
export async function safeJson(res: Response): Promise<{ ok: boolean; data: any; error: string | null }> {
  const ct = res.headers.get('content-type') || ''
  if (!res.ok) {
    if (ct.includes('application/json')) {
      try {
        const d = await res.json()
        return { ok: false, data: null, error: d.error || d.message || `Error ${res.status}` }
      } catch {}
    }
    if (res.status === 413) return { ok: false, data: null, error: 'File too large. Please reduce the file size and try again.' }
    const text = await res.text().catch(() => '')
    return { ok: false, data: null, error: text || `Server error (${res.status})` }
  }
  try {
    const data = await res.json()
    return { ok: true, data, error: null }
  } catch {
    return { ok: true, data: null, error: null }
  }
}

const MB = 1024 * 1024
/** Returns an error string if any file exceeds the limit, otherwise null */
export function checkFileSizes(files: File[], limitMb = 8): string | null {
  for (const f of files) {
    if (f.size > limitMb * MB) {
      return `"${f.name}" is ${(f.size / MB).toFixed(1)} MB — max ${limitMb} MB per file.`
    }
  }
  return null
}
