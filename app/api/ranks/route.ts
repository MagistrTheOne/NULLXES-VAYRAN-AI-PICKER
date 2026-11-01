import { RANKS } from "@/lib/heroes";
import { DATA_WINDOWS } from "@/lib/provider-data";
import { getRankStats, providerRank } from "@/lib/rone";
export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const rank = RANKS.find(value => value === query.get("rank"));
  const days = DATA_WINDOWS.find(value => value === Number(query.get("days") ?? 7));
  if (!rank || !days) return Response.json({ status: "error", message: "Invalid rank or data window." }, { status: 400 });
  if (!providerRank(rank)) return Response.json({ status: "unsupported", message: "Mythical Immortal is not supported by the provider. Glory data is not substituted." }, { status: 422 });
  try { return Response.json({ status: "ready", data: await getRankStats(rank, days) }, { headers: { "Cache-Control": "public, max-age=60" } }); }
  catch { return Response.json({ status: "error", message: "Rank statistics unavailable or failed validation." }, { status: 502, headers: { "Cache-Control": "no-store" } }); }
}
