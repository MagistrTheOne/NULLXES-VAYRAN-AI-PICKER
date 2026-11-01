"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { DATA_WINDOWS, type ProviderResult, type SynergyData } from "@/lib/provider-data";
import { RANKS } from "@/lib/heroes";
import { useDataWindow, useDraft, useRank } from "./session";
import { useCatalog } from "./catalog-provider";
import { z } from "zod";

const synergyResponse = z.discriminatedUnion("status", [
  z.object({
    status: z.literal("ready"),
    data: z.object({
      rank: z.enum(RANKS),
      days: z.number().refine(
        (value): value is (typeof DATA_WINDOWS)[number] => DATA_WINDOWS.some(day => day === value),
      ),
      populationNote: z.string(),
      fetchedAt: z.string(),
      candidates: z.array(z.object({
        allyId: z.string(),
        heroId: z.string(),
        delta: z.number().min(-100).max(100),
        relationship: z.enum(["positive", "negative"]),
        recordUpdatedAt: z.string().nullable(),
        sourceUrl: z.string(),
      })),
      selectedPairs: z.array(z.object({
        allyId: z.string(),
        heroId: z.string(),
        delta: z.number().min(-100).max(100),
        relationship: z.enum(["positive", "negative"]),
        recordUpdatedAt: z.string().nullable(),
        sourceUrl: z.string(),
      })),
      unavailableHeroIds: z.array(z.string()),
    }),
  }),
  z.object({ status: z.literal("error"), message: z.string() }),
]);

export function SynergyPanel() {
  const { draft } = useDraft();
  const { rank } = useRank();
  const { days } = useDataWindow();
  const payload = JSON.stringify({ rank, days, allies: Object.values(draft.picks.ally).filter(Boolean), enemies: Object.values(draft.picks.enemy).filter(Boolean), bans: draft.bans });
  return <section className="synergy-panel">
    <h3>HERO PAIR DATA</h3>
    <p className="muted-copy">{rank} · Individual teammate-pair results, not a team prediction.</p>
    {rank === "Mythical Immortal" ? <p role="status">No pair results are available for this rank.</p> : !Object.values(draft.picks.ally).some(Boolean) ? <p>Select an allied hero to see pair results.</p> : <SynergyResults key={payload} payload={payload} rank={rank} days={days} />}
  </section>;
}

function SynergyResults({ payload, rank, days }: { payload: string; rank: (typeof RANKS)[number]; days: (typeof DATA_WINDOWS)[number] }) {
  const { heroes } = useCatalog();
  const [result, setResult] = useState<ProviderResult<SynergyData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/synergy", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal }).then(async response => {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          throw new Error(`Pair analysis returned an unreadable response (HTTP ${response.status}).`);
        }
        const parsed = synergyResponse.safeParse(body);
        if (!parsed.success) throw new Error("Pair analysis response did not match the expected data contract.");
        if (parsed.data.status === "error") throw new Error(parsed.data.message);
        if (!response.ok) throw new Error(`Pair analysis failed (HTTP ${response.status}).`);
        if (parsed.data.data.rank !== rank || parsed.data.data.days !== days) {
          throw new Error("Pair analysis returned data for a different rank or statistics window.");
        }
        if (!controller.signal.aborted) setResult({ status: "ready", data: parsed.data.data });
      }).catch(error => { if (!controller.signal.aborted) setResult({ status: "error", message: error instanceof Error ? error.message : "Pair analysis failed unexpectedly." }); });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [days, payload, rank, attempt]);
  if (!result) return <p role="status">Loading pair data…</p>;
  if (result.status === "error") return <div role="status"><p>{result.message}</p><Button variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry</Button></div>;
  const name = (id: string) => heroes.find(hero => hero.id === id)?.name ?? id;
  const pairs = (items: SynergyData["candidates"]) => items.map((pair, index) => <li key={`${pair.allyId}-${pair.heroId}-${index}`}>
    <strong>{name(pair.heroId)}</strong><span> with {name(pair.allyId)}</span>
    <p>{pair.delta > 0 ? "+" : ""}{pair.delta.toFixed(2)} percentage points</p>
    {pair.recordUpdatedAt ? <small>Data record updated: {pair.recordUpdatedAt}</small> : null}
  </li>);
  return <div aria-live="polite">
    <h4>Available partners</h4>
    {result.data.candidates.length ? <ul className="synergy-list">{pairs(result.data.candidates)}</ul> : <p>No pair suggestions for this draft.</p>}
    {result.data.selectedPairs.length > 0 && <><h4>Selected team pairs</h4><ul className="synergy-list">{pairs(result.data.selectedPairs)}</ul></>}
    {result.data.unavailableHeroIds.length > 0 && <p>Pair data is unavailable for: {result.data.unavailableHeroIds.map(name).join(", ")}.</p>}
    <p className="muted-copy">Pair results are individual and should not be added together. Suggestions exclude heroes already picked or banned. Rank boundaries and match counts are not provided with these results.</p>
  </div>;
}
