import { SignJWT, jwtVerify } from "jose";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  // Don't throw at module-load on Vercel-like edges; throw lazily when used.
  console.warn("[jwt] JWT_SECRET is not set. Authentication will fail until configured.");
}

const secretKey = () => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET environment variable is required");
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export type JWTPayload = {
  sub: string;        // userId
  email: string;
  role: "ADMIN" | "MEMBER";
  name: string;
};

const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .setIssuer("team-task-manager")
    .sign(secretKey());
}

export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey(), { issuer: "team-task-manager" });
    if (
      typeof payload.sub === "string" &&
      typeof payload.email === "string" &&
      typeof payload.role === "string" &&
      typeof payload.name === "string"
    ) {
      return {
        sub: payload.sub,
        email: payload.email as string,
        role: payload.role as "ADMIN" | "MEMBER",
        name: payload.name as string,
      };
    }
    return null;
  } catch {
    return null;
  }
}
