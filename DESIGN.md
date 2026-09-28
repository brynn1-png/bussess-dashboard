---
name: AI Business Automation Platform
description: A support-desk control panel built as a pneumatic-tube dispatch desk — engraved aluminium plates, one continuous line, and a closed palette where every hue means exactly one thing.
colors:
  ground-aluminium: "#e6e9ec"
  panel-50: "#f7f8f9"
  panel-100: "#eceef0"
  panel-200: "#dfe2e5"
  panel-300: "#c7cbd0"
  panel-400: "#9aa0a7"
  panel-500: "#5e656c"
  panel-600: "#50565c"
  panel-700: "#3a3f45"
  panel-800: "#272b30"
  panel-900: "#15181b"
  panel-950: "#0b0d0f"
  route-50: "#eef1ff"
  route-100: "#dee3ff"
  route-200: "#c0c9ff"
  route-300: "#94a3ff"
  route-400: "#6376ff"
  route-500: "#3350f0"
  route-600: "#1b3ae0"
  route-700: "#142ca8"
  route-800: "#111f78"
  signal-50: "#fff7e6"
  signal-100: "#ffebc4"
  signal-200: "#ffd98a"
  signal-500: "#eda200"
  signal-600: "#d28a00"
  signal-700: "#a86a00"
  signal-800: "#7a4e00"
  fault-50: "#fef2f2"
  fault-100: "#fde3e3"
  fault-200: "#fac7c7"
  fault-500: "#dc2626"
  fault-600: "#c81e1e"
  fault-700: "#9f1717"
  fault-800: "#7a1111"
  hazard-100: "#fff3b0"
  hazard-300: "#ffdf56"
  hazard-400: "#ffd000"
  ink: "#15181b"
  ink-soft: "#2a2f35"
typography:
  display:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 4rem)"
    fontWeight: 800
    lineHeight: 0.95
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.09em"
  machine:
    fontFamily: "Courier Prime, ui-monospace, Courier New, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
rounded:
  xs: "2px"
  sm: "2px"
  md: "2px"
  lg: "3px"
  xl: "3px"
  "2xl": "4px"
  "3xl": "4px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "48px"
components:
  button-primary:
    backgroundColor: "{colors.route-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.route-700}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "#ffffff"
    textColor: "{colors.panel-700}"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  button-danger:
    backgroundColor: "{colors.fault-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "10px 16px"
  input:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "10px 14px"
  chip-selected:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  chip-unselected:
    backgroundColor: "#ffffff"
    textColor: "{colors.panel-600}"
    rounded: "{rounded.lg}"
    padding: "6px 12px"
  nav-tab-active:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "6px 10px"
  plate:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "20px"
  seal-band:
    backgroundColor: "{colors.ink}"
    textColor: "#ffffff"
    rounded: "0"
    padding: "8px 16px"
  rail-node:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  rail-node-active:
    backgroundColor: "{colors.route-600}"
    textColor: "#ffffff"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: AI Business Automation Platform

## Overview

**Creative North Star: "The Pneumatic-Tube Dispatch Desk"**

This is an operations panel, not a marketing site. The reference is a mid-century dispatch office: an aluminium desk surface with stations engraved into it, carriers running a single continuous line, and every stamp on the record meaning something specific. Content sits in recessed plates separated by milled grooves — never in floating rounded cards, never in a grid of interchangeable tiles. The dominant material is neutral metal; colour is scarce, and when it appears it is load-bearing.

Provenance is the product's real subject (AI drafts, humans confirm), so the visual system makes authorship legible: machine matter is set in Courier Prime on a dashed, unsealed plate; human matter is set in Archivo on a solid plate under a blue "Human" rule; a completed sign-off strikes a single ink band across the record. Priority is expressed as a *count* of signal bands, never as a hue, so urgency can never be confused with a status colour.

Rejected, confirmed: system/Arial-Black display faces, emoji or unicode glyph stand-ins for icons, gradient text, glassmorphism or blur, left-border accents thicker than 1px, hard `4px 4px 0` drop shadows, cream + serif and near-black + neon pairings, and any candy-tinted success state.

**Key Characteristics:**

- One aluminium ground; plates are milled into it, separated by engraved grooves.
- A closed six-hue palette law — each hue owns exactly one meaning.
- Archivo carries what humans wrote; Courier Prime carries what the machine printed.
- Squared plates (2–4px radii) instead of pills; icons are lucide strokes at 1.75 weight.
- One continuous motion moment: the ink seal striking across confirmed machine output.

## Colors

The palette is closed and semantic: six hues, six meanings, no decorative use.

### Primary

- **Routing Blue** (`route-600` #1b3ae0, ramp `route-50` #eef1ff → `route-800` #111f78): the line itself, and everything the line asks of a human. Primary actions, focus rings, the active nav/filter selection, the REVIEW station, `in_progress` status, quantity bars, and every "Human ·" section rule.
- **Ink** (`ink` #15181b): a human has marked this. Selected nav tab and filter pill, `resolved` status, confirmed review chips, the seal band, "Human-confirmed" metric, and the darkest step of the priority ramp.

### Secondary

- **Signal Amber** (`signal-500` #eda200, ramp `signal-50` #fff7e6 → `signal-800` #7a4e00): a machine still has it. Pending analysis, queued work, spinners, and the four priority bands drawn on a `PriorityBadge`.

### Tertiary

- **Fault Red** (`fault-600` #c81e1e, ramp `fault-50` #fef2f2 → `fault-800` #7a1111): failed, destructive, or adverse. Error alerts, failed AI analyses, `negative` sentiment, the solid destructive button, and removal actions.
- **Hazard Yellow** (`hazard-100` #fff3b0 / `hazard-400` #ffd000): blocked, disabled, or irreversible — nothing else. Armed-destructive confirmations and the 45° diagonal band that caps them.

### Neutral

- **Aluminium Ground** (`ground-aluminium` #e6e9ec): the desk. Page background and header strip; `html` background so overscroll carries the material too.
- **Panel ramp** (`panel-50` #f7f8f9 → `panel-950` #0b0d0f): idle, archived, none. Plate fills, hairline rules, borders, muted copy, and the neutral steps of every quantity bar. `panel-700` (#3a3f45) is the lightest grey permitted as body text on white (10.5:1); `panel-500` (#5e656c) is the lightest permitted for secondary text — 4.85:1 on the aluminium ground, 5.9:1 on white, so it can sit on either.

### Named Rules

**The Palette Law.** Each hue means exactly one thing — route = needs a human, signal = machine has it, fault = failed or adverse, hazard = blocked or irreversible, ink = a human marked it, panel = idle or none. A hue may never be borrowed for emphasis, decoration, or variety.

**The Priority Rule.** Priority is never a hue. It is a count of signal bands out of four, with unfilled slots drawn as ghosts. Urgency must never be confusable with a status colour.

**The Zero-Green Rule.** There is no green in this system. Success is not a tint — a completed action is *settled*, so it renders as an ink-outlined plate.

## Typography

**Display Font:** Archivo Variable (variable width axis; fallback `ui-sans-serif, system-ui, sans-serif`)
**Body Font:** Archivo Variable (same stack)
**Label/Mono Font:** Courier Prime 400/700 (fallback `ui-monospace, Courier New, monospace`)

**Character:** Archivo at heavy weight, set tight, gives the panel a machined, industrial confidence; Courier Prime is the machine's own hand — tabular, printed, unmistakably not written by a person. The two faces do the work that colour is not allowed to do.

### Hierarchy

- **Display** (800, `clamp(2rem, 4vw, 4rem)` / 64px on the Overview, 48px on inner pages, line-height 0.95, letter-spacing −0.03em): page titles only. Sits directly on the aluminium — no box, no eyebrow.
- **Headline** (700, 24–28px, line-height 1.25): record titles — ticket subject on detail pages.
- **Title** (600, 16px, line-height 1.4): list-row subjects and card headings.
- **Body** (400, 15px / `text-sm` 14px, line-height 1.6): all prose — customer messages, operator replies, helper copy — set in Archivo. The one exception is inside a machine plate, where the AI's own words (verdict summary, suggested response) are set in Courier at 13px / 1.75 leading: that plate is machine-printed matter and the face must say so.
- **Label** (700, 11px, letter-spacing 0.09em, uppercase, width axis 72%): the `.legend` — station names, table headers, section headings, form labels.
- **Machine** (Courier Prime 400, 11–13px, tabular-nums): IDs, counts, timestamps, stamps, tags, run rules, sentiment values, meta lines — and, inside a machine plate, the AI's verdict summary and suggested response.

### Named Rules

**The Provenance Rule.** If the machine printed it, it is set in Courier. If a person wrote it, it is set in Archivo. Type carries authorship where a colour may not.

**The Legend Rule.** Section headings are never sentence-case bold. They are 11px Archivo compressed to 72% width, uppercase, +0.09em tracked, in `panel-600` — a legend engraved into the panel, not a headline shouting above it.

## Layout

Single-column working surfaces on a `max-w-5xl` container (admin) or `max-w-3xl` (portal), 16px side gutters, 32px vertical rhythm between sections. The header is a full-bleed engraved strip on the aluminium ground with a `.groove-b` rule beneath it: wordmark left, station tabs centre, identity right; below 640px the tab row wraps to its own full-width line beneath wordmark and identity.

Density is deliberately uneven. The first viewport of a list or overview is dense — a continuous track of mounted station readings, a meta line in Courier, one primary action, then a hairline-ruled table. Supporting analysis sits below in two-column plates (`lg:grid-cols-2`) that collapse to one column on smaller screens.

Rows in a list are not cards: one outer plate with 1px `panel-200` rules between rows, and only the first row raised with a short soft shadow so the head of the queue has a visible lip. Spacing rhythm: 4 / 8 / 16 / 24 / 32 / 48px; controls use 10px vertical padding; plates use 16–24px internal padding.

## Elevation & Depth

A hybrid: depth is carried mostly by *engraving* rather than lift. Grooves (a 1px dark lip plus a 1px white highlight beneath it) read as material milled into the aluminium, and they are the default separator — header bottom, section rules, table heads. Shadows are ink-tinted, always offset, and never a zero-offset halo; they appear only to give a plate a faint seat or to raise the head row of a list.

### Shadow Vocabulary

- **Plate seat** (`box-shadow: 0 1px 2px rgba(21,24,27,0.08), 0 1px 3px rgba(21,24,27,0.06)`): resting panels, tables, list containers.
- **Head-row lip** (`box-shadow: 0 6px 14px -10px rgba(21,24,27,0.55)`): the first row of a list only — marks the top of the queue.
- **Plate (elevated)** (`box-shadow: 0 1px 2px rgba(21,24,27,0.1), 0 10px 24px -14px rgba(21,24,27,0.4)`): reserved for genuinely lifted surfaces.
- **Engraved groove** (`border-bottom: 1px solid rgba(21,24,27,0.16); box-shadow: 0 1px 0 rgba(255,255,255,0.85)`): separators, not shadows.

### Named Rules

**The Flat-By-Default Rule.** Surfaces rest on the aluminium. Nothing floats, nothing hovers at rest, and no element uses a zero-offset glow. Elevation is earned by state, never applied for depth's sake.

## Shapes

Corners are cut, not rounded: 2px on inputs, chips and small plates, 3px on buttons and panels, 4px on the largest containers — the full `border-radius` vocabulary never exceeds 4px. Pills are banned; a filter or status is a squared plate with a 1px border. Borders do the structural work: `panel-200` between rows, `panel-300` on controls, and dashed (`panel-400`) wherever output is unsealed. Clipping is via `overflow-hidden` on plates only — no decorative masks.

The one recurring non-rectangular form is the **45° hazard diagonal** (7px `ink` / 7px `hazard-400`), used exclusively as the 6px cap on an armed, irreversible action.

## Components

### Buttons

- **Shape:** 3px radius, 10px × 16px padding, `gap-2` for an inline icon, 14px semibold label, 40px tall.
- **Primary:** solid `route-600` with white label; hover `route-700`, active `route-800`. The only solid-blue control on a screen — one per view.
- **Secondary:** white plate, `panel-300` stroke, `panel-700` label; hover fills `panel-100`.
- **Danger:** solid `fault-600` with white label, hover `fault-700`; soft variant is a white plate with a `fault-300` stroke and `fault-700` label for row-level removals.
- **Disabled:** cursor not-allowed, background `panel-300` and label `panel-600`. A pristine form's Save button reads "No changes" rather than a bare greyed "Save".
- **Focus:** 2px `route-600` outline at 2px offset, everywhere, via `:focus-visible`.

### Chips

Squared plates, 11–12px, 1px border, 2px radius. `StatusBadge` — `open`/`in_progress` on `route-50` + `route-700`, `resolved` on `ink` + white, `closed` on `panel-100` + `panel-700`. `ReviewBadge` sets machine states ("Analyzing", "AI failed", "No analysis") in Courier on neutral/fault tints and human states ("Needs review", "Confirmed") in Archivo on route/ink. Workflow tags are Courier `panel-700` plates titled "Added by a workflow".

### Filter pills

One selection language, learned once: **selected** = solid `ink` plate, white label; **unselected** = white plate, `panel-300` stroke, `panel-600` label, hover `panel-100`. Used identically for status groups, AI-triage groups, and the analytics time-window toggle.

### Cards / Containers

- **Corner Style:** 3px radius, or a borderless continuous list plate.
- **Background:** white on the aluminium ground; `panel-50` for inset header strips.
- **Shadow Strategy:** plate seat (see Elevation); first list row additionally gets the head-row lip.
- **Border:** 1px `panel-200` at rest; 1px *dashed* `panel-400` for unsealed machine output.
- **Internal Padding:** 16px on dense rows, 20–24px on plates.

### Inputs / Fields

White fill, 1px `panel-300` stroke, 3px radius, 10px × 14px padding, 14px `ink` text with `panel-500` placeholder. Focus swaps the stroke to `route-600` and sets a `route-600` caret. Errors are a `fault-700` message naming the exact row; disabled is `panel-300` fill with `panel-600` text.

### Navigation

An engraved header strip on the ground colour with `.groove-b` beneath. Station tabs are 13px semibold plates: inactive = white with `panel-300` stroke and `panel-600` label; active = solid `ink` with white label and a 14px lucide icon. Each tab carries `aria-current="page"`. Below 640px the tab row wraps to a full-width second line.

### Signature Components

**The Station Rail (`.track` + mounted plates).** The Overview's first viewport is a five-node reading of one queue — NEW / ANALYZE / REVIEW / REPLY / CLOSED — drawn on a single continuous 3px milled track that is painted per cell so it runs edge to edge. Counts are 44px Archivo 800 inside 120px-max plates; only the REVIEW node (work waiting on a human) is filled `route-600` with white numerals. Each node's accessible name spells out exactly which API counter it reads, and a caption states that stages overlap rather than summing.

**Machine plate + seal band.** Machine output sits under a `.groove-b` header strip on `panel-50` reading `MACHINE · <source> · <stamp>` with a right-aligned **Sealed** / **Unsealed** marker, on a dashed border while unsealed. Confirming it flips the border to solid and strikes `.seal-band` — an ink band that wipes left-to-right in 380ms carrying an outlined initials plate (from the `confirmed_by` signer recorded by the API), "Confirmed by <name>", and the timestamp. It is the only authored motion in the system.

**Human rule.** Where a person authors content next to machine output (reply composer, manage panel, ticket message form), the plate opens with a `route-50` strip reading `HUMAN · <section>` in `route-700`. Grey strip = machine, blue strip = human.

**Hazard notice.** Armed-destructive confirmation: a `hazard-100` plate capped by the 45° diagonal band, `ink` text, `role="status"`.

## Do's and Don'ts

### Do:

- **Do** keep one meaning per hue, exactly as legislated: route = needs a human, signal = machine has it, fault = failed or adverse, hazard = blocked or irreversible, ink = a human marked it, panel = idle.
- **Do** express priority as a count of signal bands (1–4) with ghost slots, never as a colour.
- **Do** keep plate and typeface in agreement: IDs, counts, stamps, tags and the AI's own words in Courier Prime; customer messages, operator replies and notes in Archivo.
- **Do** separate regions with engraved grooves (1px dark lip + 1px white highlight) and list rows with 1px `panel-200` rules inside one outer plate.
- **Do** cap armed, irreversible confirmations with the 45° hazard band and say plainly what cannot be undone.
- **Do** use lucide icons at `stroke-width: 1.75`, and give every icon-only control an `aria-label`.
- **Do** hold body text to ≥4.5:1 — `panel-700` on white (10.5:1), `panel-600` on ground (8.6:1), `route-700` on `route-50` (7.5:1).

### Don't:

- **Don't** borrow a hue for decoration, variety, or emphasis — a screen with no red on it has no failures.
- **Don't** use green, candy tints, or any success colour; settled states are ink-outlined plates.
- **Don't** use emoji or unicode glyph stand-ins for icons, gradient text, glassmorphism, blur, or `border-left` accents wider than 1px.
- **Don't** round past 4px, use pill shapes for filters or badges, or let a `border-radius` exceed `rounded-2xl`.
- **Don't** stack interchangeable KPI tiles in a page's first viewport, or float a grid of identical rounded cards where a plate and hairline rules would do.
- **Don't** apply a zero-offset shadow or a hard `4px 4px 0` block shadow; shadows are ink-tinted, offset, and rare.
- **Don't** set a human's words in Courier, or an AI paragraph in Archivo: customer messages, replies and notes stay Archivo; the verdict and suggested response stay Courier. Authorship and typeface must never disagree.
