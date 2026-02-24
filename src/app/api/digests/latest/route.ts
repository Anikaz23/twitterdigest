import { NextResponse } from "next/server";
import { getLatestDigest } from "@/lib/backend/db/repository";

export async function GET() {
  try {
    const digest = await getLatestDigest();
    if (!digest) {
      return NextResponse.json({ error: "No digests found" }, { status: 404 });
    }
    return NextResponse.json(digest);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to fetch latest digest" }, { status: 500 });
  }
}
