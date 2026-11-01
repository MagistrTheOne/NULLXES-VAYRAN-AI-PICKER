import "server-only";

import { cacheLife } from "next/cache";
import { z } from "zod";

const playerLookupResponse = z.object({
  success: z.literal(true),
  user_id: z.string().regex(/^\d+$/),
  server_id: z.string().regex(/^\d+$/),
  username: z.string().min(1),
  country: z.string().nullable().optional(),
});

export type PlayerProfile = {
  playerId: string;
  serverId: string;
  nickname: string;
  country?: string;
};

export class AluProviderError extends Error {
  constructor(readonly status: number, readonly code?: string) {
    super(`ALU player lookup returned HTTP ${status}`);
    this.name = "AluProviderError";
  }
}

async function cachedPlayerLookup(
  playerId: string,
  serverId: string,
  apiKey: string,
): Promise<PlayerProfile> {
  "use cache";
  cacheLife({ stale: 86400, revalidate: 86400, expire: 86400 });

  const url = new URL("https://aluu.in/api/check/mlbb-check");
  url.searchParams.set("user_id", playerId);
  url.searchParams.set("server_id", serverId);

  const response = await fetch(url, {
    headers: { Accept: "application/json", "x-api-key": apiKey },
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok) {
    let code: string | undefined;
    try {
      const errorPayload = z.object({ code: z.string().optional() }).passthrough().parse(await response.json());
      code = errorPayload.code;
    } catch {
      code = undefined;
    }
    throw new AluProviderError(response.status, code);
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("ALU returned an invalid JSON response");
  }
  const result = playerLookupResponse.parse(payload);
  if (result.user_id !== playerId || result.server_id !== serverId) {
    throw new Error("ALU returned identifiers that do not match the request");
  }

  return {
    playerId: result.user_id,
    serverId: result.server_id,
    nickname: result.username,
    ...(result.country ? { country: result.country } : {}),
  };
}

export function lookupAluPlayer(playerId: string, serverId: string) {
  const apiKey = process.env.ALU_API_KEY;
  if (!apiKey) throw new Error("ALU_API_KEY is not configured");
  return cachedPlayerLookup(playerId, serverId, apiKey);
}
