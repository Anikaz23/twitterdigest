import { NextRequest, NextResponse } from "next/server";
import { getDigests, getTotalDigestCount } from "@/lib/backend/db/repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit") || "20");
    const offsetRaw = Number(searchParams.get("offset") || "0");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;
    const offset = Number.isFinite(offsetRaw) ? Math.max(offsetRaw, 0) : 0;

    const [digests, total] = await Promise.all([getDigests(limit, offset), getTotalDigestCount()]);

    return NextResponse.json({
      digests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + digests.length < total,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch digests" }, { status: 500 });
  }
}
