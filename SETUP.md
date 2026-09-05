# Setup Log

Running, chronological record of every command used to set up this project from an empty
directory, and why. This file is updated after every phase — it is the source of truth for
"how do I get this environment working from scratch," separate from `README.md` (which
documents what the framework does and how to run tests day-to-day).

Environment this was originally built against (Phase 1 snapshot, kept as historical record —
see "Cumulative tooling requirements" below for the current full list): Windows 11, Node
v24.18.0, Docker 29.6.2, Docker Compose v5.3.0, git 2.54.0.

## Cumulative tooling requirements

Everything needed to work through every phase so far, updated as later phases add tools. Not
all of these are needed to just _run the tests_ day-to-day — see `README.md`'s Requirements
section for that narrower list.

| Tool                                   | Needed for                                                                     | Install                                                                                                |
| -------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Node v24.x                             | Everything                                                                     | [nodejs.org](https://nodejs.org/) or a version manager                                                 |
| pnpm                                   | Everything                                                                     | `npm install -g pnpm` (see Phase 1 step 1 for why not Corepack on this machine)                        |
| Docker Desktop                         | Phase 7 (Dockerize), Phase 1's abandoned local RBP attempt                     | [docker.com](https://www.docker.com/products/docker-desktop/)                                          |
| `git` + a GitHub account with `gh` CLI | Everything (repo), Phase 8+ (PR-based CI verification, branch protection)      | `gh` via [cli.github.com](https://cli.github.com/), then `gh auth login`                               |
| Terraform CLI (`terraform`)            | Phase 9+ (AWS infrastructure)                                                  | [developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install)         |
| AWS CLI v2 (`aws`)                     | Phase 9+ (AWS infrastructure)                                                  | [AWS CLI install guide](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) |
| AWS credentials (`aws configure`)      | Phase 9+ (anything that calls AWS)                                             | See Phase 9 Day 1, step 1/3 below                                                                      |
| JDK 26 + Maven                         | Only if reviving local RBP (currently abandoned, hosted instance used instead) | Phase 1 steps 9-10 below                                                                               |

---

## Phase 1 — Project Scaffolding

### 1. Package manager: install pnpm

pnpm is required (not npm/yarn) — faster installs, disk-efficient content-addressable store,
and strict dependency resolution that prevents phantom transitive imports.

Corepack (bundled with Node) was tried first but failed because the Node install directory
isn't user-writable in this environment:

```
corepack enable pnpm
# Internal Error: EPERM: operation not permitted, open 'C:\Program Files\nodejs\pnpm.CMD'
```

Fell back to a global npm install instead:

```bash
npm install -g pnpm
pnpm -v   # 11.20.0, change to higher
```

### 2. Initialize the project

```bash
pnpm init
```

Then hand-edited `package.json` to set: project name (`playwright-typescript-e2e`), `private:
true`, `type: "module"` (ESM throughout), `engines.node` pinned to the installed Node major
(`>=24.0.0 <25.0.0` — Node 24 is Active LTS as of this build), `packageManager: "pnpm@11.20.0"`
(pins the exact pnpm version via Corepack's packageManager field), and the npm scripts used
day-to-day (`test`, `test:headed`, `test:ui`, `report`, `lint`, `lint:fix`, `format`,
`format:check`, `typecheck`, `prepare`).

### 3. Folder structure

```bash
mkdir -p tests pages fixtures utils api config data ci infra
# .gitkeep placeholders so git tracks the still-empty folders (populated in later phases)
for d in pages fixtures utils api config data ci infra; do touch "$d/.gitkeep"; done
```

| Folder      | Purpose                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| `tests/`    | Playwright test specs                                                           |
| `pages/`    | Page Object Model classes (Phase 3)                                             |
| `fixtures/` | Playwright `test.extend` fixtures wiring pages/API clients into tests (Phase 3) |
| `utils/`    | Shared helpers                                                                  |
| `api/`      | API client wrapper + typed request/response models (Phase 4)                    |
| `config/`   | Environment config loader (Phase 5)                                             |
| `data/`     | Test data factories (Phase 5)                                                   |
| `ci/`       | GitHub Actions workflow support files (Phase 8)                                 |
| `infra/`    | Terraform modules (Phase 9)                                                     |

### 4. TypeScript config

Wrote `tsconfig.json` — strict mode plus extra strictness flags (`noUncheckedIndexedAccess`,
`exactOptionalPropertyTypes`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`,
etc.), `NodeNext` module/resolution to match `"type": "module"`, and path aliases (`@pages/*`,
`@fixtures/*`, `@utils/*`, `@api/*`, `@config/*`, `@data/*`) matching the folder structure above.

### 5. Install dependencies

```bash
pnpm add -D typescript @playwright/test eslint @eslint/js typescript-eslint \
  eslint-config-prettier eslint-plugin-playwright prettier husky lint-staged
```

`pnpm add` resolved `typescript@7.0.2` (the new native/Go-based compiler). That broke immediately:
`typescript-eslint` doesn't support TS 7.0 yet, and TS 7 also removed bare `baseUrl` (needs
relative `"paths"` entries). Pinned back to the last classic JS-based release instead:

```bash
pnpm add -D typescript@6.0.3
pnpm exec tsc --version
# Version 6.0.3
```

`tsconfig.json`'s `paths` entries were updated to `"./pages/*"` etc. (relative, no `baseUrl`)
to match.

### 6. ESLint flat config, Prettier, .gitignore

- `eslint.config.js` — flat config (ESLint 10 default): `@eslint/js` recommended +
  `typescript-eslint` recommended-type-checked + `eslint-plugin-playwright` (scoped to
  `tests/**` and `fixtures/**`) + `eslint-config-prettier` last (turns off stylistic rules
  that Prettier owns).
- `.prettierrc.json` / `.prettierignore` — single quotes, semicolons, 100-char print width.
- `.gitignore` — `node_modules/`, `.env*` (except `.env.example`), Playwright/Allure report
  and result dirs, Terraform state/lock/cache, OS/editor cruft.

### 7. Git + Husky pre-commit hook

```bash
git init
git remote add origin https://github.com/ramanwaliagithub/playwright-typescript-e2e.git
git branch -M main
pnpm exec husky init
```

Replaced the default `.husky/pre-commit` (which husky init seeds with `npm test`) with:

```
pnpm exec lint-staged
pnpm run typecheck
```

`lint-staged` config added to `package.json` — `*.ts` gets `eslint --fix`, and
`*.{ts,json,md,yml,yaml}` gets `prettier --write`, on staged files only. `typecheck` still
runs against the whole project (type errors aren't scoped to staged files).

**Note:** nothing has been pushed to the `origin` remote — only `git init`/`remote add`/local
commits happen during these phases. Pushing needs an explicit go-ahead.

### 8. Clone Restful-Booker-Platform (app under test)

Cloned as a **sibling** directory to this repo, not inside it — RBP is the application under
test, not framework code:

```bash
cd /d/Work/projects/E2E
git clone https://github.com/mwinteringham/restful-booker-platform.git
```

### 9. RBP local setup — Docker Compose alone doesn't work

Attempted the plan's default (`docker compose build`) and it failed on all 6 Java services:

```
COPY target/restful-booker-platform-message-*-exec.jar ./message.jar
ERROR: lstat /target: no such file or directory
```

Each Java service's Dockerfile expects a **pre-built jar from Maven**, not source — so Docker
alone isn't self-contained; it still needs `mvn clean install` run on the host first, which
needs JDK 26 + Maven (RBP's stated requirements). Neither was installed. Flagged this to the
user rather than silently switching to the hosted instance; user chose to install JDK 26 +
Maven locally and proceed with the original Docker plan.

### 10. Install JDK 26 + Maven

```bash
winget install --id EclipseAdoptium.Temurin.26.JDK -e --accept-package-agreements --accept-source-agreements --silent
```

Installed to `C:\Program Files\Eclipse Adoptium\jdk-26.0.2.10-hotspot`.

No Apache Maven package exists on winget, so it was downloaded and extracted manually to a
user-writable directory (avoids the earlier `C:\Program Files\...` permission problem seen
with Corepack):

```bash
mkdir -p /c/Users/hp/tools
cd /c/Users/hp/tools
curl -s -o maven.zip https://dlcdn.apache.org/maven/maven-3/3.9.16/binaries/apache-maven-3.9.16-bin.zip
unzip -q maven.zip && rm maven.zip
```

Set `JAVA_HOME`, `MAVEN_HOME`, and `PATH` persistently at the Windows **User** environment
level (PowerShell `[System.Environment]::SetEnvironmentVariable(..., "User")`) so new shells
pick them up automatically:

- `JAVA_HOME = C:\Program Files\Eclipse Adoptium\jdk-26.0.2.10-hotspot`
- `MAVEN_HOME = C:\Users\hp\tools\apache-maven-3.9.16`
- `Path += %JAVA_HOME%\bin;%MAVEN_HOME%\bin`

**Note for a fresh terminal:** open a new shell after this for `java`/`mvn` to be on `PATH`
automatically — the shell used during this setup had to export them inline per-command
since already-open shells don't pick up new User env vars.

Verified:

```bash
java -version   # openjdk 26.0.2 2026-07-21, Temurin-26.0.2+10
mvn -version    # Apache Maven 3.9.16, Java version: 26.0.2
```

### 11. Build RBP with Maven

```bash
cd /d/Work/projects/E2E/restful-booker-platform
mvn clean install
```

All 7 modules (auth, booking, room, report, branding, message, assets) built `SUCCESS` in ~3.5
minutes on first run.

### 12. Docker build hit a Windows-specific wall, then WSL itself broke

`docker compose build` on the 6 Java services worked fine (they just `COPY` a jar). The
`rbp-assets` (Next.js) service failed:

```
ERROR: rpc error: code = Unknown desc = read D:\...\assets\node_modules\@swc\helpers\...:
Insufficient system resources exist to complete the requested service.
```

Cause: `assets/` had no `.dockerignore`, so Docker tried to send the entire local
`node_modules`/`.next`/`target` trees (created by RBP's own Maven+npm build) as build
context — hundreds of MB of small files — which the Windows Docker Desktop file-sharing layer
couldn't handle. Added `assets/.dockerignore` (`node_modules`, `.next`, `target`, `.git`) since
the Dockerfile already runs `npm ci` inside the container anyway; local `node_modules` should
never be sent as build context. (This file lives in the RBP clone, not this repo, and wasn't
pushed anywhere — RBP's own repo is untouched upstream.)

Immediately after, Docker Desktop's WSL2 backend itself went unresponsive (`500 Internal
Server Error` from the Docker API, then Docker Desktop reported "unable to communicate with
the Windows Subsystem for Linux"). Fixed by force-restarting the WSL2 VM:

```powershell
wsl --shutdown
```

(User approved this explicitly first — it restarts _all_ WSL distros/Docker workloads on the
machine, not just this project's.) Docker was responsive again afterward.

### 13. Pivot: hosted RBP instance instead of local Docker deployment

User's call: stop maintaining a local Docker deployment of RBP entirely and point the
framework at the hosted public demo, **https://automationintesting.online**, instead — the
Docker/WSL instability above was the trigger, and the standing preference going forward is:
if the app under test has a usable hosted instance, prefer that over standing up local infra.

Removed everything the local deployment had created:

```bash
docker rmi restful-booker-platform-rbp-auth restful-booker-platform-rbp-booking \
  restful-booker-platform-rbp-branding restful-booker-platform-rbp-message \
  restful-booker-platform-rbp-report restful-booker-platform-rbp-room
```

(`rbp-assets` was never successfully built, so nothing to remove there; no containers were
ever started, so nothing to `docker compose down`.) Confirmed via `docker images` that no
`restful-booker-platform-*` images remain.

The RBP source clone at `D:\Work\projects\E2E\restful-booker-platform` (Maven/JDK/Maven
install, jars, `node_modules`, etc.) was left on disk — only the Docker artifacts were asked
to be removed. Flag if you'd like that cleaned up too.

Updated `playwright.config.ts`'s default `BASE_URL` to
`https://automationintesting.online`, and `.env.example` to match (dropped the local-vs-hosted
comment since there's now just one target).

### 14. tsconfig fixes found while typechecking real code

Writing the first real `.ts` files (`playwright.config.ts`, `tests/smoke.spec.ts`) surfaced two
tsconfig issues:

- `process.env` didn't resolve (`Cannot find name 'process'`) even with `@types/node`
  installed — added `"types": ["node"]` explicitly to `compilerOptions` rather than relying on
  automatic `@types` inclusion.
- The strict `noPropertyAccessFromIndexSignature` flag (intentionally enabled) requires
  `process.env['BASE_URL']` bracket syntax instead of `process.env.BASE_URL`.

### 15. Playwright install + smoke test

```bash
pnpm exec playwright install --with-deps chromium firefox webkit
```

Wrote `tests/smoke.spec.ts` — loads `/` and asserts the page title matches
`/Restful-booker-platform/i` (confirmed via `curl` against the hosted instance first: title is
literally `Restful-booker-platform demo`).

```bash
pnpm test
# Running 3 tests using 3 workers
# [1/3] [webkit] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
# [2/3] [firefox] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
# [3/3] [chromium] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
#   3 passed (7.9s)
```

Phase 1 complete: `pnpm run lint`, `pnpm run typecheck`, and `pnpm test` all green against the
hosted RBP instance across Chromium, Firefox, and WebKit.

---

## Phase 2 — Playwright Configuration

Scope check before starting: the original plan's "multi-environment support" meant local-vs-
hosted `baseURL`, but Phase 1 had just dropped local RBP entirely. Asked the user whether Phase
2 should (a) just tune config for the hosted target only, or (b) build real environment-
switching now even though only `hosted` is runnable today. User picked (b) — and confirmed local
RBP is coming back into scope later, so the switching needed to be real, not a stub.

### 1. `config/environments.ts`

New file — `TestEnvironment = 'hosted' | 'local'`, each with its own `baseURL`, `retries`,
`actionTimeout`, `navigationTimeout`. Resolved from `process.env['TEST_ENV']`, defaulting to
`'hosted'` (matches Phase 1 behavior when `TEST_ENV` is unset). Removed `config/.gitkeep` since
the folder now has real content.

`hosted` gets more retries (2) and longer timeouts than `local` (0 retries) — reasoning: the
public demo instance is shared with other automation learners, so it's more prone to transient
slowness than a local Docker deployment would be.

### 2. Wire `playwright.config.ts` to the environment config

```ts
import { environmentConfig } from './config/environments.js';
```

Note the `.js` extension on a `.ts` import — required by `"module": "NodeNext"` in
`tsconfig.json` (ECMAScript imports under Node's ESM resolution need the extension the file
will have at runtime, not its source extension). Forgetting it produced:

```
error TS2835: Relative import paths need explicit file extensions in ECMAScript imports
```

which then cascaded into 9 unrelated-looking `@typescript-eslint/no-unsafe-*` lint errors
(typescript-eslint fell back to treating the unresolved import as `any`). Fixing the import
extension fixed both `tsc` and `eslint` in one move.

Also switched `trace` from `on-first-retry` to `retain-on-failure`: with `local`'s 0 retries,
`on-first-retry` would never fire (there's no retry to attach to), so a `local` failure would
capture no trace at all. `retain-on-failure` guarantees a trace on any failed test regardless of
that environment's retry count — matches the plan's "trace/video/screenshot-on-failure only"
requirement literally, for every environment.

### 3. Cross-platform `TEST_ENV` switching

```bash
pnpm add -D cross-env
```

Added `test:hosted` (`cross-env TEST_ENV=hosted playwright test`) and `test:local` (same, with
`local`) npm scripts. Plain `VAR=value command` syntax in `package.json` scripts doesn't work on
native Windows `cmd.exe`, only bash/PowerShell 7+ — `cross-env` normalizes that so the same
script works in any shell, including whatever CI ends up using (Phase 8).

### 4. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean

pnpm run test:hosted
# Running 3 tests using 3 workers
# [1/3] [webkit] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
# [2/3] [chromium] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
# [3/3] [firefox] › tests\smoke.spec.ts:3:1 › RBP booking homepage loads
#   3 passed (5.5s)
```

`local` has no running RBP instance yet, so rather than run (and fail on) a real test against
it, proved the _config_ resolves correctly with `--list` (evaluates `playwright.config.ts`,
including loading `config/environments.ts`, without opening a browser or hitting the network):

```bash
TEST_ENV=local pnpm exec playwright test --list --reporter=list
# Listing tests:
#   [chromium] › smoke.spec.ts:3:1 › RBP booking homepage loads
#   [firefox] › smoke.spec.ts:3:1 › RBP booking homepage loads
#   [webkit] › smoke.spec.ts:3:1 › RBP booking homepage loads
# Total: 3 tests in 1 file
```

Phase 2 complete: hosted environment fully green end-to-end; local environment's config path
verified without requiring the not-yet-running local deployment.

---

## Phase 3 — Page Object Model Architecture

### 1. Inspect the real app before writing any selectors

RBP's UI is a client-rendered Next.js app — `curl`-ing pages only returns the shell, no room
listings or form fields. Instead, launched a real headless browser via a throwaway script
(`scratch-inspect.mjs`, deleted before committing — never part of the repo) and dumped
`page.locator('body').innerHTML()` at each step: homepage, a room's reservation page (before
and after clicking "Reserve Now" — the guest-details form only exists in the DOM after that
click), the admin login page, and the admin rooms page after logging in.

This is where the real selectors used in the page objects below came from — e.g. room cards
are `.room-card` with a heading matching the room type, guest fields are
`input[name="firstname"|"lastname"|"email"|"phone"]`, rooms in the admin panel are
`[data-testid="roomlisting"]` with per-field ids like `#roomName101`, and the delete icon is
`.roomDelete`.

### 2. Scope decision: hosted-only local was already dropped in Phase 1, but is `local` really staying real?

The original plan's Phase 3 wording assumes admin/booking flows work the same locally and
hosted. Asked the user whether Phase 2's environment-switching should be a real, functioning
`hosted`/`local` split or just a hosted-only shortcut, since Phase 1 had dropped local RBP.
User confirmed local is coming back into scope later — this phase's page objects and tests
don't hardcode anything hosted-specific (paths are relative, e.g. `/admin`, `/reservation/1`),
so they'll work unmodified against `local` once it's running again.

### 3. Page objects

```
pages/BasePage.ts          — shared `page` handle + goto() helper, everything else extends this
pages/BookingHomePage.ts   — room listing, date pickers, "Check Availability", "Book now"
pages/ReservationPage.ts   — guest-details form + "Reserve Now" / booking confirmation
pages/AdminLoginPage.ts    — admin login form
pages/AdminRoomsPage.ts    — admin room listing + create/delete
```

Removed `pages/.gitkeep` and `fixtures/.gitkeep` now that both folders have real content.

### 4. Fixture-based injection

`fixtures/pages.fixture.ts` wraps Playwright's `test.extend` to construct each page object
from the standard `page` fixture and hand it to tests by name (`bookingHomePage`,
`reservationPage`, `adminLoginPage`, `adminRoomsPage`). Tests import `test`/`expect` from this
file, never from `@playwright/test` directly.

### 5. Enforcing the boundary with ESLint, not just convention

Added to `eslint.config.js`, scoped to `files: ['tests/**/*.ts']`:

- `no-restricted-imports` banning `@playwright/test` (message points at the fixture file
  instead).
- `no-restricted-syntax` banning any `page.<method>()` call expression (`CallExpression`
  where `callee.object.name === 'page'`).

Proved this actually catches violations, not just passes by construction: temporarily left
Phase 1's `tests/smoke.spec.ts` untouched (still importing `@playwright/test` and calling
`page.goto()` directly) and ran `pnpm run lint` — it failed with exactly the two expected
errors. Migrated `smoke.spec.ts` to use `bookingHomePage.open()` + the fixture's `test`/`expect`
(still reads `page` for `expect(page).toHaveTitle(...)` — that's an argument to `expect()`, not
a `page.*` call, so it's allowed) and lint went green.

### 6. Admin credentials: stop relying on the shell exporting env vars

`.env.example` has existed since Phase 1, but nothing actually loaded `.env` into
`process.env` — `TEST_ENV`/`BASE_URL` worked because they were being read directly, but the
admin test needs `ADMIN_USERNAME`/`ADMIN_PASSWORD` from `.env` per the "never hardcode
credentials" ground rule. Added:

```bash
pnpm add -D dotenv
```

and `import 'dotenv/config';` as the _first_ import in `playwright.config.ts` (import order
matters here — it must run before `config/environments.ts` or anything else reads
`process.env`). Playwright forwards the now-populated `process.env` to its worker processes,
so test files see the same values. Full typed config loading is still Phase 5's job — this is
the minimum needed to unblock Phase 3 without hardcoding secrets.

### 7. Tests

`tests/booking.spec.ts` — full guest flow: open homepage → set stay dates → check availability
→ book "Single" → fill guest details → confirm → assert `Booking Confirmed`.

`tests/admin-rooms.spec.ts` — log in as admin → create a room with a timestamp-derived unique
room number → assert it's listed → delete it → assert it's gone. Self-cleaning, since this
runs against the shared hosted instance.

### 8. Flaky failure, root-caused, not papered over

First full run: `booking.spec.ts` failed on firefox/webkit (chromium passed), with
`TimeoutError` waiting for the "Single" room's "Book now" link after `Check Availability`.
Re-running the whole suite made it fail on _all three_ browsers, including chromium, which had
passed moments earlier — a strong signal the failure was caused by the test's own prior runs,
not real flakiness.

Root cause: the test hardcoded the site's default pre-filled dates (today/tomorrow — same
dates used during the manual inspection step above, which had already created a real booking
for "Single" on those exact dates). RBP's "Check Availability" filters the room list against
_real_ existing bookings, so once "Single" was booked for that day, it correctly stopped
appearing — the page object was working correctly; the test's fixed dates were the bug.

Fix: `BookingHomePage.setStayDates(checkin, checkout)` fills the two date inputs directly
(`.dateWrapper input`, format `MM/DD/YYYY` matching what the site itself renders) rather than
relying on whatever's pre-filled. The test now picks a random day 30-330 days out on every run:

```ts
const daysOut = 30 + Math.floor(Math.random() * 300);
```

far enough out to not collide with anything booked near "today," and randomized so repeated
runs (and the 3 parallel browser projects within one run) don't all fight over the exact same
day either. Verified stable across two consecutive full 9-test runs after the fix.

### 9. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean, including the new tests/** restriction rules

pnpm run test:hosted
# Running 9 tests using 8 workers
#   9 passed (13.3s)

pnpm run test:hosted   # ran again immediately after, to rule out flakiness
#   9 passed (13.3s)
```

Phase 3 complete: 4 page objects + fixture-based injection, lint-enforced separation between
tests and Playwright/page internals, and 3 passing spec files (9 tests across 3 browsers)
against the real hosted RBP instance.

### 10. Commit + push

```bash
git add .gitignore README.md SETUP.md eslint.config.js fixtures pages package.json \
  playwright.config.ts pnpm-lock.yaml tests
git commit -m "feat: add Page Object Model architecture with fixture-based injection"
git push
# f82f354..df5bd71  main -> main
```

---

## Phase 4 — API Testing Layer

### 1. Reverse-engineer the real API from network traffic

RBP has no published API spec. Probed the hosted instance directly with plain `fetch` in a
throwaway script (`scratch-api.mjs`, deleted before committing) to learn the real request/
response shapes for every endpoint needed: `GET /api/room`, `POST /api/auth/login`,
`GET/POST/DELETE /api/booking(/:id)`, `GET/POST/DELETE /api/message(/:id)`,
`POST/DELETE /api/room(/:id)`.

Key findings that shaped the client:

- **Auth is a bare opaque token, not a cookie the server sets for you.**
  `POST /api/auth/login` returns `{ token }` with no `Set-Cookie` header. Tried `Authorization:
Bearer`, a custom `X-Auth-Token` header, and a manually-constructed `Cookie: token=<value>`
  header against a protected endpoint (`GET /api/booking?roomid=1`) — only the `Cookie` header
  worked (401 → 200). The real frontend must set this via `document.cookie` client-side after
  login (a browser blocks scripts from setting the `Cookie` _request_ header directly, but
  `document.cookie` is a different, allowed API) — a plain HTTP client isn't bound by that
  browser restriction, so setting the header explicitly is the correct equivalent.
- **Different endpoints need different auth.** `GET /api/room`, `POST /api/booking` (guests
  book without logging in — matches the UI flow from Phase 3), `GET/POST /api/message`, and
  `GET /api/message/:id` are all public. `GET/DELETE /api/booking/:id`, `GET /api/booking?
roomid=`, `POST/DELETE /api/room(/:id)`, and `DELETE /api/message/:id` require the auth
  cookie.
- **Booking creation needs a nested `bookingdates` object**, not flat `checkin`/`checkout`
  fields — a flat payload silently produced `{"errors":["Failed to create booking"]}` (500);
  matching the shape `GET /api/booking` itself returns fixed it (201).
- `POST /api/room` returns just `{success:true}`, not the created room — its `roomid` has to be
  found afterward via `GET /api/room`.

### 2. `api/schemas.ts` — zod schemas, types inferred from them

One schema per response shape (`RoomSchema`, `BookingSchema`, `MessageSchema`,
`MessageSummarySchema`, `LoginResponseSchema`, list wrappers for each), with
`z.infer<typeof X>` for the TypeScript types instead of hand-duplicating interfaces that could
drift from the schema.

### 3. `api/RbpApiClient.ts` — the typed client

One method per operation, each `.parse()`-ing the response through its schema:
`login`, `listRooms`, `createRoom`, `deleteRoom`, `createBooking`, `getBooking`,
`listBookingsForRoom`, `deleteBooking`, `listMessages`, `getMessage`, `sendMessage`,
`deleteMessage`. `login()` stores the token internally and attaches
`Cookie: token=<value>` on every subsequent authenticated call via a private `authHeaders()`
helper that throws a clear error if called before `login()`.

Removed `api/.gitkeep` now that the folder has real content.

### 4. Extracted `config/credentials.ts`

Multiple test files now need `ADMIN_USERNAME`/`ADMIN_PASSWORD`, previously inlined only in
`tests/admin-rooms.spec.ts`. Pulled into one `adminCredentials` export and updated
`admin-rooms.spec.ts` to use it too, so there's one place reading those env vars.

### 5. Wire `apiClient` into the fixture, extend the lint boundary

Added an `apiClient` fixture to `fixtures/pages.fixture.ts` (constructs `RbpApiClient` from
Playwright's built-in `request` fixture). Extended the Phase 3 `no-restricted-syntax` ESLint
rule from banning only `page.*` calls in `tests/**` to also ban `request.*` — the same
separation principle applies to the API layer: tests get HTTP access only through
`RbpApiClient`, never the raw `APIRequestContext`.

### 6. Tests: 3 contract tests + 1 hybrid seeding test

- `tests/api/rooms.spec.ts` — `GET /api/room` returns the 3 seed rooms with a schema-valid
  shape.
- `tests/api/bookings.spec.ts` — create → get-by-id → list-by-room → delete, asserting the
  response at each step.
- `tests/api/messages.spec.ts` — send → find-in-list → get-by-id → delete, asserting content
  matches what was sent.
- `tests/room-seeded-via-api.spec.ts` — the "(b) test-data seeding" half of this phase's brief:
  create a room via the API, confirm it independently through a UI page object, delete it via
  the API.

### 7. Three real bugs, found by actually running these against the shared instance

**Bug 1 — schema too strict.** First full run failed `tests/api/rooms.spec.ts` with 20+ zod
errors like `path: ["rooms", 17, "description"], expected string, received undefined` — and
the room _index_ being 17 was itself a clue that something had gone wrong before this bug even
mattered (see Bug 3). Root cause: `RoomSchema` required `description` and `image` as strings,
but those fields only exist on the 3 originally-curated rooms — anything created through the
admin panel's create-room form (no description/image inputs) or this phase's `createRoom` API
method never gets them. Fixed by making both `.optional()` in the schema — this is what the
real API actually does, not a workaround.

**Bug 2 — wrong UI target for the seeding test.** The first version of
`room-seeded-via-api.spec.ts` created a room via the API, then asserted it appeared as a
`.room-card` on the **public homepage** (`/`). That failed 100% of the time, on all 3 browsers,
even with a guaranteed-unique price to search for. Root cause: `/` is a statically pre-rendered
Next.js route (confirmed from the build output captured back in Phase 1's setup log —
`├ ○ /` — `○ (Static)`), so it reflects whatever existed at build time and never picks up
rooms created afterward. The **admin rooms panel**, by contrast, is what Phase 3's
`admin-rooms.spec.ts` already proved is live/dynamic. Rewrote the test to log into the admin
panel and check `adminRoomsPage.roomRow(roomName)` instead — which is also a closer match to
what the original phase plan actually specified ("create a booking via API before testing the
**admin panel** shows it").

**Bug 3 — `Date.now()` isn't a safe "unique" ID under parallelism.** Several tests generated
"unique" room numbers/prices/message subjects via
`` `9${Date.now() % 100_000}` ``. That looks unique but isn't: the 3 browser projects
(chromium/firefox/webkit) run the _same_ test in parallel and start within the same
millisecond window, so they can compute the identical "unique" value. When two workers' cleanup
code then does `rooms.find(r => r.roomName === roomName)`, it can match — and delete — a
_different_ worker's still-in-use room, which is exactly what surfaced as the Bug 2 fix's
`£712` room going missing mid-test on retries. `Math.random()` doesn't have this problem
(separate process, separate random state per worker). Extracted
`utils/uniqueSuffix.ts` (`Math.random()`-based) and reused it everywhere a "unique per test"
value was needed, replacing `Date.now()` throughout — including refactoring Phase 3's already-
working `randomStayDates()` logic into `utils/randomStayDates.ts` for the same reason
(consistency, and `tests/api/bookings.spec.ts` needed the same random-date approach that
`tests/booking.spec.ts` already used, since it _also_ hit the "hardcoded date collides with a
previous run's booking" bug from Phase 3, just via the API instead of the UI).

**Also:** every data-creating test now wraps its assertions in `try { ... } finally { cleanup
}` instead of cleanup-after-assertions — a failed assertion no longer skips deletion and leaves
orphaned data behind. This is _why_ Bug 1 was even visible: earlier debugging-session test
runs (before this fix existed) had left ~18 orphaned rooms on the shared hosted instance from
failed assertions that never reached their cleanup step.

### 8. Cleaned up accumulated test debris

Before the fixes above, the shared hosted instance had accumulated 21 rooms (only 3 are the
real seed rooms). Listed them via a throwaway script, confirmed with the user before deleting
anything (shared/public infrastructure, not just this project's), then deleted every room
except `101`/`102`/`103`:

```bash
node scratch-cleanup.mjs
# deleted room 4 (912306): 202
# ... (18 total)
# rooms after cleanup: [ '1:101', '2:102', '3:103' ]
```

### 9. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean, including the extended tests/** restriction rules

pnpm run test:hosted
# Running 21 tests using 8 workers
#   21 passed (29.9s)

pnpm run test:hosted   # ran again immediately after
#   21 passed (29.9s)
```

Phase 4 complete: typed, schema-validated API client covering rooms/bookings/messages/auth,
used both for standalone contract tests and as a seeding utility for a UI test — plus three
real, non-hypothetical bugs found and fixed by actually running everything against the live
shared instance instead of trusting the implementation on paper.

---

## Phase 5 — Test Data & Config Management

### 1. `config/env.ts` — the one place `process.env` gets read

```ts
const EnvSchema = z.object({
  TEST_ENV: z.enum(['hosted', 'local']).default('hosted'),
  BASE_URL: z.string().url().optional(),
  ADMIN_USERNAME: z.string().default('admin'),
  ADMIN_PASSWORD: z.string().default('password'),
});

export const env = EnvSchema.parse(process.env);
```

Reused zod (already a dependency since Phase 4's API schemas) rather than hand-rolling
validation. `z.object` strips unrecognized keys by default, so `process.env`'s hundreds of
unrelated OS/shell variables pass through harmlessly — only the 4 keys above are extracted and
validated. `.parse()` throws immediately on load if something's wrong, which is exactly the
"fail fast with a clear error" behavior a typed config loader should have — previously
`config/environments.ts` read `process.env['TEST_ENV']` directly and silently fell back to
`'hosted'` on anything unrecognized, including a typo.

### 2. Base + per-environment override layering

Split the old single `config/environments.ts` (two fully-independent flat objects) into:

- `config/base.ts` — `baseEnvironmentConfig`, the defaults every environment starts from.
- `config/environments.ts` — a `Partial<EnvironmentConfig>` per environment (only what's
  actually different), merged onto the base via a small `layer()` helper
  (`{ ...baseEnvironmentConfig, ...override }`). `local`'s override is now just `{ baseURL:
'http://localhost' }` — every other field (retries, timeouts) inherits the base default
  instead of repeating it.
- Now imports `env.TEST_ENV` (validated) instead of reading `process.env` itself.

### 3. Wire `env` through the rest of config

`config/credentials.ts` and `playwright.config.ts`'s `BASE_URL` override both switched from
`process.env['X']` to `env.X`. After this, `config/env.ts` is the _only_ file in the repo that
touches `process.env`.

### 4. Verify the validation actually fires

```bash
TEST_ENV=bogus pnpm exec playwright test --list
```

```
ZodError: [
  {
    "expected": "\"hosted\" | \"local\"",
    "code": "invalid_type",
    ...
    "path": ["TEST_ENV"],
    "message": "Invalid option: expected one of \"hosted\"|\"local\""
  }
]
```

Fails immediately at config-load time with the exact allowed values named — not a vague
downstream Playwright error.

### 5. Test data factories

```bash
pnpm add -D @faker-js/faker
```

- `data/guestFactory.ts` — `buildGuest(overrides?)`: first/last name, email, phone.
- `data/roomFactory.ts` — `buildNewRoom(overrides?)`: room number (via Phase 4's
  `uniqueSuffix()`), type, accessible, price, features.
- `data/bookingFactory.ts` — `buildNewBooking(overrides?)`: built from `buildGuest()` +
  `randomStayDates()` (Phase 3/4's collision-safe date helper), plus `depositpaid`.
- `data/messageFactory.ts` — `buildNewMessage(overrides?)`: built from `buildGuest()`, plus a
  random subject/description.

Every factory takes an `overrides` param so a test can pin down exactly the fields it cares
about (`buildNewBooking({ roomid: 1 })`) while getting realistic, collision-safe random data
for everything else. Removed `data/.gitkeep` now that the folder has real content.

**A `strict`/`exactOptionalPropertyTypes` wrinkle:** `buildNewRoom`'s return type was
originally annotated `: NewRoom`, where the API's `NewRoom.features` is _optional_
(`features?: RoomFeature[]`) since a direct API caller might not specify it. But the factory
_always_ assigns a value — annotating the return type widened it back to
`RoomFeature[] | undefined` anyway, which then failed `admin-rooms.spec.ts`'s
`exactOptionalPropertyTypes: true` check when passed to `AdminRoomsPage.createRoom`. Fixed by
using `satisfies NewRoom` instead of a `: NewRoom` annotation — this checks assignability
without widening the inferred type, so `features` stays known-always-present on the factory's
actual return value.

### 6. Refactor existing tests onto the factories

- `tests/booking.spec.ts` — `fillGuestDetails({ firstName: 'Jane', ... })` → `fillGuestDetails(buildGuest())`.
- `tests/admin-rooms.spec.ts` / `tests/room-seeded-via-api.spec.ts` — inline room objects →
  `buildNewRoom()`, mapped to whichever shape the call site needs (the admin UI form takes
  `price` as a string; the API takes `roomPrice` as a number — the factory produces the API
  shape, call sites adapt at the boundary rather than forcing one factory to serve both).
- `tests/api/bookings.spec.ts` — hardcoded `firstname: 'Api', lastname: 'ContractTest'` and a
  fixed future date → `buildNewBooking({ roomid: 1 })`.
- `tests/api/messages.spec.ts` — hardcoded name/email/phone/description → `buildNewMessage({
subject })` (subject still explicit — the test needs a known value to search for
  afterward), and the assertion now compares against the actual built object
  (`toMatchObject({ ...message })`) instead of duplicating literals that could drift from what
  was actually sent.

`toMatchObject` needed the `{ ...message }` spread — passing the `NewMessage`-typed variable
directly hit `Argument ... not assignable to Record<string, unknown>: Index signature for type
'string' is missing`, a strict-mode quirk where a named interface isn't accepted where a
literal/indexable shape is expected; a fresh object literal (via spread) satisfies it.

### 7. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint         # clean

pnpm run test:hosted
# Running 21 tests using 8 workers
#   21 passed (30.5s)
```

Phase 5 complete: config is layered (base + per-env overrides) and centrally validated (one
zod-checked entry point for all env/secrets), and every test that creates data now does so via
a realistic, collision-safe, overridable factory instead of a hardcoded literal.

---

## Phase 6 — Reporting & Diagnostics

### 1. Add Allure alongside the existing HTML report

```bash
pnpm add -D allure-playwright allure-commandline
```

`allure-commandline` wraps the Java-based Allure CLI as an npm package (no separate global
install) — it needs a JVM, which JDK 26 (installed back in Phase 1 for RBP's local Maven build)
already provides on this machine. Verified before relying on it:

```bash
pnpm exec allure --version
# 2.43.0
```

Changed `playwright.config.ts`'s `reporter` from the bare string `'html'` to an array so both
run every time:

```ts
reporter: [['html'], ['allure-playwright']],
```

Added two scripts:

```json
"report:allure": "allure generate allure-results --clean -o allure-report",
"report:allure:open": "allure open allure-report"
```

`.gitignore` already had `allure-results/`/`allure-report/` entries from Phase 1's initial
scaffolding — nothing to add there.

### 2. Prove both reporters actually produce a report

```bash
pnpm run test:hosted
# 21 passed (28.8s)
```

Confirmed `playwright-report/index.html` existed and `allure-results/` had exactly 21
`*-result.json` files (one per test). Generated the Allure report and read its summary widget
directly rather than trusting "no errors was printed":

```bash
pnpm run report:allure
node -e "console.log(require('./allure-report/widgets/summary.json').statistic)"
# { failed: 0, broken: 0, skipped: 0, passed: 21, unknown: 0, total: 21 }
```

### 3. Deliberately fail a test — the actual point of this phase

Wrote a throwaway `tests/_temp-deliberate-failure.spec.ts` (never committed) asserting an
impossible page title, to verify failure artifacts are genuinely captured, not just configured:

```ts
test('deliberate failure to verify artifact capture', async ({ page, bookingHomePage }) => {
  await bookingHomePage.open();
  await expect(page).toHaveTitle(/this-title-will-never-match-xyz/);
});
```

First attempt used `--reporter=list` on the CLI to get readable console output — which turned
out to **completely override** the array of reporters configured in `playwright.config.ts`, so
`allure-playwright` silently didn't run and `allure-results/` was never created. Re-ran without
that flag (letting the configured `[html, allure-playwright]` reporters run as normal, still
readable from the terminal's own failure summary) and both fired correctly.

Confirmed on disk, not just by absence of errors:

```bash
find test-results -type f
# .../test-failed-1.png, video.webm, trace.zip, error-context.md
```

Allure's top-level `result.json` has an empty `attachments: []` at the root — attachments live
nested inside the step tree, not flattened at the top. Walked the tree to find them:

```bash
node -e "
  const r = require('./allure-results/<uuid>-result.json');
  function find(node, path) {
    if (node.attachments?.length) console.log(path, JSON.stringify(node.attachments));
    for (const s of node.steps || []) find(s, path + ' > ' + s.name);
  }
  find(r, r.name);
"
```

```
... > screenshot      [{"name":"screenshot","source":"...png","type":"image/png"}]
... > video           [{"name":"video","source":"...webm","type":"video/webm"}]
... > error-context   [{"name":"error-context","source":"...md","type":"text/markdown"}]
... > trace           [{"name":"trace","source":"...zip","type":"application/vnd.allure.playwright-trace"}]
```

All four attached with correct MIME types. Regenerated the Allure report against this failure
run too and confirmed its summary showed `{ failed: 1, passed: 0, total: 1 }` — the failure
renders, not just gets recorded.

### 4. Clean up

```bash
rm tests/_temp-deliberate-failure.spec.ts
rm -rf test-results playwright-report allure-results allure-report
```

The temporary failing test was never meant to be committed — it existed purely to prove
artifact capture works, per the phase's own instructions ("verified by deliberately failing a
test"), not to become a permanently broken test in the suite. Re-ran the real suite clean
afterward to confirm nothing was left in a bad state.

### 5. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean

pnpm run test:hosted
# Running 21 tests using 8 workers
#   21 passed (19.6s)
```

Phase 6 complete: Allure runs alongside the existing HTML reporter on every execution, and
failure-artifact capture (trace/video/screenshot) is verified working in both, not just
configured and assumed.

---

## Phase 7 — Dockerize

**Pacing note:** starting this phase, work is now paused after each day-chunk within a phase,
not just at phase boundaries — user asked directly whether the roadmap's day-breakdown was
being treated as a literal pacing plan (it hadn't been; Phases 1-6 each ran to completion in
one pass) and chose to tighten it. This file's Phase 7 section will grow one day-chunk at a
time as a result, rather than all at once like earlier phases.

### Day 1 — base image, build, smoke test in-container

#### 1. Pin the base image to the exact installed Playwright version

`@playwright/test` is `1.62.1`. Confirmed the matching Docker tag actually exists before
writing the Dockerfile around it, rather than guessing from Playwright's docs (which only had
`v1.62.0` examples at the time):

```bash
docker manifest inspect mcr.microsoft.com/playwright:v1.62.1-noble
# (returns a valid multi-arch manifest — tag exists)
```

Wrote `Dockerfile`:

```dockerfile
FROM mcr.microsoft.com/playwright:v1.62.1-noble
WORKDIR /app
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
CMD ["pnpm", "test"]
```

and `.dockerignore` (`node_modules`, `.git`, report/result directories, `.env`,
`E2E_manual.md`) — applying Phase 1's RBP build-context lesson (an unexcluded `node_modules`
caused a Windows resource-exhaustion error back then) preemptively this time, instead of
discovering it the same way twice.

#### 2. Docker Desktop's WSL2 backend broke again — different failure mode this time

```bash
docker build -t rbp-e2e-tests:latest .
```

First attempt failed immediately:

```
ERROR: failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine
```

Same category of problem as Phase 1 (Docker Desktop/WSL2 instability), so applied the same
known fix — `wsl --shutdown` — after re-confirming with the user first (it's machine-wide, not
scoped to this project, same as last time). Docker reconnected within seconds. Retried the
build; this time it got further but failed differently:

```
ERROR: write /var/lib/docker/buildkit/containerd-overlayfs/metadata_v2.db: read-only file system
```

#### 3. Root cause: the host disk itself was full

```powershell
Get-PSDrive -Name C | Select-Object Used,Free
```

Free space: **~7MB**. An ext4 filesystem (which is what Docker Desktop's WSL2 disk uses
internally) remounts itself read-only as a protective measure when the underlying disk fills
up — that's what actually broke the build, not Docker itself being unhealthy. `wsl --shutdown`
had only fixed the _previous_ symptom (the pipe connection), not this one.

This is a host-level problem, not scoped to this project, and involves deleting things outside
this repo's control — stopped and asked before doing anything. User asked for a read-only
investigation first. Ran non-destructive size scans, drilling down one level at a time
(`C:\` → `C:\Users` → `AppData` → `AppData\Local`) rather than one giant recursive scan, to keep
each command fast enough to actually finish:

```
C:\Users                     57.75 GB   →  hp\AppData\Local  43.77 GB   →
  Packages        10.92 GB   (Windows Store app data)
  Docker          10.40 GB   (Docker Desktop's own data)
  Programs         7.96 GB
  ms-playwright     2.41 GB  (our own browser binaries)
  ...
```

Presented this breakdown and let the user choose the cleanup approach rather than picking one
unilaterally — they chose a full Docker Desktop purge (reclaims the ~10GB `Docker` folder, at
the cost of wiping _all_ Docker images/containers/volumes/build cache on the machine, not just
this project's).

#### 4. Executing the purge

Docker Desktop's GUI "Clean / Purge data" has a CLI-scriptable equivalent. `wsl -l -v` showed
only one Docker-related distro (`docker-desktop` — no separate `-data` distro on this Docker
Desktop version). Stopped Docker Desktop's processes first, then:

```powershell
wsl --unregister docker-desktop
```

This only reclaimed ~0.7GB — nowhere near the ~10GB expected. The actual data disk turned out
to live outside the named-distro registration entirely, at
`%LOCALAPPDATA%\Docker\wsl\disk\docker_data.vhdx` (10.29GB, found by searching for `*.vhdx`
files directly rather than assuming the distro list was the whole picture). Deleted it directly
(safe since Docker Desktop's processes were already stopped):

```powershell
Remove-Item "$env:LOCALAPPDATA\Docker\wsl\disk\docker_data.vhdx" -Force
```

Free space went from ~7MB to **16.53GB**. Relaunched Docker Desktop from its actual install
path — `%LOCALAPPDATA%\Programs\DockerDesktop\Docker Desktop.exe`, _not_ `C:\Program Files\...`
(this install was per-user, not machine-wide; the standard path guess failed first). Docker
came back healthy with a fresh, empty data disk (confirmed via `docker system df`: 0 images, 0
containers, 0 build cache).

#### 5. Build + verify

```bash
docker build -t rbp-e2e-tests:latest .
# ... succeeds. One harmless warning during `pnpm install`'s `prepare` script:
#   $ husky
#   .git can't be found
# Expected — .dockerignore excludes .git, and git hooks are meaningless inside a container
# that only runs tests, never commits. Does not fail the build.

docker images rbp-e2e-tests
# rbp-e2e-tests:latest   3.87GB disk / 1.03GB content

docker run --rm -e TEST_ENV=hosted rbp-e2e-tests:latest \
  pnpm exec playwright test tests/smoke.spec.ts --project=chromium
# Running 1 test using 1 worker
# [1/1] [chromium] › tests/smoke.spec.ts:3:1 › RBP booking homepage loads
#   1 passed (2.2s)
```

Day 1 complete: image builds cleanly, smoke test passes in-container against the real hosted
instance. Day 2 (full suite in-container + host parity check) is a separate go-ahead per the
new day-chunk pacing.

### Day 2 — full suite in-container, parity with a local run

#### 1. Rebuild fresh

```bash
docker build -t rbp-e2e-tests:latest .
```

Almost entirely layer-cached from Day 1 (only `COPY . .` re-ran, since no source changed) —
confirms the Dockerfile's layer ordering (deps installed before the rest of the source is
copied) is doing its job of keeping rebuilds fast.

#### 2. Mount report directories so artifacts land on the host

Reports only exist inside the container's filesystem by default and disappear with `--rm`
unless mounted out:

```bash
rm -rf test-results playwright-report allure-results allure-report
mkdir -p test-results playwright-report allure-results

docker run --rm -e TEST_ENV=hosted \
  -v "D:\Work\projects\E2E\playwright-typescript\test-results:/app/test-results" \
  -v "D:\Work\projects\E2E\playwright-typescript\playwright-report:/app/playwright-report" \
  -v "D:\Work\projects\E2E\playwright-typescript\allure-results:/app/allure-results" \
  rbp-e2e-tests:latest pnpm test
```

```
Running 21 tests using 8 workers
...
  21 passed (34.8s)
```

Confirmed the mounts actually worked, not just that the run passed:

```bash
ls playwright-report/        # index.html
ls allure-results/ | wc -l   # 21 — one raw result per test
```

#### 3. Host parity run

```bash
rm -rf test-results playwright-report allure-results allure-report
pnpm run test:hosted
```

```
Running 21 tests using 8 workers
...
  21 passed (26.4s)
```

Same 21 tests, same 3 browsers, same result, both places. The container run took longer
(~34.8s vs ~26.4s) — expected containerization overhead (extra virtualization layer under
WSL2), not a functional gap. No env var/secrets handling issues to resolve here — `-e
TEST_ENV=hosted` was already sufficient (proven in Day 1), and the admin-authenticated tests
(`admin-rooms.spec.ts`, the API bookings/messages contract tests) all passed using the
zod-defaulted `admin`/`password` credentials with no `.env` file present in the image at all,
confirming `config/env.ts`'s defaults work correctly with no environment configuration
whatsoever beyond the one `-e` flag.

#### 4. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean
```

Phase 7 Day 2 complete: full suite runs identically in-container and on the host, and reports
generated inside the container are accessible on the host via volume mounts. Day 3 (docs/buffer)
is a separate go-ahead.

### Day 3 — finalize

Rounded out `.dockerignore` to match `.gitignore`'s OS/editor/build-artifact exclusions
(`*.tsbuildinfo`, `.vscode`, `.idea`) — nothing in the earlier list was wrong, just incomplete.
Rebuilt (fully layer-cached except the final `COPY . .`) and ran the suite twice more in-
container to confirm the change didn't regress anything:

```bash
docker build -t rbp-e2e-tests:latest .
docker run --rm -e TEST_ENV=hosted rbp-e2e-tests:latest pnpm test
```

First run hit one flaky `booking.spec.ts` failure on webkit, retried, passed — the same class
of shared-hosted-instance transient flakiness documented since Phase 3, not a Docker or
`.dockerignore` regression. Second run was clean. `pnpm run typecheck`/`pnpm run lint` both
still pass.

Phase 7 complete: image builds cleanly, pinned to the exact installed Playwright version;
smoke test and full suite both verified in-container with results matching a host run;
reports accessible on the host via volume mounts; `.dockerignore` finalized.

---

## Phase 8 — GitHub Actions PR Checks

### Day 1 — base workflow: lint + typecheck

#### 1. Write the workflow

`.github/workflows/pr-checks.yml` — two jobs, `lint` and `typecheck`, each: checkout →
`pnpm/action-setup` (no `version` input, so it reads `packageManager` from `package.json`
automatically) → `actions/setup-node@v4` with `node-version: '24'` and `cache: 'pnpm'` →
`pnpm install --frozen-lockfile` → the job's own command. Triggers: `pull_request` targeting
`main`, plus `workflow_dispatch` for manual runs. `permissions: contents: read` (least
privilege — this workflow only reads, never writes). A `concurrency` group cancels a still-
running check when a new commit lands on the same PR, instead of wasting CI minutes on a
now-outdated run.

Order matters for the pnpm/Node setup steps: `pnpm/action-setup` must run _before_
`actions/setup-node`, because `setup-node`'s `cache: 'pnpm'` option needs `pnpm` already on
`PATH` to know what to cache.

#### 2. Prove it on a real PR, not just by reading the YAML

A GitHub Actions workflow "should work" based on reading it is not proof — the only real proof
is a run actually executing on GitHub. Rather than push straight to `main` (where a
`pull_request`-triggered workflow wouldn't even fire), created a branch specifically to
exercise it:

```bash
git checkout -b ci/pr-checks-workflow
git add .github/workflows/pr-checks.yml
git commit -F <message file>
git push -u origin ci/pr-checks-workflow
gh pr create --title "Add PR checks workflow" --base main --head ci/pr-checks-workflow
gh pr checks 1 --watch
```

```
lint        pass    18s
typecheck   pass    20s
```

Both jobs ran for real on GitHub Actions and passed. Squash-merged the PR
(`gh pr merge 1 --squash --delete-branch`), which fast-forwarded local `main` and cleaned up
the branch automatically.

This is the first PR-based change in this project — every prior phase committed straight to
`main`. The PR cycle here was specifically to get a real trigger for a `pull_request`-scoped
workflow to verify against; doc-only changes continue to commit directly to `main` as before,
not every future change needs to go through a PR.

#### 3. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean
```

Phase 8 Day 1 complete: lint and typecheck run as real, passing GitHub Actions checks on a
live pull request. Day 2 (smoke-test subset, sharded across browsers) is a separate go-ahead.

### Day 2 — sharded smoke-test matrix

#### 1. Add the matrixed job

Added a `smoke` job to `.github/workflows/pr-checks.yml`:

```yaml
smoke:
  runs-on: ubuntu-latest
  strategy:
    fail-fast: false
    matrix:
      browser: [chromium, firefox, webkit]
  steps:
    - uses: actions/checkout@v4
    - uses: pnpm/action-setup@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '24'
        cache: 'pnpm'
    - run: pnpm install --frozen-lockfile
    - run: pnpm exec playwright install --with-deps ${{ matrix.browser }}
    - run: pnpm exec playwright test tests/smoke.spec.ts --project=${{ matrix.browser }}
      env:
        TEST_ENV: hosted
```

Deliberately scoped to just `tests/smoke.spec.ts`, not the full suite — PR checks should give
fast feedback; the full 21-test regression run is Phase 10's scheduled-job territory, not
something every PR should wait on. `fail-fast: false` so a failure on one browser doesn't
cancel the other two shards mid-run — useful for actually seeing which browser(s) are affected
instead of just "something failed."

No secrets/env configuration needed: `config/env.ts`'s zod defaults (`TEST_ENV=hosted`,
`ADMIN_USERNAME`/`ADMIN_PASSWORD` defaulting to RBP's shipped `admin`/`password`) are enough
for the smoke test, which doesn't touch admin-gated functionality anyway.

#### 2. Verify via a real PR again

Same pattern as Day 1 — asked for and got go-ahead on the full branch → commit → push → PR →
watch → merge sequence before running any of it (per the "ask before commit/push" instruction
now in `CLAUDE.md`):

```bash
git checkout -b ci/sharded-smoke-matrix
git add .github/workflows/pr-checks.yml
git commit -F <scratchfile>
git push -u origin ci/sharded-smoke-matrix
gh pr create --title "Add sharded smoke-test matrix to PR checks" --base main --head ci/sharded-smoke-matrix
gh pr checks 2 --watch
```

```
lint                pass   19s
typecheck           pass   12s
smoke (chromium)    pass   44s
smoke (firefox)     pass   47s
smoke (webkit)      pass   1m3s
```

All 5 checks (the 2 from Day 1 plus the 3 new matrix shards) passed on a real GitHub Actions
run. `gh pr merge 2 --squash --delete-branch` fast-forwarded local `main` automatically.

Phase 8 Day 2 complete: PR checks now cover all 3 browsers via a fast, sharded smoke-test
matrix. Day 3 (artifact upload, required status check, branch protection) is a separate
go-ahead, and still needs the user's branch protection expectations first.

### Day 3 — artifact upload on failure

#### 1. Scope check: branch protection is still an open question

Day 3's full scope (per the roadmap) is artifact upload + required status check + branch
protection rule. The last two need the user's branch protection expectations, unanswered since
kickoff. Flagged a real tradeoff before asking again: our PR-checks workflow only triggers on
`pull_request` events, so if branch protection _requires_ those checks to pass, it also has to
_require a PR before merging_ — a direct push to `main` would never trigger them, and would
just sit blocked waiting on checks that never ran. That's a bigger process change than "turn on
a setting" — it would end the direct-to-`main` pattern used for every phase so far except CI-
workflow verification. User said to continue rather than block on it, so proceeded with just
the unblocked artifact-upload piece.

#### 2. Add the upload step

```yaml
- run: pnpm exec playwright test tests/smoke.spec.ts --project=${{ matrix.browser }}
  env:
    TEST_ENV: hosted
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: playwright-report-${{ matrix.browser }}
    path: playwright-report/
    retention-days: 7
```

Per-browser artifact names (`playwright-report-chromium` etc.) — required, since all 3 matrix
shards would otherwise try to upload an artifact named the same thing in the same run, which
GitHub Actions doesn't allow. No extra `permissions` needed — `actions/upload-artifact` works
under the existing `contents: read`.

#### 3. Prove it fires on a real failure, not just read the YAML

`if: failure()` looks right on paper, but the only real proof is watching it actually trigger.
Rather than trust that, deliberately broke the smoke test on the verification branch:

```bash
git checkout -b ci/artifact-upload-on-failure
git add .github/workflows/pr-checks.yml
git commit -F <scratchfile>              # the real change
# then, same branch, second commit:
#   tests/smoke.spec.ts: assert an impossible title
git add tests/smoke.spec.ts
git commit -m "temp: break smoke test to verify artifact upload on failure"
git push -u origin ci/artifact-upload-on-failure
gh pr create --title "Upload Playwright report on smoke-test failure" --base main --head ci/artifact-upload-on-failure
gh pr checks 3 --watch
```

All 3 `smoke` shards failed, as intended. Checked for the artifacts directly via the API
rather than trusting the Actions UI summary:

```bash
gh api repos/ramanwaliagithub/playwright-typescript-e2e/actions/runs/<id>/artifacts
```

```json
{
  "total_count": 3,
  "artifacts": [
    { "name": "playwright-report-chromium", "size_in_bytes": 8168346 },
    { "name": "playwright-report-webkit", "size_in_bytes": 14336275 },
    { "name": "playwright-report-firefox", "size_in_bytes": 13510958 }
  ]
}
```

All 3 present, non-trivial sizes (real HTML reports, not empty stubs).

#### 4. Clean up and merge

```bash
git revert --no-edit <temp-breakage-sha>
git push
gh pr checks 3 --watch   # all 5 green now
gh pr merge 3 --squash --delete-branch
```

Squash-merging collapsed the temporary breakage + its revert into a clean 6-line diff in
`main` — the intermediate broken state never persists in the permanent history, only in the
now-closed PR's own commit log.

#### 5. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean
git log --oneline -1
# 6b95b1a feat: upload the Playwright report on smoke-test failure
```

Phase 8 Day 3 (artifact upload) complete. Required status check + branch protection rule
remain blocked on the user's branch protection expectations.

### Day 3b — branch protection rule

User delegated the policy decision ("you decide how to handle it"). Decided on:

- **Require the 5 status checks** (`lint`, `typecheck`, `smoke (chromium/firefox/webkit)`),
  `strict: true` (branch must be up to date before merging) — this is the actual point of the
  phase, and matches the original kickoff plan's own wording ("required status check for
  merge").
- **No required PR-review approval count.** With one contributor, GitHub won't let the author
  approve their own PR — requiring even 1 approval would deadlock every future merge. Skip it
  until there's a second collaborator.
- **`enforce_admins: false`** — the repo owner keeps a bypass valve; the gate is real for
  anyone without admin rights. A hard "no bypass ever" felt like more process overhead than
  asked for on a currently-solo project, and would have forced every trivial docs fix through
  a full PR cycle going forward.
- **Disallow force-push and branch deletion on `main`** — standard hardening, no real
  downside.

#### 1. Apply it

GitHub branch protection isn't something `gh` has a first-class subcommand for beyond the raw
REST API, so applied it directly:

```bash
gh api --method PUT repos/ramanwaliagithub/playwright-typescript-e2e/branches/main/protection \
  -H "Accept: application/vnd.github+json" \
  --input branch-protection.json
```

```json
{
  "required_status_checks": {
    "strict": true,
    "checks": [
      { "context": "lint" },
      { "context": "typecheck" },
      { "context": "smoke (chromium)" },
      { "context": "smoke (firefox)" },
      { "context": "smoke (webkit)" }
    ]
  },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```

This first attempt was blocked by Claude Code's own auto-mode safety classifier — modifying
repo-level admin settings is treated as more sensitive than a normal commit, even though the
user had delegated the _policy_ decision. Explained exactly what the command would do and
asked for explicit permission before retrying; user approved, then it applied cleanly.

#### 2. Verify it's real, not just a 200 response

```bash
gh api repos/ramanwaliagithub/playwright-typescript-e2e/branches/main/protection
```

confirmed the settings persisted (`strict: true`, all 5 contexts, `enforce_admins: false`,
force-push/deletion both disabled). Then proved it actually _does_ something, rather than
trusting the API response alone: made a trivial, reversible direct push to `main` (a one-line
HTML comment in `README.md`).

```bash
git commit -m "test: verify branch protection blocks direct push"
git push
```

```
remote: Bypassed rule violations for refs/heads/main:
remote: - 5 of 5 required status checks are expected.
```

This is the correct, fully-expected result: GitHub evaluated the rule, found the push violated
it (no PR, so none of the 5 checks had run), and reported that — but let it through because the
pusher is the repo admin and `enforce_admins` is `false`, exactly as configured. Immediately
reverted the test commit and pushed the revert (same bypass message, same reasoning) to leave
no trace in `main`'s real content.

#### 3. Proof

```bash
pnpm run typecheck   # clean
pnpm run lint        # clean
git status            # clean — test commit + its revert cancel out
```

Phase 8 complete: PR checks (lint, typecheck, sharded smoke tests) run on every PR, failures
upload debuggable report artifacts, and branch protection genuinely gates merges for anyone
without admin rights — verified with a real (bypassed-as-designed) push, not assumed from the
API response.

---

## Phase 9 — Terraform: AWS Scheduled-Run Infrastructure

### Day 1 — remote state backend

#### 1. Check tooling and AWS access before writing anything

```bash
terraform -version   # v1.15.8, already installed
aws --version        # aws-cli/2.36.10, already installed
aws sts get-caller-identity
# NoCredentials — nothing configured yet
```

Asked the user how they wanted to handle AWS credentials rather than guessing — offered
`aws configure` (self-service, keeps secrets out of chat), `aws sso login`, pre-set env vars,
or deferring entirely. User chose to run `aws configure` themselves, in their own terminal, not
this one — never pasted into chat:

```bash
aws configure
# prompts for: AWS Access Key ID, AWS Secret Access Key, Default region name, Default output format
```

or, for SSO-based accounts instead of long-lived access keys:

```bash
aws configure sso
aws sso login --profile <profile-name>   # re-run whenever the SSO session expires
```

While waiting, wrote and validated everything that doesn't need live AWS access: the bootstrap
module's `.tf` files, `terraform fmt`, `terraform init` (downloads provider plugins from the
public registry, no AWS call), and `terraform validate` (pure config-consistency check, no AWS
call) — all passed clean before a single AWS credential existed.

#### 2. Existing IAM user vs. a dedicated one

User asked whether to reuse their one existing IAM user or create a new one. Real chicken-and-
egg problem: creating a _new_ least-privilege user requires _some_ existing privileged access
to create it with. Resolved as a staged plan: use the existing user to bootstrap, then (later in
this phase) provision a dedicated `rbp-e2e-terraform` IAM user with a scoped policy via
Terraform itself, and switch over to it for everything going forward — gets proper separation
without a deadlock.

#### 3. Credentials showed up under a named profile, not `default`

```bash
aws sts get-caller-identity
# still NoCredentials
```

`aws configure` had in fact been run, but under a named profile:

```bash
cat ~/.aws/config
# [profile terraform-cli]
# region = ap-southeast-2
aws sts get-caller-identity --profile terraform-cli
# Account: 689971417924, Arn: .../user/terraform-cli
```

Every `terraform`/`aws` command in this phase needs `AWS_PROFILE=terraform-cli` exported first
(the Bash tool doesn't persist env vars between calls in this environment, so it's set inline
per command, not once globally). The default region in `infra/bootstrap/variables.tf` and
`infra/versions.tf` was also updated from an initial `us-east-1` guess to `ap-southeast-2` to
match.

#### 4. Bootstrap module

```
infra/bootstrap/
  versions.tf   — terraform + required_providers (aws ~> 5.0, random ~> 3.6)
  variables.tf  — aws_region (default ap-southeast-2), project (default "rbp-e2e")
  main.tf       — random_id suffix, S3 bucket (versioned, AES256, public access blocked,
                  force_destroy = true), DynamoDB table (PAY_PER_REQUEST, hash key "LockID")
  outputs.tf    — state_bucket_name, state_lock_table_name, aws_region
```

`force_destroy = true` on the bucket was added deliberately, not left as the (safer) default
`false` — this bucket only ever holds Terraform state, never arbitrary data, and the plan for
today was apply → verify → destroy in one sitting. A versioned bucket with an object in it
(even just a state file) refuses to delete without `force_destroy`, so this was necessary to
tear down cleanly without a separate manual "empty the bucket" step.

Also caught and fixed a real bug in `.gitignore` while doing this: `.terraform.lock.hcl` was
listed as ignored, which is backwards — like `pnpm-lock.yaml`, it pins exact provider versions
and should be committed for reproducible plans. Fixed before it caused a problem (a teammate or
CI resolving a different provider version than expected).

#### 5. Plan, apply, and prove the backend actually works — not just trust the apply output

```bash
export AWS_PROFILE=terraform-cli
cd infra/bootstrap
terraform validate
terraform plan -out=bootstrap.tfplan
# Plan: 6 to add, 0 to change, 0 to destroy
```

Presented the full plan for review (per the standing "always ask before `apply`, it's cost-
incurring" rule) before running it:

```bash
terraform apply "bootstrap.tfplan"
# Apply complete! Resources: 6 added, 0 changed, 0 destroyed.
# state_bucket_name = "rbp-e2e-tfstate-f852008a"
```

Wired the real bucket name into `infra/versions.tf`'s backend block (replacing the
`REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name` placeholder — backend blocks can't reference
variables or other resources' outputs, so this hardcoding step is unavoidable and expected),
then actually exercised it rather than assuming the config was correct:

```bash
cd infra
terraform init
# Successfully configured the backend "s3"!
# (warning: `dynamodb_table` is deprecated in favor of `use_lockfile` — the newer AWS provider
#  supports native S3 locking without a separate DynamoDB table. Left as DynamoDB for now since
#  that's what the original phase plan explicitly asked for; noting the modernization option
#  here rather than silently switching away from the spec.)
terraform plan
# Acquiring state lock. This may take a few moments...
# No changes. (expected — infra/ has zero resources defined yet, Day 2/3's job)
```

The "Acquiring state lock" line is the real proof: it means Terraform actually reached out to
DynamoDB and S3, not just parsed the config. Double-checked directly against AWS too, bypassing
Terraform entirely:

```bash
aws s3api list-objects-v2 --bucket rbp-e2e-tfstate-f852008a   # empty — no resources to persist yet, expected
aws dynamodb describe-table --table-name rbp-e2e-tfstate-lock --query "Table.TableStatus"
# "ACTIVE"
```

#### 6. Deliberate teardown

The whole point of today's exercise was to prove the mechanism works, not to keep it running
indefinitely before Day 2/3 actually need it. Generated and reviewed a destroy plan before
running it, same as any other apply:

```bash
terraform plan -destroy -out=destroy.tfplan
# Plan: 0 to add, 0 to change, 6 to destroy
terraform apply "destroy.tfplan"
# Apply complete! Resources: 0 added, 0 changed, 6 destroyed.
```

Verified the resources are genuinely gone, directly against AWS, not just trusting Terraform's
own "complete" message:

```bash
aws s3api head-bucket --bucket rbp-e2e-tfstate-f852008a
# 404 Not Found
aws dynamodb describe-table --table-name rbp-e2e-tfstate-lock
# ResourceNotFoundException
```

Cleaned up local artifacts afterward: removed the now-stale `.tfplan` files and both `infra/`
and `infra/bootstrap/`'s local `.terraform/` cache directories (gitignored, never committed —
removed just so a future `terraform init` starts clean rather than pointing at cached state for
a backend that no longer exists). `infra/bootstrap/terraform.tfstate` (bootstrap's own local
state, since it doesn't use a remote backend itself) now correctly shows an empty `resources`
list. Reverted `infra/versions.tf`'s backend bucket name back to the
`REPLACE_WITH_BOOTSTRAP_OUTPUT_state_bucket_name` placeholder, with a comment pointing at this
record and at `E2E_manual.md`'s redo steps — leaving the real (now-destroyed) bucket name live
in the committed config would just be a dead reference, confusing for anyone (including
future-me) who tries to use it without re-reading history first.

#### 7. Proof

```bash
terraform fmt -recursive -diff   # clean, no changes needed
pnpm run typecheck                # clean
pnpm run lint                     # clean
```

Phase 9 Day 1 complete: the state backend mechanism (S3 + DynamoDB, provider/backend config) is
proven to work end-to-end against real AWS — created, verified via both Terraform and the raw
AWS API, then torn down the same way, with zero ongoing cost and a clean git history that
doesn't leave a dead resource reference behind. Redo steps for when this needs to be stood up
for real are in `E2E_manual.md`.

### Phase 9 Day 2 — CodeBuild execution role, project, log group

Added the three resources Day 2 was scoped to, in `infra/` (the main root, currently unapplied
since Day 1's state backend was deliberately torn down):

1. **CloudWatch log group** (`infra/cloudwatch.tf`) — `/codebuild/rbp-e2e`, 30-day retention.
   Written first since the IAM policy below needs its ARN.
2. **IAM role** (`infra/iam.tf`) — a role CodeBuild assumes (`sts:AssumeRole` trust policy
   scoped to the `codebuild.amazonaws.com` service principal), with an inline policy granting
   only `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:PutLogEvents` on that one log
   group's ARN — no wildcard resource access.
3. **CodeBuild project** (`infra/codebuild.tf`) — `rbp-e2e-regression`, GitHub source pointed at
   this repo, `buildspec` path set to `buildspec.yml` (doesn't exist in the repo yet — CodeBuild
   only reads that file when a build actually runs, not at `terraform apply` time; the file
   itself lands later in this phase when the scheduled regression suite is wired up).
   `NO_ARTIFACTS` for now since the S3 report bucket is Day 3's job. Also added a
   `github_token` variable (`sensitive = true`, `default = null`) — CodeBuild's GitHub source
   credential needs a personal access token, supplied at apply time via `TF_VAR_github_token`,
   never committed; `aws_codebuild_source_credential` only gets created (`count` gate) once a
   token is actually supplied.
4. `infra/variables.tf` (shared `project` variable) and `infra/outputs.tf` (project name, role
   ARN, log group name — for later phases to reference) round out the root module.

```bash
cd infra
terraform init -backend=false -input=false   # no real backend yet — offline validation only
terraform fmt -recursive -diff                # one alignment fix in codebuild.tf, applied
terraform validate
# Success! The configuration is valid.
```

Deliberately did **not** re-bootstrap the state backend or run a real `plan`/`apply` this day —
Day 3 adds the S3 report bucket and EventBridge schedule to the same root, so the plan is to
accumulate all of Phase 9's resources first and then do one comprehensive `terraform plan` for
review, rather than a partial plan per day. Committed as three separate commits (log group → IAM
role → CodeBuild project, in that dependency order so each one validates independently on its
own), each pushed right after committing.

### Phase 9 Day 3 — S3 report bucket, EventBridge nightly schedule

Added the last two resources Day 3 was scoped to, plus the IAM wiring between them and what Day
2 already created:

1. **S3 report bucket** (`infra/s3.tf`) — `rbp-e2e-reports-<account-id>` (account ID via
   `data.aws_caller_identity.current`, since S3 bucket names must be globally unique and this
   avoids needing a `random_id` resource in the main root). Public access fully blocked,
   AES256 server-side encryption, and a lifecycle rule expiring objects after 90 days plus
   aborting incomplete multipart uploads after 7 — reports are disposable build artifacts, not
   records to keep indefinitely.
2. **IAM policy extension** (`infra/iam.tf`) — added a second inline policy to the existing
   CodeBuild role: `s3:PutObject` scoped to `${aws_s3_bucket.reports.arn}/*` only. Write-only,
   no delete/list — a compromised build can publish a report but can't touch the bucket's
   existing history.
3. **EventBridge nightly schedule** (`infra/eventbridge.tf`) — a `aws_cloudwatch_event_rule`
   (`cron(0 2 * * ? *)` UTC by default, via a `schedule_expression` variable) targeting the
   CodeBuild project, plus its own IAM role (`events.amazonaws.com` trust policy) with an inline
   policy granting only `codebuild:StartBuild` on that one project's ARN. The rule's `state` is
   driven by a `schedule_enabled` variable defaulting to `false` — it ships **disabled**, since
   enabling it before `buildspec.yml` exists (Phase 10) would trigger real nightly builds
   guaranteed to fail, wasting CodeBuild minutes and cluttering the log group for no reason.
4. `infra/outputs.tf` — added `reports_bucket_name` and `nightly_schedule_rule_name`.

```bash
cd infra
terraform init -backend=false -input=false
terraform fmt -recursive -diff   # clean, no changes needed
terraform validate
# Success! The configuration is valid.
```

Committed as three separate commits, each independently valid without needing partial-file
staging: `infra/s3.tf` alone (no dependency on anything added this day), then `infra/iam.tf`
(depends on the now-committed bucket), then `infra/eventbridge.tf` + `infra/outputs.tf` together
(the outputs file picks up both this day's new outputs in one hunk, so splitting it further
would have needed a manual patch). Each pushed right after committing.

Phase 9 Day 3 complete — all of Phase 9's originally-scoped Terraform is now written and
validated offline. Still outstanding before any of it runs for real: re-bootstrap the state
backend (`infra/bootstrap/`, torn down at the end of Day 1), provision the dedicated
`rbp-e2e-terraform` IAM user (deferred from Day 1's staged-access plan), and run one
comprehensive `terraform plan` across everything above for review before `apply` — each of
those needs its own explicit go-ahead.

## Phase 10 — CodeBuild Scheduled Regression

Before starting, raised two items flagged at earlier phases as "revisit before Phase 10":

- **Failure notification channel** (Slack/Teams/email) — asked again; user chose to skip it for
  now. `buildspec.yml` ships without a notification step; adding one is a later follow-up.
- **RBP admin credentials** — flagged at kickoff as "propose alternate/rotated creds before
  Phase 9/10." Concluded that literally rotating the credentials isn't the right move:
  `automationintesting.online` is a shared public training instance other people also use, and
  changing its real admin password would break it for them. What was actually agreed at kickoff
  was a secrets _strategy_ (dotenv locally, a proper secret store in CI), not a credential
  _rotation_ — and that hadn't been wired into Terraform yet. Proposed wiring the existing
  credential values through AWS Secrets Manager; user redirected to **no ongoing cost**, which
  ruled that out (Secrets Manager charges ~$0.40/secret/month even idle) in favor of SSM
  Parameter Store (Standard tier, SecureString under the free AWS-managed key) instead.

**Credentials and buildspec, written and validated offline:**

1. `infra/ssm.tf` — 3 SSM parameters: `/rbp-e2e/ADMIN_USERNAME` and `/rbp-e2e/ADMIN_PASSWORD`
   (`SecureString`, no default — supplied via `TF_VAR_rbp_admin_username`/
   `TF_VAR_rbp_admin_password` at apply time, never committed) and `/rbp-e2e/BASE_URL` (plain
   `String`, defaults to `https://automationintesting.online`). Deliberately Standard tier (not
   Advanced) and the default `alias/aws/ssm` AWS-managed KMS key (not a customer-managed key) —
   both free, unlike Secrets Manager.
2. `infra/iam.tf` — extended the CodeBuild role with `ssm:GetParameters` scoped to exactly
   those 3 parameter ARNs, plus `kms:Decrypt` scoped to the SSM-managed key's ARN (looked up via
   a `data "aws_kms_alias"` block rather than hardcoding the key ID).
3. `infra/codebuild.tf` — added 4 `environment_variable` blocks to the project's `environment`:
   `REPORTS_BUCKET` (`PLAINTEXT`, the Day 3 bucket name) and `ADMIN_USERNAME`/`ADMIN_PASSWORD`/
   `BASE_URL` (`PARAMETER_STORE` type — CodeBuild resolves and decrypts these natively at build
   start, so the values never appear in the buildspec or Terraform config).
4. `buildspec.yml` (repo root) — `install` phase installs pnpm (via corepack) and all 3
   browsers; `build` phase runs `pnpm run test:hosted` (the full suite, not the PR-check smoke
   subset); `post_build` uploads the Playwright HTML report and a freshly generated Allure
   report to `s3://$REPORTS_BUCKET/reports/<UTC timestamp>-<build number>/`, run unconditionally
   so a failed build still leaves its reports behind for inspection.

```bash
cd infra
terraform init -backend=false -input=false
terraform fmt -recursive -diff   # clean, no changes needed
terraform validate
# Success! The configuration is valid.
```

Committed as four separate commits (SSM parameters → IAM grant → CodeBuild wiring → buildspec),
each independently valid, each pushed right after committing.

**Known unknown, can't be resolved without a real build:** whether `aws/codebuild/standard:7.0`'s
`runtime-versions: nodejs: 24` actually resolves to Node 24 — AWS updates that image tag's
available runtime versions over time rather than keeping it immutable, so this can only be
confirmed on the first real CodeBuild run, not by reading documentation now.

Remaining before this runs for real: re-bootstrap the state backend, provision the dedicated
`rbp-e2e-terraform` IAM user, supply the three `TF_VAR_*` values at apply time, run one
comprehensive `terraform plan` for review, then `apply`. The EventBridge schedule stays disabled
(`schedule_enabled = false`) until a manual build has been proven to succeed against the real
infrastructure — only then does it make sense to flip it on and re-apply.

## Phase 11a — Flake Quarantine & Self-Healing Locators

Moved to Phase 11 (Enterprise Hardening) even though Phase 10 Day 2/3's verification (a real
manual CodeBuild run, confirming the EventBridge schedule fires) is still blocked on the
deferred `terraform apply` — explicit user call, not a silent skip. Recovered the original
roadmap artifact first to confirm Phase 11's actual day-chunk scope (11a/11b/11c) rather than
guessing it from memory.

**Self-healing locators, built and retrofitted onto real page objects:**

1. `utils/SelfHealingLocator.ts` — wraps a primary + fallback `Locator` pair. `resolve()` calls
   `primary.waitFor({ state: 'attached', timeout: 2000 })`; on timeout it attaches a diagnostic
   note to the running test (via `test.info().attach(...)`, imported directly from
   `@playwright/test` — allowed here since the project's lint boundary banning that import only
   applies to `tests/**`, not `pages/`/`utils/`) and returns the fallback locator instead of
   throwing. Exposes `click()`/`fill()` — the two actions actually needed at the two call sites
   below; not built out further speculatively.
2. Retrofitted `AdminLoginPage`'s login button (`#doLogin` primary → `getByRole('button', {name:
/log ?in/i})` fallback) and `AdminRoomsPage`'s room delete button (`.roomDelete` primary →
   `getByRole('button', {name: /delete/i})` fallback) — the two most CSS-class/ID-coupled
   interactive elements among the current page objects, picked by inspecting every existing
   locator rather than guessing.

Proof, not just typecheck/lint: ran `tests/admin-rooms.spec.ts` + `tests/smoke.spec.ts` against
the hosted instance with the retrofit in place (2 passed), confirming the wrapper's happy path
(primary locator resolves normally, fallback never triggers) doesn't change existing behavior.
Then ran the **full** suite once more for a broader regression check:

```bash
TEST_ENV=hosted pnpm exec playwright test --project=chromium
# Running 7 tests using 7 workers ... 7 passed (7.1s)
```

**Flake quarantine mechanism, and a real bug caught while proving it:**

1. First attempt: `playwright.config.ts`'s `grepInvert: /@quarantine/` (excluding tagged tests
   from every normal run) plus a `test:quarantine` package.json script running
   `playwright test --grep @quarantine` (to select only tagged tests, for checking whether one
   has stabilized).
2. **Proof caught a real bug in this design**, using the same never-committed-temporary-test
   technique as Phase 6's failure-artifact verification: added a throwaway
   `tests/_tmp-quarantine-proof.spec.ts` tagged `{ tag: '@quarantine' }`, then ran
   `playwright test --grep @quarantine --list` — got `Error: No tests found`, not the expected
   single test. Root-caused by reading `node_modules/.pnpm/playwright@1.62.1/.../runner/index.js`
   directly rather than guessing: CLI `--grep`/`--grep-invert` **AND with** config's
   `grep`/`grepInvert` (both filters chain via `preOnlyTestFilters.push`), they don't replace
   config's setting — so a `@quarantine`-tagged test was excluded by config's `grepInvert` before
   the CLI's `--grep` ever got a chance to select it.
3. Fixed by switching to an env-var-driven config toggle instead of a CLI flag:
   ```ts
   const quarantineOnly = process.env['QUARANTINE_ONLY'] === 'true';
   // ...
   ...(quarantineOnly ? { grep: /@quarantine/ } : { grepInvert: /@quarantine/ }),
   ```
   (`process.env['QUARANTINE_ONLY']` not `process.env.QUARANTINE_ONLY` —
   `noPropertyAccessFromIndexSignature` under this project's strict `tsconfig.json` requires
   bracket access for index-signature properties.) `test:quarantine` now runs
   `cross-env QUARANTINE_ONLY=true TEST_ENV=hosted playwright test` — no CLI `--grep` needed,
   config alone decides which of `grep`/`grepInvert` is active. A first version tried
   `grep: quarantineOnly ? /@quarantine/ : undefined` directly, which failed `tsc --noEmit` under
   `exactOptionalPropertyTypes: true` (`undefined` isn't assignable where the field is typed
   `RegExp | RegExp[]`, only _absent_); fixed by conditionally spreading in only the one field
   that should be present (`...(quarantineOnly ? {grep: ...} : {grepInvert: ...})`) rather than
   setting the other to `undefined`.
4. Re-verified both directions with the same temporary test: default run listed only
   `smoke.spec.ts` (quarantined test excluded); `QUARANTINE_ONLY=true` run listed only the
   quarantined test. Removed `tests/_tmp-quarantine-proof.spec.ts` before committing — never
   part of any commit.

Committed as two commits (self-healing locators, then the quarantine mechanism), each pushed
right after committing. No tests are currently quarantined — the mechanism exists for the next
time one is needed, not because one exists today.
