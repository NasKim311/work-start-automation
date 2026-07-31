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
`npm run preview`.

There is no test suite configured in either package.

Note: `electron/main.js`'s `createWindow` branches on `app.isPackaged` — unpackaged (dev) loads
`http://localhost:5173` from the Vite dev server; packaged loads
`react-app/dist/index.html` via `loadFile`, so `npm run build` must be run before packaging.
There is no `electron-builder`/packaging config in `package.json` yet, so packaging itself
isn't wired up — only the dev-vs-packaged load branch exists so far.

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

Current channels: `load-config`, `save-config`, `run-tasks`, `select-file`, `get-auto-start`,
`set-auto-start`, `is-autostart`, `notify-dirty-state` (one-way, `ipcRenderer.send`/`ipcMain.on`
— renderer reports its current tasks + dirty flag so `main.js` can warn before a window close
discards unsaved changes; see `win.on("close", ...)` in `createWindow`), `task-execution-error`
(one-way, main → renderer via `sender.send(...)`/`ipcRenderer.on(...)` — `run-tasks` reports
each `execFile`/`exec` failure back to the renderer that invoked it, since main-process
`console.error` alone is invisible in a packaged build with no devtools).

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

**Auto-start on Windows login** — `set-auto-start` uses
`app.setLoginItemSettings({ openAtLogin, path: app.getPath("exe"), args: ["--autostart"] })`.
On launch, the renderer checks `is-autostart` (which just checks `process.argv` for
`--autostart`) and if true, immediately calls `run-tasks` with the loaded config — this is the
entire "automation" trigger path, there's no separate scheduler/daemon.

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
