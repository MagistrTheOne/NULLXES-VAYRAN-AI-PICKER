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
| Rone `/api/heroes/khufra/counters?rank=mythic&days=7&size=1` | HTTP 200 | Counter records expose `main_heroid`, `sub_hero` / `sub_hero_last`, `increase_win_rate`, duration-bucket rates and `_updatedAt`; integrated for selected opposing picks. Match sample counts are not returned. |
| Rone `/api/academy/heroes/khufra/lane?size=1` | HTTP 200 | Roam metadata; no lane distribution percentages. |
| Rone `/api/academy/heroes/{id}/win-rate/timeline?lane=jungle&rank=mythic&size=1` | HTTP 200; one record | `total_win_rate`, `time_win_rate[{time_min,time_max,win_rate}]`, `_updatedAt`; integrated as raw per-hero intervals. No sample counts or `days` filter. |
| Rone `/api/heroes/positions` | Documented schema | Role/lane metadata, not usage distribution or proof of a player's assigned lane. Draft roles come from the selected VAYRAN slots. |
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
- Rone's current hosted terms additionally require avoiding traffic that degrades service, handling rate limiting/503 maintenance or high-traffic responses with backoff/failover guidance, and state that commercial hosted-API use is by arrangement. No public quota or SLA is promised.
- Rone observed rank cache: max-age=300, stale-while-revalidate=60. Compatibility record timestamp is retained as a source update timestamp, not claimed as match measurement time.

## Implementation

Server adapters: `lib/mlbbdex.ts`, `lib/rone.ts`; contracts `lib/provider-data.ts`; Zod 4.6.7 validates upstream responses and draft requests. Native fetch with 15-second timeout. Validated catalog/profile/published metrics cache for one hour; Rone rank/pair records for five minutes. No credentials, dotenv, database or new backend framework required: Next.js loads `.env*` itself.

Routes: GET `/api/heroes`, `/api/heroes/[slug]`, `/api/portraits/[slug]`, `/api/rankings`, `/api/ranks`; POST `/api/synergy` computes pair data and `/api/draft-analysis` returns rank baselines, selected counter records and lane timelines. Fixed upstream origins; no arbitrary URL forwarding. Error states do not invent data.

UI: catalog provider, hero profile, published metrics, rank table and window selector, preliminary synergy panel, live selected-rank/time-window picker rates, descriptive team hero-WR means, explicit role-slot coverage, individual opposing-pick counter signals, and unaggregated per-hero lane duration buckets. All data refreshes on pick changes; no probability or model confidence is presented.

## ORDER 015 — Full Draft Analysis (2026-11-01)

- The top of the existing Draft Lab intelligence sidebar shows pick completeness, Allied/Enemy comparison, a two-sided comparison bar, phase-data coverage, the strongest individual selected synergy per team, and the strongest positive selected counter signal per team. On desktop the sidebar is sticky; smaller layouts retain the existing stacked flow.
- The displayed 0–100 Draft Advantage Score is a documented descriptive index only: `allied = clamp(50 + (mean allied hero WR - mean enemy hero WR) / 2, 0, 100)` and `enemy = 100 - allied`. Mean inputs use available selected-hero rows from the exact selected Rone rank/window; a score is withheld until both teams have at least one rated pick. Partial drafts are labelled provisional and show rate coverage. The score is not a probability, team win rate, calibrated model, or evidence that the underlying hero WRs predict a 5v5 result.
- Synergy and counter observations remain raw, individual, directional percentage-point signals and do not enter the index. Rone omits match denominators and patch attribution; therefore evidence strength, confidence and a calibrated 5v5 probability remain unavailable.
- Rank, window, picks and bans form the request key. Rank/window changes cannot reuse another rank/window's visible response; ban changes refresh analysis and the existing ban-aware suggestions. The API validates unique picks, per-team unique bans, no pick/ban overlap, and catalog membership.
- Early/Mid/Late are product display bands (0–8 / 8–15 / 15+ minutes), not official MLBB phase boundaries. UI only groups source intervals wholly contained within a band and preserves original interval endpoints in the detail view. It reports per-team hero interval coverage without team-level averaging or an advantage claim; source records have no sample counts.
- No probability model, external source, LLM or fabricated statistics were added. Picked-position counts describe assigned VAYRAN slots, not verified in-game role performance.

## ORDER 014 — Draft Intelligence Engine V1 (2026-11-01)

### Live contract checks

- `GET /api/heroes/rank?rank=mythic&days=7&size=2&index=1&lang=en`: HTTP 200; `data.records[]`, `data.total=133`. The sampled rows contained hero win/pick/ban rates as fractions. The response has no match count, sample denominator, record update timestamp, or explicit patch field. The `total` value counts hero records, not matches. Retrieval time is not presented as measurement time.
- `GET /api/heroes/17/counters?rank=mythic&days=7&size=1&index=1&lang=en`: HTTP 200; one hero record and up to five `sub_hero` and `sub_hero_last` entries in the observed result. It includes directional `increase_win_rate`, bucketed `min_win_rate*` values and `_updatedAt=2026-10-31T16:35:02Z`. No match/sample denominator is included. Only selected opposing heroes present in these returned lists are shown.
- `GET /api/academy/heroes/17/win-rate/timeline?lane=jungle&rank=mythic&size=2&index=1&lang=en`: HTTP 200; one record, `total_win_rate`, and `time_win_rate` intervals with explicit bounds. Observed `_updatedAt=2026-10-31T18:25:01Z`. The endpoint accepts rank and lane but no `days` window, and does not provide interval sample counts. It is not combined with the 7-day hero-rank baseline.
- Rone's hosted terms: unauthenticated public analytics endpoints; no uptime SLA or fixed public quota; avoid load, cache results, respect throttling/503 responses and back off. Commercial hosted-API use is by arrangement with the operator; no commercial approval or deployment was performed.

### Calculations and boundaries

- Each side's baseline is the arithmetic mean of the available selected-hero win rates from the exact selected Rone rank and days window. Missing hero rows are omitted and the displayed known/selected count makes coverage explicit. The mean is unweighted because match sample counts are absent; it is labelled a descriptive hero baseline, never a team win rate or win probability.
- Role coverage is the count of filled VAYRAN role slots out of five. It does not infer a hero's actual match lane, composition balance, damage, control, initiation or frontline.
- Synergy remains the existing individual, directional pair signal. Counter entries remain individual provider-reported percentage-point signals and retain main/counter direction. Neither class is summed into a score or converted to probability.
- Timeline data is displayed as the source's original intervals: Early groups intervals ending at or before 12 minutes, Mid groups 12–18 minute intervals, and Late groups intervals starting at/after 18 minutes. No interval rates are averaged or converted into a side advantage because per-interval sample sizes are missing. These group labels are presentation only, not a model.
- Data-window filters apply to rank, synergy and counter endpoints. The lane timeline has no matching days parameter; its own record update timestamp is shown separately.
- Rone rank rows and compatibility/counter/timeline records are cached for five minutes. Draft-side timeline and counter requests are limited to two selected heroes concurrently; request changes are debounced and stale browser requests are aborted. Provider throttling or validation failures produce unavailable states.
- No probability model, confidence score, sample-based weighting, independent validation set, Brier score or log loss exists. Draft outcome probability remains unavailable.

Draft validation permits the same hero to be banned by both teams, rejects a repeated ban within one team, and prevents picks from colliding with any ban. Portrait requests use the provider slug when available, otherwise the local hero ID as a candidate slug; the profile response must validate before its returned image mapping is redirected. This keeps identity fallback usable during catalog outages without guessing an artwork URL. Source/settings/overview copy reflects real integration boundaries. No tests, mocks, or new API calls were added for Player Lookup.

## Verification

TypeScript (`npx tsc --noEmit`) passed. The final production build passed in an isolated output directory without replacing the build served on port 3100. Scoped ESLint on changed app/API/UI files passed. Full ESLint still reports existing errors in `components/ui/carousel.tsx` and `hooks/use-mobile.ts`, plus warnings in `components/ui/alert-dialog.tsx` and `components/ui/avatar.tsx`. Local browser rendering of Players and Settings was visually checked; an unrelated global catalog request returned HTTP 502 during the check. Earlier local HTTP checks returned 200 ready for catalog (134 heroes), Khufra profile, published rankings (133 heroes), Mythic rank rows (133), Khufra compatibility (five positive pairs); Immortal returned 422 unsupported. Khufra's mapped image returned HTTP 200 `image/webp`, 42,610 bytes.

## Player Lookup provider review — 2026-11-01

**Decision: RapidAPI is a candidate but not yet an approved/verified integration.** No player IDs were submitted to any endpoint during this review.

- [MLBBDex API documentation](https://mlbbdex.com/en/api-doc) documents heroes, items, and hero rankings only. Its terms explicitly state that it provides no player data.
- [RapidAPI listing](https://rapidapi.com/bienkim86/api/mobile-legends-user-info-lookup) identifies the “Mobile Legends User Info Lookup” API. Its linked [provider README](https://github.com/kimigop1827/Mobile-Legends-API-2026) claims:
  - Base URL `https://mobile-legends-user-info-lookup.p.rapidapi.com`
  - `GET /lookup?id=PLAYER_ID&zone=ZONE_ID`; Player ID required and zone optional in the README
  - `X-RapidAPI-Key` and `X-RapidAPI-Host` headers
  - Example fields including nickname, current/highest rank, level, skin count, squad, hero history, last login, and approximate location
  - Subscription-plan-dependent rate limits
  The README example is provider-published example content, not a live response verified by VAYRAN. It is internally inconsistent: the example query and returned `server` show `10012`, while `request.zone_id` is `null`. The repository's MIT code license does not establish hosted API usage rights. The listing's terms, commercial usage rights, subscription/pricing quotas, and complete machine-readable response contract were not independently verified. The API key is not configured in the environment. The example includes sensitive account activity/location fields; any future endpoint must deliberately minimize exposed fields.
- [Rone Arena OpenAPI](https://arena.rone.dev/api/openapi.json) has no anonymous ID-to-profile lookup:
  - `POST /api/user/auth/send-vc` accepts JSON `role_id` (Game ID) and `zone_id` (Server ID). It sends a four-digit verification code to the account's in-game mail, valid for five minutes. It is an ownership-verification step, not a read-only public lookup.
  - `POST /api/user/auth/login` accepts `role_id`, `zone_id`, and `vc`, then returns JWT/session credentials.
  - `GET /api/user/info?lang=en` returns `avatar`, `name`, `level`, `rank_level`, `history_rank_level`, `reg_country`, `roleId`, and `zoneId`; it requires the authenticated session created by the login flow.
- [Rone hosted API terms](https://github.com/ridwaanhall/rone-arena-api/blob/main/HOSTED_API_TERMS.md) prohibit using player-facing endpoints against accounts other than the player's own. The service may rate-limit requests, has no SLA, and commercial use is by arrangement. No public quota or separate authorization for anonymous player discovery is documented.
- The repo found via public GitHub search, [alpinekun799/mlbb_api](https://github.com/alpinekun799/mlbb_api), only provides a one-line README ("Unoffical MLBB Player"); it publishes no verifiable endpoint contract, response schema, rate limits, permission terms, or commercial terms. It is not a suitable integration source.

At the initial review, Player Intelligence exposed Player ID / Server ID fields and **Find Player** with client-side numeric validation; no mock route, third-party request, credentials, or authentication flow was added. The later contract findings and current integration decision are recorded below. A future Rone alternative would require a separate, explicitly owner-authorized verification flow; it must not be used as anonymous lookup or initiated without a deliberate user action.

### RapidAPI contract follow-up

The current RapidAPI listing documentation describes `POST /lookup` with JSON body `{ "role_id": <positive number> }`. Its parameter table lists only `role_id`; it does not document a `server_id`/`zone_id` request field, despite the overview text describing Server ID as optional. The documented success example contains `data.player_data` fields `player_id`, `nickname`, `level`, `current_rank`, `high_rank`, `skin_count`, `matches`, `location`, and `server`. This is documentation example data, not a response observed by VAYRAN; `location` is not needed for a player profile and must not be returned by a future integration.

The linked provider README lists `https://mobile-legends-user-info-lookup.p.rapidapi.com` and the standard `X-RapidAPI-Key` / `X-RapidAPI-Host` headers, but its `GET /lookup?id=...&zone=...` contract conflicts with the current listing documentation. The current generated request snippet and exact active Base URL/host were not accessible: the public documentation lists only `POST /lookup`, and the RapidAPI playground failed to load in the available browser session. Therefore no Base URL is confirmed; the README hostname is not approved for further requests. The [Basic plan page](https://rapidapi.com/bienkim86/api/mobile-legends-user-info-lookup/pricing) shows 5 requests/month with a hard limit, 1,000 requests/hour, and 10,240 MB/month before a listed bandwidth fee of $0.001/MB. Applicable provider commercial terms were not independently confirmed.

**Single live request audit:** the first attempt used a redacted placeholder credential and returned HTTP 403; it did not reduce the provider quota. The valid-key attempt was sent to candidate host `https://mobile-legends-user-info-lookup.p.rapidapi.com/lookup` with `POST`, the documented JSON `role_id`, and the RapidAPI headers. The supplied Server ID was not sent because the current parameter table does not document it. The response was HTTP 404 (`text/plain`) after 1,381 ms; no JSON/profile schema was returned, so the requested ID and Server ID could not be matched. RapidAPI response headers reported a 5-request limit and 4 remaining; the valid-key request consumed one monthly call. No profile details or raw response were retained. This 404 means the exact host/path combination is not verified for the current endpoint. The signed-in generated snippet/playground could not be inspected in the available browser session, so no alternate URL is guessed and no further calls are made.

The key is stored locally in the ignored `.env` file and is not recorded here. Since the key was shared in chat, rotate it in RapidAPI and replace it in `.env`. No Next.js lookup route, cache, or application-side quota guard has been added: the current endpoint did not return a profile, and there is no configured durable quota store. A public route must not be exposed until the generated URL is verified and the server-side quota guard/cache can be enforced. Server ID must not be sent unless the provider documents it.

**Message prepared for the API owner (not sent):**

> The RapidAPI listing documents `POST /lookup` with JSON `{ "role_id": <positive integer> }`, but does not publish the Base URL or a working generated request snippet. The older README documents a conflicting `GET` contract. Please confirm the current Base URL/full request URL, exact `X-RapidAPI-Host` value and generated request example for `POST /lookup`; clarify whether Server ID is accepted, and provide the hosted API's terms for third-party/commercial use.

### ORDER 008A — Player identity contract

VAYRAN requires both positive-integer `playerId` and `serverId` (Zone ID) for player lookup. The server ID is not included in the RapidAPI body unless the provider documents support for it. If a future provider response includes `player_data.server`, it must match the requested server ID; if absent or mismatched, the profile is not identified and must not be shown as the requested player. The Player Intelligence form enforces both required fields and enables Find Player only when both values are valid. No live lookup was repeated while the provider URL remains unconfirmed.

## Next engineering step

Verify remaining image coverage during use; no full-roster image availability claim is made. Confirm Rone population definitions and sample provenance before treating pair signals as reliable draft recommendations. Prediction Engine remains disconnected.

## ORDER 009 — Player resolution provider check

### ALU primary

The supplied [ALU API documentation](https://www.aluu.in/docs) documents a read-only Mobile Legends name lookup:

- Base URL: `https://aluu.in/api/check`
- `GET /api/check/mlbb-check?user_id={playerId}&server_id={serverId}`
- `x-api-key` request header
- Required positive/numeric ID and server/zone values
- Success fields: `success`, `user_id`, `server_id`, `username`, `country`
- Documented per-minute limit: 60 requests for `mlbb-check`
- Shared daily limit depends on the account plan, resets at midnight Asia/Kolkata, and includes every request that passes the IP check. The separate `/api/check` endpoint also consumes quota.
- The calling server IP must be added to the account's IP whitelist before any lookup can proceed.

One explicitly approved lookup was sent for the owner-supplied player/server pair. Result: HTTP 403, `IP_NOT_ALLOWED` / whitelist required, about 1.3 seconds. No nickname/profile fields were returned, so the claimed in-game nickname could not be verified. No quota headers were returned; per ALU documentation, blocked requests before passing IP verification are not included in daily usage. No second request or separate quota-check request was made.

The API credential was saved locally as `ALU_API_KEY` in the ignored `.env`; its value is not recorded here. It was shared in chat and should be rotated. The attached screenshot also exposed an account password; change it immediately. ALU's available documentation describes lookup as a reseller/top-up pre-order check; it does not establish permission to reuse results in an independent analytics product. Terms for VAYRAN's use therefore remain unconfirmed. The environment's outbound IP is not a suitable production allowlist target; the deployment's stable egress IP must be whitelisted by the account owner.

### Volsever backup

The [Game ID Checker documentation](https://docs.volsever.com/introduction-2285591m0) documents a read-only lookup:

- Base URL: `https://gate.volsever.com`
- `GET /proxy/api/game/mobile-legends?id={playerId}&zone={serverId}`
- `X-API-Key` header
- Success response fields include `username`, `user_id`, `zone`, `game`, and `region`; the echoed identifiers allow pair matching.
- Its terms say the API is for game account lookup/validation and digital service workflows, require the customer to establish lawful use and needed rights/notices, and provide service as-is. Product documentation primarily targets stores, top-up platforms and resellers; explicit approval for VAYRAN analytics is not stated.

No Volsever API key is configured and no request was sent. It is a documented technical fallback, not an approved or configured provider for VAYRAN.

### Resolution status

No player route or frontend provider integration was added: ALU denied access because the deployment egress IP is not whitelisted; the Volsever credential is absent; and neither provider's reviewed terms explicitly confirm analytics-product use. No real nickname can be displayed until a provider authorizes this use and returns an identifier-matching response. Purchase, payment, bonus-check and order endpoints remain unused.

**Owner follow-up required:** (1) rotate the ALU API key and exposed account password; (2) confirm with ALU whether lookup results may be used in a non-reseller analytics product; (3) whitelist the stable VAYRAN server egress IP, or configure a Volsever key and obtain the same usage clarification. Do not repeat the lookup until these conditions are met.

## ORDER 010 — ALU local integration preparation

The public egress IPv4 observed from the current local Windows development environment is `193.27.19.8`. This is not a verified production egress address. The ALU Dashboard was not accessible from this environment, so whitelist membership cannot be checked directly. The previous approved lookup returned `IP_NOT_ALLOWED`; do not retry until the stable deployment egress IP has been whitelisted.

The server-only `POST /api/players/lookup` and Players UI are implemented. The route validates positive integer strings, calls only the documented ALU `mlbb-check` endpoint with a 10-second timeout, validates echoed IDs before returning nickname and optional country, maps provider/network failures, and caches validated success responses for 24 hours using Next.js Cache Components. A process-local limiter allows at most 10 requests per client IP and 45 total requests per process per minute.

At the time of Order 010, the route was gated by `ALU_LOOKUP_ENABLED`, `ALU_TERMS_APPROVED`, and `ALU_IP_WHITELISTED`. These were later removed under Order 012. The in-memory limiter is process-local and does not coordinate across multiple instances; production scaling requires a shared limiter or equivalent edge protection. Commercial/analytics use permission remains unconfirmed.

No player lookup was performed for Order 010. No Draft Lab, Heroes, or Ranks changes were made. Purchase, payment, bonus-check, and order endpoints are not used.

### ORDER 011 readiness check

The current local Windows development environment again reports public egress IPv4 `193.27.19.8`, matching the IP shown in the owner-provided ALU Dashboard screenshot. Dashboard save state could not be independently inspected. At the time of Order 011 the feature gates were unset, so no lookup was sent. The gate behavior was removed under Order 012.

The reported `runtime` build failure came from an earlier route revision. The current `app/api/players/lookup/route.ts` does not declare a `runtime` segment config; current production build passes with Cache Components enabled.

### ORDER 012 — Live lookup completed

Removed the three locally invented feature gates. The API key remains server-only in ignored `.env`. Per request, one production build of VAYRAN was started locally and exactly one upstream lookup was issued through its `POST /api/players/lookup` route for player `146323873`, server `6068`.

- VAYRAN route response: HTTP 200; total latency approximately 1,914 ms.
- Returned player ID matched: yes.
- Returned server ID matched: yes.
- Nickname: `MagistrTheOne?`
- Country: `AM`.
- The Players UI was opened in the local production build and displayed the returned nickname, both IDs, and country. The UI read was served from the 24-hour success cache; no second upstream ALU call was made.
- No ranks, match history, or statistics were requested or displayed.

The current implementation build no longer contains a `runtime` segment config and passes production build. Analytics-product terms remain unconfirmed; public deployment use must be reviewed separately. No changes were made to Draft Lab, Heroes, or Ranks.

### ORDER 013 — Player Intelligence profile

The Players page presents the verified ALU identity (nickname, player ID, server ID, and optional country) with a neutral avatar fallback. ALU does not provide a player avatar or competitive statistics. Win rate, ranks, account level, hero/role performance, match history, and rank progression therefore remain explicitly unavailable. No additional provider or live API request was added for this UI work.
