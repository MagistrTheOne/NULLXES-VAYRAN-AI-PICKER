import { z } from "zod";
import { ROLES, RANKS } from "@/lib/heroes";
import { DATA_WINDOWS } from "@/lib/provider-data";
import { getCatalog } from "@/lib/mlbbdex";
import { getDraftCounterData, getHeroLaneTimeline, getRankStats, getSynergy, providerRank } from "@/lib/rone";

const roleSlots = z.object({
  EXP: z.string().max(80).optional(),
  JUNGLE: z.string().max(80).optional(),
  MID: z.string().max(80).optional(),
  GOLD: z.string().max(80).optional(),
  ROAM: z.string().max(80).optional(),
}).strict();
const daysInput = z.number().refine(
  (value): value is (typeof DATA_WINDOWS)[number] => DATA_WINDOWS.some(day => day === value),
);
const input = z.object({
  rank: z.enum(RANKS),
  days: daysInput,
  picks: z.object({
    ally: roleSlots,
    enemy: roleSlots,
  }).strict(),
  bans: z.object({
    ally: z.array(z.string().max(80)).max(5).refine(ids => new Set(ids).size === ids.length),
    enemy: z.array(z.string().max(80)).max(5).refine(ids => new Set(ids).size === ids.length),
  }).strict(),
}).strict();

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 16_384) {
    return Response.json({ status: "error", message: "Draft analysis request is too large." }, { status: 413 });
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return Response.json({ status: "error", message: "Draft analysis request is missing." }, { status: 400 });
  }
  const chunks: Uint8Array[] = [];
  let byteLength = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      byteLength += value.byteLength;
      if (byteLength > 16_384) {
        await reader.cancel();
        reader.releaseLock();
        return Response.json({ status: "error", message: "Draft analysis request is too large." }, { status: 413 });
      }
      chunks.push(value);
    }
  } catch {
    reader.releaseLock();
    return Response.json({ status: "error", message: "Unable to read draft analysis request." }, { status: 400 });
  }
  reader.releaseLock();
  const bytes = new Uint8Array(byteLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    return Response.json({ status: "error", message: "Draft analysis request is not valid JSON." }, { status: 400 });
  }

  let body: z.infer<typeof input>;
  try {
    body = input.parse(payload);
  } catch {
    return Response.json({ status: "error", message: "Invalid draft analysis request." }, { status: 400 });
  }

  if (!providerRank(body.rank)) {
    return Response.json(
      { status: "unsupported", message: "Rone does not provide Mythical Immortal data; no other rank is substituted." },
      { status: 422, headers: { "Cache-Control": "no-store" } },
    );
  }

  const slots = (["ally", "enemy"] as const).flatMap(team =>
    ROLES.flatMap(role => {
      const heroId = body.picks[team][role];
      return heroId ? [{ team, role, heroId }] : [];
    }),
  );
  const heroIds = slots.map(slot => slot.heroId);
  const bannedIds = [...body.bans.ally, ...body.bans.enemy];
  if (
    new Set(heroIds).size !== heroIds.length ||
    heroIds.some(id => bannedIds.includes(id))
  ) {
    return Response.json({ status: "error", message: "A picked hero cannot be picked twice or banned." }, { status: 400 });
  }

  try {
    const catalog = await getCatalog();
    const validIds = new Set(catalog.heroes.map(hero => hero.id));
    if ([...heroIds, ...bannedIds].some(id => !validIds.has(id))) {
      return Response.json({ status: "error", message: "Draft contains an unknown hero." }, { status: 400 });
    }

    const rankData = await getRankStats(body.rank, body.days);
    const synergyResults = [];
    const unavailableSynergyHeroIds: string[] = [];
    for (const [team, opponents] of [
      ["ally", "enemy"],
      ["enemy", "ally"],
    ] as const) {
      const allies = ROLES.flatMap(role => {
        const id = body.picks[team][role];
        return id ? [id] : [];
      });
      if (!allies.length) continue;
      const result = await getSynergy(
        body.rank,
        body.days,
        allies,
        ROLES.flatMap(role => {
          const id = body.picks[opponents][role];
          return id ? [id] : [];
        }),
        bannedIds,
      );
      synergyResults.push(...result.selectedPairs);
      unavailableSynergyHeroIds.push(...result.unavailableHeroIds);
    }

    const timelines: Awaited<ReturnType<typeof getHeroLaneTimeline>>[] = [];
    const unavailableTimelineHeroIds: string[] = [];
    const counterRecords: (Awaited<ReturnType<typeof getDraftCounterData>> & { team: "ally" | "enemy" })[] = [];
    const unavailableCounterHeroIds: string[] = [];

    for (let offset = 0; offset < slots.length; offset += 2) {
      await Promise.all(slots.slice(offset, offset + 2).map(async slot => {
        try {
          timelines.push(await getHeroLaneTimeline(slot.heroId, slot.role, body.rank));
        } catch {
          unavailableTimelineHeroIds.push(slot.heroId);
        }
        try {
          counterRecords.push({ ...await getDraftCounterData(slot.heroId, body.rank, body.days), team: slot.team });
        } catch {
          unavailableCounterHeroIds.push(slot.heroId);
        }
      }));
    }

    const opponentIds = {
      ally: new Set(slots.filter(slot => slot.team === "enemy").map(slot => slot.heroId)),
      enemy: new Set(slots.filter(slot => slot.team === "ally").map(slot => slot.heroId)),
    };
    const counters = counterRecords.flatMap(record => [
      ...record.counters.map(entry => ({ ...entry, relationship: "counter" as const })),
      ...record.negative.map(entry => ({ ...entry, relationship: "negative" as const })),
    ].filter(entry => opponentIds[record.team].has(entry.heroId)).map(entry => ({
      mainHeroId: record.mainHeroId,
      counterHeroId: entry.heroId,
      mainTeam: record.team,
      counterTeam: record.team === "ally" ? "enemy" as const : "ally" as const,
      relationship: entry.relationship,
      impact: entry.impact,
      updatedAt: record.updatedAt,
    })));

    return Response.json({
      status: "ready",
      data: {
        rank: body.rank,
        days: body.days,
        fetchedAt: new Date().toISOString(),
        populationNote: rankData.populationNote,
        rankData,
        timelines,
        counters,
        synergyPairs: synergyResults,
        unavailableSynergyHeroIds: [...new Set(unavailableSynergyHeroIds)],
        unavailableTimelineHeroIds: [...new Set(unavailableTimelineHeroIds)],
        unavailableCounterHeroIds: [...new Set(unavailableCounterHeroIds)],
      },
    }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json(
      { status: "error", message: "Rank-scoped draft data is temporarily unavailable." },
      { status: 502, headers: { "Cache-Control": "no-store" } },
    );
  }
}
