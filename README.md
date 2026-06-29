# UserGhost Arena

UserGhost Arena runs real Playwright browser traces against two websites, evaluates the observed behavior with OpenAI, and produces a scored winner report for a deterministic AI persona.

Pitch:

> A/B testing tells you what won after traffic. We tell you why something will lose before you ship.

## What is implemented

- Default comparison: `https://openai.com` vs `https://claude.ai/new`.
- URL inputs for Variant A and Variant B.
- 50 deterministic user profiles with personality, goal, behavior, and scoring traits.
- Persona picker with search.
- Task picker for pricing, signup, product understanding, plan choice, and cancellation policy.
- Custom context field for arbitrary jobs, audiences, and evaluation goals.
- Mandatory Playwright traces with observed screenshots, scrolls, and click attempts.
- OpenAI Responses API evaluation with `gpt-5-mini`.
- Observed-only step log, confusion meter, rage-click signal, replay, scorecard, and final roast.

## Run it

```bash
npm install
npx playwright install chromium
cp .env.example .env
npm run dev
```

Add `OPENAI_API_KEY` to `.env` before running an arena evaluation. Open `http://127.0.0.1:5000`.

## Real Website Behavior

Paste any public `https://` URL into Variant A and Variant B. The server opens each site in Chromium, captures visible text, headings, CTAs, screenshots, scrolls, and click attempts, then sends that observed trace to OpenAI.

Chromium uses `PLAYWRIGHT_BROWSER_MODE=auto` by default: it tries headless first, then falls back to headed Chromium if a real target serves an automation challenge or blocks the headless trace. Set `PLAYWRIGHT_BROWSER_MODE=headless` for strict headless-only runs, or `PLAYWRIGHT_BROWSER_MODE=headed` when you explicitly want to watch native Chromium windows.

There is no synthetic replay fallback. If Playwright cannot load a site, a site blocks automation, Chromium is not installed, or `OPENAI_API_KEY` is missing, the run fails with a setup/page-access error instead of fabricating results.

Custom context examples:

- `Can a procurement lead find SOC 2 details, contract terms, and a way to book a security review?`
- `Can a distracted mobile shopper find the return policy and buy a gift under $50?`
- `Can a technical founder understand API limits, docs quality, and whether there is a free trial?`

## OpenAI Setup

The server loads `.env` automatically. `OPENAI_MODEL` defaults to `gpt-5-mini` when it is not set.

Never commit `.env` or paste API keys into source files. If a key is exposed in chat, rotate it.
