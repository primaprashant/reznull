# Implementation Plan: reznull MVP

## Overview

One-hour build of a hardcoded demo: Flask single page, scenario selector, Run simulation, ranked leaderboard with predicted lift and confidence, persona reactions, and a calibration panel. All results are canned and served from a `/simulate` JSON endpoint so the flow looks real. Tasks are sliced vertically so a clickable end-to-end demo exists after Task 1, and every task after that adds richness without breaking what works.

## Architecture Decisions

- Single Flask app. `index.html` template, `static/app.js` for the fetch and render, Tailwind via CDN so there is no build step. No database, no auth, no persistence.
- All demo data lives in `scenarios.py` as plain dicts. The front end never knows the data is canned; it calls `/simulate?scenario=...` and renders whatever JSON comes back. This is the seam where real simulation would later plug in.
- Build the thinnest end-to-end path first (one scenario, minimal leaderboard), then layer animation, richer result fields, the calibration panel, and the second scenario on top.

## Task List

### Phase 1: Walking skeleton (demo runs end to end)

#### Task 1: End-to-end path for the onboarding scenario
**Status:** Complete.

**Description:** Stand up the Flask app and deliver the full click-to-result path for one scenario. Page renders the onboarding control and variants from `scenarios.py`, a Run button posts to `/simulate`, and the response renders as a ranked list of variants with predicted metric. Rough styling with Tailwind CDN so it is presentable, not polished.

**Acceptance criteria:**
- [x] `uv run python app.py` serves the page at localhost with the onboarding variant cards visible.
- [x] Clicking Run calls `/simulate?scenario=onboarding` and renders variants ranked by predicted metric.
- [x] Data comes from `scenarios.py`, not hardcoded in the template or JS.

**Verification:**
- [x] App runs without errors.
- [x] Manual check: load page, click Run, a ranked leaderboard appears.

**Dependencies:** None
**Files:** `app.py`, `scenarios.py`, `templates/index.html`, `static/app.js`, `Makefile`
**Scope:** M

### Checkpoint: Skeleton
- [x] Demo is presentable end to end with one scenario. If the clock died here, you could still show it.

### Phase 2: Make it convincing (full canned experience)

#### Task 2: Simulation progress pass
**Description:** Between the click and the results, play a short animation over a synthetic population count (a couple of thousand personas counting up or a progress bar) so the run feels like work is happening. Add a brief sleep on the `/simulate` endpoint to back it.

**Acceptance criteria:**
- [ ] Clicking Run shows a progress pass over a population count before results render.
- [ ] Results still render correctly after the pass.

**Verification:**
- [ ] Manual check: the run feels like a simulation, not an instant swap.

**Dependencies:** Task 1
**Files:** `static/app.js`, `app.py`
**Scope:** S

#### Task 3: Rich leaderboard (lift, confidence, persona reactions)
**Description:** Extend each variant in `scenarios.py` with `lift_vs_control`, `confidence`, `persona_count`, and a short list of sample reactions (persona name, segment, decision, one-line rationale). Render lift versus control, a confidence bar, and the persona reactions for the top variant.

**Acceptance criteria:**
- [ ] Each leaderboard row shows predicted metric, lift versus control, and a confidence bar.
- [ ] The top variant shows two or three persona reactions with name, segment, and rationale.

**Verification:**
- [ ] Manual check: the winner is obvious and the reactions read as real users.

**Dependencies:** Task 1
**Files:** `scenarios.py`, `static/app.js`, `templates/index.html`
**Scope:** M

#### Task 4: Calibration panel
**Description:** Add a `calibration` block per scenario (`tests_validated`, `directional_match_pct`, `mean_abs_error`) and render it above the leaderboard, framed as proof the population reproduced past tests.

**Acceptance criteria:**
- [ ] A calibration panel sits above the leaderboard with validated test count and directional match percentage.
- [ ] Values come from `scenarios.py` per scenario.

**Verification:**
- [ ] Manual check: panel reads as a credibility signal, not decoration.

**Dependencies:** Task 1
**Files:** `scenarios.py`, `static/app.js`, `templates/index.html`
**Scope:** S

#### Task 5: Second scenario and selector
**Description:** Add the pricing scenario (trial-to-paid metric, control plus four variants showing the price and conversion tradeoff) to `scenarios.py`, and add a selector so the judge can switch scenarios and re-run. No front-end logic changes beyond reading the selected scenario id.

**Acceptance criteria:**
- [ ] Both onboarding and pricing scenarios are fully populated.
- [ ] Switching the selector and running shows the correct scenario's variants, leaderboard, and calibration.

**Verification:**
- [ ] Manual check: both scenarios run start to finish.

**Dependencies:** Tasks 3 and 4
**Files:** `scenarios.py`, `templates/index.html`, `static/app.js`
**Scope:** M

### Checkpoint: Core complete
- [ ] Both scenarios run end to end with animation, rich leaderboard, persona reactions, and calibration panel. This is the presentable MVP.

### Phase 3: Polish and stretch (only if time)

#### Task 6: Styling polish
**Description:** Tighten layout, spacing, and the winner highlight so it looks like a product rather than a hackathon page. Cosmetic only.

**Acceptance criteria:**
- [ ] Layout is clean and the winning variant is visually distinct.

**Verification:**
- [ ] Manual check: looks intentional on a projector.

**Dependencies:** Task 5
**Files:** `templates/index.html`, `static/app.js`
**Scope:** S

#### Task 7 (optional): One Stage 3 upgrade
**Description:** Pick exactly one. (a) Swap the top persona's reaction for a live OpenAI call so a real agent produces the verdict on stage, which reads well at an OpenAI event. (b) Add a segment breakdown (new vs returning, price-sensitive vs not) with per-segment winners. (c) Let the judge edit a variant's copy and re-run, mapping the edit to a canned bucket so it resolves instantly.

**Acceptance criteria:**
- [ ] The chosen upgrade works without breaking the canned core path.

**Verification:**
- [ ] Manual check: core demo still runs if the upgrade misbehaves.

**Dependencies:** Task 5
**Files:** `app.py`, `static/app.js` (plus OpenAI client if 3a)
**Scope:** S

## Time Budget (60 minutes)

| Block | Tasks | Minutes |
|-------|-------|---------|
| Skeleton | 1 | 15 |
| Convincing | 2, 3, 4 | 20 |
| Second scenario | 5 | 10 |
| Buffer | checkpoint | 5 |
| Stretch | 6 or 7 | 10 |

Core demo (Tasks 1 to 5) lands around minute 45, leaving buffer plus one stretch.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Time runs out mid-build | High | Vertical slices mean every checkpoint is demoable; stop at the last finished task. |
| Stretch upgrade (3a live call) fails on stage | Med | Keep it strictly additive; core path stays fully canned and independent. |
| Demo looks like a prototype | Med | Tailwind baseline in Task 1, dedicated polish in Task 6. |
| Numbers look implausible to judges | Low | Use the figures already in MVP.md (control 22 percent, winner 31 percent, etc.). |

## Open Questions

- Stage 3 pick for Task 7 if there is time: live OpenAI call, segment breakdown, or editable copy. Decide at the hour based on remaining minutes.
