# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user today is the app's own developer, using it personally to prep their desktop
each morning. Aspirational/secondary audience: coworkers and personal contacts the developer
may hand the app to if it proves useful — likely non-technical, so the interface cannot assume
developer-level comfort with tools or jargon.

## Product Purpose

DeskReady automates the repetitive "get my desktop ready for work" routine: opening a fixed
set of websites in Chrome and launching programs/VS Code folders, with configurable delays
between them, in one click or automatically at Windows login.

## Positioning

Not a browser bookmark manager or a generic task scheduler — a purpose-built, single-click
Windows morning-routine launcher that models a _sequence_ of arrival actions (open this, then
that, N seconds later) and can trigger itself unattended at login.

## Operating Context

Runs as a Windows desktop Electron app, used in the first seconds of sitting down at a
computer (personal or work laptop). Tasks are either a website URL (opened in Chrome) or a
program/executable path (including `code "<folder>"` to open a VS Code workspace).

## Capabilities and Constraints

- Two task types: `browser` (opens a URL in Chrome) and `program` (launches an .exe or a
  `code "<folder>"` command).
- Per-task delay entered in seconds or minutes, stored in seconds, cumulative across the list
  (not per-task).
- Add, edit, delete (with confirmation), and reorder tasks (drag-and-drop or buttons); test-run
  a single task immediately without waiting through the list's delay; save/load the list; run
  on demand with live progress and a stop button; unsaved changes prompt before the window
  closes; execution failures surface to the user instead of only `console.error`.
- Multiple named routine sets ("profiles") can be created/renamed/deleted and switched between;
  the profile that runs at Windows login is chosen independently of whichever one is currently
  open in the UI.
- Optional auto-run at Windows login (`openAtLogin` + `--autostart` launch arg), with an OS
  notification announcing which set is starting.
- Config can be exported to / imported from a JSON file for moving routine sets to another PC
  (still not auto-synced between machines).
- Windows-only today (shells out to `start chrome`, uses Windows login-item APIs).
- Korean-only UI, by existing project convention.
- Small solo-maintained codebase; Vitest unit tests + Playwright E2E tests cover the core
  flows; electron-builder produces a Windows installer and portable exe (no custom app icon
  yet, uses Electron's default).

## Brand Commitments

Name "DeskReady" (⚡ mark) is confirmed and should be kept. No other visual element is
binding — the developer explicitly wants to explore a fully new visual direction; the current
teal/orange rounded-pill look is prior art, not a constraint.

## Evidence on Hand

None. Internal/personal tool with no case studies, testimonials, or external proof assets.
Do not fabricate any.

## Product Principles

1. One click should be enough — the entire point is deleting repetitive manual morning setup.
2. Trustworthy automation — it can run unattended at login, so state and errors must stay
   legible, never silent.
3. Shareable simplicity — must remain usable by non-technical friends/coworkers if handed off,
   not just the developer.
4. A five-second tool, not a dashboard to linger in — respect that this is glanced at once a
   morning, not a place people spend time.
