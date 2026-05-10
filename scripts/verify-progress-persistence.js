#!/usr/bin/env node

const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const progressSyncPath = "src/services/sync/progressSync.ts";
const appStorePath = "src/store/useAppStore.ts";

function resolveTsPath(request, parentDir) {
  const candidates = [];

  if (request.startsWith("@/")) {
    candidates.push(path.join(repoRoot, request.slice(2)));
  } else if (request.startsWith(".")) {
    candidates.push(path.resolve(parentDir, request));
  } else {
    return null;
  }

  for (const candidate of candidates) {
    for (const filePath of [candidate, `${candidate}.ts`, `${candidate}.tsx`, `${candidate}.js`]) {
      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        return filePath;
      }
    }
  }

  return null;
}

function loadTsModule(filePath) {
  const absolutePath = path.resolve(repoRoot, filePath);
  const source = fs.readFileSync(absolutePath, "utf8");
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
    fileName: absolutePath,
  });

  const mod = new Module(absolutePath, module);
  mod.filename = absolutePath;
  mod.paths = Module._nodeModulePaths(path.dirname(absolutePath));

  const originalRequire = mod.require.bind(mod);
  mod.require = (request) => {
    const resolved = resolveTsPath(request, path.dirname(absolutePath));
    return resolved ? loadTsModule(path.relative(repoRoot, resolved)) : originalRequire(request);
  };

  mod._compile(compiled.outputText, absolutePath);
  return mod.exports;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function stringify(value) {
  return JSON.stringify(value, null, 2);
}

function readRepoFile(filePath) {
  return fs.readFileSync(path.resolve(repoRoot, filePath), "utf8");
}

function extractTypeBody(source, typeName) {
  const match = source.match(new RegExp(`export type ${typeName} = \\{([\\s\\S]*?)\\n\\};`));
  assert(match, `${typeName} must remain an exported object type.`);
  return match[1];
}

function extractTypeFields(source, typeName) {
  return extractTypeBody(source, typeName)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("//"))
    .map((line) => line.match(/^([a-zA-Z0-9_]+)[?:]?:/)?.[1])
    .filter(Boolean);
}

function extractFunctionBody(source, functionName) {
  const start = source.indexOf(`function ${functionName}`);
  assert(start >= 0, `${functionName} must exist.`);

  const bodyStart = source.indexOf("{", start);
  assert(bodyStart >= 0, `${functionName} must have a function body.`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) return source.slice(bodyStart + 1, index);
  }

  throw new Error(`Could not parse ${functionName} body.`);
}

function parseObjectKeysFromReturn(functionBody) {
  const returnStart = functionBody.indexOf("return {");
  assert(returnStart >= 0, "Expected function to return an object literal.");

  const objectStart = functionBody.indexOf("{", returnStart);
  let depth = 0;
  let objectEnd = -1;
  for (let index = objectStart; index < functionBody.length; index += 1) {
    const char = functionBody[index];
    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;
    if (depth === 0) {
      objectEnd = index;
      break;
    }
  }
  assert(objectEnd > objectStart, "Could not parse returned object literal.");

  const body = functionBody.slice(objectStart + 1, objectEnd);
  return body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("..."))
    .map((line) => line.match(/^([a-zA-Z0-9_]+):/)?.[1] ?? line.match(/^([a-zA-Z0-9_]+),?$/)?.[1])
    .filter(Boolean);
}

function uniqueValues(values) {
  return Array.from(new Set(values));
}

function assertNoDuplicates(errors, label, values, getKey = (value) => value) {
  const seen = new Set();
  values.forEach((value, index) => {
    const key = getKey(value);
    if (!key) return;
    if (seen.has(key)) errors.push(`${label}[${index}] duplicates key "${key}".`);
    seen.add(key);
  });
}

function assertIsoString(errors, label, value, { nullable = false, optional = false } = {}) {
  if (value === undefined && optional) return;
  if (value === null && nullable) return;

  if (typeof value !== "string") {
    errors.push(`${label} must be an ISO string${nullable ? " or null" : ""}.`);
    return;
  }

  if (Number.isNaN(Date.parse(value)) || new Date(value).toISOString() !== value) {
    errors.push(`${label} must be a serialized ISO date string. Got: ${stringify(value)}`);
  }
}

function assertDateKey(errors, label, value, { nullable = false, optional = false } = {}) {
  if (value === undefined && optional) return;
  if (value === null && nullable) return;

  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    errors.push(`${label} must be a local YYYY-MM-DD date key${nullable ? " or null" : ""}.`);
  }
}

function findSecretLeaks(value, pathLabel = "progress") {
  const leaks = [];
  const secretKeyPattern = /(api[_-]?key|authorization|bearer|password|secret|service[_-]?role|session[_-]?token|supabase[_-]?key|token)/i;
  const secretValuePattern = /(sk-[a-z0-9_-]{8,}|eyJ[a-z0-9_-]{8,}|service[_-]?role|bearer\s+[a-z0-9._-]+)/i;

  function visit(current, currentPath) {
    if (current && typeof current === "object") {
      if (current instanceof Date) leaks.push(`${currentPath} contains a Date object instead of a serialized string.`);
      if (Array.isArray(current)) {
        current.forEach((item, index) => visit(item, `${currentPath}[${index}]`));
        return;
      }

      Object.entries(current).forEach(([key, child]) => {
        const childPath = `${currentPath}.${key}`;
        if (secretKeyPattern.test(key)) leaks.push(`${childPath} looks like a client-visible secret field.`);
        visit(child, childPath);
      });
      return;
    }

    if (typeof current === "string" && secretValuePattern.test(current)) {
      leaks.push(`${currentPath} looks like it contains a secret value.`);
    }
  }

  visit(value, pathLabel);
  return leaks;
}

function validateProgressSnapshot(snapshot, expectedFields) {
  const errors = [];
  const expectedFieldSet = new Set(expectedFields);
  const actualFields = Object.keys(snapshot);

  expectedFields.forEach((field) => {
    if (!(field in snapshot)) errors.push(`ProgressSnapshot is missing "${field}".`);
  });

  actualFields.forEach((field) => {
    if (!expectedFieldSet.has(field)) errors.push(`ProgressSnapshot has unexpected client-visible field "${field}".`);
  });

  const arrayFields = [
    "completedLessons",
    "skippedLessons",
    "skippedModules",
    "lessonAttempts",
    "reviewQueue",
    "drillResults",
    "savedPhrases",
    "mistakes",
    "feedbackHistory",
  ];
  arrayFields.forEach((field) => {
    if (!Array.isArray(snapshot[field])) errors.push(`ProgressSnapshot.${field} must be an array.`);
  });

  ["completedLessons", "skippedLessons", "skippedModules", "savedPhrases", "mistakes"].forEach((field) => {
    if (!Array.isArray(snapshot[field])) return;
    assertNoDuplicates(errors, `ProgressSnapshot.${field}`, snapshot[field]);
  });

  if (snapshot.authProfile !== null && (typeof snapshot.authProfile !== "object" || Array.isArray(snapshot.authProfile))) {
    errors.push("ProgressSnapshot.authProfile must be an object or null.");
  }

  if (snapshot.authProfile) {
    ["provider", "providerUserId", "syncProfileId", "displayName", "signedInAt"].forEach((field) => {
      if (typeof snapshot.authProfile[field] !== "string" || snapshot.authProfile[field].trim().length === 0) {
        errors.push(`ProgressSnapshot.authProfile.${field} must be a non-empty string.`);
      }
    });
    assertIsoString(errors, "ProgressSnapshot.authProfile.signedInAt", snapshot.authProfile.signedInAt);
  }

  assertDateKey(errors, "ProgressSnapshot.dailyProgressDate", snapshot.dailyProgressDate, { nullable: true });
  assertDateKey(errors, "ProgressSnapshot.lastActiveDate", snapshot.lastActiveDate, { nullable: true });

  if (Array.isArray(snapshot.lessonAttempts)) {
    assertNoDuplicates(errors, "ProgressSnapshot.lessonAttempts", snapshot.lessonAttempts, (attempt) => `${attempt.lessonId}-${attempt.completedAt}`);
    snapshot.lessonAttempts.forEach((attempt, index) => {
      assertIsoString(errors, `ProgressSnapshot.lessonAttempts[${index}].completedAt`, attempt.completedAt);
    });
  }

  if (Array.isArray(snapshot.reviewQueue)) {
    assertNoDuplicates(errors, "ProgressSnapshot.reviewQueue", snapshot.reviewQueue, (item) => item.id);
    snapshot.reviewQueue.forEach((item, index) => {
      assertIsoString(errors, `ProgressSnapshot.reviewQueue[${index}].createdAt`, item.createdAt);
      assertIsoString(errors, `ProgressSnapshot.reviewQueue[${index}].completedAt`, item.completedAt, { nullable: true });
      assertIsoString(errors, `ProgressSnapshot.reviewQueue[${index}].dueAt`, item.dueAt, { nullable: true, optional: true });
      assertIsoString(errors, `ProgressSnapshot.reviewQueue[${index}].lastPracticedAt`, item.lastPracticedAt, {
        nullable: true,
        optional: true,
      });
    });
  }

  if (Array.isArray(snapshot.drillResults)) {
    assertNoDuplicates(errors, "ProgressSnapshot.drillResults", snapshot.drillResults, (result) => result.id);
    snapshot.drillResults.forEach((result, index) => {
      assertIsoString(errors, `ProgressSnapshot.drillResults[${index}].practicedAt`, result.practicedAt);
    });
  }

  try {
    const serialized = JSON.stringify(snapshot);
    assert(serialized && JSON.parse(serialized), "ProgressSnapshot must round-trip through JSON.");
  } catch (error) {
    errors.push(`ProgressSnapshot must be JSON-serializable: ${error instanceof Error ? error.message : error}`);
  }

  errors.push(...findSecretLeaks(snapshot));
  return errors;
}

function makeValidSnapshot() {
  const now = "2026-05-09T12:00:00.000Z";

  return {
    isSignedIn: true,
    hasCompletedOnboarding: true,
    authProfile: {
      provider: "local",
      providerUserId: "kavita-local",
      syncProfileId: "local-kavita",
      displayName: "Kavita",
      email: "kavita@example.com",
      signedInAt: now,
    },
    name: "Kavita",
    explanationPreference: "both",
    dailyGoalMinutes: 5,
    streakCount: 3,
    minutesToday: 4,
    dailyProgressDate: "2026-05-09",
    lastActiveDate: "2026-05-09",
    completedLessons: ["greetings-intro"],
    skippedLessons: ["directions-basics"],
    skippedModules: ["travel"],
    lessonAttempts: [
      {
        lessonId: "greetings-intro",
        completedAt: now,
        score: 92,
        correctCount: 5,
        checkedCount: 5,
        retryCount: 1,
        reviewPrompts: ["I am good."],
      },
    ],
    reviewQueue: [
      {
        id: "review-1",
        source: "lesson",
        title: "Lesson review",
        prompt: "I am good.",
        detail: "Practice once.",
        createdAt: now,
        completedAt: null,
        dueAt: now,
        priority: "normal",
        practiceCount: 1,
        lastPracticedAt: now,
        lastResult: "practiced",
      },
    ],
    drillResults: [
      {
        id: "drill-1",
        itemId: "review-1",
        source: "lesson",
        target: "I am good.",
        practicedAt: now,
        outcome: "improved",
        attempted: true,
        learnerTurnCount: 2,
        score: 90,
        summary: "Clear.",
        tips: [],
      },
    ],
    savedPhrases: ["Nice to meet you."],
    mistakes: ["Use 'I am' instead of 'I'."],
    feedbackHistory: [
      {
        pronunciation: {
          summary: "The sentence was understandable.",
          score: 77,
          retryWords: [],
          tips: ["Say the complete sentence once slowly."],
        },
        grammar: {
          improvedSentences: [
            {
              original: "I good.",
              improved: "I am good.",
              explanation: {
                "hi-Deva": "Use 'am' when speaking about yourself: I am good.",
                "hi-Latn": "English mein apne baare mein adjective bolte waqt 'am' lagta hai: I am good.",
              },
            },
          ],
        },
        confidence: {
          note: "Good effort. You completed 1 speaking turn.",
          nextStep: 'Repeat this once more: "I am good."',
          score: 76,
        },
        savedPhrases: [],
        mistakes: ['Try "I am good." instead of "I good.".'],
        sessionReceipt: {
          completedAt: now,
          turnCount: 1,
          bestSentence: "I good.",
          grammarFix: {
            original: "I good.",
            improved: "I am good.",
          },
          pronunciationScore: 77,
          retrySentence: "I am good.",
          nextStepLesson: {
            lessonId: "greetings-intro",
            title: "Say Hello And Introduce Yourself",
            reason: "Your review shows missing helping verbs. Practice the complete sentence once.",
          },
        },
      },
    ],
  };
}

function assertSnapshotVerifierCatchesPersistenceRisks(expectedFields) {
  const validSnapshot = makeValidSnapshot();
  const validErrors = validateProgressSnapshot(validSnapshot, expectedFields);
  assert(validErrors.length === 0, `Expected valid snapshot to pass. Got: ${stringify(validErrors)}`);

  const riskySnapshot = {
    ...makeValidSnapshot(),
    sessionToken: "bearer secret-token",
    dailyProgressDate: new Date("2026-05-09T12:00:00.000Z"),
    completedLessons: ["greetings-intro", "greetings-intro"],
    reviewQueue: [
      ...makeValidSnapshot().reviewQueue,
      {
        ...makeValidSnapshot().reviewQueue[0],
        prompt: "Duplicate id should be rejected.",
      },
    ],
  };
  const riskyErrors = validateProgressSnapshot(riskySnapshot, expectedFields);

  [
    "unexpected client-visible field",
    "Date object",
    "duplicates key",
    "secret",
  ].forEach((expectedText) => {
    assert(
      riskyErrors.some((error) => error.includes(expectedText)),
      `Snapshot verifier should catch "${expectedText}". Got: ${stringify(riskyErrors)}`
    );
  });
}

function assertStaticStoreContract(progressSyncSource, appStoreSource) {
  const progressFields = extractTypeFields(progressSyncSource, "ProgressSnapshot");
  const pickedFields = parseObjectKeysFromReturn(extractFunctionBody(appStoreSource, "pickProgressSnapshot"));
  const missingPickedFields = progressFields.filter((field) => !pickedFields.includes(field));

  assert(
    missingPickedFields.length === 0,
    `pickProgressSnapshot must include every ProgressSnapshot field. Missing: ${missingPickedFields.join(", ")}`
  );

  const normalizeBody = extractFunctionBody(appStoreSource, "normalizeProgressSnapshot");
  [
    "normalizeAuthProfile(state.authProfile)",
    "getTodayMinutes(",
    "Array.isArray(state.completedLessons)",
    "Array.isArray(state.lessonAttempts)",
    "Array.isArray(state.reviewQueue)",
    "Array.isArray(state.drillResults)",
    "Array.isArray(state.feedbackHistory)",
  ].forEach((snippet) => {
    assert(normalizeBody.includes(snippet), `normalizeProgressSnapshot must keep sanitization step: ${snippet}`);
  });

  const mergeBody = extractFunctionBody(appStoreSource, "mergeProgressSnapshots");
  [
    "normalizeProgressSnapshot(remote)",
    "Math.max(local.streakCount, normalizedRemote.streakCount)",
    "Math.max(local.minutesToday, normalizedRemote.minutesToday)",
    "uniqueStrings(local.completedLessons, normalizedRemote.completedLessons)",
    "uniqueStrings(local.skippedLessons, normalizedRemote.skippedLessons)",
    "uniqueStrings(local.skippedModules, normalizedRemote.skippedModules)",
    "uniqueLessonAttempts(local.lessonAttempts, normalizedRemote.lessonAttempts)",
    "uniqueReviewItems(local.reviewQueue, normalizedRemote.reviewQueue)",
    "uniqueDrillResults(local.drillResults, normalizedRemote.drillResults)",
    "uniqueStrings(local.savedPhrases, normalizedRemote.savedPhrases)",
    "uniqueStrings(local.mistakes, normalizedRemote.mistakes)",
    "uniqueFeedback(local.feedbackHistory, normalizedRemote.feedbackHistory)",
  ].forEach((snippet) => {
    assert(mergeBody.includes(snippet), `mergeProgressSnapshots must keep merge behavior: ${snippet}`);
  });

  return progressFields;
}

function assertExportedSyncHelpers() {
  const { getConfiguredApiBaseUrl, getDefaultSyncProfileId, getSafeProfileId, hasProgressSyncEndpoint } = loadTsModule(progressSyncPath);

  assert(typeof getSafeProfileId === "function", "progressSync.ts must export getSafeProfileId.");
  assert(typeof getDefaultSyncProfileId === "function", "progressSync.ts must export getDefaultSyncProfileId.");
  assert(typeof getConfiguredApiBaseUrl === "function", "progressSync.ts must export getConfiguredApiBaseUrl.");
  assert(typeof hasProgressSyncEndpoint === "function", "progressSync.ts must export hasProgressSyncEndpoint.");

  assert(getSafeProfileId(" learner_01 ") === "learner_01", "getSafeProfileId should trim and preserve safe ids.");
  assert(getSafeProfileId("../secret") === "local-kavita", "getSafeProfileId should reject unsafe ids.");
  assert(getSafeProfileId("a".repeat(65)) === "local-kavita", "getSafeProfileId should reject overlong ids.");
  assert(getDefaultSyncProfileId() === "local-kavita", "Default sync profile should remain deterministic without env.");
  assert(getConfiguredApiBaseUrl() === undefined, "Configured API base URL should be absent in offline verification.");
  assert(hasProgressSyncEndpoint() === false, "Offline verification must not require a progress sync endpoint.");
}

function run() {
  const progressSyncSource = readRepoFile(progressSyncPath);
  const appStoreSource = readRepoFile(appStorePath);
  const progressFields = assertStaticStoreContract(progressSyncSource, appStoreSource);

  assertExportedSyncHelpers();
  assertSnapshotVerifierCatchesPersistenceRisks(progressFields);

  console.log(
    `Progress persistence verification passed: ${progressFields.length} snapshot fields, offline sync helpers, merge contract, JSON/date/id/secret checks.`
  );
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
