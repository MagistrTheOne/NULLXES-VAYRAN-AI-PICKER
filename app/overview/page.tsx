import Link from "next/link";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { PageHeading } from "@/components/vayran/shared";
import { CurrentRank } from "@/components/vayran/shell";
import { CatalogCount, CatalogStatus } from "@/components/vayran/catalog-provider";
export default function OverviewPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="NULLXES / COMPETITIVE INTELLIGENCE"
        title="VAYRAN"
        description="A focused workspace for Mobile Legends: Bang Bang draft decisions."
      />
      <section className="overview-entry">
        <div>
          <span className="eyebrow">DRAFT WORKSPACE</span>
          <h2>
            Every pick changes
            <br />
            the composition.
          </h2>
          <p>
            Build allied and enemy teams, manage bans and inspect the available
            hero catalog. Preliminary pair signals are sourced separately from match predictions.
          </p>
          <Link href="/" className="primary-link">
            Open Draft Lab <ArrowRight size={17} />
          </Link>
        </div>
        <div className="overview-session">
          <span className="eyebrow">CURRENT SESSION</span>
          <h3>
            <CurrentRank />
          </h3>
          <dl>
            <div>
              <dt>Workspace</dt>
              <dd>Local draft editor</dd>
            </div>
            <div>
              <dt>Hero identities</dt>
              <dd><CatalogCount/> available</dd>
            </div>
            <div>
              <dt>Current patch</dt>
              <dd>Unverified</dd>
            </div>
            <div>
              <dt>Prediction engine</dt>
              <dd>Not connected</dd>
            </div>
          </dl>
        </div>
      </section>
      <section className="module-table">
        <div className="section-label">
          <h2>System modules</h2>
          <span>AVAILABILITY</span>
        </div>
        {[
          {
            name: "Draft Lab",
            text: "Local picks, bans and composition editing",
            state: "AVAILABLE",
            href: "/",
          },
          {
            name: "Hero Intelligence",
            text: "MLBBDex catalog and published metrics · rank population unspecified",
            state: "PARTIAL",
            href: "/heroes",
          },
          {
            name: "Rank Analytics",
            text: "Rone Arena rank filters · Immortal unsupported",
            state: "PARTIAL",
            href: "/ranks",
          },
          {
            name: "Player Intelligence",
            text: "Personal analysis requires future account integration",
            state: "NOT AVAILABLE",
            href: "/players",
          },
        ].map((item) => (
          <Link href={item.href} className="module-row" key={item.name}>
            <div>
              <h3>{item.name}</h3>
              <p>{item.text}</p>
            </div>
            <span>{item.state}</span>
            <ArrowUpRight size={17} />
          </Link>
        ))}
      </section>
      <div className="source-summary">
        <span>DATA SOURCES</span>
        <CatalogStatus/>
        <Link href="/settings">Inspect sources ↗</Link>
      </div>
    </div>
  );
}
