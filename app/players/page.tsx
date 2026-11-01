import Link from "next/link";
import { ArrowRight, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeading } from "@/components/vayran/shared";
export default function PlayersPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="PERSONAL COMPETITIVE CONTEXT"
        title="Player Intelligence"
        description="Understand individual performance in the context of a team."
      />
      <section className="player-unavailable">
        <UserRound size={36} strokeWidth={1} aria-hidden="true" />
        <Badge variant="outline">NOT AVAILABLE</Badge>
        <h2>Player analysis is not connected.</h2>
        <p>
          Verified account data and explicit account consent are required. No
          profiles, match history or personal performance have been imported.
        </p>
        <Link href="/" className="primary-link">
          Return to Draft Lab <ArrowRight size={16} />
        </Link>
      </section>
      <div className="player-capabilities">
        {[
          {
            title: "Hero pool",
            detail: "Personal proficiency and role coverage",
          },
          {
            title: "Performance context",
            detail: "Rank-specific trends across verified matches",
          },
          {
            title: "Draft fit",
            detail: "Individual strengths within a composition",
          },
        ].map((item) => (
          <section key={item.title}>
            <span className="eyebrow">FUTURE CAPABILITY</span>
            <h3>{item.title}</h3>
            <p>{item.detail}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
