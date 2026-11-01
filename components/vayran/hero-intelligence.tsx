"use client";
import { useState } from "react";
import { useCatalog } from "./catalog-provider";
import { PublishedMetrics } from "./published-metrics";
import { HeroProfile } from "./hero-profile";
import { HeroPortrait } from "./hero-portrait";
import { HeroSelector } from "./hero-selector";
export function HeroIntelligence() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { heroes } = useCatalog();
  const selected = heroes.find(hero => hero.id === selectedId);
  return (
    <div className="hero-intelligence">
      <HeroSelector onSelect={hero => setSelectedId(hero.id)} selectedId={selected?.id} compact />
      <aside className="hero-detail">
        <p className="eyebrow">HERO INTELLIGENCE</p>
        <h2>{selected?.name ?? "Select a hero"}</h2>
        {selected && <HeroPortrait hero={selected} className="detail-portrait" />}
        <p className="muted-copy">
          {selected
            ? selected.roles.join(" / ") || "Role details unavailable"
            : "Explore a hero’s available identity and analysis coverage."}
        </p>
        <p className="muted-copy">{selected?.classes?.join(" / ")}{selected?.specialties?.length ? ` · ${selected.specialties.join(" / ")}` : ""}</p>
        <PublishedMetrics key={selected?.providerSlug ?? "no-selected-hero"} slug={selected?.providerSlug}/>
        {selected?.providerSlug ? <HeroProfile key={selected.providerSlug} slug={selected.providerSlug}/> : null}
        <p className="source-note">
          Hero identity and lane details are provided where available.
        </p>
      </aside>
    </div>
  );
}
