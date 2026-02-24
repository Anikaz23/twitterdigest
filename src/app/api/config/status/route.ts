import { NextResponse } from "next/server";
import { buildConfigStatus, defaultConfigStatus } from "@/lib/backend/configStatus";

export async function GET() {
  try {
    const status = await buildConfigStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Config status fallback:", error);
    const status = defaultConfigStatus({ databaseConnected: false });
    return NextResponse.json(status);
  }
}
