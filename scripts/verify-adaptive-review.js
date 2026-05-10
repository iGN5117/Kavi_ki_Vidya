#!/usr/bin/env node

const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");

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

function makeFeedback(overrides = {}) {
  const { pronunciation, grammar, confidence, ...rest } = overrides;

  return {
    pronunciation: {
      summary: "Clear enough for this check.",
      score: 96,
      retryWords: [],
      tips: [],
      ...pronunciation,
    },
    grammar: {
      improvedSentences: [],
      ...grammar,
    },
    confidence: {
      note: "Keep going.",
      nextStep: "Practice one sentence.",
      score: 90,
      ...confidence,
    },
    savedPhrases: [],
    mistakes: [],
    ...rest,
  };
}

function makePlanInput(overrides = {}) {
  return {
    feedbackHistory: [],
    mistakes: [],
    reviewQueue: [],
    lessonAttempts: [],
    drillResults: [],
    ...overrides,
  };
}

function assertUsefulPracticeHref(focus) {
  assert(
    typeof focus.actionHref === "string" && focus.actionHref.startsWith("/speak/conversation?"),
    `Expected a useful speaking practice href. Got: ${stringify(focus)}`
  );

  const query = new URLSearchParams(focus.actionHref.split("?")[1] || "");
  assert(query.get("practicePrompt") === focus.prompt, `Practice href should include the focus prompt. Got: ${focus.actionHref}`);
  assert(query.get("practiceItemId") === focus.id, `Practice href should include the focus id. Got: ${focus.actionHref}`);
}

function getLessonModuleById(lessons) {
  return new Map(lessons.map((lesson) => [lesson.id, lesson.moduleId]));
}

function getLessonSkillTagsById(lessonSkillProfiles) {
  return new Map(Object.entries(lessonSkillProfiles));
}

function run() {
  const { getLearnerPracticePlan, getAdaptiveLessonRecommendation } = loadTsModule("src/services/adaptive/practicePlan.ts");
  const { lessons } = loadTsModule("src/content/lessons.ts");
  const { lessonSkillProfiles } = loadTsModule("src/content/lessonSkillProfiles.ts");

  assert(typeof getLearnerPracticePlan === "function", "practicePlan.ts must export getLearnerPracticePlan.");
  assert(
    typeof getAdaptiveLessonRecommendation === "function",
    "practicePlan.ts must export getAdaptiveLessonRecommendation."
  );
  assert(Array.isArray(lessons) && lessons.length > 0, "lessons.ts must export a non-empty lessons array.");

  const grammarFeedback = makeFeedback({
    grammar: {
      improvedSentences: [
        {
          original: "I good.",
          improved: "I am good.",
          explanation: {
            "hi-Deva": "Use am here.",
            "hi-Latn": "Yahan am chahiye.",
          },
        },
      ],
    },
  });
  const grammarPlan = getLearnerPracticePlan(makePlanInput({ feedbackHistory: [grammarFeedback] }));
  const grammarFocus = grammarPlan.find((focus) => focus.kind === "grammar" && focus.prompt === "I am good.");

  assert(grammarFocus, `Expected an "I am good." grammar focus. Got: ${stringify(grammarPlan)}`);
  assert(grammarFocus.recommendedLessonId === "greetings-intro", `Expected greetings-intro recommendation. Got: ${stringify(grammarFocus)}`);
  assertUsefulPracticeHref(grammarFocus);

  const pronunciationFeedback = makeFeedback({
    pronunciation: {
      summary: "A few sounds need another try.",
      score: 62,
      retryWords: ["please", "clearly"],
      tips: ["Open the vowel sound and slow down."],
    },
  });
  const pronunciationPlan = getLearnerPracticePlan(makePlanInput({ feedbackHistory: [pronunciationFeedback] }));
  const pronunciationFocus = pronunciationPlan.find(
    (focus) => focus.kind === "pronunciation" && focus.prompt.includes("please") && focus.prompt.includes("clearly")
  );

  assert(pronunciationFocus, `Expected a pronunciation focus for retry words. Got: ${stringify(pronunciationPlan)}`);
  assertUsefulPracticeHref(pronunciationFocus);

  const recommendationInput = {
    ...makePlanInput({ feedbackHistory: [grammarFeedback] }),
    completedLessons: [],
    skippedLessons: [],
    skippedModules: [],
    lessonModuleById: getLessonModuleById(lessons),
    lessonSkillTagsById: getLessonSkillTagsById(lessonSkillProfiles),
  };
  const recommendation = getAdaptiveLessonRecommendation(recommendationInput);

  assert(recommendation?.lessonId === "greetings-intro", `Expected greetings-intro recommendation. Got: ${stringify(recommendation)}`);
  assert(recommendation.focus.prompt === "I am good.", `Expected recommendation to use grammar focus. Got: ${stringify(recommendation)}`);

  const completedRecommendation = getAdaptiveLessonRecommendation({
    ...recommendationInput,
    completedLessons: ["greetings-intro"],
  });
  assert(
    completedRecommendation?.lessonId === "neighbor-small-talk",
    `Completed matched lesson should fall through to the next tagged lesson. Got: ${stringify(completedRecommendation)}`
  );

  const skippedRecommendation = getAdaptiveLessonRecommendation({
    ...recommendationInput,
    skippedLessons: ["greetings-intro"],
  });
  assert(
    skippedRecommendation?.lessonId === "neighbor-small-talk",
    `Skipped matched lesson should fall through to the next tagged lesson. Got: ${stringify(skippedRecommendation)}`
  );

  console.log("Adaptive review verification passed: tagged grammar, pronunciation, and fallback lesson recommendations passed.");
}

try {
  run();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
