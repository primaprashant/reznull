import { createHash } from "node:crypto";

import { getProfile } from "../data/profiles.mjs";

export const TASKS = [
  {
    id: "find_pricing",
    label: "Find pricing",
    goal: "Find pricing and understand the cheapest useful plan.",
    keywords: ["pricing", "price", "plan", "free", "trial", "$", "month", "annual"],
  },
  {
    id: "start_signup",
    label: "Start signup",
    goal: "Start signup or a free trial without getting lost.",
    keywords: ["sign up", "signup", "start", "trial", "get started", "create account", "join"],
  },
  {
    id: "understand_product",
    label: "Understand product",
    goal: "Understand what the product does and who it is for.",
    keywords: ["what", "product", "platform", "helps", "teams", "customers", "use"],
  },
  {
    id: "choose_best_plan",
    label: "Choose best plan",
    goal: "Choose the best plan for a small team.",
    keywords: ["pricing", "plan", "team", "starter", "pro", "business", "included"],
  },
  {
    id: "find_cancellation",
    label: "Find cancellation policy",
    goal: "Find whether cancellation is easy and risk-free.",
    keywords: ["cancel", "cancellation", "refund", "contract", "terms", "monthly"],
  },
];

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = "gpt-5-mini";
const MAX_STEPS = 5;
const VIEWPORT = { width: 1280, height: 900 };
const FALLBACK_URL = "https://openai.com";

export function getBrowserMode() {
  const configuredMode = String(process.env.PLAYWRIGHT_BROWSER_MODE || "").trim().toLowerCase();
  if (["auto", "headless", "headed"].includes(configuredMode)) {
    return configuredMode;
  }
  if (process.env.PLAYWRIGHT_HEADLESS === "1") {
    return "headless";
  }
  if (process.env.PLAYWRIGHT_HEADLESS === "0") {
    return "headed";
  }
  return "auto";
}

export async function runArena({ variantAUrl, variantBUrl, profileId, taskId, customContext, origin, onEvent }) {
  assertOpenAiConfigured();

  const profile = getProfile(profileId);
  const task = buildTask({ taskId, customContext });
  const seedBase = `${profile.type}:${task.seedKey}:${variantAUrl}:${variantBUrl}`;

  await emitEvent(onEvent, {
    type: "run_started",
    runId: createHash("sha256").update(seedBase).digest("hex").slice(0, 12),
    profile,
    task,
  });

  const variantInputs = [
    { id: "A", label: "Variant A", inputUrl: variantAUrl },
    { id: "B", label: "Variant B", inputUrl: variantBUrl },
  ];
  const variants = await Promise.all(
    variantInputs.map((variant) => inspectVariant({ ...variant, origin, profile, task, onEvent })),
  );

  for (const variant of variants) {
    if (!variant.trace.length) {
      throw new Error(`${variant.label} did not produce an observed browser trace.`);
    }
  }

  const localResults = variants.map((variant) => evaluateVariant({ variant, profile, task }));
  await emitEvent(onEvent, { type: "openai_started", model: process.env.OPENAI_MODEL || DEFAULT_MODEL });
  const openai = await requestOpenAiEvaluation({ profile, task, variants, localResults, seedBase });
  const results = mergeOpenAiNotes(localResults, openai.report);
  const ranked = [...results].sort((left, right) => right.score - left.score);
  const winner = ranked[0];
  const loser = ranked[1];

  const payload = {
    runId: createHash("sha256").update(seedBase).digest("hex").slice(0, 12),
    deterministicSeed: seedBase,
    generatedAt: new Date().toISOString(),
    profile,
    task,
    variants,
    results,
    winner: {
      variantId: winner.variantId,
      label: winner.label,
      score: winner.score,
      headline: `${winner.label} wins for ${profile.label}`,
    },
    report: buildReport({ winner, loser, profile, task, openai }),
    openai,
  };

  await emitEvent(onEvent, { type: "final", payload });
  return payload;
}

function buildTask({ taskId, customContext }) {
  const context = String(customContext || "").trim();
  if (context) {
    return {
      id: "custom_context",
      seedKey: `custom_context:${normalizeSeedText(context)}`,
      label: "Custom goal",
      goal: context,
      keywords: extractKeywords(context),
      customContext: context,
    };
  }

  const task = TASKS.find((item) => item.id === taskId) ?? TASKS[0];
  return { ...task, seedKey: task.id, customContext: "" };
}

function extractKeywords(context) {
  const stopWords = new Set([
    "about",
    "able",
    "after",
    "also",
    "and",
    "are",
    "before",
    "best",
    "can",
    "could",
    "does",
    "find",
    "for",
    "from",
    "get",
    "have",
    "how",
    "into",
    "just",
    "know",
    "make",
    "not",
    "that",
    "the",
    "their",
    "there",
    "this",
    "through",
    "to",
    "understand",
    "use",
    "user",
    "what",
    "when",
    "where",
    "with",
    "without",
  ]);
  const words = context
    .toLowerCase()
    .replaceAll(/[^a-z0-9$%]+/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !stopWords.has(word));

  return [...new Set(words)].slice(0, 12);
}

function normalizeSeedText(value) {
  return value.toLowerCase().replaceAll(/\s+/g, " ").slice(0, 220);
}

async function inspectVariant({ id, label, inputUrl, origin, profile, task, onEvent }) {
  const resolvedUrl = resolveArenaUrl(inputUrl, origin);
  await emitEvent(onEvent, { type: "variant_started", variantId: id, label, url: resolvedUrl });
  const observed = await runObservedBrowserTrace({
    url: resolvedUrl,
    profile,
    task,
    variant: { id, label },
    onEvent,
  });
  const context = buildContextFromObservation(observed);

  const variant = {
    id,
    label,
    inputUrl,
    resolvedUrl,
    inspector: "playwright",
    browserMode: observed.browserMode,
    browserHeadless: observed.browserHeadless,
    screenshot: observed.finalScreenshot,
    blocked: observed.blocked,
    blockReason: observed.blockReason,
    trace: observed.trace,
    context,
  };

  await emitEvent(onEvent, {
    type: "variant_completed",
    variantId: id,
    label,
    screenshot: variant.screenshot,
    traceLength: variant.trace.length,
    title: variant.context.title,
    browserMode: variant.browserMode,
    blocked: variant.blocked,
    blockReason: variant.blockReason,
  });

  return variant;
}

function resolveArenaUrl(inputUrl, origin) {
  const trimmed = String(inputUrl || "").trim();
  if (!trimmed) {
    return FALLBACK_URL;
  }
  if (trimmed.startsWith("/")) {
    return new URL(trimmed, origin).toString();
  }
  return new URL(trimmed).toString();
}

function assertOpenAiConfigured() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required. Add it to .env before running a real arena evaluation.");
  }
}

async function runObservedBrowserTrace({ url, profile, task, variant, onEvent }) {
  let chromium;

  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error("Playwright is required for real website testing. Run `npm install` and `npx playwright install chromium`.");
  }

  const browserMode = getBrowserMode();
  const attempts = getBrowserLaunchAttempts(browserMode);
  let browser;
  let lastError;

  for (const attempt of attempts) {
    try {
      await emitEvent(onEvent, {
        type: "browser_launch",
        variantId: variant.id,
        label: variant.label,
        browserMode: attempt.mode,
        headless: attempt.headless,
      });

      return await runTraceAttempt({
        chromium,
        url,
        profile,
        task,
        variant,
        onEvent,
        launchAttempt: attempt,
        browserMode,
      });
    } catch (error) {
      lastError = error;
      if (browserMode !== "auto" || !attempt.headless) {
        break;
      }

      await emitEvent(onEvent, {
        type: "browser_retry",
        variantId: variant.id,
        label: variant.label,
        fromMode: attempt.mode,
        toMode: "headed-fallback",
        reason: error.message,
      });
    } finally {
      await browser?.close().catch(() => {});
      browser = null;
    }
  }

  throw new Error(`Could not run a real browser trace for ${url}: ${lastError?.message || "browser launch failed"}`);
}

function getBrowserLaunchAttempts(browserMode) {
  if (browserMode === "headless") {
    return [{ mode: "headless", headless: true }];
  }
  if (browserMode === "headed") {
    return [{ mode: "headed", headless: false }];
  }

  return [
    { mode: "headless", headless: true },
    { mode: "headed-fallback", headless: false },
  ];
}

async function runTraceAttempt({ chromium, url, profile, task, variant, onEvent, launchAttempt, browserMode }) {
  let browser;

  try {
    browser = await chromium.launch({
      headless: launchAttempt.headless,
      args: ["--disable-blink-features=AutomationControlled"],
    });
    const context = await browser.newContext({
      viewport: VIEWPORT,
      locale: "en-US",
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();
    await gotoRealSite(page, url);
    const initialState = await collectBrowserState(page);
    if (launchAttempt.headless && browserMode === "auto" && isAutomationChallengeState(initialState)) {
      throw new Error("Headless Chromium reached an automation challenge page.");
    }
    if (isAutomationChallengeState(initialState)) {
      const screenshot = await captureScreenshot(page);
      return await buildBlockedTrace({
        state: initialState,
        screenshot,
        profile,
        variant,
        onEvent,
        launchAttempt,
      });
    }

    const states = [];
    const trace = [];
    const history = [];

    for (let index = 0; index < MAX_STEPS; index += 1) {
      const state = index === 0 ? initialState : await collectBrowserState(page);
      const beforeScreenshot = await captureScreenshot(page);
      const action = chooseBrowserAction({ state, task, profile, index, history });

      action.beforeScreenshot = beforeScreenshot;
      action.screenshot = beforeScreenshot;
      action.beforeUrl = page.url();
      action.executed = false;

      await executeBrowserAction(page, action);
      action.afterUrl = page.url();
      action.afterScreenshot = await captureScreenshot(page);
      action.screenshot = action.afterScreenshot;

      states.push(state);
      trace.push(action);
      history.push(action);

      await emitEvent(onEvent, {
        type: "step",
        variantId: variant.id,
        label: variant.label,
        step: buildReplayStep({ step: action, index, profile }),
      });
    }

    const finalState = await collectBrowserState(page);
    const finalScreenshot = await captureScreenshot(page);
    states.push(finalState);

    return {
      finalScreenshot,
      browserMode: launchAttempt.mode,
      browserHeadless: launchAttempt.headless,
      blocked: false,
      blockReason: "",
      states,
      trace,
    };
  } finally {
    await browser?.close().catch(() => {});
  }
}

async function buildBlockedTrace({ state, screenshot, profile, variant, onEvent, launchAttempt }) {
  const blockReason = "Security verification or bot challenge blocked the observed product experience.";
  const action = {
    type: "blocked",
    action: "Blocked by security verification",
    target: "Security verification",
    reason: blockReason,
    confusion: 99,
    rageSignal: true,
    cursor: { x: 55, y: 42 },
    scrollPercent: state.scrollPercent,
    matchScore: 0,
    beforeUrl: state.url,
    afterUrl: state.url,
    beforeScreenshot: screenshot,
    afterScreenshot: screenshot,
    screenshot,
    executed: true,
  };

  await emitEvent(onEvent, {
    type: "step",
    variantId: variant.id,
    label: variant.label,
    step: buildReplayStep({ step: action, index: 0, profile }),
  });

  return {
    finalScreenshot: screenshot,
    browserMode: launchAttempt.mode,
    browserHeadless: launchAttempt.headless,
    blocked: true,
    blockReason,
    states: [state],
    trace: [action],
  };
}

function isAutomationChallengeState(state) {
  const text = `${state.title} ${state.visibleText}`.toLowerCase();
  return hasAny(text, [
    "just a moment",
    "checking your browser",
    "verify you are human",
    "captcha",
    "cloudflare",
    "attention required",
    "unusual traffic",
  ]);
}

async function emitEvent(onEvent, event) {
  if (onEvent) {
    await onEvent(event);
  }
}

async function gotoRealSite(page, url) {
  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  } catch (error) {
    const currentUrl = page.url();
    const hasStarted = currentUrl && currentUrl !== "about:blank";
    if (!hasStarted) {
      await page.goto(url, { waitUntil: "commit", timeout: 30000 });
    }
  }

  await page.waitForLoadState("load", { timeout: 8000 }).catch(() => {});
  await page.waitForLoadState("networkidle", { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1000);
}

async function collectBrowserState(page) {
  const [visibleText, pageMeta, headings, clickables, scroll] = await Promise.all([
    page.locator("body").innerText({ timeout: 2500 }).catch(() => ""),
    page
      .evaluate(() => ({
        title: document.title || "",
        description: document.querySelector("meta[name='description']")?.getAttribute("content") || "",
      }))
      .catch(() => ({ title: "", description: "" })),
    page
      .locator("h1, h2, h3")
      .evaluateAll((elements) =>
        elements
          .slice(0, 20)
          .map((element) => element.textContent?.replace(/\s+/g, " ").trim() || "")
          .filter(Boolean),
      )
      .catch(() => []),
    page
      .locator("a, button, [role='button'], input[type='submit']")
      .evaluateAll((elements) =>
        elements.slice(0, 80).map((element, index) => {
          const rect = element.getBoundingClientRect();
          const label =
            element.innerText ||
            element.getAttribute("aria-label") ||
            element.getAttribute("value") ||
            element.getAttribute("title") ||
            "";

          return {
            index,
            label: label.replace(/\s+/g, " ").trim(),
            href: element.href || "",
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            visible:
              rect.width > 0 &&
              rect.height > 0 &&
              rect.bottom >= 0 &&
              rect.top <= window.innerHeight &&
              rect.right >= 0 &&
              rect.left <= window.innerWidth,
          };
        }),
      )
      .catch(() => []),
    page
      .evaluate(() => ({
        y: window.scrollY,
        max: Math.max(1, document.documentElement.scrollHeight - window.innerHeight),
      }))
      .catch(() => ({ y: 0, max: 1 })),
  ]);

  return {
    url: page.url(),
    title: pageMeta.title,
    description: pageMeta.description,
    headings,
    clickables: clickables.filter((item) => item.label),
    visibleText: visibleText.slice(0, 10000),
    scrollPercent: Math.round((scroll.y / scroll.max) * 100),
  };
}

async function captureScreenshot(page) {
  const screenshot = await page.screenshot({ type: "jpeg", quality: 62, fullPage: false });
  return `data:image/jpeg;base64,${screenshot.toString("base64")}`;
}

function chooseBrowserAction({ state, task, profile, index, history }) {
  const visibleText = state.visibleText.toLowerCase();
  const foundKeyword = task.keywords.find((keyword) => visibleText.includes(keyword.toLowerCase()));
  const bestClickable = findBestClickable({ clickables: state.clickables, keywords: task.keywords, history });
  const confusion = clampInt(
    34 +
      (bestClickable ? -12 : 16) +
      (foundKeyword ? -12 : 10) +
      (100 - profile.traits.patience) / 8 +
      index * 5,
    1,
    99,
  );

  if (index === 0) {
    return {
      type: "scan",
      action: "Scanned current viewport",
      target: foundKeyword || "first screen",
      reason: foundKeyword
        ? `The viewport already contains "${foundKeyword}".`
        : "The first viewport does not directly answer the goal.",
      confusion,
      rageSignal: false,
      cursor: { x: 50, y: 30 },
      scrollPercent: state.scrollPercent,
      matchScore: foundKeyword ? 2 : 0,
    };
  }

  if (bestClickable && index <= 3) {
    return {
      type: "click",
      clickableIndex: bestClickable.index,
      action: `Clicked "${bestClickable.label}"`,
      target: bestClickable.label,
      reason: `This visible control best matched the goal: ${task.goal}`,
      confusion,
      rageSignal: confusion > 68,
      cursor: {
        x: clampInt((bestClickable.x / VIEWPORT.width) * 100, 4, 96),
        y: clampInt((bestClickable.y / VIEWPORT.height) * 100, 4, 96),
      },
      scrollPercent: state.scrollPercent,
      matchScore: bestClickable.score,
    };
  }

  if (state.scrollPercent < 92 && index < MAX_STEPS - 1) {
    return {
      type: "scroll",
      action: "Scrolled for more evidence",
      target: task.label,
      reason: `No visible control clearly satisfies: ${task.goal}`,
      confusion,
      rageSignal: confusion > 70,
      cursor: { x: 82, y: 76 },
      scrollPercent: state.scrollPercent,
      matchScore: foundKeyword ? 1 : 0,
    };
  }

  return {
    type: "decide",
    action: "Reached decision point",
    target: foundKeyword || task.label,
    reason: foundKeyword ? "Observed enough goal evidence to judge the page." : "No stronger observed path appeared.",
    confusion,
    rageSignal: confusion > 70,
    cursor: { x: 54, y: 42 },
    scrollPercent: state.scrollPercent,
    matchScore: foundKeyword ? 2 : 0,
  };
}

function findBestClickable({ clickables, keywords, history }) {
  const clickedTargets = new Set(history.filter((item) => item.type === "click").map((item) => item.target));
  let best = null;
  let bestScore = 0;

  for (const clickable of clickables.filter((item) => item.visible && !clickedTargets.has(item.label))) {
    const text = `${clickable.label} ${clickable.href}`.toLowerCase();
    const keywordScore = keywords.reduce((total, keyword) => total + (text.includes(keyword.toLowerCase()) ? 3 : 0), 0);
    const ctaScore = hasAny(text, ["start", "trial", "pricing", "demo", "contact", "security", "docs", "terms"])
      ? 2
      : 0;
    const score = keywordScore + ctaScore;

    if (score > bestScore) {
      best = { ...clickable, score };
      bestScore = score;
    }
  }

  return best;
}

async function executeBrowserAction(page, action) {
  if (action.type === "scan" || action.type === "decide") {
    await moveObservedMouse(page, action.cursor);
    action.executed = true;
    await page.waitForTimeout(250);
    return;
  }

  if (action.type === "click") {
    try {
      await moveObservedMouse(page, action.cursor);
      await page
        .locator("a, button, [role='button'], input[type='submit']")
        .nth(action.clickableIndex)
        .click({ timeout: 2500 });
      await page.waitForLoadState("domcontentloaded", { timeout: 3500 }).catch(() => {});
      await page.waitForTimeout(450);
      action.executed = true;
      return;
    } catch (error) {
      action.type = "scroll";
      action.action = `Could not click "${action.target}"; scrolled instead`;
      action.reason = "The target was visible but not actionable, so the agent scrolled for more evidence.";
      action.errorSummary = summarizePlaywrightError(error.message);
    }
  }

  if (action.type === "scroll") {
    await moveObservedMouse(page, action.cursor);
    await page.mouse.wheel(0, 720);
    await page.waitForTimeout(350);
    action.executed = true;
  }
}

async function moveObservedMouse(page, cursor) {
  const x = clampInt((cursor?.x || 50) * VIEWPORT.width * 0.01, 1, VIEWPORT.width - 1);
  const y = clampInt((cursor?.y || 50) * VIEWPORT.height * 0.01, 1, VIEWPORT.height - 1);
  await page.mouse.move(x, y, { steps: 8 }).catch(() => {});
}

function summarizePlaywrightError(message) {
  if (message.includes("Timeout")) {
    return "Click timed out.";
  }
  if (message.includes("intercepts pointer events")) {
    return "Another page element intercepted the click.";
  }
  return "Click was not actionable.";
}

function buildContextFromObservation({ states, trace }) {
  const title = firstMeaningful(states.map((state) => state.title));
  const description = firstMeaningful(states.map((state) => state.description));
  const headings = [...new Set(states.flatMap((state) => state.headings))].slice(0, 20);
  const ctas = [...new Set(states.flatMap((state) => state.clickables.map((item) => item.label)))].slice(0, 24);
  const visibleText = [...new Set(states.map((state) => state.visibleText).filter(Boolean))].join(" ").slice(0, 14000);
  const observedActions = trace.map((step) => `${step.action}: ${step.target}`).join(" ");

  return {
    title,
    description,
    headings,
    ctas,
    visibleText,
    observedActions,
    featureBag: buildFeatureBag({ title, description, headings, ctas, visibleText }),
  };
}

function firstMeaningful(values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function buildFeatureBag({ title, description, headings, ctas, visibleText }) {
  const text = [title, description, ...headings, ...ctas, visibleText].join(" ").toLowerCase();
  const ctaText = ctas.join(" ").toLowerCase();
  const count = (terms) => terms.reduce((total, term) => total + occurrences(text, term), 0);

  return {
    textLength: visibleText.length,
    ctaCount: ctas.length,
    directCta: hasAny(ctaText, ["start", "trial", "get started", "buy", "sign up", "signup", "demo"]),
    pricingVisible: hasAny(text, ["pricing", "price", "$", "free", "trial", "plan", "month", "annual"]),
    trustSignals: count(["security", "soc 2", "gdpr", "hipaa", "customers", "case study", "trusted", "audit"]),
    proofSignals: count(["case study", "customer", "testimonial", "roi", "benchmark", "results", "%"]),
    jargonSignals: count(["transform", "synergy", "platform", "solution", "leverage", "innovative", "ecosystem"]),
    frictionSignals: count(["contact sales", "book a demo", "request", "required", "enterprise only"]),
    policySignals: count(["privacy", "terms", "cancel", "refund", "contract", "data processing"]),
    integrationSignals: count(["api", "docs", "integration", "webhook", "sso", "export"]),
  };
}

function evaluateVariant({ variant, profile, task }) {
  if (variant.blocked) {
    return buildBlockedResult({ variant, profile });
  }

  const bag = variant.context.featureBag;
  const observedText = [
    variant.context.visibleText,
    variant.context.observedActions,
    ...variant.trace.map((step) => `${step.target} ${step.reason}`),
  ]
    .join(" ")
    .toLowerCase();
  const taskMatches = task.keywords.reduce((total, keyword) => total + occurrences(observedText, keyword), 0);
  const clicks = variant.trace.filter((step) => step.type === "click" && step.executed).length;
  const scrolls = variant.trace.filter((step) => step.type === "scroll" && step.executed).length;
  const wrongClicks = variant.trace.filter((step) => step.type === "click" && step.matchScore <= 1).length;
  const rageSignals = variant.trace.filter((step) => step.rageSignal).length;
  const reachedDecision = variant.trace.some((step) => step.type === "decide" || step.matchScore >= 3);
  const pricingTask = task.id.includes("pricing") || task.id.includes("plan");
  const cancellationTask = task.id === "find_cancellation";
  const customTask = task.id === "custom_context";

  const clarityScore = clampInt(
    34 +
      Math.min(taskMatches, 7) * 6 +
      bag.directCta * 12 +
      Math.min(bag.ctaCount, 8) * 2 -
      bag.jargonSignals * 3 -
      wrongClicks * 8 -
      scrolls * 3 +
      (profile.traits.technicalConfidence - 50) / 10,
    1,
    100,
  );
  const trustScore = clampInt(
    30 +
      Math.min(bag.trustSignals, 8) * 6 +
      Math.min(bag.proofSignals, 8) * 4 +
      Math.min(bag.policySignals, 6) * 4 -
      Math.min(bag.jargonSignals, 8) * (profile.traits.trustSkepticism / 70),
    1,
    100,
  );
  const speedScore = clampInt(
    84 +
      bag.directCta * 6 +
      (pricingTask && bag.pricingVisible ? 8 : 0) -
      scrolls * 11 -
      wrongClicks * 13 -
      (100 - profile.traits.patience) / 5,
    1,
    100,
  );
  const lowFrictionScore = clampInt(
    76 +
      bag.directCta * 7 +
      bag.pricingVisible * 5 -
      bag.frictionSignals * 12 -
      wrongClicks * 12 -
      (profile.traits.priceSensitivity - 50) / 6,
    1,
    100,
  );
  const taskSuccessScore = clampInt(
    18 +
      Math.min(taskMatches, 8) * 9 +
      reachedDecision * 10 +
      bag.directCta * 10 +
      bag.pricingVisible * (pricingTask ? 18 : 5) +
      bag.policySignals * (cancellationTask ? 12 : 2) +
      (customTask && taskMatches > 1 ? 12 : 0) -
      wrongClicks * 9 -
      rageSignals * 5,
    0,
    100,
  );
  const score = Math.round(
    taskSuccessScore * 0.4 + clarityScore * 0.2 + trustScore * 0.15 + speedScore * 0.15 + lowFrictionScore * 0.1,
  );
  const confusion = clampInt(Math.round(100 - (clarityScore * 0.55 + speedScore * 0.25 + trustScore * 0.2)), 1, 99);

  return {
    variantId: variant.id,
    label: variant.label,
    score,
    taskSuccess: taskSuccessScore >= 58,
    completedGoal: taskSuccessScore >= 58,
    metrics: {
      taskSuccess: taskSuccessScore,
      clarityScore,
      trustScore,
      speedScore,
      lowFrictionScore,
      confidence: clampInt(Math.round((score + trustScore + clarityScore) / 3), 1, 99),
      confusion,
      stepsTaken: variant.trace.length,
      wrongClicks,
      timeToGoalSeconds: clampInt(variant.trace.length * 8 + scrolls * 7 + wrongClicks * 12, 10, 240),
      ctaFound: bag.directCta,
      pricingFound: bag.pricingVisible,
      formErrors: 0,
      rageClicks: rageSignals > 0,
    },
    replay: buildTraceReplay({ variant, profile }),
    reasons: buildVariantReasons({ bag, task, profile, taskMatches, wrongClicks, scrolls }),
  };
}

function buildBlockedResult({ variant, profile }) {
  return {
    variantId: variant.id,
    label: variant.label,
    blocked: true,
    blockReason: variant.blockReason,
    score: 1,
    taskSuccess: false,
    completedGoal: false,
    metrics: {
      taskSuccess: 0,
      clarityScore: 1,
      trustScore: 1,
      speedScore: 1,
      lowFrictionScore: 1,
      confidence: 5,
      confusion: 99,
      stepsTaken: variant.trace.length,
      wrongClicks: 0,
      timeToGoalSeconds: 240,
      ctaFound: false,
      pricingFound: false,
      formErrors: 0,
      rageClicks: true,
      blocked: true,
    },
    replay: buildTraceReplay({ variant, profile }),
    reasons: [
      `${variant.label} was blocked by security verification before the product experience was visible.`,
      "The observed trace contains an access challenge, not usable product evidence.",
      "Blocked variants cannot satisfy the persona goal or win the arena.",
    ],
  };
}

function buildTraceReplay({ variant, profile }) {
  return variant.trace.map((step, index) => buildReplayStep({ step, index, profile }));
}

function buildReplayStep({ step, index, profile }) {
  return {
    step: index + 1,
    elapsedSeconds: (index + 1) * 8,
    type: step.type,
    confusion: step.confusion,
    rageSignal: step.rageSignal,
    cursor: step.cursor,
    scrollPercent: step.scrollPercent,
    action: step.action,
    target: step.target,
    reason: step.reason,
    beforeScreenshot: step.beforeScreenshot || step.screenshot,
    afterScreenshot: step.afterScreenshot || step.screenshot,
    screenshot: step.afterScreenshot || step.screenshot,
    observed: true,
    executed: step.executed,
    personaThought: `${profile.name}: ${step.reason}`,
  };
}

function buildVariantReasons({ bag, task, profile, taskMatches, wrongClicks, scrolls }) {
  const reasons = [];
  if (taskMatches > 0) reasons.push(`Observed ${taskMatches} goal-matching signals for "${task.goal}".`);
  if (bag.directCta) reasons.push("A relevant CTA was visible during the browser trace.");
  if (!bag.directCta) reasons.push("No obvious primary CTA was observed.");
  if (bag.pricingVisible) reasons.push("Pricing or trial language appeared in observed page text.");
  if (!bag.pricingVisible && task.id.includes("pricing")) reasons.push("Pricing did not appear in the observed path.");
  if (bag.trustSignals >= 2) reasons.push("Trust signals appeared in the observed content.");
  if (bag.jargonSignals >= 3) reasons.push(`${profile.name} encountered jargon before concrete value.`);
  if (wrongClicks > 0) reasons.push(`${wrongClicks} observed click attempt(s) were weak matches for the goal.`);
  if (scrolls > 1) reasons.push("The persona had to scroll repeatedly to gather enough evidence.");
  return reasons.slice(0, 4);
}

async function requestOpenAiEvaluation({ profile, task, variants, localResults, seedBase }) {
  const apiKey = process.env.OPENAI_API_KEY;
  const body = {
    model: process.env.OPENAI_MODEL || DEFAULT_MODEL,
    input: [
      {
        role: "system",
        content:
          "You are a strict usability-test analyst. Use only observed browser trace evidence. Do not invent actions, clicks, scrolls, screenshots, or page content. Return compact JSON only. Do not change numeric scores. A variant marked blocked is an access failure caused by security verification or a bot challenge. It is not a successful product experience and must not be described as winning evidence.",
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: JSON.stringify({
              deterministicSeed: seedBase,
              persona: profile,
              task,
              variants: variants.map((variant) => ({
                id: variant.id,
                label: variant.label,
                url: variant.resolvedUrl,
                blocked: Boolean(variant.blocked),
                blockReason: variant.blockReason || "",
                title: variant.context.title,
                description: variant.context.description,
                headings: variant.context.headings,
                ctas: variant.context.ctas,
                observedText: variant.context.visibleText.slice(0, 4500),
                observedTrace: variant.trace.map((step) => ({
                  action: step.action,
                  type: step.type,
                  target: step.target,
                  reason: step.reason,
                  executed: step.executed,
                  beforeUrl: step.beforeUrl,
                  afterUrl: step.afterUrl,
                  scrollPercent: step.scrollPercent,
                })),
              })),
              localResults: localResults.map((result) => ({
                variantId: result.variantId,
                blocked: Boolean(result.blocked),
                score: result.score,
                metrics: result.metrics,
                reasons: result.reasons,
              })),
            }),
          },
          ...variants
            .filter((variant) => variant.screenshot)
            .map((variant) => ({
              type: "input_image",
              image_url: variant.screenshot,
              detail: "low",
            })),
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "arena_narrative",
        strict: true,
        schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            summary: { type: "string" },
            finalRoast: { type: "string" },
            variantNotes: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
                properties: {
                  variantId: { type: "string" },
                  reasons: { type: "array", items: { type: "string" } },
                  replayTone: { type: "string" },
                },
                required: ["variantId", "reasons", "replayTone"],
              },
            },
          },
          required: ["summary", "finalRoast", "variantNotes"],
        },
      },
    },
  };

  const response = await fetch(OPENAI_ENDPOINT, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenAI API returned HTTP ${response.status}`);
  }

  return {
    status: "ok",
    model: body.model,
    report: JSON.parse(extractResponseText(payload)),
    message: "OpenAI evaluated observed browser traces.",
  };
}

function extractResponseText(payload) {
  if (payload.output_text) {
    return payload.output_text;
  }

  for (const item of payload.output || []) {
    for (const content of item.content || []) {
      if (content.text) {
        return content.text;
      }
    }
  }

  throw new Error("OpenAI response did not include output text.");
}

function mergeOpenAiNotes(localResults, report) {
  return localResults.map((result) => {
    if (result.blocked) {
      return result;
    }

    const note = report.variantNotes.find((item) => item.variantId === result.variantId);
    if (!note) {
      return result;
    }

    return {
      ...result,
      reasons: note.reasons.length ? note.reasons.slice(0, 4) : result.reasons,
      llmReplayTone: note.replayTone,
    };
  });
}

function buildReport({ winner, loser, profile, task, openai }) {
  const speedDelta = loser.metrics.timeToGoalSeconds - winner.metrics.timeToGoalSeconds;
  const clickDelta = loser.metrics.stepsTaken - winner.metrics.stepsTaken;
  const confusionDelta = loser.metrics.confusion - winner.metrics.confusion;
  const loserBlocked = loser.blocked && !winner.blocked;
  const bothBlocked = loser.blocked && winner.blocked;

  return {
    summary:
      loserBlocked
        ? `${winner.label} wins because ${loser.label} was blocked by security verification before the product experience was visible.`
        : bothBlocked
          ? "Both variants were blocked by security verification, so neither produced usable product evidence."
          : openai.report.summary ||
            `${winner.label} wins because the observed browser trace gave ${profile.name} clearer evidence for "${task.goal}".`,
    reasons: loserBlocked
      ? [
          `${loser.label} was blocked by security verification and could not satisfy the goal.`,
          `${winner.label} exposed observable product content for "${task.goal}".`,
          "Blocked challenge pages are scored as access failures, not product wins.",
          `${winner.label} scored ${winner.score}/100 from observed browser evidence.`,
        ]
      : [
          `${winner.label} scored ${winner.score}/100 from observed browser evidence.`,
          `${winner.label} completed the trace ${Math.max(speedDelta, 0)} seconds faster than ${loser.label}.`,
          `${winner.label} required ${Math.max(clickDelta, 0)} fewer observed steps than ${loser.label}.`,
          `${profile.name} ended with ${Math.max(confusionDelta, 0)} points less confusion on ${winner.label}.`,
          winner.metrics.taskSuccess >= loser.metrics.taskSuccess
            ? "Observed goal evidence was stronger on the winning variant."
            : "The winner had less friction despite comparable goal evidence.",
        ],
    finalRoast:
      loserBlocked
        ? `${loser.label} never got past the security gate, so there was no product journey to judge.`
        : bothBlocked
          ? "Both variants hid the product behind security verification, which is a dead end for this observed user."
          : openai.report.finalRoast ||
            `${loser.label} loses because the observed path made ${profile.name} work harder to satisfy the goal.`,
    pitch: "A/B testing tells you what won after traffic. We tell you why something will lose before you ship.",
  };
}

function occurrences(text, term) {
  return text.split(term.toLowerCase()).length - 1;
}

function hasAny(text, terms) {
  return terms.some((term) => text.includes(term));
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampInt(value, min, max) {
  return Math.round(clamp(value, min, max));
}
