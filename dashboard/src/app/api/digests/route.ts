import { NextRequest, NextResponse } from "next/server";
import { getDigests, getDigestById, getTotalDigestCount } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    if (id) {
      const digest = getDigestById(parseInt(id, 10));
      if (!digest) {
        return NextResponse.json({ error: "Digest not found" }, { status: 404 });
      }
      return NextResponse.json(digest);
    }

    const digests = getDigests(limit, offset);
    const total = getTotalDigestCount();

    return NextResponse.json({
      digests,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + digests.length < total,
      },
    });
  } catch (error) {
    console.error("Error fetching digests:", error);
    return NextResponse.json({ error: "Failed to fetch digests" }, { status: 500 });
  }
}
