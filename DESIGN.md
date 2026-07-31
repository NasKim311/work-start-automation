---
name: DeskReady
description: 매일 아침 반복되는 업무 준비를 한 번의 클릭으로 세팅하는 Windows 데스크톱 앱
colors:
  ink-navy: "#1F2A44"
  paper-cream: "#FBF6EC"
  card-cream: "#FFFDF8"
  rule-tan: "#D8CBAE"
  input-tan: "#B9AC8C"
  meta-tan: "#A79C7F"
  coral: "#C9634A"
  label-ink: "#5B5340"
  body-ink: "#8A8065"
typography:
  display:
    fontFamily: "Caveat, cursive"
    fontSize: "3.75rem"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "normal"
  label:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "11px"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "0.1em"
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 700
    lineHeight: 1.6
    letterSpacing: "-0.01em"
rounded:
  hero: "40px"
  card: "24px"
  stamp: "6px"
  pill: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "transparent"
    textColor: "{colors.coral}"
    rounded: "{rounded.stamp}"
    padding: "10px 28px"
  button-primary-hover:
    backgroundColor: "{colors.coral}"
    textColor: "{colors.card-cream}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.label-ink}"
    rounded: "{rounded.stamp}"
    padding: "10px 22px"
---

# Design System: DeskReady

## Overview

**Creative North Star: "The Morning Page"**

DeskReady reads as a page torn from a personal paper planner, not a piece of software chrome.
A solid ink-navy band opens each screen like a notebook's cover strip; everything below sits
on faintly ruled cream paper inside dashed-border note cards, as if hand-organized the night
before. The one accent — a warm coral "stamp" — marks the single action that matters on a
given card, echoing a rubber stamp or a felt-tip check mark rather than a UI button. The
system replaces the product's earlier "Jinjja Seoul" teal-and-pill identity outright; that
look is retired and should not be reintroduced or blended with this one.

**Key Characteristics:**
- Paper, not glass: dashed borders and ruled-line texture stand in for shadows and gradients
- One handwritten voice (Caveat) reserved for the "DeskReady" wordmark only; everything else
  reads in the product's existing Korean-first sans (Pretendard) at a confident bold weight
- A single warm accent (coral) does double duty as ink color and the only "stamped" fill
- Controls behave like marks on paper — underlines, ticks, and stamps — not glossy pill chrome

## Colors

Cool ink navy for structure, warm coral for the one action that matters, on cream paper.

### Primary
- **Ink Navy** (`#1F2A44`): the hero band background and the default body-text color.

### Secondary
- **Coral** (`#C9634A`): the primary "stamp" button, active tab underline, focus state, and
  task-row icons. Reserved for the one thing on a card that wants to be pressed or noticed.

### Neutral
- **Paper Cream** (`#FBF6EC`): page background, carrying a faint ruled-line texture
  (`repeating-linear-gradient`, 38px rhythm, 5% navy).
- **Card Cream** (`#FFFDF8`): the note-card surface sitting on top of the page.
- **Rule Tan** (`#D8CBAE`): dashed card borders and row dividers.
- **Input Tan** (`#B9AC8C`): underline-input resting border and inactive tab color.
- **Meta Tan** (`#A79C7F`): secondary/meta text (timestamps, delay labels, placeholders).
- **Label Ink** (`#5B5340`) / **Body Ink** (`#8A8065`): darker warm neutrals for body copy on
  cream, used instead of true gray so text stays inside the paper's warm palette.

### Named Rules
**The One Stamp Rule.** Coral fill (not just coral text) appears on at most one button per
card — the primary action. Everything else stays an outline or plain text so the stamp reads
as a deliberate mark, not decoration.

## Typography

**Display Font:** Caveat (handwritten script) — the "DeskReady" wordmark only, nowhere else.
**Body Font:** Pretendard Variable — every label, button, input, and paragraph.

**Character:** One quiet, confident sans for all functional text, broken only by a single
handwritten flourish on the product name — like a printed form with one line filled in by hand.

### Hierarchy
- **Display** (700, `~3.75rem`/`text-6xl`, Caveat, line-height 0.9): the hero wordmark only.
- **Section Label** (700, `11px`, uppercase, `0.1em` tracking, coral): card headers such as
  "오늘의 설정" / "새로운 작업 추가" / "나의 데스크 루틴 리스트".
- **Body** (700, `1rem`, ink navy): task titles, button labels, tagline.
- **Meta** (600–700, `12px`, meta tan): delay/type meta text, placeholders.

### Named Rules
**The Handwriting Is Singular Rule.** Caveat renders exactly one string on screen at a time
(the wordmark). A second handwritten element would turn a signature into a costume.

## Layout

Single centered column (`max-w-4xl`), the hero band pulled behind the first card with a
`-mt-14` overlap — the one deliberate break from strict stacking, inherited from the
product's original layout. Below the hero, cards stack with consistent vertical rhythm
(`space-y-6`); inside a card, form fields fall into a 12-column grid on desktop and stack on
mobile. Task rows are not separate cards — they are dashed-divided rows inside one list card,
like checklist lines on a page rather than a stack of index cards.

## Elevation & Depth

Mostly flat. Resting cards use one soft ambient shadow (`0 12px 30px rgba(31,42,68,0.08)`) to
lift the "page" off the ruled background; nothing else in the system carries a shadow. Depth
otherwise comes from the dashed border and the ruled-paper texture, not from layered elevation.

### Named Rules
**The Paper, Not Glass Rule.** Reach for a dashed border or a ruled line before reaching for a
shadow or gradient. Shadows are for the page-level card only, never for buttons or rows.

## Shapes

Two families only: the hero band's soft `40px` bottom radius (unchanged from the original
system, kept as the page's one big gesture), and note-card corners at `24px`. Buttons are
small stamped rectangles (`6px` radius, not pills) so they read as ink marks rather than chrome
controls. The auto-start toggle is the one deliberate pill remaining, since a physical switch
is the truest real-world referent for an on/off control.

## Components

### Buttons ("Stamps")
- **Shape:** `6px` radius rectangle, never a pill.
- **Primary:** transparent fill, coral border and text, slight `-1deg` rotation like a hand
  stamp; fills solid coral with cream text on hover.
- **Secondary:** transparent fill, tan border, `label-ink` text; used for lower-emphasis
  actions like "설정 저장".

### Type Tabs (segmented replacement)
- **Style:** plain text buttons in a row, no pill/tray background; the active option gets a
  `2px` coral underline and coral text, the inactive option stays tan. Used for the
  웹사이트/프로그램 task-type switch.

### Inputs
- **Style:** underline-only — transparent background, `1.5px` tan bottom border, no fill, no
  radius. Focus shifts the underline to coral. This replaces the prior pill/gray-fill inputs
  system-wide.

### Toggle Switch
- **Style:** pill track with a coral border, coral dot that slides — the one pill shape kept
  in the system, used only for the physical-switch-like auto-start control. Off: transparent
  track, coral dot. On: track fills solid coral and the dot switches to cream, so on/off reads
  at a glance instead of relying on dot position alone.

### Task Rows
- **Style:** no card, no shadow, no hover-lift. Each row is icon (line-drawn, in a coral-tinted
  circle) + bold navy title + tan meta line, separated from the next row by a `1.5px` dashed
  divider. The row being edited breaks this pattern deliberately: it gets a solid coral border,
  rounded corners, and a warm highlighted fill so it reads as "lifted out" of the list.

### Section Label
- **Style:** `11px` uppercase coral text with wide tracking, no background, no border — a
  handwritten-planner section tag rather than a UI eyebrow/kicker.

## Do's and Don'ts

### Do:
- **Do** keep coral fill to one stamp button per card; everything else stays outline or text.
- **Do** use dashed borders and ruled-line texture as the system's primary depth cue.
- **Do** keep Caveat to the single "DeskReady" wordmark.
- **Do** style form controls as marks on paper (underlines, stamps, ticks), not glossy chrome.

### Don't:
- **Don't** reintroduce the retired teal (`#0082B2`) / bright-orange (`#E54D26`) pill system —
  it is fully replaced, not a fallback.
- **Don't** add card shadows or hover-lift to individual task rows; the list card carries the
  one shadow in the system.
- **Don't** use a second handwritten or display font anywhere else on the page.
- **Don't** round buttons into pills; stamps are rectangular with a small radius.
