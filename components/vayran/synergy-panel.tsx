"use client";

import { useEffect, useState } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { DATA_WINDOWS, type DataWindow, type ProviderResult, type SynergyData } from "@/lib/provider-data";
import { useDraft, useRank } from "./session";
import { useCatalog } from "./catalog-provider";

export function SynergyPanel() {
  const { draft } = useDraft();
  const { rank } = useRank();
  const [days, setDays] = useState<DataWindow>(7);
  const payload = JSON.stringify({ rank, days, allies: Object.values(draft.picks.ally).filter(Boolean), enemies: Object.values(draft.picks.enemy).filter(Boolean), bans: draft.bans });
  return <section className="synergy-panel">
    <h3>PRELIMINARY SYNERGY</h3>
    <label>Data window <NativeSelect value={days} onChange={event => setDays(Number(event.target.value) as DataWindow)}>{DATA_WINDOWS.map(day => <NativeSelectOption key={day} value={day}>{day} days</NativeSelectOption>)}</NativeSelect></label>
    <p className="muted-copy">{rank} · Rone Arena pair statistics. These are individual pair signals, not a team win prediction.</p>
    {rank === "Mythical Immortal" ? <p>Unsupported by this provider. No substitute rank is used.</p> : !Object.values(draft.picks.ally).some(Boolean) ? <p>Select an allied hero to see available pair signals.</p> : <SynergyResults key={payload} payload={payload} />}
  </section>;
}

function SynergyResults({ payload }: { payload: string }) {
  const { heroes } = useCatalog();
  const [result, setResult] = useState<ProviderResult<SynergyData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      fetch("/api/synergy", { method: "POST", headers: { "Content-Type": "application/json" }, body: payload, signal: controller.signal }).then(async response => {
        const value = await response.json();
        if (!response.ok || value.status !== "ready") throw new Error(value.message || "Synergy unavailable.");
        if (!controller.signal.aborted) setResult(value);
      }).catch(error => { if (!controller.signal.aborted) setResult({ status: "error", message: error instanceof Error ? error.message : "Synergy unavailable." }); });
    }, 400);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [payload, attempt]);
  if (!result) return <p role="status">Loading compatibility…</p>;
  if (result.status === "error") return <div role="status"><p>{result.message}</p><Button variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry</Button></div>;
  const name = (id: string) => heroes.find(hero => hero.id === id)?.name ?? id;
  const pairs = (items: SynergyData["candidates"]) => items.map((pair, index) => <li key={`${pair.allyId}-${pair.heroId}-${index}`}>
    <strong>{name(pair.heroId)}</strong><span> with {name(pair.allyId)}</span>
    <p><a href={pair.sourceUrl} target="_blank" rel="noreferrer">{pair.delta > 0 ? "+" : ""}{pair.delta.toFixed(2)} percentage points</a></p>
    <small>Source record updated: {pair.recordUpdatedAt ?? "not supplied"}</small>
  </li>);
  return <div aria-live="polite">
    <h4>Available partners</h4>
    {result.data.candidates.length ? <ul className="synergy-list">{pairs(result.data.candidates)}</ul> : <p>No eligible positive pair signals returned.</p>}
    {result.data.selectedPairs.length > 0 && <><h4>Selected team pairs</h4><ul className="synergy-list">{pairs(result.data.selectedPairs)}</ul></>}
    {result.data.unavailableHeroIds.length > 0 && <p>Compatibility unavailable for: {result.data.unavailableHeroIds.map(name).join(", ")}.</p>}
    <p className="muted-copy">{result.data.populationNote} Pair deltas are not added together. Picked and banned heroes are excluded from suggestions.</p>
  </div>;
}
