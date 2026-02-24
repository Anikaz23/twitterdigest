import { NextRequest, NextResponse } from "next/server";
import { getDigestById } from "@/lib/backend/db/repository";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const parsed = Number(id);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return NextResponse.json({ error: "Invalid digest id" }, { status: 400 });
    }

    const digest = await getDigestById(parsed);
    if (!digest) {
      return NextResponse.json({ error: "Digest not found" }, { status: 404 });
    }

    return NextResponse.json(digest);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch digest" }, { status: 500 });
  }
}
