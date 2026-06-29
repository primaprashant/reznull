Make it visual, replayable, and emotionally obvious.

Build this:

“AI User Arena”

A tool where fake users with personalities race through Variant A vs Variant B, then produce a dramatic winner report.

Demo flow:

1. Enter two URLs:
    * /landing-a
    * /landing-b
2. Pick personas:
    * Impatient shopper
    * Budget-conscious founder
    * Confused non-technical user
    * Skeptical enterprise buyer
3. Click Run Arena
4. Show split-screen browsers:
    * left = Variant A
    * right = Variant B
    * AI agents clicking around live
5. After 2–3 minutes, show scoreboard:

Winner: Variant B
Why:
- CTA found 43% faster
- 2 fewer clicks to pricing
- Less confusion around signup
- Higher trust score
- Better mobile clarity

The “sexy” part is not the accuracy. It is the watchability.

What to build in 1.5 hours

Minimum winning version:

React frontend
  ├── Input: Variant A URL
  ├── Input: Variant B URL
  ├── Persona dropdown
  ├── Run button
  ├── Live step log
  └── Final scorecard
Node backend
  ├── Playwright opens both pages
  ├── Takes screenshots
  ├── Sends screenshot + visible text to LLM
  ├── Agent chooses next action
  ├── Playwright executes
  └── Logs results

Don’t overbuild real analytics. Fake less; frame it as synthetic usability testing.

The hackathon-winning features

Add these, even if shallow:

1. Persona cards

Make them feel alive:

Mika, 28
Busy startup founder
Goal: Find pricing and start trial
Behavior: impatient, hates vague copy

2. Confusion meter

Every step gets a score:

Confusion: 72/100
Reason: Pricing is hidden behind “Solutions”

3. Rage-click detector

Even if simple:

Repeated clicks / failed clicks / long hesitation = rage signal

4. Replay

This is huge.

Show:

Step 1: Scanned hero
Step 2: Clicked “Learn More”
Step 3: Got lost
Step 4: Went back
Step 5: Found pricing

You can implement this as logs, not actual video.

5. Final roast

Hackathon judges love this:

Variant A loses because it talks like a board deck.
Variant B wins because the CTA is obvious and the value prop is concrete.

Scoring formula

Keep it simple:

score =
  taskSuccess * 40
  + clarityScore * 20
  + trustScore * 15
  + speedScore * 15
  + lowFrictionScore * 10

Track:

completed goal?
steps taken
wrong clicks
time taken
CTA found?
pricing found?
form errors?
agent confidence

The pitch

Use this line:

“A/B testing tells you what won after traffic. We tell you why something will lose before you ship.”

That is the whole product.

Best demo target

Use landing pages, not complex apps.

Good demo tasks:

Find pricing
Start signup
Understand what the product does
Choose the best plan
Find cancellation policy

Name ideas

* Variant Arena
* UserGhost
* PersonaLab
* ClickOracle
* SimulUX
* GhostTraffic
* RoastMyFunnel

My pick: UserGhost.

Tagline:

“Watch AI users get confused before real users do.”