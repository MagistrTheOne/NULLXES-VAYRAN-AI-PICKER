"use client";

import { useEffect, useState } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { DATA_WINDOWS, type DataWindow, type ProviderResult, type RankData } from "@/lib/provider-data";
import { ROLES, type Rank } from "@/lib/heroes";
import { useDraft, useRank } from "./session";
import { useCatalog } from "./catalog-provider";
import type { RankRow } from "@/lib/provider-data";

export function DraftWinrateEstimate() {
  const { draft } = useDraft();
  const { rank } = useRank();
  const [days, setDays] = useState<DataWindow>(7);
  const allyIds = ROLES.map(role => draft.picks.ally[role]).filter((id): id is string => Boolean(id));
  const enemyIds = ROLES.map(role => draft.picks.enemy[role]).filter((id): id is string => Boolean(id));

  return (
    <section className="draft-estimate" aria-label="Preliminary draft win-rate estimate">
      <div className="draft-estimate-heading">
        <h3>PRELIMINARY RATE INDICATOR</h3>
        <label>
          Window
          <NativeSelect aria-label="Win-rate data window" value={days} onChange={event => setDays(Number(event.target.value) as DataWindow)}>
            {DATA_WINDOWS.map(day => <NativeSelectOption key={day} value={day}>{day} days</NativeSelectOption>)}
          </NativeSelect>
        </label>
      </div>
      <p className="muted-copy">{rank} · mean hero win rates from Rone Arena, not match-specific outcomes.</p>
      {rank === "Mythical Immortal" ? (
        <p role="status">Immortal statistics are not provided. No other rank is substituted.</p>
      ) : allyIds.length === 0 || enemyIds.length === 0 ? (
        <p role="status">Select at least one hero on each team to calculate the indicator.</p>
      ) : (
        <EstimateResults key={`${rank}-${days}`} rank={rank} days={days} allyIds={allyIds} enemyIds={enemyIds} />
      )}
      <p className="muted-copy">The displayed split normalizes the two teams’ average rank-filtered hero win rates to 100%. It is a rough comparison only — not a match win probability, and it does not account for hero matchups, roles, draft order, or sample size.</p>
    </section>
  );
}

function EstimateResults({ rank, days, allyIds, enemyIds }: { rank: Rank; days: DataWindow; allyIds: string[]; enemyIds: string[] }) {
  const { heroes } = useCatalog();
  const [result, setResult] = useState<ProviderResult<RankData> | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const query = new URLSearchParams({ rank, days: String(days) });
        const response = await fetch(`/api/ranks?${query}`, { signal: controller.signal });
        const payload: ProviderResult<RankData> = await response.json();
        if (!response.ok || payload.status !== "ready") {
          throw new Error(response.status === 422 ? "This rank is unsupported by the statistics provider." : payload.status === "error" ? payload.message : "Rank win rates are unavailable.");
        }
        if (!controller.signal.aborted) setResult(payload);
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ status: "error", message: error instanceof Error ? error.message : "Rank win rates are unavailable." });
        }
      }
    }
    void load();
    return () => controller.abort();
  }, [rank, days, attempt]);

  if (!result) return <p role="status">Loading {rank} hero win rates…</p>;
  if (result.status === "error") {
    return (
      <div role="status">
        <p>{result.message}</p>
        <Button size="xs" variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry rates</Button>
      </div>
    );
  }

  const rowsByHero = new Map<string, RankRow>();
  for (const row of result.data.rows) {
    if (row.heroId) rowsByHero.set(row.heroId, row);
  }
  const allyRows = allyIds.map(id => rowsByHero.get(id));
  const enemyRows = enemyIds.map(id => rowsByHero.get(id));
  const missingIds = [...new Set([
    ...allyIds.filter((_, index) => !allyRows[index]),
    ...enemyIds.filter((_, index) => !enemyRows[index]),
  ])];
  if (missingIds.length) {
    const names = missingIds.map(id => heroes.find(hero => hero.id === id)?.name ?? id);
    return <p role="status">No rank-filtered win-rate row for: {names.join(", ")}. Indicator unavailable until all picked heroes have data.</p>;
  }

  const availableAllyRows = allyRows.filter((row): row is RankRow => row !== undefined);
  const availableEnemyRows = enemyRows.filter((row): row is RankRow => row !== undefined);
  if (availableAllyRows.length !== allyIds.length || availableEnemyRows.length !== enemyIds.length) {
    return <p role="status">Win-rate coverage changed while calculating. Indicator unavailable; update the draft and retry.</p>;
  }
  const allyAverage =
    availableAllyRows.reduce((total, row) => total + row.winRate, 0) / allyRows.length;
  const enemyAverage =
    availableEnemyRows.reduce((total, row) => total + row.winRate, 0) / enemyRows.length;
  const combinedAverage = allyAverage + enemyAverage;
  if (combinedAverage <= 0) return <p role="status">The provider returned no usable win-rate values for these heroes.</p>;

  const allyShare = allyAverage / combinedAverage * 100;
  const enemyShare = 100 - allyShare;
  const picksCount = (ids: string[]) => `${ids.length}/${ROLES.length}`;
  return (
    <div className="draft-estimate-values" aria-live="polite">
      <p className="draft-estimate-split">
        <span>ALLY <strong>{allyShare.toFixed(1)}%</strong></span>
        <span>ENEMY <strong>{enemyShare.toFixed(1)}%</strong></span>
      </p>
      <div className="draft-estimate-detail">
        <span>Mean hero win rate</span>
        <span>{allyAverage.toFixed(2)}% / {enemyAverage.toFixed(2)}%</span>
      </div>
      <p className="muted-copy">Based on {picksCount(allyIds)} allied and {picksCount(enemyIds)} enemy picks · {days}-day provider window. Missing matches and current patch are not supplied.</p>
    </div>
  );
}
