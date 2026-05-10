#!/usr/bin/env node

const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const ts = require("typescript");

const repoRoot = path.resolve(__dirname, "..");
const supportLanguages = ["hi-Deva", "hi-Latn"];

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

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function labelLesson(lesson, index) {
  return `lesson ${isNonEmptyString(lesson?.id) ? `"${lesson.id}"` : `at index ${index}`}`;
}

function labelActivity(lesson, lessonIndex, activity, activityIndex) {
  const lessonLabel = labelLesson(lesson, lessonIndex);
  const typeLabel = isNonEmptyString(activity?.type) ? activity.type : "unknown";
  return `${lessonLabel} activity ${activityIndex + 1} (${typeLabel})`;
}

function sortedCounts(values) {
  const counts = new Map();
  for (const value of values) {
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()].sort(([left], [right]) => String(left).localeCompare(String(right)));
}

function arraysHaveSameCounts(left, right) {
  return JSON.stringify(sortedCounts(left)) === JSON.stringify(sortedCounts(right));
}

function validateOptionsActivity(errors, activityLabel, activity) {
  if (!Array.isArray(activity.options) || activity.options.length === 0) {
    errors.push(`${activityLabel} must have a non-empty options array.`);
  } else {
    activity.options.forEach((option, optionIndex) => {
      if (!isNonEmptyString(option)) errors.push(`${activityLabel} options[${optionIndex}] must be a non-empty string.`);
    });
  }

  if (!isNonEmptyString(activity.answer)) {
    errors.push(`${activityLabel} must have a non-empty string answer.`);
  } else if (!Array.isArray(activity.options) || !activity.options.includes(activity.answer)) {
    errors.push(`${activityLabel} answer "${activity.answer}" must exist in options.`);
  }
}

function validateExplanation(errors, activityLabel, activity) {
  const explanation = activity?.explanation;
  supportLanguages.forEach((language) => {
    if (!isNonEmptyString(explanation?.[language])) {
      errors.push(`${activityLabel} explanation must include non-empty ${language}.`);
    }
  });
}

function validateTeachingSentence(errors, activityLabel, sentence) {
  if (!isNonEmptyString(sentence?.targetText)) {
    errors.push(`${activityLabel} sentence.targetText must be a non-empty string.`);
  }

  supportLanguages.forEach((language) => {
    if (!isNonEmptyString(sentence?.support?.[language])) {
      errors.push(`${activityLabel} sentence.support must include non-empty ${language}.`);
    }
  });
}

function validateContent({ modules, lessons, scenarios, lessonSkillProfiles }) {
  const errors = [];

  if (!Array.isArray(modules)) errors.push("src/content/modules.ts must export modules as an array.");
  if (!Array.isArray(lessons)) errors.push("src/content/lessons.ts must export lessons as an array.");
  if (!Array.isArray(scenarios)) errors.push("src/content/scenarios.ts must export scenarios as an array.");
  if (errors.length > 0) return errors;

  const lessonIds = new Set();
  const moduleIds = new Set();

  lessons.forEach((lesson, index) => {
    if (!isNonEmptyString(lesson?.id)) {
      errors.push(`Lesson at index ${index} must have a non-empty id.`);
      return;
    }
    if (lessonIds.has(lesson.id)) errors.push(`Duplicate lesson id "${lesson.id}".`);
    lessonIds.add(lesson.id);
  });

  modules.forEach((learningModule, moduleIndex) => {
    const moduleLabel = isNonEmptyString(learningModule?.id) ? `module "${learningModule.id}"` : `module at index ${moduleIndex}`;
    if (!isNonEmptyString(learningModule?.id)) {
      errors.push(`Module at index ${moduleIndex} must have a non-empty id.`);
    } else {
      if (moduleIds.has(learningModule.id)) errors.push(`Duplicate module id "${learningModule.id}".`);
      moduleIds.add(learningModule.id);
    }

    if (!Array.isArray(learningModule?.lessonIds)) {
      errors.push(`${moduleLabel} must have a lessonIds array.`);
      return;
    }

    learningModule.lessonIds.forEach((lessonId, lessonIdIndex) => {
      if (!isNonEmptyString(lessonId)) {
        errors.push(`${moduleLabel} lessonIds[${lessonIdIndex}] must be a non-empty string.`);
      } else if (!lessonIds.has(lessonId)) {
        errors.push(`${moduleLabel} references missing lesson "${lessonId}".`);
      }
    });
  });

  lessons.forEach((lesson, lessonIndex) => {
    const lessonLabel = labelLesson(lesson, lessonIndex);

    if (!isNonEmptyString(lesson?.moduleId)) {
      errors.push(`${lessonLabel} must have a non-empty moduleId.`);
    } else if (!moduleIds.has(lesson.moduleId)) {
      errors.push(`${lessonLabel} references missing moduleId "${lesson.moduleId}".`);
    }

    if (!isNonEmptyString(lesson?.overview)) {
      errors.push(`${lessonLabel} must have a non-empty overview.`);
    }

    if (!Array.isArray(lesson?.skipOverview) || lesson.skipOverview.length === 0) {
      errors.push(`${lessonLabel} must have a non-empty skipOverview array.`);
    } else {
      lesson.skipOverview.forEach((item, itemIndex) => {
        if (!isNonEmptyString(item)) errors.push(`${lessonLabel} skipOverview[${itemIndex}] must be a non-empty string.`);
      });
    }

    if (!Array.isArray(lesson?.activities) || lesson.activities.length === 0) {
      errors.push(`${lessonLabel} must have a non-empty activities array.`);
      return;
    }

    lesson.activities.forEach((activity, activityIndex) => {
      const activityLabel = labelActivity(lesson, lessonIndex, activity, activityIndex);

      if (activity?.type === "sentence" || activity?.type === "speak") {
        validateTeachingSentence(errors, activityLabel, activity?.sentence);
        return;
      }

      if (activity?.type === "choice" || activity?.type === "fillBlank" || activity?.type === "fixSentence") {
        validateOptionsActivity(errors, activityLabel, activity);
        validateExplanation(errors, activityLabel, activity);
        if (activity.type === "fillBlank") {
          if (!isNonEmptyString(activity.sentenceStart)) errors.push(`${activityLabel} must have a non-empty sentenceStart.`);
          if (!isNonEmptyString(activity.sentenceEnd)) errors.push(`${activityLabel} must have a non-empty sentenceEnd.`);
        }
        if (activity.type === "fixSentence" && !isNonEmptyString(activity.incorrectSentence)) {
          errors.push(`${activityLabel} must have a non-empty incorrectSentence.`);
        }
        return;
      }

      if (activity?.type === "chooseMeaning") {
        validateTeachingSentence(errors, activityLabel, activity?.sentence);
        validateOptionsActivity(errors, activityLabel, activity);
        validateExplanation(errors, activityLabel, activity);
        return;
      }

      if (activity?.type === "arrangeWords") {
        if (!Array.isArray(activity.words) || activity.words.length === 0) {
          errors.push(`${activityLabel} must have a non-empty words array.`);
        } else {
          activity.words.forEach((word, wordIndex) => {
            if (!isNonEmptyString(word)) errors.push(`${activityLabel} words[${wordIndex}] must be a non-empty string.`);
          });
        }

        if (!Array.isArray(activity.answer) || activity.answer.length === 0) {
          errors.push(`${activityLabel} must have a non-empty answer array.`);
        } else if (!Array.isArray(activity.words) || !arraysHaveSameCounts(activity.words, activity.answer)) {
          errors.push(`${activityLabel} answer must use exactly the same words as words.`);
        }
        validateExplanation(errors, activityLabel, activity);
        return;
      }

      errors.push(`${activityLabel} has unsupported activity type "${activity?.type}".`);
    });
  });

  scenarios.forEach((scenario, scenarioIndex) => {
    const scenarioLabel = isNonEmptyString(scenario?.id) ? `scenario "${scenario.id}"` : `scenario at index ${scenarioIndex}`;

    ["id", "title", "goal", "starter"].forEach((field) => {
      if (!isNonEmptyString(scenario?.[field])) {
        errors.push(`${scenarioLabel} must have a non-empty ${field}.`);
      }
    });

    if (!Array.isArray(scenario?.suggestedReplies) || scenario.suggestedReplies.length === 0) {
      errors.push(`${scenarioLabel} must have a non-empty suggestedReplies array.`);
    } else {
      scenario.suggestedReplies.forEach((reply, replyIndex) => {
        if (!isNonEmptyString(reply)) errors.push(`${scenarioLabel} suggestedReplies[${replyIndex}] must be a non-empty string.`);
      });
    }
  });

  if (!lessonSkillProfiles || typeof lessonSkillProfiles !== "object" || Array.isArray(lessonSkillProfiles)) {
    errors.push("src/content/lessonSkillProfiles.ts must export lessonSkillProfiles as an object.");
  } else {
    lessons.forEach((lesson, lessonIndex) => {
      if (!isNonEmptyString(lesson?.id)) return;

      const lessonLabel = labelLesson(lesson, lessonIndex);
      const skillTags = lessonSkillProfiles[lesson.id];
      if (!Array.isArray(skillTags) || skillTags.length === 0) {
        errors.push(`${lessonLabel} must have at least one lesson skill profile tag.`);
        return;
      }

      skillTags.forEach((tag, tagIndex) => {
        if (!isNonEmptyString(tag)) errors.push(`${lessonLabel} skillTags[${tagIndex}] must be a non-empty string.`);
      });
    });

    Object.keys(lessonSkillProfiles).forEach((lessonId) => {
      if (!lessonIds.has(lessonId)) errors.push(`lessonSkillProfiles references missing lesson "${lessonId}".`);
    });
  }

  return errors;
}

function main() {
  const { modules } = loadTsModule("src/content/modules.ts");
  const { lessons } = loadTsModule("src/content/lessons.ts");
  const { scenarios } = loadTsModule("src/content/scenarios.ts");
  const { lessonSkillProfiles } = loadTsModule("src/content/lessonSkillProfiles.ts");
  const errors = validateContent({ modules, lessons, scenarios, lessonSkillProfiles });

  if (errors.length > 0) {
    console.error(`Content verification failed with ${errors.length} issue${errors.length === 1 ? "" : "s"}:`);
    errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
    return;
  }

  console.log(`Content verification passed: ${modules.length} modules, ${lessons.length} lessons, ${scenarios.length} scenarios.`);
}

main();
