import { lessonSkillProfiles as bundledLessonSkillProfiles } from "@/src/content/lessonSkillProfiles";
import { lessons as bundledLessons } from "@/src/content/lessons";
import { modules as bundledModules } from "@/src/content/modules";
import { getConfiguredApiBaseUrl, getErrorMessage } from "@/src/services/sync/progressSync";
import type { CurriculumContent } from "@/src/types/content";

export type CurriculumSource = "backend" | "bundled";

export type CurriculumLoadResult = {
  curriculum: CurriculumContent;
  source: CurriculumSource;
  errorMessage?: string;
};

const bundledCurriculum: CurriculumContent = {
  version: "bundled",
  modules: bundledModules,
  lessons: bundledLessons,
  lessonSkillProfiles: bundledLessonSkillProfiles,
};

let cachedResult: CurriculumLoadResult | null = null;
let pendingLoad: Promise<CurriculumLoadResult> | null = null;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function getCurriculumEndpoint() {
  const baseUrl = getConfiguredApiBaseUrl();
  if (!baseUrl) return undefined;

  return `${baseUrl}/curriculum`;
}

function validateCurriculumContent(value: unknown): CurriculumContent {
  if (!isPlainObject(value)) {
    throw new Error("Curriculum payload must be a JSON object.");
  }

  const modules = value.modules;
  const lessons = value.lessons;
  const lessonSkillProfiles = value.lessonSkillProfiles;
  if (!Array.isArray(modules) || modules.length === 0) {
    throw new Error("Curriculum payload must include modules.");
  }
  if (!Array.isArray(lessons) || lessons.length === 0) {
    throw new Error("Curriculum payload must include lessons.");
  }
  if (!isPlainObject(lessonSkillProfiles)) {
    throw new Error("Curriculum payload must include lessonSkillProfiles.");
  }

  const moduleIds = new Set<string>();
  const lessonIds = new Set<string>();
  modules.forEach((learningModule) => {
    if (!isPlainObject(learningModule) || typeof learningModule.id !== "string") {
      throw new Error("Every module must include an id.");
    }
    moduleIds.add(learningModule.id);
  });
  lessons.forEach((lesson) => {
    if (!isPlainObject(lesson) || typeof lesson.id !== "string" || typeof lesson.moduleId !== "string") {
      throw new Error("Every lesson must include an id and moduleId.");
    }
    lessonIds.add(lesson.id);
  });

  modules.forEach((learningModule) => {
    const lessonList = isPlainObject(learningModule) ? learningModule.lessonIds : undefined;
    if (!Array.isArray(lessonList)) {
      throw new Error("Every module must include lessonIds.");
    }
    lessonList.forEach((lessonId) => {
      if (typeof lessonId !== "string" || !lessonIds.has(lessonId)) {
        throw new Error(`Module references missing lesson "${String(lessonId)}".`);
      }
    });
  });

  lessons.forEach((lesson) => {
    if (!isPlainObject(lesson) || typeof lesson.id !== "string" || typeof lesson.moduleId !== "string") return;
    if (!moduleIds.has(lesson.moduleId)) {
      throw new Error(`Lesson "${lesson.id}" references missing module "${lesson.moduleId}".`);
    }
    if (!Array.isArray(lessonSkillProfiles[lesson.id])) {
      throw new Error(`Lesson "${lesson.id}" is missing skill tags.`);
    }
  });

  return value as CurriculumContent;
}

export function hasCurriculumEndpoint() {
  return Boolean(getCurriculumEndpoint());
}

export function getBundledCurriculum(): CurriculumContent {
  return bundledCurriculum;
}

export async function fetchBackendCurriculum(): Promise<CurriculumContent> {
  const endpoint = getCurriculumEndpoint();
  if (!endpoint) {
    throw new Error("Curriculum sync is not configured until EXPO_PUBLIC_API_BASE_URL is set.");
  }

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Curriculum fetch failed: ${response.status}`));
  }

  return validateCurriculumContent(await response.json());
}

export async function loadCurriculumContent(forceRefresh = false): Promise<CurriculumLoadResult> {
  if (!forceRefresh && cachedResult) return cachedResult;
  if (!forceRefresh && pendingLoad) return pendingLoad;

  pendingLoad = (async () => {
    if (!hasCurriculumEndpoint()) {
      cachedResult = { curriculum: bundledCurriculum, source: "bundled" };
      return cachedResult;
    }

    try {
      const curriculum = await fetchBackendCurriculum();
      cachedResult = { curriculum, source: "backend" };
      return cachedResult;
    } catch (error) {
      return {
        curriculum: bundledCurriculum,
        source: "bundled",
        errorMessage: error instanceof Error ? error.message : "Curriculum fetch failed.",
      };
    } finally {
      pendingLoad = null;
    }
  })();

  return pendingLoad;
}
