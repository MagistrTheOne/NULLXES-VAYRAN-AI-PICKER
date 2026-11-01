import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeading } from "@/components/vayran/shared";

export default function PlayersPage() {
  return (
    <div className="support-page">
      <PageHeading
        eyebrow="PLAYER INTELLIGENCE"
        title="Player Intelligence"
        description="Find a player by Player ID and Server ID. No account connection required."
      />
      <section className="player-lookup">
        <h2>Player Lookup</h2>
        <p>Search public player information using in-game identifiers.</p>
        <div className="player-lookup-fields">
          <label htmlFor="player-id">Player ID</label>
          <Input
            id="player-id"
            type="text"
            inputMode="numeric"
            placeholder="Enter Player ID"
            disabled
          />
          <label htmlFor="server-id">Server ID</label>
          <Input
            id="server-id"
            type="text"
            inputMode="numeric"
            placeholder="Enter Server ID"
            disabled
          />
        </div>
        <Button isDisabled>Find Player</Button>
        <p className="player-lookup-status" role="status">
          Public player lookup is not available yet. No documented, permitted
          read-only service for Player ID and Server ID has been confirmed.
          Services that require in-game verification or account authentication
          are not used.
        </p>
      </section>
    </div>
  );
}
