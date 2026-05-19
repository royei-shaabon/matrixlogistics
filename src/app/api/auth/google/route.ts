import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";
import crypto, { createHmac } from "crypto";

// Firebase Hosting strips all cookies except __session before forwarding to Cloud Run.
// Solution: stateless HMAC-signed state — no cookie needed.

function getOAuthSecret(): string {
  return process.env.JWT_SECRET || "matrix-supply-secret-key-change-in-production";
}

export function generateOAuthState(): string {
  const nonce = crypto.randomBytes(16).toString("hex");
  const ts = Date.now().toString();
  const sig = createHmac("sha256", getOAuthSecret()).update(`${nonce}:${ts}`).digest("hex");
  return `${nonce}.${ts}.${sig}`;
}

export function verifyOAuthState(state: string): boolean {
  const parts = state.split(".");
  if (parts.length !== 3) return false;
  const [nonce, ts, sig] = parts;
  const age = Date.now() - parseInt(ts, 10);
  if (isNaN(age) || age < 0 || age > 10 * 60 * 1000) return false;
  const expected = createHmac("sha256", getOAuthSecret()).update(`${nonce}:${ts}`).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(sig, "hex"), Buffer.from(expected, "hex"));
}

// GET — initiate server-side Google OAuth
export async function GET(_req: NextRequest) {
  const state = generateOAuthState();
  const APP_URL = process.env.APP_URL || "https://get-supply.web.app";
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${APP_URL}/api/auth/google/callback`,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });
  // Direct redirect — no cookie needed (state is self-validating via HMAC)
  return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
}

export async function POST(req: NextRequest) {
  const { token } = await req.json();
  if (!token) return NextResponse.json({ error: "Token חסר" }, { status: 400 });

  const adminAuth = getAdminAuth();
  const db = getAdminDb();

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(token);
  } catch {
    return NextResponse.json({ error: "Token לא תקין" }, { status: 401 });
  }

  const uid = decoded.uid;
  const email = decoded.email || "";
  const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "";

  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();

  if (!doc.exists) {
    // Check by email
    const byEmail = await db.collection(COLLECTIONS.users).where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      const existing = byEmail.docs[0];
      const data = existing.data();
      if (data.globalStatus === "blocked") {
        return NextResponse.json({ error: "חשבונך חסום" }, { status: 403 });
      }
      const effectiveRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
      const sessionToken = await createSession({
        userId: existing.id,
        email,
        globalRole: effectiveRole,
        globalStatus: data.globalStatus || "active",
      });
      const res = NextResponse.json({ ok: true, globalRole: effectiveRole });
      return setSessionCookie(res, sessionToken);
    }
    return NextResponse.json({ needsRegistration: true });
  }

  const data = doc.data()!;
  if (data.globalStatus === "blocked") {
    return NextResponse.json({ error: "חשבונך חסום" }, { status: 403 });
  }

  const effectiveRole = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
  const sessionToken = await createSession({
    userId: uid,
    email,
    globalRole: effectiveRole,
    globalStatus: data.globalStatus || "active",
  });

  const res = NextResponse.json({ ok: true, globalRole: effectiveRole });
  return setSessionCookie(res, sessionToken);
}
