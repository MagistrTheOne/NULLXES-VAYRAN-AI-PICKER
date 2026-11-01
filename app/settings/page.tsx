import { ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/vayran/shared";
import { RankSelector } from "@/components/vayran/shell";
import { CATALOG_SOURCES } from "@/lib/heroes";
export default function SettingsPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="WORKSPACE / SOURCES"
        title="Settings"
        description="Session preferences and transparent data provenance."
      />
      <section className="settings-section">
        <div>
          <h2>Rank preference</h2>
          <p>
            Shared across sections and saved for this browser tab. Draft
            selections survive navigation; reloading clears the draft.
          </p>
        </div>
        <RankSelector id="settings-rank" />
      </section>
      <section className="settings-section">
        <div>
          <h2>Appearance</h2>
          <p>NULLXES graphite · Geist · React Aria / Nova</p>
        </div>
        <span className="eyebrow">DARK WORKSPACE</span>
      </section>
      <section className="source-register">
        <div className="section-label">
          <h2>Catalog provenance</h2>
          <span>RETRIEVED 29 OCT 2026</span>
        </div>
        <p className="muted-copy">
          Fallback only: local transcription of publicly available MLBB.GG hero identities and
          lane membership. Source pages have different snapshot dates. Gold lane
          coverage is partial; missing lanes are marked unverified. These
          entries are not a tier list, current-patch confirmation or a
          recommendation.
        </p>
        {CATALOG_SOURCES.map((source) => (
          <a
            key={source.label}
            href={source.url}
            target="_blank"
            rel="noreferrer"
            className="source-row"
          >
            <span>
              {source.label}
              <small>MLBB.GG</small>
            </span>
            <span>Source updated {source.updated}</span>
            <ArrowUpRight size={16} />
          </a>
        ))}
      </section>
      <div className="data-policy">
        <h3>Integration status</h3>
        <p>
          Catalog and published metrics: MLBBDex Public API. Rank filters and preliminary pair compatibility: Rone Arena. Requests run through the Next.js server with schema validation and caching. Prediction engine and player accounts remain unavailable.
        </p>
        <p><a href="https://mlbbdex.com/en/api-doc">MLBBDex documentation</a> · <a href="https://mobilelegends.fandom.com">Mobile Legends Wiki</a> · Data attribution: CC BY-SA. Portraits use the provider's image mappings. <a href="https://mlbbdex.com/en/legal">Artwork © Moonton</a>; data and code licenses do not transfer artwork ownership.</p>
        <p><a href="https://arena.rone.dev/api/docs">Rone Arena documentation</a> · <a href="https://github.com/ridwaanhall/rone-arena-api/blob/main/HOSTED_API_TERMS.md">Hosted API terms</a>. Immortal is unsupported. Exact rank boundaries, sample counts and current patch are not supplied.</p>
        <p>
          VAYRAN is an independent NULLXES product, not an official Moonton
          service.
        </p>
      </div>
    </div>
  );
}
