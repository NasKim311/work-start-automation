# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**DeskReady** — an Electron desktop app (Korean UI) that lets a user queue up a list of
"morning routine" tasks (open a website in Chrome, launch a program/VS Code folder) with
per-task delays, save that list, and either run it on demand or automatically on Windows
login.

## Running it

There is no combined dev script — in dev (`app.isPackaged === false`), the Electron shell
always points at the Vite dev server, so both must run together in separate terminals:

```bash
# terminal 1 — Vite dev server (must be on :5173, hardcoded in electron/main.js)
cd react-app
npm install
npm run dev

# terminal 2 — Electron shell
npm install   # at repo root
npm start
```

Other react-app commands: `npm run build` (tsc -b && vite build), `npm run lint` (eslint .),
`npm run preview`, `npm run test` (Vitest, unit tests for pure logic in `src/utils.ts`).

At the repo root: `npm run build` (builds `react-app/dist` by delegating into `react-app`),
`npm run dist` (build + `electron-builder`, produces an NSIS installer and a portable `.exe`
under `release/` — see "Packaging" below), `npm run test:e2e` (Playwright, drives the real
Electron app end-to-end — see "E2E tests" below).

Note: `electron/main.js`'s `createWindow` branches on `app.isPackaged` — unpackaged (dev) loads
`http://localhost:5173` from the Vite dev server; packaged loads `react-app/dist/index.html`
via `loadFile`, so `react-app` must be built (`npm run build` at the repo root, or `cd react-app
&& npm run build`) before packaging.

### Packaging

`electron-builder` is configured via the root `package.json`'s `"build"` field (`appId`,
`productName: "DeskReady"`, Windows `nsis` + `portable` targets, output to `release/`).
`npm run dist` builds the renderer then runs `electron-builder`. The app icon
(`build.win.icon` → `build/icon.png`, source vector at `build/icon-source.svg`) is a custom
"모닝 노트"-palette mug-and-checkmark mark matching the in-app hero wordmark
(`react-app/src/App.tsx`'s hero `<svg>`) — regenerate `icon.png` from the source SVG (e.g. via
a headless-browser screenshot) if the design changes; electron-builder converts the PNG to
`.ico` at build time. `electron` and `electron-builder` are `devDependencies` (not
`dependencies`) deliberately — electron-builder replaces the Electron npm package with the
platform binary at packaging time, so having it under `dependencies` risks bundling the ~300MB
npm package into the app.

`react-app/vite.config.ts` sets `base: "./"`. Without it, Vite's production build emits
absolute asset paths (`/assets/index-*.js`) which resolve fine on a dev server but break under
`loadFile()`'s `file://` protocol in a packaged app — the window opens (title bar shows
correctly) but renders completely blank, since the JS/CSS never load. If a packaged build ever
shows a blank window again, check this first before anything else.

### Tests

- **Unit tests** (`react-app`, Vitest, `npm run test`): cover pure logic extracted into
  `react-app/src/utils.ts` — `formatDelay`, `secondsToDisplay`/`displayToSeconds` (delay
  seconds↔minutes conversion), `reorderTasks` (drag-and-drop / up-down-button reordering).
  These are plain functions with no React/Electron dependency, kept in `utils.ts` specifically
  so they're cheap to test in isolation — prefer extracting new pure logic there over inlining
  it in a component when it's meaningfully testable.
- **E2E tests** (repo root, `@playwright/test` + its `_electron` launcher, `npm run test:e2e`,
  specs under `e2e/`): boot the real Electron app via `e2e/fixtures.ts`'s `test`/`page`
  fixtures, each with an isolated temp `--user-data-dir` (and optionally a seeded
  `config.json` via `test.use({ initialConfig: makeConfig([...]) })`) so tests never touch the
  developer's real config. `playwright.config.ts`'s `webServer` starts/reuses the Vite dev
  server on `:5173`, since unpackaged Electron always loads from there regardless of test
  context.
  **Fixture gotcha**: the `electronApp` fixture's teardown force-`destroy()`s all windows
  before calling `app.close()`. If it only called `close()`, a test that leaves the app dirty
  (any task add/remove/reorder without saving) would hit the real "저장 안 한 변경사항"
  confirmation dialog on shutdown — a blocking native dialog nothing in the test would ever
  answer, hanging until Playwright's teardown timeout. Don't remove that `destroy()` call
  without accounting for this.

## Architecture

Two separate npm packages, not a workspace:
- **Repo root** (`package.json`, `electron/`) — the Electron main process. `main.js` is the
  Electron entrypoint (`"main"` field); has its own `node_modules`/lockfile.
- **`react-app/`** — the Vite + React + TypeScript renderer, styled with Tailwind v4 (via
  `@tailwindcss/vite`, configured in `react-app/src/index.css` with `@theme`, not a
  `tailwind.config.js`). Its own `node_modules`/lockfile — always `cd react-app` before running
  its npm scripts.

**IPC boundary** — the renderer never touches Node/Electron APIs directly; everything goes
through `electron/preload.js`'s `contextBridge`-exposed `window.electronAPI`. Any new IPC
capability requires changes in three places kept in sync by hand:
1. `ipcMain.handle(...)` (or `ipcMain.on(...)` for one-way notifications) in `electron/main.js`
2. the matching bridge method in `electron/preload.js`
3. the `ElectronAPI` interface in `react-app/src/types.ts`

Current channels: `load-config`, `save-config`, `run-tasks`, `run-single-task` (runs one task
immediately, ignoring its delay — for testing a URL/path without waiting through the whole
list's cumulative delay; shares the `runSingleTask` execution logic with `run-tasks`),
`stop-tasks` (cancels `pendingTimeouts` via the same `clearPendingTasks` helper `run-tasks`
uses at its own start — only cancels not-yet-fired scheduled tasks; a task whose `exec`/`execFile`
has already been kicked off keeps running, this can't kill it), `select-file`, `export-config`
(writes the whole `AppConfig` to a JSON file via `dialog.showSaveDialog`, for moving routine
sets to another PC), `import-config` (reads a JSON file via `dialog.showOpenDialog`; accepts
either the current `AppConfig` shape or the old `{ tasks: [...] }` shape via the same
`makeDefaultConfig` migration `load-config` uses), `get-auto-start`, `set-auto-start`,
`is-autostart`, `notify-dirty-state` (one-way, `ipcRenderer.send`/`ipcMain.on`
— renderer reports its current tasks + dirty flag so `main.js` can warn before a window close
discards unsaved changes; see `win.on("close", ...)` in `createWindow`), `task-execution-error`
(one-way, main → renderer via `sender.send(...)`/`ipcRenderer.on(...)` — `run-tasks` reports
each `execFile`/`exec` failure back to the renderer that invoked it, since main-process
`console.error` alone is invisible in a packaged build with no devtools), `task-started` and
`run-tasks-finished` (one-way, main → renderer — `run-tasks` reports which task is about to
run and when the last one has fired, so the "출근 시작하기" button can show live progress
instead of no feedback at all while the cumulative delay elapses).

**Task model** (`react-app/src/types.ts`): `{ type: "browser" | "program", title?, value, delay }`.
- `type: "browser"` runs `chrome "<value>"` via `execFile("cmd.exe", ["/c", "start", "chrome", ...])`;
  `type: "program"` runs `value` directly (supports both raw `.exe` paths and `code "<folder>"`
  for VS Code).
- In `run-tasks` (`electron/main.js`), execution deliberately splits between `execFile` and
  `exec`: browser URLs and plain `.exe` paths go through `execFile` (no shell, so special
  characters/spaces in the value can't cause shell injection); only `code "<folder>"` values go
  through `exec` (shell-invoked), because that's a genuine shell command string, not just a
  path. Keep this split when touching that code — don't switch everything to `exec` for
  convenience.
- `delay` is in seconds and is **cumulative across the task list**, not per-task: in
  `run-tasks`, `main.js` accumulates `totalDelay += task.delay` and schedules each task's
  execution with `setTimeout(..., totalDelay * 1000)`, so a list's total wait time is the sum
  of all delays up to that point, not just its own. Re-running cancels any still-pending
  timeouts from the previous run (`pendingTimeouts`), so a stale run can't overlap a new one.

**Config persistence** — saved as JSON at `app.getPath("userData")/config.json` (per-OS-user
Electron data dir), *not* a repo-relative file. A root-level `config.json` was previously
committed by mistake and is being removed/gitignored — don't reintroduce a repo-root config
file as a data store.

`app.getPath("userData")` derives its folder name from `app.name`, which Electron resolves
from the root `package.json`'s top-level `"productName"` field if present, otherwise `"name"`.
Root `package.json` intentionally has **no top-level `productName`** — only `build.productName`
(used by electron-builder for the packaged app/installer name) — because adding one changes
the dev userData folder too (`electron .` would start reading/writing a different, empty
`config.json` under a new folder name, silently orphaning whatever config already exists under
the old one). Don't add a top-level `productName` without accounting for this.

The config holds multiple named routine sets ("프로필"): `{ profiles: [{ id, name, tasks }],
activeProfileId, autoStartProfileId }` (`react-app/src/types.ts`'s `AppConfig`/`Profile`).
`activeProfileId` is whichever profile the UI currently has open/editing; `autoStartProfileId`
is the profile `--autostart` runs, and the two are intentionally independent — switching which
profile you're viewing does not change what runs at login. `load-config` in `main.js`
auto-migrates the old single-list `{ tasks: [...] }` shape into a one-profile `AppConfig` (named
"기본") the first time it's read, and immediately persists the migrated shape so this only
happens once.

**Auto-start on Windows login** — `set-auto-start` uses `app.setLoginItemSettings({
openAtLogin, path: app.getPath("exe"), args: autoStartArgs })`. On launch, the renderer checks
`is-autostart` (which just checks `process.argv` for `--autostart`) and if true, immediately
calls `run-tasks` with the loaded config — this is the entire "automation" trigger path,
there's no separate scheduler/daemon.

`autoStartArgs` (module-level in `main.js`) is `["--autostart"]` when packaged, but
`[app.getAppPath(), "--autostart"]` when unpackaged. Unpackaged, `path` resolves to the generic
`electron.exe` binary, not to this app — without the app path as an argument, Windows would
launch bare Electron at login with no idea which app to load. `get-auto-start` passes the same
`autoStartArgs` to `app.getLoginItemSettings({ args: autoStartArgs })`: Windows treats a login
item with different `args` as a *different* entry, so if get/set ever pass mismatched args,
`openAtLogin` reads back `false` even right after a successful `set-auto-start` — the toggle
looks broken (and silently resets to off on every restart) even though the registry entry is
correct. Keep get/set using the exact same `autoStartArgs` value if this code changes.
`e2e/autostart.spec.ts` regression-tests the toggle surviving an app restart.

**Component structure** (`react-app/src/`): `App.tsx` owns all task state (load/save/run/reorder)
and passes callbacks down; `TaskForm.tsx` and the edit-mode UI in `TaskList.tsx` both wrap the
same `TaskEntryForm.tsx` (via an `"add" | "edit"` `variant` prop) rather than duplicating the
form markup — extend that shared component rather than forking it.

## Conventions

- UI copy, code comments, and console/log/error messages are in Korean throughout the
  codebase — match this when touching existing strings or adding new user-facing text/comments.
- The UI follows the "모닝 노트" (Morning Note) design system — navy hero banner, cream
  dotted-note cards, handwritten wordmark, coral stamp buttons — specified in `DESIGN.md`.
  Check it before making any UI/styling change so new work matches the existing colors,
  typography, and component patterns rather than introducing one-off styles.

## Reference docs

- [`README.md`](README.md) — product overview, features, and run instructions (Korean)
- [`PRODUCT.md`](PRODUCT.md) — product definition: users, purpose, positioning, constraints
- [`DESIGN.md`](DESIGN.md) — design system spec (colors, typography, component rules)
- [`TODO.md`](TODO.md) — known limitations and prioritized feature/UX candidates
