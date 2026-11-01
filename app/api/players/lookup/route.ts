import { z } from "zod";
import { AluProviderError, lookupAluPlayer } from "@/lib/alu-player";

const lookupInput = z.object({
  playerId: z.string().regex(/^(?=.*[1-9])\d{1,20}$/),
  serverId: z.string().regex(/^(?=.*[1-9])\d{1,20}$/),
});

const rateWindowMs = 60_000;
const clientRequestLimit = 10;
const processRequestLimit = 45;
const maxRateBuckets = 10_000;
const rateCounters = new Map<string, { count: number; resetAt: number }>();
let processCounter = { count: 0, resetAt: 0 };

function isRateLimited(request: Request) {
  const now = Date.now();
  if (processCounter.resetAt <= now) processCounter = { count: 0, resetAt: now + rateWindowMs };
  processCounter.count += 1;
  if (processCounter.count > processRequestLimit) return true;

  for (const [key, bucket] of rateCounters) {
    if (bucket.resetAt <= now) rateCounters.delete(key);
  }
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const clientIp = (request.headers.get("x-real-ip")?.trim() || forwardedFor || "unknown").slice(0, 64);
  if (!rateCounters.has(clientIp) && rateCounters.size >= maxRateBuckets) return true;
  const bucket = rateCounters.get(clientIp) ?? { count: 0, resetAt: now + rateWindowMs };
  bucket.count += 1;
  rateCounters.set(clientIp, bucket);
  return bucket.count > clientRequestLimit;
}

function unavailable(message: string, status = 503) {
  return Response.json({ status: "unavailable", message }, {
    status,
    headers: {
      "Cache-Control": "no-store",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}

export async function POST(request: Request) {
  if (!process.env.ALU_API_KEY) {
    return unavailable("Player lookup is not configured.");
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return Response.json(
      { status: "error", message: "Request body is missing." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 1024) {
        await reader.cancel();
        return Response.json(
          { status: "error", message: "Request body is too large." },
          { status: 413, headers: { "Cache-Control": "no-store" } },
        );
      }
      chunks.push(value);
    }
  } catch {
    reader.releaseLock();
    return Response.json(
      { status: "error", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  reader.releaseLock();
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  let body: unknown;
  try {
    body = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return Response.json(
      { status: "error", message: "Invalid request body." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  const parsed = lookupInput.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { status: "error", message: "Enter positive whole numbers for Player ID and Server ID." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (isRateLimited(request)) {
    return unavailable("Player lookup rate limit reached. Try again shortly.", 429);
  }

  try {
    const data = await lookupAluPlayer(parsed.data.playerId, parsed.data.serverId);
    return Response.json({ status: "ready", data }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AluProviderError) {
      if (error.status === 401) return unavailable("Player lookup credentials were rejected.", 502);
      if (error.status === 403) {
        const message = error.code === "IP_NOT_ALLOWED"
          ? "ALU rejected the lookup: this server IP is not whitelisted."
          : error.code === "DAILY_LIMIT_REACHED" || error.code === "FREE_DAILY_LIMIT_REACHED"
            ? "ALU daily lookup quota has been reached."
            : "ALU denied access to the player lookup.";
        return Response.json(
          {
            status: "unavailable",
            message,
            providerStatus: 403,
            ...(error.code ? { providerCode: error.code } : {}),
          },
          { status: 503, headers: { "Cache-Control": "no-store" } },
        );
      }
      if (error.status === 404 || error.status === 400) {
        return Response.json(
          { status: "not_found", message: "No player was found for this ID and Server ID." },
          { status: 404, headers: { "Cache-Control": "no-store" } },
        );
      }
      if (error.status === 429) return unavailable("Player lookup provider rate limit reached.", 429);
      return unavailable("Player lookup provider is unavailable.", 502);
    }
    if (error instanceof Error && error.name === "TimeoutError") {
      return unavailable("Player lookup timed out. Try again later.", 504);
    }
    return unavailable("Player lookup response could not be verified.", 502);
  }
}
