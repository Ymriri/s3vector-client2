# S3Vector Client — Master Plan ( Attu-for-AWS-S3-Vectors )

## Goal
A single-page web client (pure static SPA) that lets a user operate **all AWS S3 Vectors APIs** from the browser — Attu-style, but for AWS S3 Vectors. After deployment, the user opens the page, enters credentials (AK/SK, optional session token, region, optional custom endpoint) in **Settings**, and then manages buckets/indexes/vectors and runs similarity queries — no local SDK install, no backend service.

## Non-goals
- No bundled backend/proxy server (escape hatch documented only, see CORS below).
- No credential storage server-side; settings live in the browser (localStorage, with a "session-only" option).

## Tech stack (decided by master)
- **React 18 + TypeScript + Vite** SPA, Ant Design 5 component library.
- State: **Zustand**; routing: **React Router v6**; data calls: thin service layer over **@aws-sdk/client-s3vectors** (bundled into the browser build).
- Unit tests: **Vitest + @testing-library/react**, SDK mocked; every feature module ships tests and `npm test` must pass.
- Lint/build gates: `npm run lint`, `npm run build` must pass per round.

## S3 Vectors API inventory — full coverage required (16 actions)
Bucket-level:
1. CreateVectorBucket  2. DeleteVectorBucket  3. GetVectorBucket  4. ListVectorBuckets
5. PutVectorBucketPolicy  6. GetVectorBucketPolicy  7. DeleteVectorBucketPolicy

Index-level:
8. CreateIndex  9. DeleteIndex  10. GetIndex  11. ListIndexes

Vector-level:
12. PutVectors (upsert)  13. GetVectors  14. ListVectors  15. DeleteVectors  16. QueryVectors

Every action above must be reachable from the UI.

## Architecture
```
src/
  api/          # S3VectorsClientFactory + typed service wrappers per API group
  settings/     # credential store (zustand + localStorage), settings page
  pages/        # Dashboard, Buckets, BucketDetail(Indexes/Policy), IndexDetail(Vectors), QueryConsole, Settings
  components/   # shared UI (code/JSON viewers, confirm dialogs, error banner)
  tests/        # unit tests co-located or here
```
- Client factory: `new S3VectorsClient({ region, credentials: {accessKeyId, secretAccessKey, sessionToken?}, endpoint? })` built **at call time** from user settings; support endpoint override for testing/custom gateways.
- All SDK errors surfaced in a friendly error banner with AWS error code/name.

## CORS (key risk, decision recorded)
Browser-direct calls require the AWS endpoint to allow CORS. Primary path = direct call to `s3vectors.<region>.api.aws`. Mitigations, in order:
1. Direct call (default).
2. If CORS blocks: app shows a clear, actionable error page explaining the one-line reverse-proxy / Cloudflare-Worker option, and the Settings page has an optional "API endpoint / proxy base URL" field so a user can point the SPA at such a proxy **without any code change**. This keeps the shipped artifact a single static page.
3. WASM is NOT needed (the JS SDK already runs in-browser); documented in README.

## Milestones
- **M0** docs+team: PLAN/AGENTS/DESIGN committed. (master)
- **M1** scaffold: Vite+React+TS+AntD+Vitest runnable; settings page with AK/SK/region/endpoint + connection test (ListVectorBuckets); client factory + tests. 
- **M2** bucket group: 7 bucket APIs + UI (list/create/delete/get/policy editor).
- **M3** index group: 4 index APIs + UI (list/create/delete/get + distance metric & dimension config).
- **M4** vector group: 5 vector APIs + UI (put via JSON editor, get/list with pagination, delete, **Query console** with topK + metric display).
- **M5** hardening: full test pass, lint, build, README (deploy + CORS notes), final review + commit; demo checklist.

## Team (subagents via `claude -p`, I am master)
| Role | Codename | Responsibility |
|---|---|---|
| Design agent | S1 | Pick/adapt a DESIGN.md from `awesome-design-md/design-md/`, write repo `DESIGN.md` + page layout spec (Attu-like: sidebar + main console). |
| Scaffold agent | S2 | M1 scaffold, client factory, settings page, test infra. |
| Feature agent | S3 | M2–M4 features per API group, with unit tests for each module. |
| Test agent | S4 | Independent per-round test review: run full suite, add missing tests, must be green. |
| Review/commit agent | S5 | Per-round code review + all `git commit`s (master never commits). |

Working dir: `/Users/ym/app/s3vector_client` (git repo, main branch).
Rules: subagents write code+tests in the repo; S5 reviews & commits; master integrates, runs gates, reports to user.
`awesome-design-md/` stays untracked (gitignored) as vendored reference.
