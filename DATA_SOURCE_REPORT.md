# NULLXES VAYRAN — DATA SOURCE REPORT

Updated: 2026-11-01. Status: IMPLEMENTED within available provider coverage; Immortal and calibrated prediction remain unavailable. Portrait display was explicitly authorized by the owner.

## Sources and actual responses

| Provider / endpoint | Observed response | Coverage / limitations |
| --- | --- | --- |
| MLBBDex `/api/v1/heroes` | HTTP 200; `data[]`, `total`, `source` | 134 heroes; slug, name, roles, lanes, specialties. Existing 133 identities map without ID changes; Dori added. Local identities retained if absent upstream. |
| MLBBDex `/api/v1/heroes?role=Tank&lane=Roam` | HTTP 200; 18 records | Documented role/lane filters. |
| MLBBDex `/api/v1/heroes/khufra` | HTTP 200; `data`, `source` | Profile and actual portrait/icon paths. Only this profile's image mapping was inspected; full image coverage not claimed. |
| MLBBDex `/api/v1/rankings` | HTTP 200; `data.measuredAt`, `data.heroes[]`, `total`, `source` | 133 heroes; slug/name/tier/winRate/banRate/pickRate/score/lowSample. Rates are percentages. No rank population field. |
| MLBBDex `/api/v1/patches` | HTTP 200; 276 records | First listed version 2.2.16; not proof of the statistics dataset's patch. Not integrated. |
| MLBBDex `/api/v1/items?category=Defense` | HTTP 200; 26 records | Not integrated in this task. |
| Rone `/api/heroes?size=150&index=1&lang=en` | HTTP 200; `code=0`, `data.records[]`, `data.total` | 133 heroes; numeric IDs mapped by exact normalized names to catalog IDs. Dori absent. |
| Rone `/api/heroes/rank?rank={legend,mythic,honor,glory}&days=7&size=1` | HTTP 200 for all four filters | Main hero ID/name and win/appearance/ban fractions converted to percentages. Full list requested with size=150 in adapter. |
| Rone rank `immortal` | HTTP 422 | Unsupported; never replaced with Glory. |
| Rone `/api/heroes/khufra/compatibility?rank=mythic&days=7&size=1` | HTTP 200 | Main hero and positive/negative pair entries; `increase_win_rate` converted to percentage points. Record `_updatedAt` retained. |
| Rone `/api/heroes/khufra/counters?rank=mythic&days=7&size=1` | HTTP 200 | Investigated, not integrated. |
| Rone `/api/academy/heroes/khufra/lane?size=1` | HTTP 200 | Roam metadata; no lane distribution percentages. |
| Rone `/api/academy/meta/version?size=1` | HTTP 200 | Old 2.1.18 record, not presented as current patch. |

MLBB.GG remains the existing local identity fallback. No undocumented MLBB.GG API was integrated.

## Rank and synergy policy

Rank choices persist in browser session storage. Legend/Mythic/Honor/Glory select the corresponding documented Rone filters. Exact star boundaries and overlap are not documented; labels do not assert disjoint populations. Immortal remains selectable with an unsupported state. Grandmaster/Epic are excluded.

Windows: 1, 3, 7, 15, 30 days. Rank rows have retrieval time, not an invented measurement date. Sample sizes and dataset patch remain unknown. MLBBDex published rankings are displayed separately, explicitly without rank attribution. `measuredAt` and `lowSample` are preserved.

Preliminary synergy uses Rone pair records for selected allies. Picked/banned heroes are excluded. Deltas remain individual directional pair signals, never added or represented as team probabilities. Missing or failed hero coverage is named. UI requests are debounced and aborted when the draft changes; stale draft results are discarded. Server validates rank/window/catalog IDs and uniqueness across picks/bans. Compatibility fetch concurrency is limited to two.

## Freshness, attribution and permissions

- [MLBBDex docs](https://mlbbdex.com/en/api-doc): weekly sync; observed docs date 2026-10-21. Observed rankings `measuredAt`: `2026-10-19T09:45:29.833Z`. No API key or fixed quota; reasonable usage required. Observed cache headers: max-age=3600, s-maxage=86400, stale-while-revalidate=604800.
- Data attribution: MLBBDex / [Mobile Legends Wiki](https://mobilelegends.fandom.com), CC BY-SA as declared by provider. Original site texts/code are MIT; this does not license game artwork.
- [MLBBDex legal notice](https://mlbbdex.com/en/legal): portraits and artwork remain Moonton property. No third-party redistribution/hotlink grant was verified. Following the explicit 2026-10-31 instruction, images are displayed from actual per-hero API mappings. Next.js Image loads lazily through a validated redirect endpoint; no guessed paths or artwork copies are added to the repository. Letter fallbacks cover errors/missing mappings. Ownership attribution remains visible; user authorization is not described as a provider license.
- [Rone docs](https://arena.rone.dev/api/docs), [OpenAPI](https://arena.rone.dev/api/openapi.json), [hosted terms](https://github.com/ridwaanhall/rone-arena-api/blob/main/HOSTED_API_TERMS.md): public unauthenticated endpoints, caching and graceful failure required, no fixed SLA/quota. Commercial deployment terms require separate review; no deployment performed. Code licensing does not transfer game asset rights.
- Rone observed rank cache: max-age=300, stale-while-revalidate=60. Compatibility record timestamp is retained as a source update timestamp, not claimed as match measurement time.

## Implementation

Server adapters: `lib/mlbbdex.ts`, `lib/rone.ts`; contracts `lib/provider-data.ts`; Zod 4.6.7 validates upstream responses and draft requests. Native fetch with 15-second timeout. Validated catalog/profile/published metrics cache for one hour; Rone rank/pair records for five minutes. No credentials, dotenv, database or new backend framework required: Next.js loads `.env*` itself.

Routes: GET `/api/heroes`, `/api/heroes/[slug]`, `/api/portraits/[slug]`, `/api/rankings`, `/api/ranks`; POST `/api/synergy` computes a read-only response. Fixed upstream origins; no arbitrary URL forwarding. Error states do not invent data. Existing Draft Lab shell and state remain intact.

UI: catalog provider, hero profile, published metrics, rank table and window selector, and preliminary synergy panel. The user Settings page contains preferences and the required short hero-data credit; technical provider and licensing details stay in this internal report.

Draft validation permits the same hero to be banned by both teams, rejects a repeated ban within one team, and prevents picks from colliding with any ban. Portrait requests use the provider slug when available, otherwise the local hero ID as a candidate slug; the profile response must validate before its returned image mapping is redirected. This keeps identity fallback usable during catalog outages without guessing an artwork URL. Source/settings/overview copy reflects real integration boundaries. No tests, mocks, or new API calls were added for Player Lookup.

## Verification

TypeScript (`npx tsc --noEmit`) passed. The final production build passed in an isolated output directory without replacing the build served on port 3100. Scoped ESLint on changed app/API/UI files passed. Full ESLint still reports existing errors in `components/ui/carousel.tsx` and `hooks/use-mobile.ts`, plus warnings in `components/ui/alert-dialog.tsx` and `components/ui/avatar.tsx`. Local browser rendering of Players and Settings was visually checked; an unrelated global catalog request returned HTTP 502 during the check. Earlier local HTTP checks returned 200 ready for catalog (134 heroes), Khufra profile, published rankings (133 heroes), Mythic rank rows (133), Khufra compatibility (five positive pairs); Immortal returned 422 unsupported. Khufra's mapped image returned HTTP 200 `image/webp`, 42,610 bytes.

## Player Lookup provider review — 2026-11-01

**Decision: no suitable public read-only lookup provider confirmed. Live lookup remains disabled.** No player IDs were submitted to any endpoint during this review.

- [MLBBDex API documentation](https://mlbbdex.com/en/api-doc) documents heroes, items, and hero rankings only. Its terms explicitly state that it provides no player data.
- [Rone Arena OpenAPI](https://arena.rone.dev/api/openapi.json) has no anonymous ID-to-profile lookup:
  - `POST /api/user/auth/send-vc` accepts JSON `role_id` (Game ID) and `zone_id` (Server ID). It sends a four-digit verification code to the account's in-game mail, valid for five minutes. It is an ownership-verification step, not a read-only public lookup.
  - `POST /api/user/auth/login` accepts `role_id`, `zone_id`, and `vc`, then returns JWT/session credentials.
  - `GET /api/user/info?lang=en` returns `avatar`, `name`, `level`, `rank_level`, `history_rank_level`, `reg_country`, `roleId`, and `zoneId`; it requires the authenticated session created by the login flow.
- [Rone hosted API terms](https://github.com/ridwaanhall/rone-arena-api/blob/main/HOSTED_API_TERMS.md) prohibit using player-facing endpoints against accounts other than the player's own. The service may rate-limit requests, has no SLA, and commercial use is by arrangement. No public quota or separate authorization for anonymous player discovery is documented.
- The repo found via public GitHub search, [alpinekun799/mlbb_api](https://github.com/alpinekun799/mlbb_api), only provides a one-line README ("Unoffical MLBB Player"); it publishes no verifiable endpoint contract, response schema, rate limits, permission terms, or commercial terms. It is not a suitable integration source.

Player Intelligence now exposes disabled Player ID / Server ID fields and a disabled **Find Player** action. It states the exact blocker and sends no requests. No mock route, lookup endpoint, credentials, or authentication flow was added.

## Next engineering step

Verify remaining image coverage during use; no full-roster image availability claim is made. Confirm Rone population definitions and sample provenance before treating pair signals as reliable draft recommendations. Prediction Engine remains disconnected.
