#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const clientRoots = ["app", "src"];
const textExtensions = new Set([".js", ".jsx", ".ts", ".tsx", ".json", ".mjs", ".cjs"]);
const secretEnvNames = ["OPENAI_API_KEY", "SUPABASE_SERVICE_ROLE_KEY"];
const requiredPublicSupabaseEnv = ["EXPO_PUBLIC_SUPABASE_URL", "EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY"];

const failures = [];
const passes = [];

function toRepoPath(filePath) {
  return path.relative(repoRoot, filePath).split(path.sep).join("/");
}

function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

function existsFile(relativePath) {
  const filePath = path.join(repoRoot, relativePath);
  return fs.existsSync(filePath) && fs.statSync(filePath).isFile();
}

function walkFiles(relativeDir) {
  const root = path.join(repoRoot, relativeDir);
  if (!fs.existsSync(root)) return [];

  const files = [];
  const stack = [root];

  while (stack.length > 0) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if ([".expo", ".git", "node_modules"].includes(entry.name)) continue;
        stack.push(fullPath);
        continue;
      }

      if (entry.isFile() && textExtensions.has(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }

  return files.sort();
}

function getClientFiles() {
  return clientRoots.flatMap(walkFiles);
}

function getEnvFiles() {
  return fs
    .readdirSync(repoRoot, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /^\.env(?:\.|$)/.test(entry.name))
    .map((entry) => path.join(repoRoot, entry.name))
    .sort();
}

function getAssignedEnvNames(filePath) {
  return readText(filePath)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => line.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=/)?.[1])
    .filter(Boolean);
}

function addFailure(message) {
  failures.push(message);
}

function addPass(message) {
  passes.push(message);
}

function verifySecretNamesAreServerOnly() {
  const envProblems = [];

  for (const envFile of getEnvFiles()) {
    for (const envName of getAssignedEnvNames(envFile)) {
      if (!envName.startsWith("EXPO_PUBLIC_")) continue;
      for (const secretName of secretEnvNames) {
        if (envName.includes(secretName)) {
          envProblems.push(`${toRepoPath(envFile)}:${envName}`);
        }
      }
    }
  }

  if (envProblems.length > 0) {
    addFailure(`Server secret env names must not be exposed through EXPO_PUBLIC_*: ${envProblems.join(", ")}`);
  } else {
    addPass("Server secret env names are not assigned to EXPO_PUBLIC_* variables.");
  }

  const clientProblems = [];
  for (const filePath of getClientFiles()) {
    const source = readText(filePath);
    for (const secretName of secretEnvNames) {
      if (source.includes(secretName)) {
        clientProblems.push(`${toRepoPath(filePath)}:${secretName}`);
      }
    }
  }

  if (clientProblems.length > 0) {
    addFailure(`Server secret env names must not appear in client app/src files: ${clientProblems.join(", ")}`);
  } else {
    addPass("Server secret env names do not appear in client app/src files.");
  }
}

function verifyOAuthIsNotActiveProductionScope() {
  const activePatterns = [
    { label: "expo-auth-session", pattern: /from\s+["']expo-auth-session["']|require\(["']expo-auth-session["']\)/ },
    { label: "expo-apple-authentication", pattern: /from\s+["']expo-apple-authentication["']|require\(["']expo-apple-authentication["']\)/ },
    { label: "react-native-google-signin", pattern: /@react-native-google-signin|GoogleSignin/ },
    { label: "google provider literal", pattern: /\bprovider\s*:\s*["']google["']/ },
    { label: "apple provider literal", pattern: /\bprovider\s*:\s*["']apple["']/ },
    { label: "OAuth client id env", pattern: /EXPO_PUBLIC_(GOOGLE|APPLE).*CLIENT_ID|GOOGLE.*OAUTH|APPLE.*OAUTH/ },
  ];
  const problems = [];

  for (const filePath of getClientFiles()) {
    const source = readText(filePath);
    for (const { label, pattern } of activePatterns) {
      if (pattern.test(source)) {
        problems.push(`${toRepoPath(filePath)}:${label}`);
      }
    }
  }

  if (problems.length > 0) {
    addFailure(`Google/Apple OAuth appears active in client production scope: ${problems.join(", ")}`);
  } else {
    addPass("Google/Apple OAuth is not active in client production scope.");
  }
}

function verifyEnvExampleSupabasePlaceholders() {
  if (!existsFile(".env.example")) {
    addPass(".env.example is absent, so public Supabase placeholder check is skipped.");
    return;
  }

  const envNames = new Set(getAssignedEnvNames(path.join(repoRoot, ".env.example")));
  const missing = requiredPublicSupabaseEnv.filter((envName) => !envNames.has(envName));

  if (missing.length > 0) {
    addFailure(`.env.example is missing required public Supabase placeholders: ${missing.join(", ")}`);
  } else {
    addPass(".env.example includes required public Supabase placeholders.");
  }
}

function getExpoConfig() {
  const appJsonPath = path.join(repoRoot, "app.json");
  if (!fs.existsSync(appJsonPath)) {
    addFailure("app.json is missing.");
    return undefined;
  }

  try {
    return JSON.parse(readText(appJsonPath)).expo;
  } catch (error) {
    addFailure(`app.json is not valid JSON: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function hasMeaningfulMicrophoneCopy(value) {
  return typeof value === "string" && /\bmicrophone\b/i.test(value) && /\b(speak|speaking|voice|audio|practice|record)\b/i.test(value);
}

function verifyNativeMicrophonePermissionCopy() {
  const expo = getExpoConfig();
  if (!expo) return;

  const iosCopy = expo.ios?.infoPlist?.NSMicrophoneUsageDescription;
  const audioPlugin = Array.isArray(expo.plugins)
    ? expo.plugins.find((plugin) => Array.isArray(plugin) && plugin[0] === "expo-audio")
    : undefined;
  const audioPluginCopy = Array.isArray(audioPlugin) ? audioPlugin[1]?.microphonePermission : undefined;
  const androidPermissions = Array.isArray(expo.android?.permissions) ? expo.android.permissions : [];

  if (!hasMeaningfulMicrophoneCopy(iosCopy)) {
    addFailure("app.json:expo.ios.infoPlist.NSMicrophoneUsageDescription must include meaningful microphone permission copy.");
  }

  if (!hasMeaningfulMicrophoneCopy(audioPluginCopy)) {
    addFailure("app.json:expo.plugins[expo-audio].microphonePermission must include meaningful microphone permission copy.");
  }

  if (!androidPermissions.includes("android.permission.RECORD_AUDIO")) {
    addFailure("app.json:expo.android.permissions must include android.permission.RECORD_AUDIO.");
  }

  if (hasMeaningfulMicrophoneCopy(iosCopy) && hasMeaningfulMicrophoneCopy(audioPluginCopy) && androidPermissions.includes("android.permission.RECORD_AUDIO")) {
    addPass("Native microphone permission copy is present for iOS, Expo audio, and Android.");
  }
}

function verifyLiveRealtimeNotRequired() {
  const appJsonText = existsFile("app.json") ? readText(path.join(repoRoot, "app.json")) : "";
  const envExampleNames = existsFile(".env.example") ? new Set(getAssignedEnvNames(path.join(repoRoot, ".env.example"))) : new Set();
  const clientEntrypoint = existsFile("app/(tabs)/speak/index.tsx") ? readText(path.join(repoRoot, "app/(tabs)/speak/index.tsx")) : "";

  const mentionsRealtime = appJsonText.includes("react-native-webrtc") || envExampleNames.has("EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT");
  const visibleAsOptional =
    /paused|disabled|out of scope|not required|optional|fallback|Start live conversation|Live conversation/i.test(clientEntrypoint) ||
    /EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT/.test(appJsonText) ||
    envExampleNames.has("EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT");

  if (mentionsRealtime && !visibleAsOptional) {
    addFailure("Live/realtime feature appears configured but is not visibly optional, paused, or excluded from this readiness check.");
  } else {
    addPass("Live/realtime feature is not required by production readiness verification.");
  }
}

function run() {
  verifySecretNamesAreServerOnly();
  verifyOAuthIsNotActiveProductionScope();
  verifyEnvExampleSupabasePlaceholders();
  verifyNativeMicrophonePermissionCopy();
  verifyLiveRealtimeNotRequired();

  if (failures.length > 0) {
    console.error("Production readiness verification failed:");
    for (const failure of failures) {
      console.error(`FAIL ${failure}`);
    }
    for (const pass of passes) {
      console.error(`OK ${pass}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("Production readiness verification passed:");
  for (const pass of passes) {
    console.log(`OK ${pass}`);
  }
}

run();
