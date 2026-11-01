"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import type { HeroProfileData, ProviderResult } from "@/lib/provider-data";

export function HeroProfile({ slug }: { slug: string }) {
  const [result, setResult] = useState<ProviderResult<HeroProfileData> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/api/heroes/${encodeURIComponent(slug)}`, { signal: controller.signal });
        const payload: ProviderResult<HeroProfileData> = await response.json();
        if (!response.ok || payload.status !== "ready") throw new Error("Profile unavailable");
        setResult(payload);
      } catch {
        if (!controller.signal.aborted) setResult({ status: "error", message: "Hero profile unavailable." });
      }
    }
    void load();
    return () => controller.abort();
  }, [slug, attempt]);
  if (!result) return <p role="status" className="muted-copy">Loading hero profile…</p>;
  if (result.status === "error") return <div role="status"><p className="muted-copy">{result.message}</p><Button size="xs" variant="outline" onPress={() => { setResult(null); setAttempt(value => value + 1); }}>Retry profile</Button></div>;
  return <section className="detail-section"><h3>Skills</h3><ul className="profile-skills">{result.data.skills.map(skill => <li key={skill.name}>{skill.name}</li>)}</ul></section>;
}
