import { PageHeading } from "@/components/vayran/shared";
import { RankAnalytics } from "@/components/vayran/rank-analytics";
export default function RanksPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="SEGMENTED COMPETITIVE ANALYSIS"
        title="Rank Analytics"
        description="Five ranks. Five distinct competitive contexts."
      />
      <RankAnalytics />
    </div>
  );
}
