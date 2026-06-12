const { spawnSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const root = path.resolve(__dirname, "..");
const appConfig = JSON.parse(fs.readFileSync(path.join(root, "app.json"), "utf8"));
const appId = appConfig.expo?.android?.package || "com.kavikividya.app";
const screenshotRoot = path.join(os.tmpdir(), "kavi-android-ui");

const targets = [
  {
    name: "speak-home",
    flow: ".maestro/android-ui-speak-home.yaml",
    requiredIds: ["speak-screen", "speak-free-chat-button", "speak-guided-roleplay-button"],
  },
  {
    name: "free-conversation",
    flow: ".maestro/android-ui-free-conversation.yaml",
    requiredIds: ["speak-conversation-screen", "conversation-back-button", "conversation-end-button", "conversation-first-message"],
    clearBelowControls: true,
  },
  {
    name: "roleplay-list",
    flow: ".maestro/android-ui-roleplay.yaml",
    requiredIds: ["roleplay-screen", "roleplay-scenario-guest-at-home"],
  },
  {
    name: "roleplay-conversation",
    flow: ".maestro/android-ui-roleplay-conversation.yaml",
    requiredIds: ["speak-conversation-screen", "conversation-back-button", "conversation-end-button", "conversation-first-message"],
    clearBelowControls: true,
  },
  {
    name: "learn-home",
    flow: ".maestro/android-ui-learn-home.yaml",
    requiredIds: ["learn-screen", "learn-streak-progress", "learn-start-lesson-button"],
  },
  {
    name: "lesson-overview",
    flow: ".maestro/android-ui-lesson-overview.yaml",
    requiredIds: ["lesson-overview-screen", "lesson-overview-start-button"],
  },
  {
    name: "lesson-activity",
    flow: ".maestro/android-ui-lesson-activity.yaml",
    requiredIds: ["lesson-activity-screen"],
  },
  {
    name: "review",
    flow: ".maestro/android-ui-review.yaml",
    requiredIds: ["review-screen"],
  },
  {
    name: "profile",
    flow: ".maestro/android-ui-profile.yaml",
    requiredIds: ["profile-screen"],
  },
];

function resolveExecutable(name, candidates = []) {
  const pathResult = spawnSync("bash", ["-lc", `command -v ${name}`], { encoding: "utf8" });
  const fromPath = pathResult.stdout.trim();
  if (pathResult.status === 0 && fromPath) return fromPath;

  return candidates.find((candidate) => candidate && fs.existsSync(candidate));
}

function run(label, command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: options.binary ? null : "utf8",
    stdio: options.capture || options.binary ? "pipe" : "inherit",
  });

  if (result.status !== 0) {
    const stdout = Buffer.isBuffer(result.stdout) ? result.stdout.toString("utf8") : result.stdout;
    const stderr = Buffer.isBuffer(result.stderr) ? result.stderr.toString("utf8") : result.stderr;
    const output = [stdout, stderr].filter(Boolean).join("\n").trim();
    throw new Error(`${label} failed${output ? `:\n${output}` : "."}`);
  }

  return result.stdout || "";
}

function fail(message) {
  console.error(`\nAndroid UI verification blocked:\n${message}\n`);
  process.exit(1);
}

function getAndroidTooling() {
  const androidHome = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(os.homedir(), "Library/Android/sdk");
  const adb = resolveExecutable("adb", [path.join(androidHome, "platform-tools/adb")]);
  const maestro = resolveExecutable("maestro", [path.join(os.homedir(), ".maestro/bin/maestro")]);

  if (!adb) {
    fail(
      [
        "adb was not found.",
        "Install Android SDK Platform-Tools, then add it to PATH:",
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
      ].join("\n")
    );
  }

  return { adb, maestro };
}

function getConnectedDevice(adb) {
  const devicesOutput = run("adb devices", adb, ["devices"], { capture: true });
  const devices = devicesOutput
    .split("\n")
    .slice(1)
    .map((line) => line.trim().split(/\s+/))
    .filter(([id, state]) => id && state === "device");

  if (!devices.length) {
    fail("No running Android emulator/device was found. Start Kavi_Android_35 or connect a phone, then rerun this verifier.");
  }
}

function verifyAppAndMetro(adb) {
  const installedPackages = run("adb package check", adb, ["shell", "pm", "list", "packages", appId], { capture: true });
  if (!installedPackages.includes(appId)) {
    fail(`${appId} is not installed on the active Android device. Run npm run android before rerunning this verifier.`);
  }

  const metroStatus = spawnSync("curl", ["-fsS", "http://127.0.0.1:8081/status"], { encoding: "utf8" });
  if (metroStatus.status !== 0 || !metroStatus.stdout.includes("packager-status:running")) {
    fail(
      [
        "Metro is not running on http://127.0.0.1:8081.",
        "Start it first:",
        "EXPO_PUBLIC_API_BASE_URL=https://kavi-ki-vidya-api.onrender.com/api EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT=https://kavi-ki-vidya-api.onrender.com/api/realtime/session npm run start -- --host lan",
      ].join("\n")
    );
  }
}

function parseBounds(bounds) {
  const match = String(bounds || "").match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!match) return undefined;

  return {
    left: Number(match[1]),
    top: Number(match[2]),
    right: Number(match[3]),
    bottom: Number(match[4]),
  };
}

function parseNodes(xml) {
  const nodes = [];
  const nodePattern = /<node\b([^>]*)>/g;
  let match;

  while ((match = nodePattern.exec(xml))) {
    const rawAttrs = match[1];
    const attrs = {};
    const attrPattern = /([\w-]+)="([^"]*)"/g;
    let attrMatch;
    while ((attrMatch = attrPattern.exec(rawAttrs))) {
      attrs[attrMatch[1]] = attrMatch[2];
    }

    const bounds = parseBounds(attrs.bounds);
    if (bounds) {
      nodes.push({ attrs, bounds });
    }
  }

  return nodes;
}

function nodeHasId(node, id) {
  const resourceId = node.attrs["resource-id"] || "";
  const contentDescription = node.attrs["content-desc"] || "";
  return (
    resourceId === id ||
    resourceId.endsWith(`/${id}`) ||
    resourceId.includes(`:id/${id}`) ||
    resourceId.includes(id) ||
    contentDescription === id
  );
}

function findById(nodes, id) {
  return nodes.find((node) => nodeHasId(node, id));
}

function getViewport(adb) {
  const sizeOutput = run("adb wm size", adb, ["shell", "wm", "size"], { capture: true });
  const match = sizeOutput.match(/(\d+)x(\d+)/);
  if (!match) return undefined;

  return { width: Number(match[1]), height: Number(match[2]) };
}

function assertWithinViewport(name, id, node, viewport) {
  if (!viewport) return;
  const { left, top, right, bottom } = node.bounds;
  const isInside = left >= 0 && top >= 0 && right <= viewport.width && bottom <= viewport.height && right > left && bottom > top;
  if (!isInside) {
    throw new Error(
      `${name}: ${id} is outside the Android viewport. Bounds=${JSON.stringify(node.bounds)}, viewport=${JSON.stringify(viewport)}`
    );
  }
}

function assertConversationTopClearance(name, nodes) {
  const firstMessage = findById(nodes, "conversation-first-message");
  const backButton = findById(nodes, "conversation-back-button");
  const endButton = findById(nodes, "conversation-end-button");
  const missing = [
    !firstMessage && "conversation-first-message",
    !backButton && "conversation-back-button",
    !endButton && "conversation-end-button",
  ].filter(Boolean);

  if (missing.length) {
    throw new Error(`${name}: missing nodes for overlap check: ${missing.join(", ")}`);
  }

  const controlsBottom = Math.max(backButton.bounds.bottom, endButton.bounds.bottom);
  const gap = firstMessage.bounds.top - controlsBottom;
  if (gap < 12) {
    throw new Error(
      `${name}: first conversation message is too close to the top controls. gap=${gap}px, firstMessage=${JSON.stringify(
        firstMessage.bounds
      )}, back=${JSON.stringify(backButton.bounds)}, end=${JSON.stringify(endButton.bounds)}`
    );
  }
}

function captureScreen(adb, name) {
  const png = run(`capture screenshot ${name}`, adb, ["exec-out", "screencap", "-p"], { binary: true });
  const pngPath = path.join(screenshotRoot, `${name}.png`);
  fs.writeFileSync(pngPath, png);

  run(`dump UI hierarchy ${name}`, adb, ["shell", "uiautomator", "dump", "/sdcard/window.xml"], { capture: true });
  const xml = run(`read UI hierarchy ${name}`, adb, ["exec-out", "cat", "/sdcard/window.xml"], { capture: true });
  const xmlPath = path.join(screenshotRoot, `${name}.xml`);
  fs.writeFileSync(xmlPath, xml);

  return { pngPath, xmlPath, nodes: parseNodes(xml) };
}

function assertTargetUi(target, capture, viewport) {
  for (const id of target.requiredIds) {
    const node = findById(capture.nodes, id);
    if (!node) {
      throw new Error(`${target.name}: required Android UI node not found: ${id}. See ${capture.xmlPath}`);
    }
    assertWithinViewport(target.name, id, node, viewport);
  }

  if (target.clearBelowControls) {
    assertConversationTopClearance(target.name, capture.nodes);
  }
}

function readErrorLogs(adb) {
  return run("read Android error logs", adb, ["logcat", "-d", "AndroidRuntime:E", "ReactNativeJS:E", "*:S"], {
    capture: true,
  });
}

function main() {
  const { adb, maestro } = getAndroidTooling();
  getConnectedDevice(adb);
  verifyAppAndMetro(adb);
  fs.mkdirSync(screenshotRoot, { recursive: true });
  run("clear Android logs", adb, ["logcat", "-c"], { capture: true });

  const viewport = getViewport(adb);
  const captures = [];

  for (const target of targets) {
    const flowPath = path.join(root, target.flow);
    if (!fs.existsSync(flowPath)) {
      fail(`Flow not found: ${target.flow}`);
    }

    console.log(`\nRunning Android UI flow: ${target.name}`);
    run(`maestro ${target.flow}`, maestro, ["test", target.flow]);
    const capture = captureScreen(adb, target.name);
    assertTargetUi(target, capture, viewport);
    captures.push(capture.pngPath);
    console.log(`Captured ${capture.pngPath}`);
  }

  const errorLogs = readErrorLogs(adb);
  const crashPattern = /(FATAL EXCEPTION|Invariant Violation|TypeError|ReferenceError|com\.facebook\.react)/i;
  if (crashPattern.test(errorLogs)) {
    console.error(errorLogs.trim());
    fail("Android or React Native errors were found after the UI flows.");
  }

  console.log("\nAndroid UI verification passed.");
  console.log(`Screenshots: ${screenshotRoot}`);
  console.log(captures.map((capture) => `- ${capture}`).join("\n"));
}

try {
  main();
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}
