import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { getCatalog } from "./mlbbdex";
import { type Rank } from "./heroes";
import { DATA_WINDOWS, type DataWindow, type RankData, type SynergyData, type SynergyPair } from "./provider-data";

const rankCodes: Partial<Record<Rank, string>> = { Legend: "legend", Mythic: "mythic", "Mythical Honor": "honor", "Mythical Glory": "glory" };
export function providerRank(rank: Rank) { return rankCodes[rank]; }
const populationNote = "Provider rank filter; exact star boundaries and overlap are not supplied. Glory is not an Immortal-specific population. Sample counts and current patch are unavailable.";
const fraction = z.number().min(0).max(1);
const main = z.object({ main_heroid: z.number().int().positive(), main_hero: z.object({ data: z.object({ name: z.string().min(1) }) }), main_hero_win_rate: fraction, main_hero_appearance_rate: fraction, main_hero_ban_rate: fraction });
const rankResponse = z.object({ code: z.literal(0), data: z.object({ total: z.number().int().nonnegative(), records: z.array(z.object({ data: main })) }) });
const pair = z.object({ heroid: z.number().int().positive(), increase_win_rate: z.number().min(-1).max(1) });
const compatibilityResponse = z.object({ code: z.literal(0), data: z.object({ records: z.array(z.object({ _updatedAt: z.number().nonnegative().optional(), data: main.extend({ sub_hero: z.array(pair), sub_hero_last: z.array(pair).optional() }) })) }) });
const indexResponse = z.object({ code: z.literal(0), data: z.object({ total: z.number().int(), records: z.array(z.object({ data: z.object({ hero_id: z.number().int().positive(), hero: z.object({ data: z.object({ name: z.string().min(1) }) }) }) })) }) });
async function request(path: string): Promise<unknown> {
  const response = await fetch(`https://arena.rone.dev/api/${path}`, { cache: "no-store", headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`Rone Arena HTTP ${response.status}`);
  return response.json();
}
function normalize(name: string) { return name.toLowerCase().replace(/[^a-z0-9]/g, ""); }
async function heroIndex() {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  const response = indexResponse.parse(await request("heroes?size=150&index=1&lang=en"));
  if (!response.data.total || response.data.records.length !== response.data.total) throw new Error("Rone hero index is incomplete");
  const catalog = await getCatalog();
  const ids = new Map(catalog.heroes.map(hero => [normalize(hero.name), hero.id]));
  const records = response.data.records.map(record => ({ providerId: record.data.hero_id, heroId: ids.get(normalize(record.data.hero.data.name)) ?? null }));
  if (new Set(records.map(row => row.providerId)).size !== records.length || new Set(records.filter(row => row.heroId).map(row => row.heroId)).size !== records.filter(row => row.heroId).length) throw new Error("Ambiguous Rone identity mapping");
  return records;
}
export async function getRankStats(rank: Rank, days: DataWindow): Promise<RankData> {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 900 });
  const code = providerRank(rank);
  if (!code || !DATA_WINDOWS.includes(days)) throw new Error("Unsupported rank or window");
  const [raw, index] = await Promise.all([request(`heroes/rank?rank=${code}&days=${days}&size=150&index=1&lang=en`), heroIndex()]);
  const response = rankResponse.parse(raw);
  if (!response.data.total || response.data.records.length !== response.data.total) throw new Error("Rank data incomplete");
  const ids = new Map(index.map(hero => [hero.providerId, hero.heroId]));
  if (new Set(response.data.records.map(row => row.data.main_heroid)).size !== response.data.total) throw new Error("Duplicate rank rows");
  return { rank, providerRank: code, days, total: response.data.total, fetchedAt: new Date().toISOString(), populationNote, rows: response.data.records.map(({ data }) => ({ heroId: ids.get(data.main_heroid) ?? null, providerId: data.main_heroid, name: data.main_hero.data.name, winRate: data.main_hero_win_rate * 100, pickRate: data.main_hero_appearance_rate * 100, banRate: data.main_hero_ban_rate * 100 })) };
}
async function compatibility(id: number, code: string, days: DataWindow) {
  "use cache";
  cacheLife({ stale: 300, revalidate: 300, expire: 900 });
  const response = compatibilityResponse.parse(await request(`heroes/${id}/compatibility?rank=${code}&days=${days}&size=1&lang=en`));
  const row = response.data.records.find(record => record.data.main_heroid === id);
  if (!row) throw new Error("No compatibility record for hero");
  return row;
}
export async function getSynergy(rank: Rank, days: DataWindow, allies: string[], enemies: string[], bans: string[]): Promise<SynergyData> {
  const code = providerRank(rank);
  if (!code) throw new Error("Unsupported rank");
  const index = await heroIndex();
  const ids = new Map(index.map(hero => [hero.heroId, hero.providerId]));
  const canonical = new Map(index.map(hero => [hero.providerId, hero.heroId]));
  const unavailableHeroIds: string[] = [];
  const pairs: SynergyPair[] = [];
  // At most two concurrent upstream lookups; successful records are cached.
  for (let offset = 0; offset < allies.length; offset += 2) {
    await Promise.all(allies.slice(offset, offset + 2).map(async allyId => {
      const id = ids.get(allyId);
      if (!id) { unavailableHeroIds.push(allyId); return; }
      try {
        const row = await compatibility(id, code, days);
        for (const [relationship, entries] of [["positive", row.data.sub_hero], ["negative", row.data.sub_hero_last ?? []]] as const) {
          for (const entry of entries) {
            const heroId = canonical.get(entry.heroid);
            if (!heroId || heroId === allyId) continue;
            pairs.push({ allyId, heroId, delta: entry.increase_win_rate * 100, relationship, recordUpdatedAt: row._updatedAt ? new Date(row._updatedAt).toISOString() : null, sourceUrl: `https://arena.rone.dev/api/heroes/${id}/compatibility?rank=${code}&days=${days}&size=1&lang=en` });
          }
        }
      } catch { unavailableHeroIds.push(allyId); }
    }));
  }
  const occupied = new Set([...allies, ...enemies, ...bans]);
  return { rank, days, populationNote, fetchedAt: new Date().toISOString(), unavailableHeroIds, candidates: pairs.filter(pair => pair.relationship === "positive" && pair.delta > 0 && !occupied.has(pair.heroId)).sort((a, b) => b.delta - a.delta).slice(0, 8), selectedPairs: pairs.filter(pair => allies.includes(pair.heroId)), };
}
