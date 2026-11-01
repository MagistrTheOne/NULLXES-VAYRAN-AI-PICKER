import Link from "next/link";
import { SynergyPanel } from "./synergy-panel";
import { ArrowUpRight, Database, Unplug } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DraftWinrateEstimate } from "./draft-winrate-estimate";
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from "@/components/ui/empty";

export function PageHeading({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-description">{description}</p>
      </div>
      {children}
    </div>
  );
}
export function Unavailable({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="unavailable">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Database aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
export function PredictionPanel() {
  return (
    <aside className="prediction-panel" aria-label="Match prediction">
      <div className="panel-title">
        <span className="eyebrow">INTELLIGENCE</span>
        <Unplug size={16} aria-hidden="true" />
      </div>
      <h2>MATCH PREDICTION</h2>
      <Badge variant="outline" className="availability-badge">
        NOT CONNECTED
      </Badge>
      <DraftWinrateEstimate />
      <p className="engine-notice">PREDICTION ENGINE — NOT CONNECTED</p>
      <p className="muted-copy">
        This rate-based indicator is not a calibrated match prediction. Draft interactions and match-specific outcomes are unavailable.
      </p>
      <div className="analysis-sections">
        {[
          {
            title: "Composition analysis",
            detail: "Team strengths and coverage",
          },
          { title: "Counterpicks", detail: "Matchup-based alternatives" },
          { title: "Reasoning", detail: "Evidence behind each recommendation" },
        ].map((item) => (
          <section key={item.title}>
            <div>
              <h3>{item.title}</h3>
              <span>UNAVAILABLE</span>
            </div>
            <p>{item.detail}</p>
          </section>
        ))}
      </div>
      <SynergyPanel />
      <div className="prediction-footnote">
        <span className="eyebrow">EVIDENCE FIRST</span>
        <p>
          No probabilities or recommendations without verified, rank-specific
          data.
        </p>
        <Link href="/settings">
          Data availability <ArrowUpRight size={13} />
        </Link>
      </div>
    </aside>
  );
}
