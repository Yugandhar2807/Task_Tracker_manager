import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { signToken, verifyToken, type JWTPayload } from "./jwt";

export const AUTH_COOKIE = "ttm_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(payload: JWTPayload): Promise<string> {
  return signToken(payload);
}

export function setAuthCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return response;
}

export function clearAuthCookie(response: NextResponse): NextResponse {
  response.cookies.set({
    name: AUTH_COOKIE,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/** Read the JWT from cookies (server components / route handlers). */
export async function getCurrentUser(): Promise<JWTPayload | null> {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Read the JWT from a NextRequest. Supports cookie + Authorization: Bearer. */
export async function getUserFromRequest(req: NextRequest): Promise<JWTPayload | null> {
  const cookieToken = req.cookies.get(AUTH_COOKIE)?.value;
  const authHeader = req.headers.get("authorization");
  const bearer = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  const token = cookieToken || bearer;
  if (!token) return null;
  return verifyToken(token);
}

/** Throw a typed Response for unauthorized / forbidden in route handlers. */
export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function requireUser(req: NextRequest): Promise<JWTPayload> {
  const user = await getUserFromRequest(req);
  if (!user) throw new HttpError(401, "Unauthorized");
  return user;
}

export async function requireAdmin(req: NextRequest): Promise<JWTPayload> {
  const user = await requireUser(req);
  if (user.role !== "ADMIN") throw new HttpError(403, "Admin access required");
  return user;
}
