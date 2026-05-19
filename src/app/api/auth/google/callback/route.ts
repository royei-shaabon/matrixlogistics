import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, COLLECTIONS } from "@/lib/firebase-admin";
import { createSession, setSessionCookie } from "@/lib/auth";
import { verifyOAuthState } from "@/app/api/auth/google/route";

const APP_URL = process.env.APP_URL || "https://get-supply.web.app";
const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  function fail(err = "1") {
    return NextResponse.redirect(`${APP_URL}/login?error=${err}`);
  }

  if (!code || !state || !verifyOAuthState(state)) return fail();

  // Exchange code for access token
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${APP_URL}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }).toString(),
  });
  if (!tokenRes.ok) return fail();

  const { access_token } = await tokenRes.json();
  if (!access_token) return fail();

  // Get user info from Google
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });
  if (!userRes.ok) return fail();

  const { email, name }: { email: string; name: string } = await userRes.json();
  if (!email) return fail();

  // Get or create Firebase user
  const adminAuth = getAdminAuth();
  let uid: string;
  try {
    uid = (await adminAuth.getUserByEmail(email)).uid;
  } catch {
    uid = (await adminAuth.createUser({ email, displayName: name, emailVerified: true })).uid;
  }

  const db = getAdminDb();

  async function createUserSession(userId: string, userEmail: string, role: string, status: string) {
    const sessionToken = await createSession({ userId, email: userEmail, globalRole: role as "user" | "super_admin", globalStatus: status as "active" | "blocked" });
    const redirect = role === "super_admin" ? `${APP_URL}/super-admin` : `${APP_URL}/environments`;
    return setSessionCookie(NextResponse.redirect(redirect), sessionToken);
  }

  const doc = await db.collection(COLLECTIONS.users).doc(uid).get();

  if (!doc.exists) {
    // Check if registered under a different UID with same email
    const byEmail = await db.collection(COLLECTIONS.users).where("email", "==", email).limit(1).get();
    if (!byEmail.empty) {
      const data = byEmail.docs[0].data();
      if (data.globalStatus === "blocked") return NextResponse.redirect(`${APP_URL}/login?error=blocked`);
      const role = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
      return createUserSession(byEmail.docs[0].id, email, role, data.globalStatus || "active");
    }

    // New user — store custom token so complete-registration can sign them in
    const customToken = await adminAuth.createCustomToken(uid);
    const res = NextResponse.redirect(`${APP_URL}/complete-registration`);
    res.cookies.set("pending_google", JSON.stringify({ customToken, email, name }), {
      httpOnly: true, secure: true, maxAge: 600, sameSite: "lax", path: "/",
    });
    return res;
  }

  const data = doc.data()!;
  if (data.globalStatus === "blocked") return NextResponse.redirect(`${APP_URL}/login?error=blocked`);
  const role = email === SUPER_ADMIN_EMAIL ? "super_admin" : (data.globalRole || "user");
  return createUserSession(uid, email, role, data.globalStatus || "active");
}
