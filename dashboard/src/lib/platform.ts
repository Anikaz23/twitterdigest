/**
 * Platform-specific configuration for Vercel Edge
 *
 * ⚡ THIS IS THE ONLY FILE TO CHANGE WHEN SWITCHING PLATFORMS
 *
 * To switch to another platform:
 * 1. Copy platform.standard.ts to platform.ts
 * 2. Or create a platform-specific version
 */

// Vercel Edge runtime - comment out for other platforms
export const runtime = "edge";

// Vercel-specific fetch with caching
export async function platformFetch(url: string, options?: RequestInit) {
  return fetch(url, {
    ...options,
    // Vercel-specific: revalidate cache every 5 minutes
    next: { revalidate: 300 },
  });
}

// Vercel-specific headers for edge
export function getPlatformHeaders(): HeadersInit {
  return {
    "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
  };
}
