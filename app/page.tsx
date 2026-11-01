import { DraftWorkspace } from "@/components/vayran/draft-workspace";
import { PredictionPanel } from "@/components/vayran/shared";

export default function Home() {
  return (
    <div className="draft-layout">
      <DraftWorkspace />
      <PredictionPanel />
    </div>
  );
}
