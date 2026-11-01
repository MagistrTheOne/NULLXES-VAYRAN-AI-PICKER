import "server-only";
import { cacheLife } from "next/cache";
import { z } from "zod";
import { HEROES, type Hero, type Role } from "./heroes";
import type { CatalogData, HeroProfileData, RankingsData } from "./provider-data";

const base = "https://mlbbdex.com";
const sourceSchema = z.object({ name: z.string().min(1), url: z.url(), license: z.string().min(1) });
const slugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80);
const laneSchema = z.enum(["Exp", "Jungle", "Mid", "Gold", "Roam"]);
const heroSchema = z.object({ slug: slugSchema, name: z.string().min(1), title: z.string(), roles: z.array(z.enum(["Tank", "Fighter", "Assassin", "Mage", "Marksman", "Support"])), lanes: z.array(laneSchema), specialties: z.array(z.string()) });
const catalogSchema = z.object({ data: z.array(heroSchema), total: z.number().int().nonnegative(), source: sourceSchema });
const rate = z.number().min(0).max(100);
const rankingSchema = z.object({ slug: slugSchema, name: z.string().min(1), tier: z.string(), winRate: rate, banRate: rate, pickRate: rate, score: z.number(), lowSample: z.boolean() });
const rankingsSchema = z.object({ data: z.object({ measuredAt: z.iso.datetime(), heroes: z.array(rankingSchema) }), total: z.number().int().nonnegative(), source: sourceSchema });
const imagePath = z.string().regex(/^\/visuels\/heros\/[a-z0-9-]+\/[a-z0-9/_.-]+$/);
const profileSchema = z.object({ data: heroSchema.extend({ skills: z.array(z.object({ name: z.string() })), images: z.object({ portrait: imagePath.optional(), icon: imagePath.optional() }).default({}) }), source: sourceSchema });
const laneMap: Record<z.infer<typeof laneSchema>, Role> = { Exp: "EXP", Jungle: "JUNGLE", Mid: "MID", Gold: "GOLD", Roam: "ROAM" };

async function request(path: string): Promise<unknown> {
  const response = await fetch(`${base}/api/v1/${path}`, {
    signal: AbortSignal.timeout(15000),
    headers: { Accept: "application/json" },
    // Cache only validated results in the enclosing Next.js cache function.
    cache: "no-store",
  });
  if (!response.ok) throw new Error(`MLBBDex returned HTTP ${response.status}`);
  if (!response.headers.get("content-type")?.includes("application/json")) throw new Error("MLBBDex returned a non-JSON response");
  return response.json();
}
function verifyList(total: number, slugs: string[]) {
  if (total !== slugs.length || new Set(slugs).size !== slugs.length || total === 0) throw new Error("MLBBDex returned an empty, incomplete or duplicate catalog");
}

export async function getCatalog(): Promise<CatalogData> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  const result = catalogSchema.parse(await request("heroes"));
  verifyList(result.total, result.data.map(hero => hero.slug));
  const existing = new Map(HEROES.map(hero => [hero.name.toLowerCase().replace(/[^a-z0-9]/g, ""), hero.id]));
  const heroes = new Map<string, Hero>(HEROES.map(hero => [hero.id, hero]));
  const mappedIds = new Set<string>();
  for (const hero of result.data) {
    const id = existing.get(hero.name.toLowerCase().replace(/[^a-z0-9]/g, "")) ?? hero.slug;
    if (mappedIds.has(id)) throw new Error("Ambiguous provider hero identity");
    mappedIds.add(id);
    heroes.set(id, { id, name: hero.name, title: hero.title, providerSlug: hero.slug, classes: hero.roles, roles: hero.lanes.map(lane => laneMap[lane]), specialties: hero.specialties });
  }
  return { heroes: [...heroes.values()].sort((a, b) => a.name.localeCompare(b.name, "en")), source: result.source, fetchedAt: new Date().toISOString(), total: result.total, retained: [...heroes.keys()].filter(id => !mappedIds.has(id)).length };
}

export async function getRankings(): Promise<RankingsData> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  const result = rankingsSchema.parse(await request("rankings"));
  verifyList(result.total, result.data.heroes.map(hero => hero.slug));
  return { ...result.data, total: result.total, source: result.source, fetchedAt: new Date().toISOString(), population: "unspecified" };
}

export async function getHeroProfile(slug: string): Promise<HeroProfileData> {
  "use cache";
  cacheLife({ stale: 3600, revalidate: 3600, expire: 86400 });
  slugSchema.parse(slug);
  const result = profileSchema.parse(await request(`heroes/${slug}`));
  if (result.data.slug !== slug) throw new Error("Provider returned a different hero");
  return { ...result.data, source: result.source, imageReuse: "unverified" };
}
