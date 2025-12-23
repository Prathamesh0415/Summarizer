import { NextRequest } from "next/server";

export function getAuthContext(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const role = req.headers.get("x-user-role");
  const sessionId = req.headers.get("x-session-id");

  if (!userId || !role || !sessionId) {
    throw new Error("Auth context missing");
  }

  return {
    userId,
    role,
    sessionId,
  };
}
