/**
 * Platform-agnostic configuration (no Edge features)
 *
 * Use this file when deploying to:
 * - Netlify
 * - Cloudflare Pages
 * - Docker / self-hosted
 * - Any non-Vercel platform
 *
 * To use: Copy this file to platform.ts
 */

// No special runtime
export const runtime = undefined;

// Standard fetch without platform-specific caching
export async function platformFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    cache: "no-store", // Always fetch fresh
  });
}

// Standard headers
export function getPlatformHeaders(): HeadersInit {
  return {};
}
