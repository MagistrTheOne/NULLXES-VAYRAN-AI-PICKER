import { PageHeading } from "@/components/vayran/shared";
import { RankSelector } from "@/components/vayran/shell";

export default function SettingsPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="WORKSPACE / PREFERENCES"
        title="Settings"
        description="Manage your workspace preferences."
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
      <p className="source-attribution">
        Hero data credit:{" "}
        <a href="https://mobilelegends.fandom.com" target="_blank" rel="noreferrer">
          Mobile Legends Wiki
        </a>{" "}
        ·{" "}
        <a href="https://creativecommons.org/licenses/by-sa/" target="_blank" rel="noreferrer">
          CC BY-SA
        </a>
        . Game artwork © Moonton.
      </p>
    </div>
  );
}
