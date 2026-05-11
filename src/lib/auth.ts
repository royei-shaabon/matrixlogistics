import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable must be set in production");
  }
  return new TextEncoder().encode(secret || "matrix-supply-secret-key-change-in-production");
}

const COOKIE_NAME = "matrix_session";

export interface SessionPayload {
  userId: string;
  email: string;
  globalRole: "user" | "super_admin";
  globalStatus: "active" | "blocked";
  currentEnvironmentId?: string;
  environmentRole?: "user" | "environment_admin";
  environmentStatus?: "pending" | "approved" | "blocked";
}

export function isEnvAdmin(session: SessionPayload): boolean {
  return session.globalRole === "super_admin" || session.environmentRole === "environment_admin";
}

export async function createSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

const SECURE = process.env.NODE_ENV === "production" ? "; Secure" : "";

export function setSessionCookie(response: Response, token: string): Response {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Lax${SECURE}; Max-Age=${7 * 24 * 3600}`
  );
  return response;
}

export function clearSessionCookie(response: Response): Response {
  response.headers.append(
    "Set-Cookie",
    `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
  return response;
}

export function getTokenFromRequest(request: Request): string | null {
  const cookie = request.headers.get("cookie") || "";
  const match = cookie.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
  return match ? match[1] : null;
}
