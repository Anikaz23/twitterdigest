import { NextRequest, NextResponse } from "next/server";
import { getDigestById, getTweetsForDigest } from "@/lib/backend/db/repository";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const digestId = Number(id);
    if (!Number.isFinite(digestId) || digestId <= 0) {
      return NextResponse.json({ error: "Invalid digest id" }, { status: 400 });
    }

    const { searchParams } = new URL(req.url);
    const limitRaw = Number(searchParams.get("limit") || "40");
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 40;

    const tweets = await getTweetsForDigest(digestId, limit);
    if (tweets.length === 0) {
      const digest = await getDigestById(digestId);
      if (!digest) {
        return NextResponse.json({ error: "Digest not found" }, { status: 404 });
      }
    }

    return NextResponse.json({
      digestId,
      tweets,
      count: tweets.length,
    }, {
      headers: {
        "Cache-Control": "private, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to load digest tweets" }, { status: 500 });
  }
}
