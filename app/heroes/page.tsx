import { PageHeading } from "@/components/vayran/shared";
import { HeroIntelligence } from "@/components/vayran/hero-intelligence";
export default function HeroesPage() {
  return (
    <div className="support-page heroes-page">
      <PageHeading
        eyebrow="IDENTITIES / LANES / MATCHUPS"
        title="Hero Intelligence"
        description="Explore the catalog. Keep identity separate from performance."
      />
      <HeroIntelligence />
    </div>
  );
}
