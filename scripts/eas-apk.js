#!/usr/bin/env node

const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const stateDir = path.join(root, ".tmp", "apk-builds");
const statePath = path.join(stateDir, "last-build.json");
const defaultProfile = "preview";
const defaultPlatform = "android";
const defaultPollIntervalSeconds = 30;
const defaultTimeoutMinutes = 90;
const terminalStates = new Set(["FINISHED", "ERRORED", "CANCELED"]);

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

function ensureStateDir() {
  fs.mkdirSync(stateDir, { recursive: true });
}

function writeState(build) {
  ensureStateDir();
  fs.writeFileSync(statePath, JSON.stringify({ ...build, savedAt: new Date().toISOString() }, null, 2));
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return undefined;
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: process.env,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      const text = chunk.toString();
      stdout += text;
      if (!options.quiet) process.stdout.write(text);
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString();
      stderr += text;
      if (!options.quiet) process.stderr.write(text);
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(new Error(`${command} ${args.join(" ")} failed with exit code ${code}\n${stdout}${stderr}`));
    });
  });
}

async function eas(args, options) {
  return run("npx", ["eas-cli@latest", ...args], options);
}

function parseJsonOutput(output) {
  const trimmed = output.trim();
  if (!trimmed) return undefined;

  try {
    return JSON.parse(trimmed);
  } catch {
    const jsonStart = trimmed.search(/[[{]/);
    if (jsonStart < 0) return undefined;
    try {
      return JSON.parse(trimmed.slice(jsonStart));
    } catch {
      return undefined;
    }
  }
}

function extractBuildId(text) {
  const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
  const buildUrlMatch = text.match(/\/builds\/([0-9a-f-]{36})/i);
  if (buildUrlMatch) return buildUrlMatch[1];

  const idMatch = text.match(uuidPattern);
  return idMatch?.[0];
}

function getBuildPageUrl(build) {
  if (!build?.id) return undefined;
  const owner = build.project?.ownerAccount?.name;
  const slug = build.project?.slug || build.project?.name;
  if (!owner || !slug) return undefined;
  return `https://expo.dev/accounts/${owner}/projects/${slug}/builds/${build.id}`;
}

function getArtifactUrl(build) {
  return build?.artifacts?.buildUrl || build?.artifacts?.applicationArchiveUrl;
}

function getPollIntervalSeconds(args) {
  return Number(args.pollIntervalSeconds || args.pollInterval || defaultPollIntervalSeconds);
}

async function listBuilds({ platform = defaultPlatform, limit = 20 } = {}) {
  const { stdout } = await eas(["build:list", "--platform", platform, "--limit", String(limit), "--json"], { quiet: true });
  const builds = parseJsonOutput(stdout);
  if (!Array.isArray(builds)) {
    throw new Error(`Could not parse EAS build:list JSON output:\n${stdout}`);
  }

  return builds;
}

async function findBuild(buildId, platform = defaultPlatform) {
  const builds = await listBuilds({ platform, limit: 50 });
  return builds.find((build) => build.id === buildId);
}

function printFinishedBuild(build) {
  const artifactUrl = getArtifactUrl(build);
  if (!artifactUrl) {
    throw new Error(`Build ${build.id} finished, but no APK artifact URL was found.`);
  }

  writeState(build);
  console.log(`\nAPK_URL=${artifactUrl}`);
  console.log(`BUILD_ID=${build.id}`);
  const pageUrl = getBuildPageUrl(build);
  if (pageUrl) console.log(`BUILD_PAGE=${pageUrl}`);
}

async function pollBuild(buildId, args) {
  const platform = args.platform || defaultPlatform;
  const pollIntervalMs = getPollIntervalSeconds(args) * 1000;
  const timeoutMs = Number(args.timeoutMinutes || defaultTimeoutMinutes) * 60 * 1000;
  const startedAt = Date.now();

  console.log(`Polling EAS build ${buildId} every ${Math.round(pollIntervalMs / 1000)}s...`);
  while (Date.now() - startedAt < timeoutMs) {
    const build = await findBuild(buildId, platform);
    if (!build) {
      console.log("Build not visible in EAS list yet.");
    } else {
      const artifactUrl = getArtifactUrl(build);
      const statusLine = [`status=${build.status}`, build.buildProfile && `profile=${build.buildProfile}`, artifactUrl && "artifact=ready"]
        .filter(Boolean)
        .join(" ");
      console.log(`${new Date().toLocaleTimeString()} ${statusLine}`);

      if (build.status === "FINISHED") {
        printFinishedBuild(build);
        return;
      }

      if (terminalStates.has(build.status)) {
        const pageUrl = getBuildPageUrl(build);
        throw new Error(`Build ${build.id} ended with status ${build.status}.${pageUrl ? ` Logs: ${pageUrl}` : ""}`);
      }
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error(`Timed out waiting for build ${buildId} after ${Math.round(timeoutMs / 60000)} minutes.`);
}

async function dispatchBuild(args) {
  const profile = args.profile || defaultProfile;
  const platform = args.platform || defaultPlatform;
  const buildArgs = ["build", "--platform", platform, "--profile", profile, "--non-interactive", "--no-wait"];

  console.log(`Dispatching EAS ${platform} build with profile "${profile}"...`);
  const { stdout, stderr } = await eas(buildArgs);
  const buildId = extractBuildId(`${stdout}\n${stderr}`);

  if (!buildId) {
    throw new Error("Could not find the EAS build ID in command output. Run `npm run apk:latest` to inspect recent builds.");
  }

  const build = { id: buildId, platform: platform.toUpperCase(), buildProfile: profile, status: "DISPATCHED" };
  writeState(build);
  console.log(`\nBUILD_ID=${buildId}`);

  if (args.noWait) {
    console.log(`Poll later with: npm run apk:poll -- ${buildId}`);
    return;
  }

  await pollBuild(buildId, args);
}

async function latestBuild(args) {
  const platform = args.platform || defaultPlatform;
  const builds = await listBuilds({ platform, limit: Number(args.limit || 20) });
  const build = builds.find((candidate) => candidate.status === "FINISHED" && getArtifactUrl(candidate));
  if (!build) {
    throw new Error(`No finished ${platform} APK build with an artifact was found.`);
  }

  printFinishedBuild(build);
}

async function main() {
  const [command = "help", ...rest] = process.argv.slice(2);
  const args = parseArgs(rest);

  if (command === "build") {
    await dispatchBuild(args);
    return;
  }

  if (command === "poll") {
    const buildId = extractBuildId(args._[0] || "") || readState()?.id;
    if (!buildId) {
      throw new Error("Pass a build ID/URL or run `npm run apk:build` first.");
    }
    await pollBuild(buildId, args);
    return;
  }

  if (command === "latest" || command === "link") {
    await latestBuild(args);
    return;
  }

  console.log(`Usage:
  npm run apk:build
  npm run apk:dispatch
  npm run apk:poll -- <build-id-or-build-url>
  npm run apk:latest

Options:
  --profile preview|production
  --platform android
  --poll-interval <seconds>
  --timeout-minutes <minutes>
  --no-wait`);
}

main().catch((error) => {
  console.error(`\nAPK tooling failed:\n${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
});
