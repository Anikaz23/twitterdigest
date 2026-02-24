import { NextResponse } from "next/server";
import { buildConfigStatus, defaultConfigStatus } from "@/lib/backend/configStatus";

const adminProtected = () => !!process.env.ADMIN_SECRET?.trim();

export async function GET() {
  try {
    const status = await buildConfigStatus();
    return NextResponse.json({ ...status, admin_protected: adminProtected() });
  } catch (error) {
    console.error("Config status fallback:", error);
    const status = defaultConfigStatus({ databaseConnected: false });
    return NextResponse.json({ ...status, admin_protected: adminProtected() });
  }
}
