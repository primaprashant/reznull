import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { USER_PROFILES, getProfileSummaries } from "./data/profiles.mjs";
import { TASKS, getBrowserMode, runArena } from "./lib/arena.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "public");
const defaultVariantAUrl = "https://openai.com";
const defaultVariantBUrl = "https://claude.ai/new";
const defaultTaskId = "understand_product";

await loadLocalEnv(path.join(__dirname, ".env"));

const port = Number(process.env.PORT || 5000);

const server = createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host || `127.0.0.1:${port}`}`);

  try {
    if (request.method === "GET" && url.pathname === "/") {
      return sendFile(response, path.join(publicDir, "index.html"), "text/html; charset=utf-8");
    }
    if (request.method === "GET" && url.pathname === "/app.js") {
      return sendFile(response, path.join(publicDir, "app.js"), "text/javascript; charset=utf-8");
    }
    if (request.method === "GET" && url.pathname === "/styles.css") {
      return sendFile(response, path.join(publicDir, "styles.css"), "text/css; charset=utf-8");
    }
    if (request.method === "GET" && url.pathname === "/api/profiles") {
      return sendJson(response, getProfileSummaries());
    }
    if (request.method === "GET" && url.pathname === "/api/tasks") {
      return sendJson(response, TASKS);
    }
    if (request.method === "GET" && url.pathname === "/api/health") {
      return sendJson(response, await getHealth());
    }
    if (request.method === "POST" && url.pathname === "/api/run-arena") {
      const body = await readJson(request);
      const origin = `${url.protocol}//${url.host}`;
      const payload = await runArena({
        variantAUrl: body.variantAUrl || defaultVariantAUrl,
        variantBUrl: body.variantBUrl || defaultVariantBUrl,
        profileId: body.profileId || USER_PROFILES[0].id,
        taskId: body.taskId || defaultTaskId,
        customContext: body.customContext || "",
        origin,
      });
      return sendJson(response, payload);
    }
    if (request.method === "POST" && url.pathname === "/api/run-arena-stream") {
      const body = await readJson(request);
      const origin = `${url.protocol}//${url.host}`;
      return streamArena(response, {
        variantAUrl: body.variantAUrl || defaultVariantAUrl,
        variantBUrl: body.variantBUrl || defaultVariantBUrl,
        profileId: body.profileId || USER_PROFILES[0].id,
        taskId: body.taskId || defaultTaskId,
        customContext: body.customContext || "",
        origin,
      });
    }
    sendJson(response, { error: "Not found" }, 404);
  } catch (error) {
    sendJson(response, { error: error.message }, 500);
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`UserGhost Arena running at http://127.0.0.1:${port}`);
});

async function sendFile(response, filePath, contentType) {
  const content = await readFile(filePath);
  response.writeHead(200, { "content-type": contentType });
  response.end(content);
}

async function getHealth() {
  let playwrightInstalled = true;

  try {
    await import("playwright");
  } catch {
    playwrightInstalled = false;
  }

  return {
    defaultVariantAUrl,
    defaultVariantBUrl,
    defaultTaskId,
    browserMode: getBrowserMode(),
    model: process.env.OPENAI_MODEL || "gpt-5-mini",
    openaiConfigured: Boolean(process.env.OPENAI_API_KEY),
    playwrightInstalled,
    profileCount: USER_PROFILES.length,
  };
}

async function loadLocalEnv(filePath) {
  let content;

  try {
    content = await readFile(filePath, "utf8");
  } catch {
    return;
  }

  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separator = line.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = line.slice(0, separator).trim();
    const value = stripEnvQuotes(line.slice(separator + 1).trim());
    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function stripEnvQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload, null, 2));
}

async function streamArena(response, input) {
  let closed = false;
  response.on("close", () => {
    closed = true;
  });
  response.writeHead(200, {
    "cache-control": "no-cache, no-transform",
    "connection": "keep-alive",
    "content-type": "application/x-ndjson; charset=utf-8",
    "x-accel-buffering": "no",
  });

  const writeEvent = async (event) => {
    if (closed || response.destroyed) {
      return;
    }

    response.write(`${JSON.stringify(event)}\n`);
  };

  try {
    await runArena({ ...input, onEvent: writeEvent });
  } catch (error) {
    await writeEvent({ type: "error", error: error.message });
  } finally {
    if (!closed && !response.destroyed) {
      response.end();
    }
  }
}

async function readJson(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > 1_000_000) {
      throw new Error("Request body is too large.");
    }
    chunks.push(chunk);
  }

  if (!chunks.length) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
