"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProviderResult, RankingsData } from "@/lib/provider-data";

export function PublishedMetrics({ slug }: { slug?: string }) {
  const [result, setResult] = useState<ProviderResult<RankingsData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!slug) return;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch("/api/rankings", { signal: controller.signal });
        const payload: ProviderResult<RankingsData> = await response.json();
        if (!response.ok || payload.status !== "ready" || !Array.isArray(payload.data.heroes)) throw new Error("Rankings unavailable");
        setResult(payload);
      } catch {
        if (!controller.signal.aborted) setResult({ status: "error", message: "Published rankings unavailable." });
      }
    }
    void load();
    return () => controller.abort();
  }, [attempt, slug]);
  const data = result?.status === "ready" ? result.data : null;
  const row = data?.heroes.find(hero => hero.slug === slug);
  if (!slug) {
    return (
      <section className="published-metrics">
        <h3>Performance statistics</h3>
        <p className="muted-copy">Select a hero to view its available performance statistics.</p>
      </section>
    );
  }
  return (
    <section className="published-metrics">
      <h3>Performance statistics</h3>
      <p className="muted-copy">
        The rank segment is not supplied for these figures. They are not rank-specific and should not be read as match predictions.
      </p>
      {!result ? <p role="status">Loading performance statistics…</p> : result.status === "error" ? (
        <div role="status">
          <p>Performance statistics are temporarily unavailable.</p>
          <Button size="xs" variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry</Button>
        </div>
      ) : null}
      {row ? (
        <dl className="metric-list">
          {[
            { label: "Win Rate", value: row.winRate },
            { label: "Pick Rate", value: row.pickRate },
            { label: "Ban Rate", value: row.banRate },
          ].map(item => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{`${item.value.toFixed(2)}%`}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {row ? (
        <p className="muted-copy">
          Published tier: {row.tier} · score: {row.score}
          <br />
          {row.lowSample ? "Flagged as a low sample." : "Not flagged as a low sample."} Exact match count is not supplied.
        </p>
      ) : data ? (
        <p className="muted-copy">No performance statistics are listed for this hero.</p>
      ) : null}
      {data ? (
        <p className="source-note">
          Updated: <time dateTime={data.measuredAt}>{data.measuredAt.replace("T", " ")}</time>
        </p>
      ) : null}
    </section>
  );
}
