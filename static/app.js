const runButton = document.querySelector("#run-simulation");
const resultsContainer = document.querySelector("#results");
const resultStatus = document.querySelector("#result-status");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatMetric(value) {
  return `${Number(value).toFixed(1)}%`;
}

function renderResults(payload) {
  const metricLabel = escapeHtml(payload.scenario.metric_label);

  resultsContainer.innerHTML = `
    <ol class="grid gap-3">
      ${payload.variants
        .map((variant, index) => {
          const isWinner = index === 0;
          const rank = index + 1;
          const borderClass = isWinner ? "border-accent shadow-[0_4px_16px_rgba(215,64,31,0.12)]" : "border-rule shadow-sm";
          const badgeClass = isWinner ? "bg-accent text-white" : "bg-sunken text-muted";

          return `
            <li class="rounded-lg border ${borderClass} bg-raised p-4">
              <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div class="min-w-0">
                  <div class="flex items-center gap-3">
                    <span class="inline-flex h-7 min-w-7 items-center justify-center rounded ${badgeClass} px-2 font-mono text-xs font-semibold">
                      #${rank}
                    </span>
                    <h3 class="text-base font-semibold">${escapeHtml(variant.label)}</h3>
                  </div>
                  <p class="mt-2 text-sm leading-6 text-muted">${escapeHtml(variant.copy)}</p>
                </div>
                <div class="shrink-0 rounded bg-sunken px-3 py-2 text-right">
                  <p class="font-mono text-2xl font-semibold">${formatMetric(variant.predicted_metric)}</p>
                  <p class="mt-1 text-xs font-medium text-muted">${metricLabel}</p>
                </div>
              </div>
            </li>
          `;
        })
        .join("")}
    </ol>
  `;
}

async function runSimulation() {
  const scenarioId = runButton.dataset.scenarioId;

  runButton.disabled = true;
  runButton.textContent = "Running...";
  runButton.classList.add("opacity-70");
  resultStatus.textContent = "Calling /simulate...";
  resultsContainer.innerHTML = "";

  try {
    const response = await fetch(`/simulate?scenario=${encodeURIComponent(scenarioId)}`);
    const payload = await response.json();

    if (!response.ok) {
      throw new Error(payload.error || "Simulation failed.");
    }

    renderResults(payload);
    resultStatus.textContent = `${payload.variants.length} variants ranked by predicted metric.`;
  } catch (error) {
    resultsContainer.innerHTML = `
      <div class="rounded-md border border-accent bg-[#FBE6DF] p-4 text-sm text-[#94290F]">
        ${escapeHtml(error.message)}
      </div>
    `;
    resultStatus.textContent = "Simulation failed.";
  } finally {
    runButton.disabled = false;
    runButton.textContent = "Run simulation";
    runButton.classList.remove("opacity-70");
  }
}

runButton.addEventListener("click", runSimulation);
