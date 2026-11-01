import { z } from "zod";
import { RANKS } from "@/lib/heroes";
import { DATA_WINDOWS } from "@/lib/provider-data";
import { getCatalog } from "@/lib/mlbbdex";
import { getSynergy, providerRank } from "@/lib/rone";
const heroIds = z.array(z.string().max(80));
const uniqueHeroIds = heroIds.refine(ids => new Set(ids).size === ids.length);
const input = z.object({
  rank: z.enum(RANKS),
  days: z.number().refine(value => DATA_WINDOWS.some(day => day === value)),
  allies: uniqueHeroIds.min(1).max(5),
  enemies: uniqueHeroIds.max(5),
  bans: z.object({
    ally: uniqueHeroIds.max(5),
    enemy: uniqueHeroIds.max(5),
  }),
});
export async function POST(request: Request) {
  if (Number(request.headers.get("content-length")) > 32768) return Response.json({ status: "error", message: "Draft payload too large." }, { status: 413 });
  let body: z.infer<typeof input>;
  const reader = request.body?.getReader();
  if (!reader) return Response.json({ status: "error", message: "Draft payload is missing." }, { status: 400 });
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  let tooLarge = false;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 32768) {
        tooLarge = true;
        break;
      }
      chunks.push(value);
    }
  } catch {
    reader.releaseLock();
    return Response.json({ status: "error", message: "Unable to read draft payload." }, { status: 400 });
  }
  reader.releaseLock();
  if (tooLarge) return Response.json({ status: "error", message: "Draft payload too large." }, { status: 413 });
  try {
    const bytes = new Uint8Array(byteLength);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
    body = input.parse(JSON.parse(text));
  }
  catch { return Response.json({ status: "error", message: "Invalid draft. Select at least one allied hero." }, { status: 400 }); }
  if (!providerRank(body.rank)) return Response.json({ status: "unsupported", message: "Mythical Immortal compatibility is unsupported. No substitute rank is used." }, { status: 422 });
  const picks = [...body.allies, ...body.enemies];
  const bans = [...body.bans.ally, ...body.bans.enemy];
  const banned = new Set(bans);
  if (new Set(picks).size !== picks.length || picks.some(id => banned.has(id))) {
    return Response.json({ status: "error", message: "A picked hero cannot be picked twice or banned." }, { status: 400 });
  }
  const all = [...picks, ...bans];
  try {
    const catalog = await getCatalog();
    if (all.some(id => !catalog.heroes.some(hero => hero.id === id))) return Response.json({ status: "error", message: "Draft contains an unknown hero." }, { status: 400 });
    const days = DATA_WINDOWS.find(day => day === body.days)!;
    return Response.json({ status: "ready", data: await getSynergy(body.rank, days, body.allies, body.enemies, [...new Set(bans)]) }, { headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ status: "error", message: "Compatibility data unavailable or failed validation." }, { status: 502 }); }
}
