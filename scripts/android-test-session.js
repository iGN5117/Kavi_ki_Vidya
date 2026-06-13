const { spawn, spawnSync } = require("child_process");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const sessionDir = path.join(root, ".tmp", "android-test-session");
const statePath = path.join(sessionDir, "state.json");
const defaultAvdName = process.env.KAVI_ANDROID_AVD || "Kavi_Android_35";
const metroUrl = "http://127.0.0.1:8081/status";
const apiHealthUrl = "http://127.0.0.1:8787/health";
const defaultApiBaseUrl = "https://kavi-ki-vidya-api.onrender.com/api";
const defaultRealtimeEndpoint = "https://kavi-ki-vidya-api.onrender.com/api/realtime/session";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function ensureSessionDir() {
  fs.mkdirSync(sessionDir, { recursive: true });
}

function readState() {
  try {
    return JSON.parse(fs.readFileSync(statePath, "utf8"));
  } catch {
    return {};
  }
}

function writeState(state) {
  ensureSessionDir();
  fs.writeFileSync(statePath, JSON.stringify({ ...state, updatedAt: new Date().toISOString() }, null, 2));
}

function isPidAlive(pid) {
  if (!pid) return false;

  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function resolveAndroidHome() {
  const candidates = [
    process.env.ANDROID_HOME,
    process.env.ANDROID_SDK_ROOT,
    "/opt/homebrew/share/android-commandlinetools",
    path.join(os.homedir(), "Library/Android/sdk"),
  ].filter(Boolean);

  return candidates.find((candidate) => fs.existsSync(path.join(candidate, "platform-tools", "adb"))) || candidates[candidates.length - 1];
}

function buildToolEnv() {
  const androidHome = resolveAndroidHome();
  const pathParts = [
    path.join(os.homedir(), ".maestro", "bin"),
    path.join(androidHome, "platform-tools"),
    path.join(androidHome, "emulator"),
    process.env.PATH || "",
  ];

  return {
    ...process.env,
    ANDROID_HOME: process.env.ANDROID_HOME || androidHome,
    ANDROID_SDK_ROOT: process.env.ANDROID_SDK_ROOT || androidHome,
    EXPO_NO_DOTENV: "1",
    EXPO_PUBLIC_API_BASE_URL: process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl,
    EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT: process.env.EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT || defaultRealtimeEndpoint,
    PATH: pathParts.join(path.delimiter),
  };
}

function resolveExecutable(name, candidates, env) {
  const result = spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8", env });
  const fromPath = result.stdout.trim();
  if (result.status === 0 && fromPath) return fromPath;

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function getTools(env = buildToolEnv()) {
  const androidHome = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || resolveAndroidHome();
  const adb = resolveExecutable("adb", [path.join(androidHome, "platform-tools", "adb")], env);
  const emulator = resolveExecutable("emulator", [path.join(androidHome, "emulator", "emulator")], env);

  if (!adb) {
    throw new Error(`adb was not found. Checked PATH and ${path.join(androidHome, "platform-tools", "adb")}`);
  }

  if (!emulator) {
    throw new Error(`Android emulator was not found. Checked PATH and ${path.join(androidHome, "emulator", "emulator")}`);
  }

  return { adb, emulator };
}

function runSync(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: options.env || buildToolEnv(),
    stdio: options.capture ? "pipe" : "inherit",
    timeout: options.timeout,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed${output ? `:\n${output}` : "."}`);
  }

  return result.stdout || "";
}

function getDevices(adb, env) {
  try {
    const output = runSync("adb devices", adb, ["devices"], { capture: true, env });
    return output
      .split("\n")
      .slice(1)
      .map((line) => line.trim().split(/\s+/))
      .filter(([id, state]) => id && state === "device")
      .map(([id]) => id);
  } catch {
    return [];
  }
}

function hasRunningEmulator(adb, env) {
  return getDevices(adb, env).some((id) => id.startsWith("emulator-"));
}

function spawnDetached(label, command, args, logName, env) {
  ensureSessionDir();
  const logPath = path.join(sessionDir, logName);
  const logFd = fs.openSync(logPath, "a");
  const child = spawn(command, args, {
    cwd: root,
    detached: true,
    env,
    stdio: ["ignore", logFd, logFd],
  });
  child.unref();
  console.log(`${label} started with pid ${child.pid}. Log: ${logPath}`);
  return { pid: child.pid, logPath };
}

async function isMetroRunning() {
  return isHttpEndpointReady(metroUrl, (body, statusCode) => statusCode === 200 && body.includes("packager-status:running"));
}

async function isApiRunning() {
  return isHttpEndpointReady(apiHealthUrl, (body, statusCode) => statusCode === 200 && body.includes('"ok":true'));
}

async function isHttpEndpointReady(url, isReady) {
  return new Promise((resolve) => {
    const request = http.get(url, (response) => {
      let body = "";
      response.on("data", (chunk) => {
        body += chunk;
      });
      response.on("end", () => {
        resolve(isReady(body, response.statusCode));
      });
    });

    request.on("error", () => resolve(false));
    request.setTimeout(1000, () => {
      request.destroy();
      resolve(false);
    });
  });
}

async function waitForMetro(timeoutMs = 90000) {
  await waitForEndpoint("Metro", isMetroRunning, metroUrl, timeoutMs);
}

async function waitForApi(timeoutMs = 90000) {
  await waitForEndpoint("Local API", isApiRunning, apiHealthUrl, timeoutMs);
}

async function waitForEndpoint(label, isReady, url, timeoutMs) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    if (await isReady()) return;
    await sleep(1000);
  }

  throw new Error(`${label} did not become ready at ${url} within ${timeoutMs}ms.`);
}

async function waitForAndroidBoot(adb, env, timeoutMs = 120000) {
  runSync("adb wait-for-device", adb, ["wait-for-device"], { env, timeout: timeoutMs });
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const bootCompleted = runSync("Android boot status", adb, ["shell", "getprop", "sys.boot_completed"], {
      capture: true,
      env,
      timeout: 10000,
    }).trim();

    if (bootCompleted === "1") return;
    await sleep(1500);
  }

  throw new Error(`Android emulator did not finish booting within ${timeoutMs}ms.`);
}

async function startSession(options = {}) {
  const env = buildToolEnv();
  const { adb, emulator } = getTools(env);
  const state = readState();
  const nextState = {
    ...state,
    avdName: options.avdName || state.avdName || defaultAvdName,
    androidHome: env.ANDROID_HOME,
  };

  if (hasRunningEmulator(adb, env)) {
    console.log("Android emulator is already running.");
    nextState.emulatorStartedByTool = false;
  } else {
    const emulatorProcess = spawnDetached(
      "Android emulator",
      emulator,
      ["-avd", nextState.avdName, "-no-snapshot-load", "-no-snapshot-save", "-no-boot-anim"],
      "emulator.log",
      env
    );
    nextState.emulatorPid = emulatorProcess.pid;
    nextState.emulatorLog = emulatorProcess.logPath;
    nextState.emulatorStartedByTool = true;
    writeState(nextState);
  }

  await waitForAndroidBoot(adb, env);
  console.log("Android emulator is booted.");

  if (await isMetroRunning()) {
    console.log("Metro is already running.");
    nextState.metroStartedByTool = false;
  } else {
    const metroProcess = spawnDetached("Metro", "npm", ["run", "start", "--", "--host", "lan", "--clear"], "metro.log", env);
    nextState.metroPid = metroProcess.pid;
    nextState.metroLog = metroProcess.logPath;
    nextState.metroStartedByTool = true;
    writeState(nextState);
  }

  await waitForMetro();
  console.log("Metro is ready.");

  if (await isApiRunning()) {
    console.log("Local API is already running.");
    nextState.apiStartedByTool = false;
  } else {
    const apiProcess = spawnDetached("Local API", "npm", ["run", "server"], "api.log", env);
    nextState.apiPid = apiProcess.pid;
    nextState.apiLog = apiProcess.logPath;
    nextState.apiStartedByTool = true;
    writeState(nextState);
  }

  await waitForApi();
  console.log("Local API is ready.");
  writeState(nextState);
  return nextState;
}

async function stopPid(pid, label) {
  if (!pid || !isPidAlive(pid)) return false;

  try {
    process.kill(pid, "SIGTERM");
  } catch {
    return false;
  }

  for (let index = 0; index < 20; index += 1) {
    if (!isPidAlive(pid)) {
      console.log(`${label} stopped.`);
      return true;
    }
    await sleep(250);
  }

  try {
    process.kill(pid, "SIGKILL");
    console.log(`${label} was force-stopped.`);
    return true;
  } catch {
    return false;
  }
}

async function cleanupSession(options = {}) {
  const env = buildToolEnv();
  const { adb } = getTools(env);
  const state = readState();

  if (state.metroStartedByTool || options.all) {
    await stopPid(state.metroPid, "Metro");
  }

  if (state.apiStartedByTool || options.all) {
    await stopPid(state.apiPid, "Local API");
  }

  if (options.all) {
    spawnSync("pkill", ["-f", "expo"], { env, stdio: "ignore" });
  }

  if (hasRunningEmulator(adb, env) && (state.emulatorStartedByTool || options.all || options.stopEmulator !== false)) {
    try {
      runSync("stop Android emulator", adb, ["emu", "kill"], { capture: true, env, timeout: 10000 });
      console.log("Android emulator stopped.");
    } catch (error) {
      console.log(`Android emulator stop skipped: ${error.message}`);
    }
  }

  try {
    fs.rmSync(statePath, { force: true });
  } catch {
    // Ignore state cleanup issues.
  }
}

async function printStatus() {
  const env = buildToolEnv();
  const { adb } = getTools(env);
  const state = readState();
  const devices = getDevices(adb, env);
  console.log(
    JSON.stringify(
      {
        avdName: state.avdName || defaultAvdName,
        androidHome: env.ANDROID_HOME,
        devices,
        metroRunning: await isMetroRunning(),
        apiRunning: await isApiRunning(),
        trackedMetroPid: state.metroPid,
        trackedMetroAlive: isPidAlive(state.metroPid),
        trackedApiPid: state.apiPid,
        trackedApiAlive: isPidAlive(state.apiPid),
        trackedEmulatorPid: state.emulatorPid,
        trackedEmulatorAlive: isPidAlive(state.emulatorPid),
        sessionDir,
      },
      null,
      2
    )
  );
}

async function main() {
  const command = process.argv[2] || "status";
  if (command === "start") {
    await startSession();
    return;
  }
  if (command === "cleanup" || command === "stop") {
    await cleanupSession({ all: process.argv.includes("--all") });
    return;
  }
  if (command === "status") {
    await printStatus();
    return;
  }

  throw new Error(`Unknown android test-session command: ${command}`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`Android test session failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
  });
}

module.exports = {
  buildToolEnv,
  cleanupSession,
  startSession,
};
