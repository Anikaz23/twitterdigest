import crypto from "crypto";
import { NextRequest } from "next/server";
import { getSetting } from "@/lib/backend/db/repository";

function timingSafeMatch(expected: string, actual: string): boolean {
  const a = Buffer.from(expected);
  const b = Buffer.from(actual);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function readBearerToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  const token = auth.slice("Bearer ".length).trim();
  return token || null;
}

function getRequestIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function checkCronAuth(req: NextRequest): Promise<{ ok: boolean; status: number; error?: string }> {
  const expectedFromDb = (await getSetting("cron_secret"))?.trim() || "";
  const expected = expectedFromDb || (process.env.CRON_SECRET?.trim() || "");
  if (!expected) {
    return { ok: false, status: 503, error: "CRON_SECRET is not configured." };
  }

  const bearer = readBearerToken(req);
  const header = req.headers.get("x-cron-secret")?.trim() || null;
  const provided = bearer || header;
  if (!provided || !timingSafeMatch(expected, provided)) {
    return { ok: false, status: 401, error: "Unauthorized cron request." };
  }

  return { ok: true, status: 200 };
}

export function checkAdminAuth(req: NextRequest): { ok: boolean; status: number; error?: string } {
  const secret = process.env.ADMIN_SECRET?.trim();
  if (!secret) {
    return { ok: false, status: 503, error: "ADMIN_SECRET is not configured." };
  }
  const provided = readBearerToken(req) || req.headers.get("x-admin-secret")?.trim() || "";
  if (!provided || !timingSafeMatch(secret, provided)) {
    return { ok: false, status: 401, error: "Unauthorized." };
  }
  return { ok: true, status: 200 };
}

export async function checkWorkerAuth(req: NextRequest): Promise<{ ok: boolean; status: number; error?: string }> {
  const token = process.env.WORKER_API_TOKEN?.trim() || "";
  const allowedIpFromDb = (await getSetting("worker_allowed_ip"))?.trim() || "";
  const allowedIp = allowedIpFromDb || (process.env.WORKER_ALLOWED_IP?.trim() || "");

  // Closed by default unless both token and allowed ip are configured.
  if (!token || !allowedIp) {
    return { ok: false, status: 404, error: "Worker endpoint is disabled." };
  }

  const requestIp = getRequestIp(req);
  if (requestIp !== allowedIp) {
    return { ok: false, status: 403, error: "Request IP is not allowed." };
  }

  const bearer = readBearerToken(req) || req.headers.get("x-worker-token")?.trim() || "";
  if (!bearer || !timingSafeMatch(token, bearer)) {
    return { ok: false, status: 401, error: "Unauthorized worker request." };
  }

  return { ok: true, status: 200 };
}
