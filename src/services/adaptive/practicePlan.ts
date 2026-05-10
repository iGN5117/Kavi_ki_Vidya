import type { LessonAttempt, ReviewQueueItem, DrillResult } from "@/src/services/sync/progressSync";
import type { LessonSkillTag } from "@/src/types/content";
import type { SpeakingFeedback } from "@/src/types/speaking";

export type PracticeActionHref =
  | "/learn"
  | "/speak"
  | `/learn/lesson/${string}`
  | `/speak/conversation?${string}`;

export type PracticeFocusKind = "grammar" | "pronunciation" | "lesson" | "confidence";

export type PracticeFocus = {
  id: string;
  kind: PracticeFocusKind;
  title: string;
  detail: string;
  prompt: string;
  source: "lesson" | "speaking";
  priority: number;
  actionLabel: string;
  actionHref: PracticeActionHref;
  recommendedLessonId?: string;
  skillTags?: LessonSkillTag[];
};

export type PracticePlanInput = {
  feedbackHistory: SpeakingFeedback[];
  mistakes: string[];
  reviewQueue: ReviewQueueItem[];
  lessonAttempts: LessonAttempt[];
  drillResults: DrillResult[];
};

export type LessonRecommendationInput = PracticePlanInput & {
  completedLessons: string[];
  skippedLessons: string[];
  skippedModules: string[];
  lessonModuleById: Map<string, string>;
  lessonSkillTagsById?: Map<string, LessonSkillTag[]>;
};

export type AdaptiveLessonRecommendation = {
  lessonId: string;
  focus: PracticeFocus;
  matchedSkillTags: LessonSkillTag[];
  reason: string;
};

function normalizeText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compactText(value: string | undefined, fallback: string, maxLength = 160) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  return (cleaned || fallback).slice(0, maxLength);
}

function makePracticeHref(focus: Pick<PracticeFocus, "id" | "source" | "prompt" | "detail">): `/speak/conversation?${string}` {
  const query = new URLSearchParams({
    mode: "free",
    practiceItemId: focus.id,
    practiceSource: focus.source,
    practicePrompt: focus.prompt,
    practiceDetail: focus.detail,
  });

  return `/speak/conversation?${query.toString()}`;
}

function uniqueSkillTags(tags: (LessonSkillTag | undefined)[]) {
  return Array.from(new Set(tags.filter((tag): tag is LessonSkillTag => Boolean(tag))));
}

function getTextSkillTags(original: string | undefined, improved: string | undefined): LessonSkillTag[] {
  const originalText = normalizeText(original);
  const improvedText = normalizeText(improved);
  const combinedText = normalizeText(`${original || ""} ${improved || ""}`);
  const tags: LessonSkillTag[] = [];

  if (
    /\b(i am|you are|he is|she is|it is|we are|they are|this is|there is)\b/.test(improvedText) &&
    !/\b(am|are|is)\b/.test(originalText)
  ) {
    tags.push("grammar-be-verb");
  }

  if (/\ba\s+\w+/.test(improvedText) && !/\ba\s+\w+/.test(originalText)) tags.push("article-a");
  if (/\b(to|in|on|at|for|with|between)\b/.test(improvedText)) tags.push("prepositions");
  if (/\b(how|what|when|where|which|can|could|should|may)\b/.test(improvedText)) tags.push("question-formation");
  if (/\b(please|can you|could you|may i)\b/.test(combinedText)) tags.push("polite-request");
  if (/\b(hello|good morning|good|fine|how are you)\b/.test(combinedText)) tags.push("greeting", "small-talk");
  if (/\b(name|this is)\b/.test(combinedText)) tags.push("self-introduction");
  if (/\b(help|understand)\b/.test(combinedText)) tags.push("help");
  if (/\bnot working|problem|no water|fever|repair|technician|complaint|lift|fridge|atm\b/.test(combinedText)) {
    tags.push("problem-reporting");
  }
  if (/\bbecause\b/.test(improvedText)) tags.push("reason-connector");
  if (/\bbut\b/.test(improvedText)) tags.push("contrast-connector");
  if (/\bshould\b/.test(improvedText)) tags.push("modal-should");
  if (/\balready\b/.test(improvedText)) tags.push("already");
  if (/\bsince\b|\bhas been\b|\bhave been\b/.test(improvedText)) tags.push("present-perfect", "ongoing-problem");
  if (/\bprefer\b/.test(improvedText)) tags.push("preference");
  if (/\binstead\b/.test(improvedText)) tags.push("change-request");
  if (/\bcall\b|\bspeaking\b|\bmessage\b/.test(combinedText)) tags.push("phone-call");
  if (/\bmarket|where is|near|stop here\b/.test(combinedText)) tags.push("directions");
  if (/\bprice|how much|packet\b/.test(combinedText)) tags.push("shopping", "quantity");

  return uniqueSkillTags(tags);
}

function getGrammarPattern(original: string | undefined, improved: string | undefined) {
  const originalText = normalizeText(original);
  const improvedText = normalizeText(improved);
  const inferredTags = getTextSkillTags(original, improved);

  const addedBeVerb =
    /\b(i am|you are|he is|she is|it is|we are|they are)\b/.test(improvedText) &&
    !/\b(am|are|is)\b/.test(originalText);
  if (addedBeVerb) {
    return {
      id: "grammar-be-verb",
      title: "Use am, is, and are",
      detail: "Your review shows missing helping verbs. Practice the complete sentence once.",
      lessonId: "greetings-intro",
      skillTags: uniqueSkillTags(["grammar-be-verb", ...inferredTags]),
    };
  }

  const addedArticle = /\ba\s+\w+\s+day\b/.test(improvedText) && !/\ba\s+\w+\s+day\b/.test(originalText);
  if (addedArticle) {
    return {
      id: "grammar-article-a",
      title: "Add a before one thing",
      detail: "Your review shows an article mistake. Practice the corrected sentence slowly.",
      lessonId: "neighbor-small-talk",
      skillTags: uniqueSkillTags(["article-a", ...inferredTags]),
    };
  }

  if (improvedText.includes("to the market") || improvedText.includes("to the teacher")) {
    return {
      id: "grammar-small-words",
      title: "Keep small words in the sentence",
      detail: "Your review shows missing small words like to or the.",
      lessonId: "take-local-transport",
      skillTags: uniqueSkillTags(["prepositions", ...inferredTags]),
    };
  }

  return {
    id: "grammar-clear-sentence",
    title: "Make the sentence complete",
    detail: "Practice the improved sentence from your review.",
    lessonId: "polite-help",
    skillTags: uniqueSkillTags(["complete-sentence", ...inferredTags]),
  };
}

function addFocus(focuses: PracticeFocus[], focus: Omit<PracticeFocus, "actionHref">) {
  if (!focus.prompt.trim()) return;
  const existingIndex = focuses.findIndex((item) => item.id === focus.id);
  const nextFocus: PracticeFocus = {
    ...focus,
    actionHref: makePracticeHref(focus),
  };

  if (existingIndex >= 0) {
    if (nextFocus.priority > focuses[existingIndex].priority) {
      focuses[existingIndex] = nextFocus;
    }
    return;
  }

  focuses.push(nextFocus);
}

function addReviewQueueFocus(focuses: PracticeFocus[], item: ReviewQueueItem, index: number) {
  const priorityByLevel = item.priority === "high" ? 98 : item.priority === "normal" ? 82 : 64;
  addFocus(focuses, {
    id: `review-${item.id || index}`,
    kind: item.source === "lesson" ? "lesson" : "pronunciation",
    title: item.title || (item.source === "lesson" ? "Review lesson sentence" : "Practice speaking correction"),
    detail: compactText(item.detail, "Practice this once slowly, then naturally."),
    prompt: compactText(item.prompt, "", 180),
    source: item.source,
    priority: priorityByLevel - Math.min(index * 2, 12),
    actionLabel: "Practice now",
    skillTags: getTextSkillTags(item.prompt, item.prompt),
  });
}

function addGrammarFocus(focuses: PracticeFocus[], feedback: SpeakingFeedback, feedbackIndex: number) {
  feedback.grammar.improvedSentences.slice(0, 2).forEach((item, index) => {
    const improved = compactText(item.improved, "");
    if (!improved) return;

    const pattern = getGrammarPattern(item.original, item.improved);
    addFocus(focuses, {
      id: `${pattern.id}-${normalizeText(improved).slice(0, 40)}`,
      kind: "grammar",
      title: pattern.title,
      detail: pattern.detail,
      prompt: improved,
      source: "speaking",
      priority: 94 - feedbackIndex * 8 - index,
      actionLabel: "Practice correction",
      recommendedLessonId: pattern.lessonId,
      skillTags: pattern.skillTags,
    });
  });
}

function addPronunciationFocus(focuses: PracticeFocus[], feedback: SpeakingFeedback, feedbackIndex: number) {
  const score = feedback.pronunciation.score;
  const retryWords = feedback.pronunciation.retryWords.filter(Boolean);
  const tips = feedback.pronunciation.tips ?? [];

  if (retryWords.length) {
    const prompt = retryWords.slice(0, 4).join(", ");
    addFocus(focuses, {
      id: `pronunciation-retry-${normalizeText(prompt).slice(0, 50)}`,
      kind: "pronunciation",
      title: "Clear these words",
      detail: tips[0] || "Say each word slowly once, then use it in a full sentence.",
      prompt,
      source: "speaking",
      priority: 90 - feedbackIndex * 8,
      actionLabel: "Practice pronunciation",
      recommendedLessonId: "polite-help",
      skillTags: uniqueSkillTags(["pronunciation-clarity", ...getTextSkillTags(prompt, prompt)]),
    });
  }

  if (typeof score === "number" && score < 85) {
    addFocus(focuses, {
      id: "pronunciation-clarity",
      kind: "pronunciation",
      title: "Improve pronunciation clarity",
      detail: tips[0] || feedback.pronunciation.summary || "Repeat one short sentence slowly.",
      prompt: retryWords[0] || "I can say this clearly.",
      source: "speaking",
      priority: 86 - feedbackIndex * 8,
      actionLabel: "Practice clarity",
      recommendedLessonId: "greetings-intro",
      skillTags: ["pronunciation-clarity", "confidence"],
    });
  }
}

function addMistakeFocus(focuses: PracticeFocus[], mistake: string, index: number) {
  const quoted = mistake.match(/"([^"]{3,180})"/)?.[1];
  const prompt = compactText(quoted || mistake, "");
  const pattern = getGrammarPattern(mistake, prompt);
  addFocus(focuses, {
    id: `mistake-${normalizeText(prompt).slice(0, 50)}`,
    kind: "grammar",
    title: pattern.title,
    detail: "This pattern appeared in your saved mistakes.",
    prompt,
    source: "speaking",
    priority: 72 - index * 3,
    actionLabel: "Practice mistake",
    recommendedLessonId: pattern.lessonId,
    skillTags: pattern.skillTags,
  });
}

function addLessonAttemptFocus(focuses: PracticeFocus[], attempt: LessonAttempt, index: number) {
  if (attempt.score >= 80 && attempt.retryCount === 0) return;

  const prompt = attempt.reviewPrompts[0] || "Review one missed lesson sentence.";
  addFocus(focuses, {
    id: `lesson-${attempt.lessonId}`,
    kind: "lesson",
    title: "Review missed lesson answer",
    detail: `${attempt.score}% on the last attempt. Revisit the lesson sentence that needed another try.`,
    prompt,
    source: "lesson",
    priority: 76 - index * 4,
    actionLabel: "Practice lesson line",
    recommendedLessonId: attempt.lessonId,
    skillTags: getTextSkillTags(prompt, prompt),
  });
}

function addDrillFocus(focuses: PracticeFocus[], result: DrillResult, index: number) {
  if (result.outcome !== "needs-retry" && (result.score ?? 100) >= 82) return;

  addFocus(focuses, {
    id: `drill-${result.id}`,
    kind: result.source === "lesson" ? "lesson" : "pronunciation",
    title: result.outcome === "needs-retry" ? "Retry recent drill" : "Strengthen recent drill",
    detail: result.tips[0] || result.summary || "Practice this once more slowly.",
    prompt: result.target,
    source: result.source,
    priority: 84 - index * 4,
    actionLabel: "Retry drill",
    recommendedLessonId: result.source === "lesson" ? result.itemId : undefined,
    skillTags: getTextSkillTags(result.target, result.target),
  });
}

export function getLearnerPracticePlan(input: PracticePlanInput): PracticeFocus[] {
  const focuses: PracticeFocus[] = [];
  const dueReviewItems = input.reviewQueue
    .filter((item) => !item.completedAt)
    .filter((item) => !item.dueAt || Date.parse(item.dueAt) <= Date.now())
    .slice(0, 6);

  dueReviewItems.forEach((item, index) => addReviewQueueFocus(focuses, item, index));
  input.feedbackHistory.slice(0, 4).forEach((feedback, index) => {
    addGrammarFocus(focuses, feedback, index);
    addPronunciationFocus(focuses, feedback, index);
  });
  input.drillResults.slice(0, 4).forEach((result, index) => addDrillFocus(focuses, result, index));
  input.lessonAttempts.slice(0, 4).forEach((attempt, index) => addLessonAttemptFocus(focuses, attempt, index));
  input.mistakes.slice(0, 4).forEach((mistake, index) => addMistakeFocus(focuses, mistake, index));

  return focuses
    .sort((left, right) => right.priority - left.priority)
    .slice(0, 5);
}

export function getAdaptiveLessonRecommendation(input: LessonRecommendationInput): AdaptiveLessonRecommendation | undefined {
  const completed = new Set(input.completedLessons);
  const skippedLessons = new Set(input.skippedLessons);
  const skippedModules = new Set(input.skippedModules);

  return getLearnerPracticePlan(input)
    .map((focus) => {
      const match = getRecommendedLessonForFocus(focus, input, completed, skippedLessons, skippedModules);
      return match ? { ...match, focus } : undefined;
    })
    .find(Boolean);
}

function getRecommendedLessonForFocus(
  focus: PracticeFocus,
  input: LessonRecommendationInput,
  completed: Set<string>,
  skippedLessons: Set<string>,
  skippedModules: Set<string>,
) {
  if (focus.recommendedLessonId && isAvailableLesson(focus.recommendedLessonId, input, completed, skippedLessons, skippedModules)) {
    const lessonTags = input.lessonSkillTagsById?.get(focus.recommendedLessonId) ?? [];
    const matchedSkillTags = getMatchedSkillTags(focus.skillTags ?? [], lessonTags);
    return {
      lessonId: focus.recommendedLessonId,
      matchedSkillTags,
      reason: getRecommendationReason(focus, matchedSkillTags),
    };
  }

  const focusTags = focus.skillTags ?? [];
  if (!focusTags.length || !input.lessonSkillTagsById) return undefined;

  const rankedCandidates = [...input.lessonModuleById.keys()]
    .filter((lessonId) => isAvailableLesson(lessonId, input, completed, skippedLessons, skippedModules))
    .map((lessonId, index) => {
      const lessonTags = input.lessonSkillTagsById?.get(lessonId) ?? [];
      const overlap = getMatchedSkillTags(focusTags, lessonTags);
      return {
        lessonId,
        matchedSkillTags: overlap,
        score: overlap.length * 100 - index,
      };
    })
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score);

  const bestCandidate = rankedCandidates[0];
  return bestCandidate
    ? {
        lessonId: bestCandidate.lessonId,
        matchedSkillTags: bestCandidate.matchedSkillTags,
        reason: getRecommendationReason(focus, bestCandidate.matchedSkillTags),
      }
    : undefined;
}

function getMatchedSkillTags(focusTags: LessonSkillTag[], lessonTags: LessonSkillTag[]) {
  return focusTags.filter((tag, index) => lessonTags.includes(tag) && focusTags.indexOf(tag) === index);
}

function getRecommendationReason(focus: PracticeFocus, matchedSkillTags: LessonSkillTag[]) {
  if (matchedSkillTags.length) {
    return `Picked because your review shows ${focus.title.toLowerCase()} and this lesson practices the same skill.`;
  }

  if (focus.source === "lesson") return "Picked from a lesson answer that needed another try.";
  if (focus.kind === "pronunciation") return "Picked from recent pronunciation feedback.";
  return "Picked from your recent speaking review.";
}

function isAvailableLesson(
  lessonId: string,
  input: LessonRecommendationInput,
  completed: Set<string>,
  skippedLessons: Set<string>,
  skippedModules: Set<string>,
) {
  const moduleId = input.lessonModuleById.get(lessonId);
  if (!moduleId) return false;
  return !completed.has(lessonId) && !skippedLessons.has(lessonId) && !skippedModules.has(moduleId);
}
