#!/usr/bin/env node

const { execFileSync } = require("node:child_process");
require("dotenv").config();

const defaultServiceUrl = "https://kavi-ki-vidya-api.onrender.com";
const successDeployStatuses = new Set(["live"]);
const failedDeployStatuses = new Set([
  "build_failed",
  "update_failed",
  "pre_deploy_failed",
  "canceled",
  "deactivated",
]);

function parseArgs(argv) {
  const parsed = { _: [] };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (!value.startsWith("--")) {
      parsed._.push(value);
      continue;
    }

    const [rawKey, inlineValue] = value.slice(2).split("=");
    const key = rawKey.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
    if (inlineValue !== undefined) {
      parsed[key] = inlineValue;
      continue;
    }

    const next = argv[index + 1];
    if (next && !next.startsWith("--")) {
      parsed[key] = next;
      index += 1;
    } else {
      parsed[key] = true;
    }
  }

  return parsed;
}

function getNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : fallback;
}

function getServiceUrl(args) {
  return String(args.serviceUrl || process.env.RENDER_SERVICE_URL || defaultServiceUrl).replace(/\/$/, "");
}

function getExpectedCommit(args) {
  if (args.commit) return String(args.commit);
  if (process.env.RENDER_EXPECTED_COMMIT) return process.env.RENDER_EXPECTED_COMMIT;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    return undefined;
  }
}

function git(args, options = {}) {
  return execFileSync("git", args, {
    encoding: "utf8",
    stdio: options.stdio || "pipe",
  });
}

function getCurrentBranch() {
  return git(["branch", "--show-current"]).trim();
}

function ensureCleanWorktree() {
  const status = git(["status", "--porcelain"]).trim();
  if (status) {
    throw new Error("Worktree has uncommitted changes. Commit before running `npm run deploy:backend:push`.");
  }
}

function getShortCommit(commit) {
  return commit ? commit.slice(0, 12) : "unknown";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function readJsonResponse(response) {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function renderApi(path, options = {}) {
  const apiKey = process.env.RENDER_API_KEY;
  if (!apiKey) {
    throw new Error("RENDER_API_KEY is not set.");
  }

  const response = await fetch(`https://api.render.com/v1${path}`, {
    ...options,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      ...(options.headers || {}),
    },
  });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Render API ${path} failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  return payload;
}

function normalizeDeploy(payload) {
  if (!payload) return undefined;
  if (payload.deploy && typeof payload.deploy === "object") return payload.deploy;
  if (payload.id || payload.status) return payload;
  return undefined;
}

function normalizeDeployList(payload) {
  if (!Array.isArray(payload)) return [];
  return payload.map(normalizeDeploy).filter(Boolean);
}

function getDeployId(payload) {
  return normalizeDeploy(payload)?.id;
}

async function triggerApiDeploy(args, expectedCommit) {
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!serviceId) {
    throw new Error("RENDER_SERVICE_ID is not set.");
  }

  const body = {};
  if (args.clearCache) body.clearCache = "clear";
  if (expectedCommit && !args.latest) body.commitId = expectedCommit;

  const payload = await renderApi(`/services/${serviceId}/deploys`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  const deploy = normalizeDeploy(payload);
  console.log(`Triggered Render API deploy${deploy?.id ? ` ${deploy.id}` : ""}.`);
  return deploy;
}

async function triggerHookDeploy() {
  const hookUrl = process.env.RENDER_DEPLOY_HOOK_URL;
  if (!hookUrl) {
    throw new Error("RENDER_DEPLOY_HOOK_URL is not set.");
  }

  const response = await fetch(hookUrl, { method: "POST" });
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Render deploy hook failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }

  console.log("Triggered Render deploy hook.");
  return normalizeDeploy(payload);
}

async function getDeploy(deployId) {
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!serviceId) throw new Error("RENDER_SERVICE_ID is not set.");
  return normalizeDeploy(await renderApi(`/services/${serviceId}/deploys/${deployId}`));
}

async function getLatestDeploy() {
  const serviceId = process.env.RENDER_SERVICE_ID;
  if (!serviceId) throw new Error("RENDER_SERVICE_ID is not set.");
  const deploys = normalizeDeployList(await renderApi(`/services/${serviceId}/deploys?limit=10`));
  return deploys[0];
}

async function pollDeploy(deployId, args) {
  const intervalMs = getNumber(args.pollInterval || args.pollIntervalSeconds, 15) * 1000;
  const timeoutMs = getNumber(args.timeoutMinutes, 20) * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const deploy = deployId ? await getDeploy(deployId) : await getLatestDeploy();
    const status = deploy?.status || "unknown";
    console.log(`${new Date().toLocaleTimeString()} render deploy status=${status}${deploy?.id ? ` id=${deploy.id}` : ""}`);

    if (successDeployStatuses.has(status)) return deploy;
    if (failedDeployStatuses.has(status)) {
      throw new Error(`Render deploy ${deploy?.id || deployId || "latest"} ended with status ${status}.`);
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for Render deploy after ${Math.round(timeoutMs / 60000)} minutes.`);
}

async function getHealth(serviceUrl) {
  const response = await fetch(`${serviceUrl}/health`);
  const payload = await readJsonResponse(response);
  if (!response.ok) {
    throw new Error(`Health check failed with HTTP ${response.status}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

function healthMatchesCommit(health, expectedCommit) {
  const deployedCommit = health?.deploy?.gitCommit || health?.gitCommit;
  if (!expectedCommit) return true;
  if (!deployedCommit) return false;
  return String(expectedCommit).startsWith(String(deployedCommit)) || String(deployedCommit).startsWith(String(expectedCommit));
}

async function waitForHealth(args, expectedCommit) {
  const serviceUrl = getServiceUrl(args);
  const intervalMs = getNumber(args.pollInterval || args.pollIntervalSeconds, 15) * 1000;
  const timeoutMs = getNumber(args.timeoutMinutes, 20) * 60 * 1000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const health = await getHealth(serviceUrl);
      const commitOk = healthMatchesCommit(health, expectedCommit);
      const mode = health?.mode || "unknown";
      const provider = health?.progressStorage?.provider || "unknown";
      const deployedCommit = health?.deploy?.gitCommit || health?.gitCommit || "unknown";
      console.log(
        `${new Date().toLocaleTimeString()} health ok=${Boolean(health?.ok)} mode=${mode} storage=${provider} commit=${getShortCommit(deployedCommit)}`
      );

      if (health?.ok && commitOk) {
        return health;
      }
    } catch (error) {
      console.log(`${new Date().toLocaleTimeString()} health waiting: ${error instanceof Error ? error.message : String(error)}`);
    }

    await sleep(intervalMs);
  }

  throw new Error(`Timed out waiting for healthy Render service after ${Math.round(timeoutMs / 60000)} minutes.`);
}

function printHealthSummary(serviceUrl, health) {
  console.log(`\nSERVICE_URL=${serviceUrl}`);
  console.log(`HEALTH_URL=${serviceUrl}/health`);
  console.log(`MODE=${health?.mode || "unknown"}`);
  console.log(`OPENAI_AVAILABLE=${Boolean(health?.openAIAvailable)}`);
  console.log(`PROGRESS_STORAGE=${health?.progressStorage?.provider || "unknown"}`);
  if (health?.deploy?.gitCommit || health?.gitCommit) {
    console.log(`DEPLOY_COMMIT=${health?.deploy?.gitCommit || health?.gitCommit}`);
  }
}

async function deploy(args) {
  const expectedCommit = getExpectedCommit(args);
  const serviceUrl = getServiceUrl(args);
  console.log(`Deploy target: ${serviceUrl}`);
  console.log(`Expected commit: ${getShortCommit(expectedCommit)}`);

  let deployPayload;
  if (process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID) {
    deployPayload = await triggerApiDeploy(args, expectedCommit);
    await pollDeploy(getDeployId(deployPayload), args);
  } else if (process.env.RENDER_DEPLOY_HOOK_URL) {
    deployPayload = await triggerHookDeploy();
    if (process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID) {
      await pollDeploy(getDeployId(deployPayload), args);
    }
  } else {
    throw new Error(
      "Set RENDER_DEPLOY_HOOK_URL for hook deploys, or set RENDER_API_KEY and RENDER_SERVICE_ID for API deploys."
    );
  }

  const health = await waitForHealth(args, expectedCommit);
  printHealthSummary(serviceUrl, health);
}

async function pushDeploy(args) {
  ensureCleanWorktree();
  const branch = getCurrentBranch();
  const expectedCommit = getExpectedCommit(args);
  const serviceUrl = getServiceUrl(args);
  if (!branch) {
    throw new Error("Could not determine current git branch.");
  }

  console.log(`Pushing ${branch} to origin to trigger Render auto-deploy...`);
  console.log(`Expected commit: ${getShortCommit(expectedCommit)}`);
  execFileSync("git", ["push", "origin", branch], { stdio: "inherit" });

  const health = await waitForHealth(args, expectedCommit);
  printHealthSummary(serviceUrl, health);
}

async function status(args) {
  const serviceUrl = getServiceUrl(args);
  if (process.env.RENDER_API_KEY && process.env.RENDER_SERVICE_ID) {
    const deploy = await getLatestDeploy();
    console.log(`LATEST_DEPLOY_ID=${deploy?.id || "unknown"}`);
    console.log(`LATEST_DEPLOY_STATUS=${deploy?.status || "unknown"}`);
  }

  const health = await getHealth(serviceUrl);
  printHealthSummary(serviceUrl, health);
}

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === "deploy") {
    await deploy(args);
    return;
  }

  if (command === "push") {
    await pushDeploy(args);
    return;
  }

  if (command === "wait") {
    const expectedCommit = args.noCommit ? undefined : getExpectedCommit(args);
    const health = await waitForHealth(args, expectedCommit);
    printHealthSummary(getServiceUrl(args), health);
    return;
  }

  if (command === "health" || command === "status") {
    await status(args);
    return;
  }

  console.log(`Usage:
  npm run deploy:backend
  npm run deploy:backend:push
  npm run deploy:backend:wait
  npm run deploy:backend:health

Environment:
  RENDER_SERVICE_URL=https://kavi-ki-vidya-api.onrender.com
  RENDER_DEPLOY_HOOK_URL=...      # simplest deploy trigger
  RENDER_API_KEY=...              # optional exact deploy polling
  RENDER_SERVICE_ID=srv-...       # optional exact deploy polling

Options:
  --timeout-minutes <minutes>
  --poll-interval <seconds>
  --commit <sha>
  --latest
  --clear-cache
  --no-commit`);
}

main().catch((error) => {
  console.error(`\nRender deploy tooling failed:\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
