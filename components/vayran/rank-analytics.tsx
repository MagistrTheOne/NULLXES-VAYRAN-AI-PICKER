"use client";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { DATA_WINDOWS, type DataWindow, type ProviderResult, type RankData } from "@/lib/provider-data";
import type { Rank } from "@/lib/heroes";
import { Check, ChevronRight } from "lucide-react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import { RANKS } from "@/lib/heroes";
import { useRank } from "./session";
import { Unavailable } from "./shared";
export function RankAnalytics() {
  const { rank, setRank } = useRank();
  const [days, setDays] = useState<DataWindow>(7);
  return (
    <div className="rank-analytics">
      <section className="rank-segments" aria-label="Rank segments">
        {RANKS.map((item, index) => (
          <Button
            key={item}
            variant="ghost"
            className="rank-row"
            aria-pressed={rank === item}
            onPress={() => setRank(item)}
          >
            <span className="rank-index">0{index + 1}</span>
            <span>
              <strong>{item}</strong>
              <small>{item === "Mythical Immortal" ? "Statistics not available" : "Rank statistics"}</small>
            </span>
            {rank === item ? <Check size={17} /> : <ChevronRight size={17} />}
          </Button>
        ))}
      </section>
      <section className="rank-detail">
        <p className="eyebrow">SELECTED SEGMENT</p>
        <h2>{rank}</h2>
        <div className="coverage-row">
          <label>
            Data window
            <NativeSelect aria-label="Statistics window" value={days} onChange={event => setDays(Number(event.target.value) as DataWindow)}>{DATA_WINDOWS.map(day => <NativeSelectOption key={day} value={day}>{day} days</NativeSelectOption>)}</NativeSelect>
          </label>
        </div>
        {rank === "Mythical Immortal" ? <Unavailable title="Statistics not available" description="There are currently no statistics available for the Mythical Immortal rank segment." /> : <RankResults key={`${rank}-${days}`} rank={rank} days={days} />}
        <div className="data-policy">
          <h3>Rank segments are shown separately.</h3>
          <p>
            Rank boundaries, match counts, patch context, and measurement dates are not supplied with these statistics. The selected rank is the source filter, not a verified match-population boundary. See Sources &amp; Legal in Settings for more information.
          </p>
        </div>
      </section>
    </div>
  );
}

function RankResults({ rank, days }: { rank: Rank; days: DataWindow }) {
  const [result, setResult] = useState<ProviderResult<RankData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [query, setQuery] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/ranks?${new URLSearchParams({ rank, days: String(days) })}`, { signal: controller.signal }).then(async response => {
      const value = await response.json();
      if (!response.ok || value.status !== "ready") throw new Error("Rank data unavailable.");
      if (!controller.signal.aborted) setResult(value);
    }).catch(() => { if (!controller.signal.aborted) setResult({ status: "error", message: "Rank statistics are temporarily unavailable." }); });
    return () => controller.abort();
  }, [rank, days, attempt]);
  if (!result) return <p role="status">Loading {rank} statistics…</p>;
  if (result.status === "error") return <div role="status"><p>Rank statistics are temporarily unavailable.</p><Button variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry</Button></div>;
  const rows = result.data.rows.filter(row => row.name.toLowerCase().includes(query.trim().toLowerCase())).toSorted((a, b) => b.winRate - a.winRate);
  return <div className="rank-results">
    <p>{result.data.total} heroes · {days} days</p>
    <p className="muted-copy">This rank-specific dataset does not include match counts, patch context, or measurement date.</p>
    <Input aria-label="Search rank statistics" placeholder="Search heroes…" value={query} onChange={event => setQuery(event.target.value)} />
    <div className="rank-table-scroll"><table><caption>{rank} · sorted by win rate</caption><thead><tr><th scope="col">Hero</th><th scope="col">Win</th><th scope="col">Pick</th><th scope="col">Ban</th></tr></thead><tbody>{rows.map(row => <tr key={row.providerId}><th scope="row">{row.name}</th><td>{row.winRate.toFixed(2)}%</td><td>{row.pickRate.toFixed(2)}%</td><td>{row.banRate.toFixed(2)}%</td></tr>)}</tbody></table></div>
    {!rows.length && <p>No heroes match this search.</p>}
  </div>;
}
