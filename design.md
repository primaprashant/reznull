---
version: alpha
name: reznull
description: >-
  Design system for reznull — a tool that predicts the outcome of an A/B test
  before you run it by simulating real users as AI agents. The surface here is
  the single-page demo: scenario selector, variant cards, a Run-simulation pass,
  a ranked leaderboard with predicted lift and confidence, persona reactions,
  and a calibration panel. Warm editorial neutrals, one decisive red-orange
  accent, IBM Plex Sans for everything human-readable, IBM Plex Mono for every
  numeral.
colors:
  ink: "#14110F"
  ink-secondary: "#4A453F"
  ink-tertiary: "#6E6A62"
  ink-muted: "#B5AFA4"
  rule: "#E4DFD5"
  surface: "#FAF7F2"
  surface-raised: "#FEFCF8"
  surface-sunken: "#F2EEE6"
  accent: "#D7401F"
  accent-hover: "#B6341A"
  accent-pressed: "#94290F"
  accent-soft: "#FBE6DF"
  success: "#2F6B3F"
  success-soft: "#E7F0E8"
  focus-ring: "#D7401F"
  on-accent: "#FFFFFF"
typography:
  display:
    fontFamily: IBM Plex Sans
    fontSize: 40px
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: IBM Plex Sans
    fontSize: 28px
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: -0.015em
  headline-md:
    fontFamily: IBM Plex Sans
    fontSize: 20px
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: -0.01em
  title-md:
    fontFamily: IBM Plex Sans
    fontSize: 16px
    fontWeight: 600
    lineHeight: 1.4
  body-lg:
    fontFamily: IBM Plex Sans
    fontSize: 18px
    fontWeight: 400
    lineHeight: 1.6
  body-md:
    fontFamily: IBM Plex Sans
    fontSize: 15px
    fontWeight: 400
    lineHeight: 1.6
  body-sm:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: 400
    lineHeight: 1.5
  label-lg:
    fontFamily: IBM Plex Sans
    fontSize: 14px
    fontWeight: 500
    lineHeight: 1.2
  label-md:
    fontFamily: IBM Plex Sans
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
  label-sm:
    fontFamily: IBM Plex Sans
    fontSize: 11px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: 0.08em
  metric-display:
    fontFamily: IBM Plex Mono
    fontSize: 36px
    fontWeight: 600
    lineHeight: 1
    letterSpacing: -0.01em
    fontFeature: "'tnum' 1, 'zero' 1"
  metric-lg:
    fontFamily: IBM Plex Mono
    fontSize: 24px
    fontWeight: 600
    lineHeight: 1.1
    fontFeature: "'tnum' 1, 'zero' 1"
  metric-md:
    fontFamily: IBM Plex Mono
    fontSize: 16px
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1, 'zero' 1"
  metric-sm:
    fontFamily: IBM Plex Mono
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.2
    fontFeature: "'tnum' 1, 'zero' 1"
  data-label:
    fontFamily: IBM Plex Mono
    fontSize: 11px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: 0.04em
spacing:
  xxs: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin: 32px
  container-max: 1120px
  content-max: 720px
rounded:
  none: 0px
  sm: 4px
  md: 6px
  lg: 8px
  xl: 12px
  full: 9999px
shadows:
  sm: "0 1px 2px rgba(20, 17, 15, 0.04)"
  md: "0 2px 8px rgba(20, 17, 15, 0.06)"
  lg: "0 8px 24px rgba(20, 17, 15, 0.08)"
  winner: "0 4px 16px rgba(215, 64, 31, 0.12)"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.on-accent}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
    typography: "{typography.label-lg}"
  button-primary-hover:
    backgroundColor: "{colors.accent-hover}"
  button-primary-pressed:
    backgroundColor: "{colors.accent-pressed}"
  button-primary-disabled:
    backgroundColor: "{colors.ink-muted}"
    textColor: "{colors.on-accent}"
  button-secondary:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.md}"
    padding: 12px 20px
    height: 44px
    typography: "{typography.label-lg}"
  button-secondary-hover:
    backgroundColor: "{colors.surface-sunken}"
  card:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.rule}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
    shadow: "{shadows.sm}"
  card-winner:
    backgroundColor: "{colors.surface-raised}"
    borderColor: "{colors.accent}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 20px
    shadow: "{shadows.winner}"
  select:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink}"
    borderColor: "{colors.rule}"
    rounded: "{rounded.sm}"
    padding: 10px 12px
    height: 40px
    typography: "{typography.body-md}"
  select-focus:
    borderColor: "{colors.accent}"
  chip-segment:
    backgroundColor: "{colors.surface-sunken}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.sm}"
    padding: 4px 8px
    typography: "{typography.label-sm}"
  lift-badge-positive:
    backgroundColor: "{colors.success-soft}"
    textColor: "{colors.success}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
    typography: "{typography.metric-sm}"
  lift-badge-negative:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-pressed}"
    rounded: "{rounded.sm}"
    padding: 2px 8px
    typography: "{typography.metric-sm}"
  confidence-track:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
    height: 6px
  confidence-fill:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    height: 6px
  progress-track:
    backgroundColor: "{colors.surface-sunken}"
    rounded: "{rounded.full}"
    height: 8px
  progress-fill:
    backgroundColor: "{colors.accent}"
    rounded: "{rounded.full}"
    height: 8px
  calibration-panel:
    backgroundColor: "{colors.surface-sunken}"
    borderColor: "{colors.rule}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.lg}"
    padding: 16px 20px
  persona-reaction:
    backgroundColor: "{colors.surface}"
    borderColor: "{colors.rule}"
    textColor: "{colors.ink-secondary}"
    rounded: "{rounded.md}"
    padding: 16px
  table-header-cell:
    textColor: "{colors.ink-tertiary}"
    typography: "{typography.label-sm}"
---

# reznull Design System

## Overview

reznull predicts the outcome of an A/B test before you run it, by simulating a
product's real users as AI agents. The people using it are product, growth, and
experimentation teams who live in dashboards and significance thresholds, so the
interface has to read as a credible research instrument — but a warm, inviting
one, not a cold console.

The personality is an **approachable analytical tool**. Warm off-white surfaces
and a soft editorial neutral palette make the page feel calm and unintimidating;
a single decisive red-orange accent carries every moment of intent — the primary
action, the winning variant, the live data fill. Depth comes from gentle tonal
layering with light, warm-tinted shadows, so cards feel liftable and friendly
rather than flat or heavy. Generous whitespace lets a dense leaderboard breathe.

The emotional target is **earned confidence**: the product is making a
prediction and asking to be trusted with a real decision, so the UI should feel
measured, legible, and quietly precise. When a rule is not specified here, fall
back to that intent — choose the calmer, more readable, more trustworthy option.

This file describes the single-page demo surface, but the tokens are the source
of truth for any reznull interface.

## Colors

The palette is warm neutrals plus one accent. Neutrals run from near-black ink
to a warm off-white, all tuned slightly warm so the product feels editorial
rather than clinical. Exactly one accent — a confident red-orange — drives
interaction and signals the winner.

- **Ink (#14110F):** Primary text, headlines, leaderboard labels.
- **Ink secondary (#4A453F):** Body copy, persona rationale, secondary content.
- **Ink tertiary (#6E6A62):** Captions, table headers, metadata, helper text.
- **Ink muted (#B5AFA4):** Placeholders and disabled states only — never body text.
- **Rule (#E4DFD5):** Hairline borders, dividers, card outlines.
- **Surface (#FAF7F2):** The page background and recessed reading areas.
- **Surface raised (#FEFCF8):** Cards, panels, and inputs that sit above the page.
- **Surface sunken (#F2EEE6):** Wells, bar tracks, and the calibration panel.
- **Accent (#D7401F):** The single interaction driver — primary buttons, the
  winning variant, confidence and progress fills, focus.
- **Accent hover (#B6341A) / pressed (#94290F):** Interaction states for the accent.
- **Accent soft (#FBE6DF):** Tinted background for accent-adjacent chips and
  negative-lift badges.
- **Success (#2F6B3F) / success soft (#E7F0E8):** Positive lift versus control.
  `success-soft` is a derived light tint for badge backgrounds.
- **Focus ring (#D7401F):** Keyboard focus, drawn as a 2px ring with offset.
- **On accent (#FFFFFF):** Text and icons placed on the accent fill; pure white
  is used (not the warm off-white) to hold AA contrast on the red.

## Typography

Two families, with a strict division of labor:

- **IBM Plex Sans — everything human-readable.** Product name, headings, body
  copy, button labels, variant copy, persona quotes, table headers, chips.
- **IBM Plex Mono — every numeral.** Predicted metrics, lift versus control,
  confidence percentages, population counts, calibration figures. Mono is set
  with tabular figures (`tnum`) and slashed zero (`zero`) so numbers line up
  cleanly in columns and never get confused with letters.

Roles:

- **Display:** The hero / headline stat moment at the top of a result.
- **Headline lg / md:** Section titles ("Predicted leaderboard") and card or
  variant titles. Tight negative tracking for an editorial, engineered feel.
- **Title md:** Panel and group headers.
- **Body lg:** The lead paragraph / tagline.
- **Body md:** Default reading size for variant copy and descriptions.
- **Body sm:** Persona rationale, secondary captions.
- **Label lg / md:** Buttons and interactive controls.
- **Label sm:** Eyebrows, table headers, and metadata. This is the only level
  set uppercase with letter-spacing; never apply caps or tracking to body text.
- **Metric display / lg / md / sm:** The numeric hierarchy, all IBM Plex Mono —
  from the winner's headline figure down to inline confidence readouts.
- **Data label:** Mono units and tickers that sit beside a metric (e.g. `pp`, `%`).

## Layout

A single, centered column on a warm page. Content is capped at a comfortable
reading width and given room to breathe, in keeping with the approachable feel.

- **Container:** Centered, max width `container-max` (1120px), with `margin`
  (32px) page gutters that tighten on small screens.
- **Text measure:** Long-form prose is capped at `content-max` (720px).
- **Spacing scale:** An 8px-based scale (`xxs` 4 → `3xl` 64). Pad inside cards
  with `md`–`lg` (16–24px); separate major sections with `xl`–`2xl` (32–48px).
- **Rhythm:** Favor whitespace over rules. Let the leaderboard, persona
  reactions, and calibration panel sit as distinct, well-spaced blocks rather
  than crowding them into a single dense table.
- **Grid:** Variant cards and leaderboard rows are a vertical stack on a single
  column; segment breakdowns may use an even multi-column grid with `gutter`
  (24px) between columns.

## Elevation & Depth

Depth is conveyed primarily through **tonal layering**, then reinforced with
**soft, warm-tinted shadows** — never hard or dark drop shadows.

The layer order, lightest-feeling to most recessed:

- `surface-raised` (#FEFCF8) — cards, panels, and inputs lifted above the page.
- `surface` (#FAF7F2) — the page itself and quiet reading areas.
- `surface-sunken` (#F2EEE6) — wells, bar tracks, and the calibration panel,
  which read as set *into* the page.

Shadows are low and tinted toward the warm ink so lift feels gentle:

- `shadows.sm` — resting cards and leaderboard rows.
- `shadows.md` — hover / raised state.
- `shadows.lg` — overlays and any transient popovers.
- `shadows.winner` — the winning variant, a soft accent-tinted glow paired with
  the accent border so the winner reads as lit, not just outlined.

## Shapes

The shape language is **engineered and measured**: small, consistent corner
radii in the 4–8px range. Modern enough to feel current and friendly, rigid
enough to feel like a precise tool.

- `sm` (4px) — inputs, chips, badges, and bar tracks.
- `md` (6px) — buttons.
- `lg` (8px) — cards, panels, and the calibration block.
- `xl` (12px) — reserved for large transient containers (modals), used sparingly.
- `full` — pills only for avatars, status dots, and the rounded caps on
  confidence and progress bars. Controls and cards are never pill-shaped.

Keep radii consistent within a view; do not mix sharp and rounded corners on
peers.

## Components

- **Primary button:** Accent fill, white text, 6px radius, 44px tall. The single
  highest-intent action per view (Run simulation). Darkens on hover/press;
  disabled uses `ink-muted`.
- **Secondary button:** Raised surface with a `rule` border and ink text, same
  geometry. For lower-intent actions (switch scenario, edit copy); fills to
  `surface-sunken` on hover.
- **Card:** Raised surface, hairline `rule` border, 8px radius, `shadows.sm`.
  The base container for variant cards and leaderboard rows.
- **Winner card:** Same geometry with an accent border and `shadows.winner` glow
  so the top variant is unmistakable on a projector.
- **Select:** Raised surface, `rule` border, 4px radius, 40px tall. The scenario
  selector. Border goes accent on focus, with the focus ring.
- **Segment chip:** Sunken-surface pill of metadata (cohort/segment tags), set in
  `label-sm`.
- **Lift badge:** `lift-badge-positive` uses success on `success-soft` for gains
  over control; `lift-badge-negative` uses `accent-pressed` on `accent-soft` for
  losses. Both set the number in mono.
- **Confidence bar:** A `surface-sunken` track with an accent fill, 6px tall,
  fully rounded caps. Communicates the confidence signal per variant.
- **Progress bar:** The simulation pass over the synthetic population — same
  treatment as the confidence bar at 8px, accent fill animating across a sunken
  track while the population count climbs in mono.
- **Calibration panel:** A sunken, bordered block above the leaderboard holding
  the credibility figures (tests validated, directional-match %, mean abs.
  error). Reads as proof, not decoration — figures in mono, labels in `label-sm`.
- **Persona reaction:** A quiet bordered card on the base surface holding a
  persona's name, segment chip, decision, and one-line rationale.
- **Table header cell:** `ink-tertiary`, `label-sm`, uppercase and tracked, for
  the leaderboard column headers.

## Do's and Don'ts

- **Do** reserve the accent (#D7401F) for one thing per view at a time: the
  primary action, the winning variant, and live data fills. One dominant accent
  keeps it meaningful.
- **Don't** use the red accent for errors or negative results — losses use the
  muted `accent-soft`/`accent-pressed` badge, gains use success green, so red
  never reads as both "winner" and "failure" on the same screen.
- **Do** set every numeral — metrics, lift, confidence, counts, calibration — in
  IBM Plex Mono with tabular figures so columns align.
- **Don't** mix the two families inside one element: prose and labels stay Plex
  Sans, numbers stay Plex Mono.
- **Do** build hierarchy with tonal layers first (`surface` → `surface-raised` →
  `surface-sunken`), then add only soft, warm-tinted shadows.
- **Don't** use hard, dark, or large drop shadows; depth should feel gentle.
- **Do** keep corner radii in the 4–8px range and consistent among peers.
- **Don't** introduce pills for buttons or cards — pills are only for avatars,
  status dots, and bar caps.
- **Do** maintain WCAG AA contrast: ink on warm surfaces, pure white on accent.
- **Don't** use `ink-muted` for readable text; it is for placeholders and
  disabled states only.
- **Do** give the page generous whitespace and let sections breathe; favor space
  over dividing rules.
- **Don't** apply uppercase or letter-spacing outside `label-sm` eyebrows and
  table headers.
