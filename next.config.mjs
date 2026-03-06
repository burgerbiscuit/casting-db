/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  experimental: {
    serverActions: { bodySizeLimit: '50mb' },
  },
  headers: async () => [{
    source: '/(.*)',
    headers: [
      // Prevent clickjacking
      { key: 'X-Frame-Options', value: 'DENY' },
      // Prevent MIME sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Referrer policy
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // XSS protection (legacy browsers)
      { key: 'X-XSS-Protection', value: '1; mode=block' },
      // Force HTTPS for 1 year
      { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
      // Disable browser features that aren't needed
      { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
      // Content Security Policy
      {
        key: 'Content-Security-Policy',
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          "font-src 'self' https://fonts.gstatic.com",
          "img-src 'self' data: blob: https://yayrsksrgrsjxcewwwlg.supabase.co https://*.supabase.co",
          "media-src 'self' blob: https://yayrsksrgrsjxcewwwlg.supabase.co https://*.supabase.co",
          "connect-src 'self' https://yayrsksrgrsjxcewwwlg.supabase.co https://*.supabase.co wss://*.supabase.co",
          "frame-ancestors 'none'",
        ].join('; ')
      },
    ]
  }]
}

export default nextConfig
