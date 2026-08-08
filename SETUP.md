# Setup Log

Running, chronological record of every command used to set up this project from an empty
directory, and why. This file is updated after every phase — it is the source of truth for
"how do I get this environment working from scratch," separate from `README.md` (which
documents what the framework does and how to run tests day-to-day).

Environment this was built against: Windows 11, Node v24.18.0, Docker 29.6.2, Docker Compose
v5.3.0, git 2.54.0.

---

## Phase 1 — Project Scaffolding (in progress)

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
pnpm -v   # 11.20.0
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
