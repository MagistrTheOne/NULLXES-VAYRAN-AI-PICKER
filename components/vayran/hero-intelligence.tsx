"use client";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { useCatalog } from "./catalog-provider";
import { PublishedMetrics } from "./published-metrics";
import { HeroProfile } from "./hero-profile";
import { HeroPortrait } from "./hero-portrait";
import { HeroSelector } from "./hero-selector";
import { useRank } from "./session";
export function HeroIntelligence() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { heroes } = useCatalog();
  const selected = heroes.find(hero => hero.id === selectedId);
  const { rank } = useRank();
  return (
    <div className="hero-intelligence">
      <HeroSelector onSelect={hero => setSelectedId(hero.id)} selectedId={selected?.id} compact />
      <aside className="hero-detail">
        <p className="eyebrow">HERO INTELLIGENCE</p>
        <h2>{selected?.name ?? "Select a hero"}</h2>
        {selected && <HeroPortrait hero={selected} className="detail-portrait" />}
        <p className="muted-copy">
          {selected
            ? selected.roles.join(" / ") || "Lane data unverified"
            : "Explore a hero’s available identity and analysis coverage."}
        </p>
        <Badge variant="outline">{rank}</Badge>
        <p className="muted-copy">
          Rank-filtered metrics are available in Rank Analytics. Published MLBBDex metrics below have an unspecified rank population.
        </p>
        <p className="muted-copy">{selected?.classes?.join(" / ")}{selected?.specialties?.length ? ` · ${selected.specialties.join(" / ")}` : ""}</p>
        <PublishedMetrics slug={selected?.providerSlug}/>
        {selected?.providerSlug ? <HeroProfile key={selected.providerSlug} slug={selected.providerSlug}/> : null}
        {["Matchups", "Strengths", "Weaknesses"].map((label) => (
          <section className="detail-section" key={label}>
            <h3>{label}</h3>
            <p>Verified analysis unavailable.</p>
          </section>
        ))}
        <p className="source-note">
          {selected?.providerSlug ? "Identity: MLBBDex / Mobile Legends Wiki · CC BY-SA" : "Identity: MLBB.GG fallback snapshot · 29 Oct 2026"}
          <br />
          Portraits: MLBBDex · artwork © Moonton.
        </p>
      </aside>
    </div>
  );
}
