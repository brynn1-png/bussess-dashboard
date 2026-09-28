---
version: 1
slug: "frontend-src"
primary_target: "frontend/src"
related_targets: []
---

# Surface brief — frontend/src

**Scope / visitor mode:** Operate. Whole frontend (admin console + customer portal), redesigned as one visual world. Development-only strategy; not browser-delivered.

**Audience:** a small-business support administrator who lives in the ticket queue all day, plus the customer checking their own case.

**Job / task:** scan a live queue, read what the AI concluded, correct it, reply, and move on — fast, repeatedly, under interruption.

**Proof / content:** seeded demo data — 13 tickets, 12 completed analyses, 3 workflows / 27 runs covering success, skipped, failed.

**Constraints:** React + plain Tailwind utility classes, no component library; emerald is a recognized incumbent trait but the user asked to replace the generic look; two roles only; every control keyboard-operable with ≥4.5:1 text contrast.

**Memorable moment:** the seal — an open, machine-printed carrier label is closed by a human band of ink carrying their initials and the time, then slides on to the next station.

**Unresolved decisions:** none blocking.

---

## Direction contract

**THESIS.** The console is a pneumatic-tube dispatch desk. Every ticket is a carrier moving between stations, and the one idea this surface owns is *custody*: you can always see which station holds a carrier and whether the thing inside was printed by a machine or sealed by a person. It refuses the category-default arrangement outright — the white-and-grey rounded-card dashboard, the green accent, the row of four identical KPI tiles, the pill badges floating on slate.

**OWN-WORLD.** Ground is one continuous brushed-aluminium panel, light because this is a bright back office read for hours. Sections are separated by engraved grooves (a dark line over a light one), never by floating cards. Structural containers are continuous panel; only a selected row, a chip, or a dialog earns a shadow with real offset and soft blur. One saturated routing blue owns the line itself, the active path, primary controls, and the REVIEW station. Three hues are reserved by law and used for nothing else: amber means a machine still has it, red means fault, hazard yellow means blocked. Priority is not a hue — it is the number of signal bands wrapped around the carrier, one to four, the way a tagged parcel is read across a room. Type is Archivo Variable across the whole system: condensed width for engraved station legends, 800 weight at display scale for station counters. Courier Prime is reserved strictly for machine-printed matter — carrier IDs, timestamps, routing codes, and the AI's own words — so the typeface itself carries provenance. Icons are lucide at one stroke weight; no emoji, no unicode stand-ins.

**STORY.** The administrator lands and reads the line before anything else: five stations, how many carriers sit at each, and that REVIEW is the only one requiring a human hand. They open a carrier and see the machine's verdict arrive *unsealed* — Courier print, dashed label edge, marked `MACHINE · UNVERIFIED`. They agree or correct it, and sealing stamps their initials and the time across the band. The customer never sees an unsealed carrier.

**FIRST VIEWPORT.** A single horizontal station rail spans the content width: one continuous 3px aluminium track with five nodes — NEW, ANALYZE, REVIEW, REPLY, CLOSED — each node a small engraved plate carrying its live count in Archivo 800 at 44px sitting directly on the track with no card around it. The REVIEW node is filled routing blue with white numerals, because it is the only station that requires a human. To the left of the rail, the page title "Ticket line" is set in Archivo 800 at 64px with tight tracking directly on the panel — no box, no eyebrow. Below the rail a dense carrier table fills the rest of the viewport: Courier ID gutter at the left edge, subject at 16px, an unsealed/sealed state chip at the right, hairline row rules, and the top row raised 2px with a real shadow. The primary action, "Open review queue", is a solid routing-blue plate pinned right beneath the rail.

**FORM.** The chosen form is a pneumatic tube and conveyor carrier system — the audience's own world, where a thing physically travels between stations and you can see it in transit. It sits at position 6 of seven grounded directions; seed key `774ed214`.

**FINISH.** unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
