<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# NULLXES VAYRAN — AGENT DIRECTIVES

**Authority:** Мага / NULLXES. Read [ARCHITECTURE.md](./ARCHITECTURE.md) before modifying any code. Its product, rank, design, API and implementation constraints are binding.

## Mission
Build a serious independent MLBB draft/statistics/prediction platform. Current delivery is the **frontend only**, using the repository's Next.js + React + TypeScript + Tailwind + shadcn **aria-nova / React Aria** stack. Backend and **OpenAI GPT / xAI Grok** integrations are **future work, not authorization to connect them now**. No local LLM.

## NON-NEGOTIABLE PROHIBITIONS
1. **NO TEST CASES:** no unit/integration/e2e tests, test suites, test fixtures, QA scaffolds or test-running as a substitute for implementation. Typechecking, linting and production builds are allowed.
2. **NO MOCKS:** no mock data, fake stats, fake requests, dummy match histories, fictional win probabilities, placeholder rankings, mock adapters/servers or simulated APIs. Show honest unavailable states instead.
3. **NO ABSTRACTION FOR ABSTRACTION'S SAKE:** no speculative layers, dependency injection frameworks, generic factories, empty service shells, adapters or architecture cosplay.
4. **NO ARCHITECTURE BREAKAGE:** do not replace frameworks, UI style, package manager, route structure or working components, or execute sweeping refactors absent explicit approval.
5. **NO UNAUTHORIZED CALLS:** no third-party APIs, scrapers, local models, model training, backend generation, secret exposure, automatic game interactions or unsolicited deployments.
6. **NO RANK COLLAPSE:** Grandmaster/Epic excluded; Legend / Mythic / Honor / Glory / Immortal each analyzed separately. No global tier-list inference.
7. **NO FABRICATION:** never claim a functioning prediction, verified statistic, connected provider or completed check unless it exists and was actually verified.
8. **NO UNAPPROVED GIT WRITES:** no commit, push, force push, destructive reset or deletion without owner instruction.

## REQUIRED ENGINEERING STANDARD
- Senior-level, clean, direct, production-grade TypeScript, narrow diffs, maintainable components, proper error and disabled states.
- Preserve current working code and user edits. Inspect before editing. Check installed Next.js documentation when changing Next.js behavior.
- Use existing `components/ui`, `components.json` and CSS variables. The configured UI is **aria-nova / React Aria**, NOT a new Base UI or monorepo setup.
- Build real interactive features with deterministic validation. Do not fake an external result to make a screenshot attractive.
- Treat current phase as frontend-first, backend-ready through stable types only where needed by implemented functionality.
- Keep the UI in premium NULLXES aesthetics: black, graphite, white, metal, minimalist realism. No neon/cyberpunk/sci-fi/generic AI decoration.
- GPT is the future assistant/explainer; Grok the future analyst. Both must be server-side, evidence-grounded, budget-controlled and incapable of inventing statistics. A configurable abrasive analyst persona is allowed; factual integrity remains mandatory.
- Report exact changed files, checks performed and missing capabilities. No marketing filler or fake success.

**If a requested feature requires unapproved backend/data access, complete its legitimate frontend portion and leave a transparent unavailable state; do not invent the missing system.**
