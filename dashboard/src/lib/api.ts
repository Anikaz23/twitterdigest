import { platformFetch } from "./platform";
import type { Digest, DigestListResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:8080";

export async function getLatestDigest(): Promise<Digest | null> {
  try {
    const res = await platformFetch(`${API_URL}/digests/latest`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch latest digest:", error);
    return null;
  }
}

export async function getDigests(limit = 20, offset = 0): Promise<DigestListResponse> {
  try {
    const res = await platformFetch(`${API_URL}/digests?limit=${limit}&offset=${offset}`);
    if (!res.ok) {
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch digests:", error);
    return {
      digests: [],
      pagination: { total: 0, limit, offset, hasMore: false },
    };
  }
}

export async function getDigestById(id: number): Promise<Digest | null> {
  try {
    const res = await platformFetch(`${API_URL}/digests/${id}`);
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`API error: ${res.status}`);
    }
    return res.json();
  } catch (error) {
    console.error("Failed to fetch digest:", error);
    return null;
  }
}
