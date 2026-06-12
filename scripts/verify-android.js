const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const appId = appConfig.expo?.android?.package || "com.kavikividya.app";
const flows = process.argv.slice(2).length
  ? process.argv.slice(2)
  : [".maestro/lesson-start.yaml", ".maestro/speak-mic.yaml"];

function resolveExecutable(name, candidates = []) {
  const pathResult = spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  const fromPath = pathResult.stdout.trim();
  if (pathResult.status === 0 && fromPath) return fromPath;

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed${output ? `:\n${output}` : "."}`);
  }

  return result.stdout || "";
}

function fail(message) {
  console.error(`\nAndroid verification blocked:\n${message}\n`);
  process.exit(1);
}

const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(os.homedir(), "Library/Android/sdk");
const adb = resolveExecutable("adb", [path.join(androidHome, "platform-tools/adb")]);
const maestro = resolveExecutable("maestro", [path.join(os.homedir(), ".maestro/bin/maestro")]);

if (!adb) {
  fail(
    [
      "adb was not found.",
      "Install Android Studio, open SDK Manager, install Android SDK Platform-Tools, then add it to PATH:",
      `export ANDROID_HOME=${androidHome}`,
      'export PATH="$ANDROID_HOME/platform-tools:$PATH"',
    ].join("\n")
  );
}

if (!maestro) {
  fail(
    [
      "Maestro was not found.",
      "Install it with:",
      "curl -Ls https://get.maestro.mobile.dev | bash",
      "Then restart the terminal and rerun npm run verify:android.",
    ].join("\n")
  );
}

const devicesOutput = run("adb devices", adb, ["devices"], { capture: true });
const devices = devicesOutput
  .split("\n")
  .slice(1)
  .map((line) => line.trim().split(/\s+/))
  .filter(([id, state]) => id && state === "device");

if (!devices.length) {
  fail(
    [
      "No running Android emulator/device was found.",
      "Start an Android Emulator from Android Studio, or connect a phone with USB debugging enabled.",
      "Then install the dev build with npm run android before rerunning this verifier.",
    ].join("\n")
  );
}

const installedPackages = run("adb package check", adb, ["shell", "pm", "list", "packages", appId], { capture: true });
if (!installedPackages.includes(appId)) {
  fail(
    [
      `${appId} is not installed on the active Android device.`,
      "Run the native Android app first:",
      "EXPO_PUBLIC_API_BASE_URL=https://kavi-ki-vidya-api.onrender.com/api EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=https://kavi-ki-vidya-api.onrender.com/api/realtime/session npm run android",
    ].join("\n")
  );
}

const metroStatus = spawnSync("curl", ["-fsS", "http://127.0.0.1:8081/status"], { encoding: "utf8" });
if (metroStatus.status !== 0 || !metroStatus.stdout.includes("packager-status:running")) {
  fail(
    [
      "Metro is not running on http://127.0.0.1:8081.",
      "Start it before Android verification:",
      "EXPO_PUBLIC_API_BASE_URL=https://kavi-ki-vidya-api.onrender.com/api EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=https://kavi-ki-vidya-api.onrender.com/api/realtime/session npm run start -- --host lan",
    ].join("\n")
  );
}

run("clear Android logs", adb, ["logcat", "-c"], { capture: true });

for (const flow of flows) {
  const flowPath = path.join(root, flow);
  if (!fs.existsSync(flowPath)) {
    fail(`Flow not found: ${flow}`);
  }
  console.log(`\nRunning Android flow: ${flow}`);
  run(`maestro ${flow}`, maestro, ["test", flow]);
}

const errorLogs = run("read Android error logs", adb, ["logcat", "-d", "AndroidRuntime:E", "ReactNativeJS:E", "*:S"], {
  capture: true,
});
const crashPattern = /(FATAL EXCEPTION|Invariant Violation|TypeError|ReferenceError|com\.facebook\.react)/i;
if (crashPattern.test(errorLogs)) {
  console.error(errorLogs.trim());
  fail("Android or React Native errors were found after the Maestro flows.");
}

console.log("\nAndroid verification passed: lesson start, speak mic start, and log scan completed.");
