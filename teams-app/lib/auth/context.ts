import { NextRequest } from "next/server";

export function getAuthContext(req: NextRequest) {
  const userId = req.headers.get("x-user-id");
  const sessionId = req.headers.get("x-session-id");

  if (!userId || !sessionId) {
    throw new Error("Auth context missing");
  }

  return {
    userId,
    sessionId,
  };
}
