const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { buildToolEnv } = require("./android-test-session");

const root = path.resolve(__dirname, "..");
const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const appId = appConfig.expo?.android?.package || "com.kavikividya.app";
const defaultApiBaseUrl = "https://kavi-ki-vidya-api.onrender.com/api";
const runAndroid = process.argv.includes("--android");

function fail(message) {
  console.error(`\nAudio playback verification failed:\n${message}\n`);
  process.exit(1);
}

function resolveExecutable(name, candidates = [], env = process.env) {
  const pathResult = spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8", env });
  const fromPath = pathResult.stdout.trim();
  if (pathResult.status === 0 && fromPath) return fromPath;

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    env: options.env || process.env,
    stdio: options.capture ? "pipe" : "inherit",
    timeout: options.timeout,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed${output ? `:\n${output}` : "."}`);
  }

  return result.stdout || "";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getAudioEndpoint() {
  const baseUrl = (process.env.VERIFY_AUDIO_API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || defaultApiBaseUrl).replace(/\/+$/, "");
  return `${baseUrl}/audio/sentence`;
}

async function verifyBackendAudioUrl() {
  const endpoint = getAudioEndpoint();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: "Hello from Kavi." }),
  });

  if (!response.ok) {
    throw new Error(`TTS endpoint returned ${response.status}: ${await response.text()}`);
  }

  const payload = await response.json();
  const audioUrl = String(payload.audioUrl || "");
  if (!audioUrl) {
    throw new Error(`TTS endpoint did not return audioUrl: ${JSON.stringify(payload)}`);
  }

  const parsedUrl = new URL(audioUrl);
  const isLocalhost = ["localhost", "127.0.0.1", "10.0.2.2"].includes(parsedUrl.hostname);
  if (parsedUrl.protocol !== "https:" && !isLocalhost) {
    throw new Error(`Remote TTS audioUrl must be https for Android playback. Got: ${audioUrl}`);
  }

  const audioResponse = await fetch(audioUrl);
  if (!audioResponse.ok) {
    throw new Error(`Generated audio URL returned ${audioResponse.status}: ${audioUrl}`);
  }

  const contentType = audioResponse.headers.get("content-type") || "";
  const audioBytes = Buffer.from(await audioResponse.arrayBuffer());
  if (!contentType.includes("audio") || audioBytes.length < 1000) {
    throw new Error(`Generated audio did not look playable. content-type=${contentType}, bytes=${audioBytes.length}`);
  }

  console.log(`Backend TTS URL verified: ${audioUrl} (${contentType}, ${audioBytes.length} bytes)`);
}

function getAndroidTooling(env) {
  const androidHome = env.ANDROID_HOME || env.ANDROID_SDK_ROOT || path.join(os.homedir(), "Library/Android/sdk");
  const adb = resolveExecutable("adb", [path.join(androidHome, "platform-tools/adb")], env);
  const maestro = resolveExecutable("maestro", [path.join(os.homedir(), ".maestro/bin/maestro")], env);

  if (!adb) throw new Error(`adb was not found. Checked ${path.join(androidHome, "platform-tools", "adb")}`);
  if (!maestro) throw new Error("Maestro was not found. Install it with: curl -Ls https://get.maestro.mobile.dev | bash");

  return { adb, maestro };
}

function assertAndroidReady(adb, env) {
  const devicesOutput = run("adb devices", adb, ["devices"], { capture: true, env });
  const devices = devicesOutput
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state === "device");

  if (!devices.length) {
    throw new Error("No running Android emulator/device was found. Run npm run android:test:start first.");
  }

  const installedPackages = run("adb package check", adb, ["shell", "pm", "list", "packages", appId], { capture: true, env });
  if (!installedPackages.includes(appId)) {
    throw new Error(`${appId} is not installed. Run npm run android before audio playback verification.`);
  }

  const metroStatus = spawnSync("curl", ["-fsS", "http://127.0.0.1:8081/status"], { encoding: "utf8", env });
  if (metroStatus.status !== 0 || !metroStatus.stdout.includes("packager-status:running")) {
    throw new Error("Metro is not running at http://127.0.0.1:8081. Run npm run android:test:start first.");
  }
}

function readPlaybackLogs(adb, env) {
  return run("read Android playback logs", adb, ["logcat", "-d", "-v", "time", "ReactNativeJS:I", "AndroidRuntime:E", "*:S"], {
    capture: true,
    env,
  });
}

async function runAndroidPlaybackFlow({ adb, maestro, env, flow, label }) {
  const flowPath = path.join(root, flow);
  if (!fs.existsSync(flowPath)) {
    throw new Error(`Flow not found: ${flow}`);
  }

  run("clear Android logs", adb, ["logcat", "-c"], { capture: true, env });
  console.log(`Running Android audio flow: ${label}`);
  run(`maestro ${flow}`, maestro, ["test", flow], { env, timeout: 120000 });
  await sleep(5000);

  const logs = readPlaybackLogs(adb, env);
  const expected = `[kavi-audio] ${label} playing `;
  if (!logs.includes(expected)) {
    throw new Error(`Did not see Android playback marker "${expected}" in logcat.\n\nRecent logs:\n${logs.slice(-4000)}`);
  }

  console.log(`Android playback verified: ${label}`);
}

async function verifyAndroidPlayback() {
  const env = buildToolEnv();
  const { adb, maestro } = getAndroidTooling(env);
  assertAndroidReady(adb, env);

  await runAndroidPlaybackFlow({
    adb,
    maestro,
    env,
    flow: ".maestro/android-audio-learn-model.yaml",
    label: "learn-model",
  });
  await runAndroidPlaybackFlow({
    adb,
    maestro,
    env,
    flow: ".maestro/android-audio-speak-coach.yaml",
    label: "speak-coach",
  });
}

async function main() {
  await verifyBackendAudioUrl();
  if (runAndroid) {
    await verifyAndroidPlayback();
  }
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
