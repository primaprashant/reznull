# reznull MVP

A demo that survives a one-hour build with AI coding agents and reads clearly to hackathon judges. Python and Flask, single page, results served from a JSON endpoint so the flow looks like a real product. Everything behind the endpoint is hardcoded for the demo. The seams are placed so the canned logic can later be swapped for real persona simulation without touching the front end.

## What the judge sees

One page. Pick a scenario, SaaS onboarding or Pricing page. The page shows the control and a set of variants with their copy. Hit Run simulation. A short progress pass plays over a synthetic population of a couple of thousand personas, then the page renders a ranked leaderboard: each variant with its predicted metric, lift versus control, and a confidence signal, plus a few representative persona reactions explaining the top result. A calibration panel sits above the leaderboard showing that this population reproduced past tests (validated against N past experiments, X% directional match), so the prediction is not coming from nowhere.

## Scenarios, both fully canned

SaaS onboarding. Metric is the share of new users who reach the aha action in their first session, defined here as connecting a data source. Control around 22%. Five variants: guided checklist, skip-to-value default, template gallery, AI setup assistant, and a stripped two-field signup. Predicted winner around 31%, lift +9pp.

Pricing page. Metric is trial-to-paid conversion. Control layout plus four variants: two tiers instead of three, annual billing defaulted on, an anchor (decoy) tier added, and value-reframed copy. Show the price and conversion tradeoff so the winner is not simply the cheapest.

## Stages

The build is sliced so each stage is demoable on its own. If the clock runs out, you stop at the last completed stage and still have something to show.

Stage 1, roughly the first 15 minutes. Flask app with one route and one template. Scenario selector, variant cards rendered from a hardcoded dict, a Run button, and an empty results area. Goal is something on screen and clickable, styled enough to not look like a prototype (Tailwind via CDN, no build step).

Stage 2, roughly minutes 15 to 50. The whole flow with canned data. Run posts to a `/simulate` endpoint that sleeps briefly and returns the precomputed result for the chosen scenario as JSON. Front end plays the population progress pass, then renders the leaderboard (predicted metric, lift, confidence bar), the persona reactions for the top variant, and the calibration panel. Populate both scenarios completely. At the end of this stage the demo is complete and presentable.

Stage 3, the final 10 minutes, optional and time-permitting. Pick one. (a) Replace the single top persona's reaction with a live OpenAI call so you can show a real agent producing the same verdict, which reads well at an OpenAI event. (b) Add a segment breakdown that splits the population into cohorts (new vs returning, price-sensitive vs not) with per-segment winners. (c) Let the judge edit a variant's copy and re-run, mapping the edit to a canned bucket so it still resolves instantly.

## Data shape

A single `scenarios.py` holds everything. Each scenario carries a name, the metric label, a control, and a list of variants. Each variant carries an id, label, the copy shown on the card, `predicted_metric`, `lift_vs_control`, `confidence`, `persona_count`, and a short list of sample reactions (persona name, segment, decision, one-line rationale). A separate `calibration` block per scenario holds `tests_validated`, `directional_match_pct`, and `mean_abs_error` for the panel. The `/simulate` endpoint looks up and returns this. The sleep and the front-end animation supply the sense of work.

## Out of scope for the hour

No database, no auth, no real persona construction, no model calls on the core path (Stage 3a aside), no persistence between runs. The build exists to make the product legible in a demo and to place the `/simulate` seam where real simulation would later live.
