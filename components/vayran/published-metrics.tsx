"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ProviderResult, RankingsData } from "@/lib/provider-data";

export function PublishedMetrics({ slug }: { slug?: string }) {
  const [result, setResult] = useState<ProviderResult<RankingsData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
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
  }, [attempt]);
  const data = result?.status === "ready" ? result.data : null;
  const row = data?.heroes.find(hero => hero.slug === slug);
  return <section className="published-metrics"><h3>Published indicators</h3><p className="muted-copy">MLBBDex · rank population unspecified. These values do not represent the selected rank and are not match predictions.</p>{!result ? <p role="status">Loading published rankings…</p> : result.status === "error" ? <div role="status"><p>{result.message}</p><Button size="xs" variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry rankings</Button></div> : null}<dl className="metric-list">{[{ label: "Win Rate", value: row?.winRate }, { label: "Pick Rate", value: row?.pickRate }, { label: "Ban Rate", value: row?.banRate }].map(item => <div key={item.label}><dt>{item.label}</dt><dd>{item.value === undefined ? "—" : `${item.value.toFixed(2)}%`}</dd></div>)}</dl>{row ? <p className="muted-copy">Published tier: {row.tier} · score: {row.score}<br/>Low sample: {row.lowSample ? "Yes — interpret with caution" : "No (provider flag)"}. Match count is not supplied.</p> : data ? <p className="muted-copy">{slug ? "No published ranking for this hero." : "Select a provider hero to view its published indicators."}</p> : null}{data ? <p className="source-note">Measured: <time dateTime={data.measuredAt}>{data.measuredAt.replace("T", " ")}</time><br/><a href="https://mlbbdex.com/api/v1/rankings" target="_blank" rel="noreferrer">MLBBDex rankings</a> · <a href={data.source.url} target="_blank" rel="noreferrer">{data.source.name}</a> · {data.source.license}</p> : null}</section>;
}
