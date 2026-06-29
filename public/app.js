const form = document.querySelector("#arena-form");
const profileList = document.querySelector("#profile-list");
const profileSearch = document.querySelector("#profile-search");
const profileInput = document.querySelector("#profile-id");
const profileCount = document.querySelector("#profile-count");
const taskSelect = document.querySelector("#task");
const personaCard = document.querySelector("#persona-card");
const scorecard = document.querySelector("#scorecard");
const stepLog = document.querySelector("#step-log");
const logStatus = document.querySelector("#log-status");
const runTitle = document.querySelector("#run-title");
const runMeta = document.querySelector("#run-meta");
const openaiStatus = document.querySelector("#openai-status");
const runButton = document.querySelector(".run-button");
const replayButton = document.querySelector("#replay-button");

let profiles = [];
let tasks = [];
let selectedProfileId = "";
let defaultTaskId = "understand_product";
let animationToken = 0;
let lastReplaySteps = [];
let lastArena = null;
let variantAnimationQueues = createVariantQueues();

init();

async function init() {
  const [profileResponse, taskResponse, healthResponse] = await Promise.all([
    fetch("/api/profiles"),
    fetch("/api/tasks"),
    fetch("/api/health"),
  ]);
  profiles = await profileResponse.json();
  tasks = await taskResponse.json();
  const health = await healthResponse.json();
  defaultTaskId = health.defaultTaskId || defaultTaskId;
  selectedProfileId = profiles[0]?.id || "";
  profileInput.value = selectedProfileId;

  renderTasks();
  renderProfiles();
  renderPersonaCard(getSelectedProfile());
  renderHealth(health);
}

function renderTasks() {
  taskSelect.innerHTML = tasks
    .map((task) => `<option value="${escapeHtml(task.id)}">${escapeHtml(task.label)}</option>`)
    .join("");
  taskSelect.value = tasks.some((task) => task.id === defaultTaskId) ? defaultTaskId : tasks[0]?.id || "";
}

function renderHealth(health) {
  if (!health.playwrightInstalled) {
    openaiStatus.textContent = "Playwright missing";
    return;
  }

  openaiStatus.textContent = health.openaiConfigured
    ? `Ready · ${health.model} · ${formatBrowserMode(health.browserMode)}`
    : "OpenAI key missing";
}

function renderProfiles() {
  const query = profileSearch.value.trim().toLowerCase();
  const visibleProfiles = profiles.filter((profile) => {
    const haystack = `${profile.name} ${profile.label} ${profile.role} ${profile.goal} ${profile.behavior}`.toLowerCase();
    return haystack.includes(query);
  });

  profileCount.textContent = `${visibleProfiles.length} of ${profiles.length} deterministic profiles`;
  profileList.innerHTML = visibleProfiles
    .map(
      (profile) => `
        <button class="profile-option" type="button" data-profile-id="${escapeHtml(profile.id)}" aria-pressed="${profile.id === selectedProfileId}">
          <strong>${escapeHtml(profile.name)}, ${profile.age} · ${escapeHtml(profile.label)}</strong>
          <span>${escapeHtml(profile.role)}</span>
        </button>
      `,
    )
    .join("");
}

function renderPersonaCard(profile) {
  if (!profile) return;

  personaCard.innerHTML = `
    <div class="persona-head">
      <div>
        <p class="eyebrow">Selected persona</p>
        <h2>${escapeHtml(profile.name)}, ${profile.age}</h2>
      </div>
      <span>${escapeHtml(profile.label)}</span>
    </div>
    <p class="persona-role">${escapeHtml(profile.role)}</p>
    <p class="persona-goal">${escapeHtml(profile.goal)}</p>
    <div class="trait-grid">
      ${trait("Patience", profile.traits.patience)}
      ${trait("Budget heat", profile.traits.priceSensitivity)}
      ${trait("Skepticism", profile.traits.trustSkepticism)}
      ${trait("Tech comfort", profile.traits.technicalConfidence)}
    </div>
  `;
}

function trait(label, value) {
  return `<div class="trait"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

profileSearch.addEventListener("input", renderProfiles);

profileList.addEventListener("click", (event) => {
  const option = event.target.closest(".profile-option");
  if (!option) return;

  selectedProfileId = option.dataset.profileId;
  profileInput.value = selectedProfileId;
  renderProfiles();
  renderPersonaCard(getSelectedProfile());
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const token = ++animationToken;
  runButton.disabled = true;
  runButton.textContent = "Running...";
  replayButton.disabled = true;
  lastReplaySteps = [];
  lastArena = null;
  variantAnimationQueues = createVariantQueues();
  stepLog.innerHTML = "";
  logStatus.textContent = "Launching parallel Playwright sessions";

  const payload = Object.fromEntries(new FormData(form).entries());
  resetStage();
  setBrowserLoading(true, "Opening browsers");
  renderScorecardLoading({
    eyebrow: "Observed trace",
    title: "Running real browser sessions",
    message: "Playwright is visiting both sites and streaming observed frames.",
  });

  try {
    const response = await fetch("/api/run-arena-stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    await consumeArenaStream(response, token);
  } catch (error) {
    setBrowserLoading(false);
    scorecard.classList.remove("loading");
    scorecard.innerHTML = `<p class="empty-state">${escapeHtml(error.message)}</p>`;
    openaiStatus.textContent = "Run failed";
    logStatus.textContent = "Run failed";
  } finally {
    if (token === animationToken) {
      runButton.disabled = false;
      runButton.textContent = "Run Trace";
    }
  }
});

replayButton.addEventListener("click", async () => {
  if (!lastReplaySteps.length) return;

  const token = ++animationToken;
  replayButton.disabled = true;
  runButton.disabled = true;
  stepLog.innerHTML = "";
  variantAnimationQueues = createVariantQueues();
  resetStage();
  setBrowserLoading(false);
  logStatus.textContent = "Replaying captured trace";

  for (const step of lastReplaySteps) {
    if (token !== animationToken) return;
    enqueueReplayStep(step, token);
  }

  await waitForReplayQueues();

  if (token === animationToken) {
    for (const variant of lastArena?.variants || []) {
      setScreenshot(variant.id, variant.screenshot);
    }
    logStatus.textContent = "Replay ready";
    replayButton.disabled = false;
    runButton.disabled = false;
  }
});

function resetStage() {
  setScreenshot("A", "");
  setScreenshot("B", "");
  setConfusion("A", 0);
  setConfusion("B", 0);
  setCursor("A", { x: 20, y: 20 }, false);
  setCursor("B", { x: 20, y: 20 }, false);
}

function setBrowserLoading(isLoading, label = "Loading") {
  for (const variantId of ["A", "B"]) {
    const placeholder = document.querySelector(`#placeholder-${variantId.toLowerCase()}`);
    placeholder.classList.toggle("loading", isLoading);
    placeholder.innerHTML = isLoading
      ? `<span><span class="spinner" aria-hidden="true"></span>${escapeHtml(label)}</span>`
      : "<span>Standby</span>";
  }
}

async function consumeArenaStream(response, token) {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || "Arena run failed.");
  }
  if (!response.body) {
    throw new Error("This browser cannot read the live trace stream.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finalSeen = false;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      finalSeen = (await handleArenaEvent(JSON.parse(line), token)) || finalSeen;
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    finalSeen = (await handleArenaEvent(JSON.parse(buffer), token)) || finalSeen;
  }

  if (!finalSeen && token === animationToken) {
    throw new Error("Arena stream ended before the final scorecard arrived.");
  }
}

async function handleArenaEvent(event, token) {
  if (token !== animationToken) return false;

  if (event.type === "run_started") {
    runTitle.textContent = `${event.profile.name} races ${event.task.label.toLowerCase()}`;
    runMeta.textContent = `Run ${event.runId} · parallel live Playwright trace`;
    logStatus.textContent = "Opening both real browser sessions";
    return false;
  }

  if (event.type === "variant_started") {
    logStatus.textContent = `${event.label}: observing ${new URL(event.url).hostname} in parallel`;
    return false;
  }

  if (event.type === "browser_launch") {
    logStatus.textContent = `${event.label}: ${formatBrowserMode(event.browserMode)} Chromium`;
    return false;
  }

  if (event.type === "browser_retry") {
    logStatus.textContent = `${event.label}: headless blocked, using headed fallback`;
    return false;
  }

  if (event.type === "step") {
    const step = { ...event.step, variantId: event.variantId, label: event.label };
    lastReplaySteps.push(step);
    enqueueReplayStep(step, token);
    return false;
  }

  if (event.type === "variant_completed") {
    enqueueVariantTask(event.variantId, () => {
      if (token === animationToken) {
        setScreenshot(event.variantId, event.screenshot);
      }
    });
    logStatus.textContent = `${event.label}: captured ${event.traceLength} observed steps`;
    return false;
  }

  if (event.type === "openai_started") {
    openaiStatus.textContent = `OpenAI ${event.model} evaluating`;
    logStatus.textContent = "Scorecard: evaluating observed traces";
    renderScorecardLoading({
      eyebrow: "Final evaluation",
      title: "OpenAI is judging the traces",
      message: "The scorecard is being generated from the observed Playwright evidence.",
    });
    return false;
  }

  if (event.type === "final") {
    await waitForReplayQueues();
    if (token !== animationToken) return false;

    lastArena = event.payload;
    for (const variant of event.payload.variants) {
      setScreenshot(variant.id, variant.screenshot);
    }
    openaiStatus.textContent = formatOpenAiStatus(event.payload.openai);
    renderScorecard(event.payload);
    replayButton.disabled = lastReplaySteps.length === 0;
    logStatus.textContent = "Scorecard ready";
    return true;
  }

  if (event.type === "error") {
    throw new Error(event.error || "Arena run failed.");
  }

  return false;
}

function createVariantQueues() {
  return {
    A: Promise.resolve(),
    B: Promise.resolve(),
  };
}

function enqueueReplayStep(step, token) {
  return enqueueVariantTask(step.variantId, () => playReplayStep(step, token));
}

function enqueueVariantTask(variantId, task) {
  const key = variantId === "B" ? "B" : "A";
  const next = (variantAnimationQueues[key] || Promise.resolve()).catch(() => {}).then(task);
  variantAnimationQueues[key] = next;
  return next;
}

async function waitForReplayQueues() {
  await Promise.all(Object.values(variantAnimationQueues).map((queue) => queue.catch(() => {})));
}

async function playReplayStep(step, token) {
  setScreenshot(step.variantId, step.beforeScreenshot || step.screenshot);
  setCursor(step.variantId, step.cursor, true);
  setConfusion(step.variantId, step.confusion);
  appendStep(step);
  await sleep(step.type === "scroll" ? 240 : 300);

  if (token !== animationToken) return;
  setScreenshot(step.variantId, step.afterScreenshot || step.screenshot);
  await sleep(step.type === "scroll" ? 360 : 220);
}

function appendStep(step) {
  const item = document.createElement("li");
  item.innerHTML = `
    <div class="variant-badge">${escapeHtml(step.label)}</div>
    <div>
      <strong>Step ${step.step}: ${escapeHtml(step.action)}</strong>
      <div>${escapeHtml(step.personaThought)}</div>
      <small>${escapeHtml(step.target)} · ${step.elapsedSeconds}s</small>
    </div>
    <div class="${step.rageSignal ? "rage" : ""}">observed · ${
      step.rageSignal ? "rage signal" : `confusion ${step.confusion}`
    }</div>
  `;
  stepLog.prepend(item);
}

function renderScorecard(arena) {
  const winner = arena.results.find((result) => result.variantId === arena.winner.variantId);
  const loser = arena.results.find((result) => result.variantId !== arena.winner.variantId);
  const reasons = arena.report.reasons.slice(0, 3);
  const bothBlocked = winner.blocked && loser.blocked;
  scorecard.classList.remove("loading");
  scorecard.innerHTML = `
    <div class="winner-banner">
      <span>${bothBlocked ? "No winner" : "Winner"}</span>
      <strong>${escapeHtml(arena.winner.label)}</strong>
      <p>${escapeHtml(arena.report.summary)}</p>
    </div>
    <p class="decision-kicker">${escapeHtml(arena.task.goal)}</p>
    <div class="metrics-grid">
      ${metric("Score", winner.score)}
      ${metric("Trust", winner.metrics.trustScore)}
      ${metric("Speed", winner.metrics.speedScore)}
      ${metric("Confusion", winner.metrics.confusion)}
    </div>
    <div class="comparison-strip">
      <span>${loser.blocked ? "Blocked" : "Loser"}</span>
      <strong>${escapeHtml(loser.label)} · ${loser.blocked ? "access failed" : `${loser.score}/100`}</strong>
    </div>
    <h3>Why it won</h3>
    <ul class="reason-list">
      ${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
    </ul>
    <div class="roast">${escapeHtml(arena.report.finalRoast)}</div>
  `;
}

function renderScorecardLoading({ eyebrow, title, message }) {
  scorecard.classList.add("loading");
  scorecard.innerHTML = `
    <div class="loading-card">
      <span class="spinner large" aria-hidden="true"></span>
      <p class="eyebrow">${escapeHtml(eyebrow)}</p>
      <h2>${escapeHtml(title)}</h2>
      <p>${escapeHtml(message)}</p>
    </div>
  `;
}

function metric(label, value) {
  return `<div class="metric"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function setConfusion(variantId, value) {
  const key = variantId.toLowerCase();
  document.querySelector(`#confusion-${key}`).style.width = `${value}%`;
  document.querySelector(`#confusion-${key}-value`).textContent = String(value);
}

function setCursor(variantId, cursor, active) {
  const element = document.querySelector(`#cursor-${variantId.toLowerCase()}`);
  element.style.left = `${cursor.x}%`;
  element.style.top = `${cursor.y}%`;
  element.classList.toggle("active", active);
}

function setScreenshot(variantId, src) {
  const key = variantId.toLowerCase();
  const image = document.querySelector(`#screenshot-${key}`);
  const placeholder = document.querySelector(`#placeholder-${key}`);
  image.src = src || "";
  image.classList.toggle("visible", Boolean(src));
  placeholder.classList.toggle("hidden", Boolean(src));
}

function formatOpenAiStatus(openai) {
  if (openai.status === "ok") return `OpenAI ${openai.model}`;
  return "OpenAI required";
}

function formatBrowserMode(mode) {
  if (mode === "auto") return "Auto browser";
  if (mode === "headless") return "Headless";
  if (mode === "headed-fallback") return "Headed fallback";
  return "Headed";
}

function getSelectedProfile() {
  return profiles.find((profile) => profile.id === selectedProfileId);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
