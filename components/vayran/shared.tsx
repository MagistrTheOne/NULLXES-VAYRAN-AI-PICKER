import { SynergyPanel } from "./synergy-panel";
import { Database } from "lucide-react";
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
    <aside className="prediction-panel" aria-label="Draft analysis">
      <div className="panel-title">
        <span className="eyebrow">DRAFT ANALYSIS</span>
      </div>
      <h2>Draft analysis is not available yet.</h2>
      <p className="muted-copy">
        No match outcome or early/late-game estimate is shown without verified
        match data for those stages.
      </p>
      <SynergyPanel />
    </aside>
  );
}
