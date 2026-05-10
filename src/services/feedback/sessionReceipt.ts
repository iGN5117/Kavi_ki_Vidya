import { lessons } from "@/src/content/lessons";
import { getLearnerPracticePlan } from "@/src/services/adaptive/practicePlan";
import type { ConversationTurn, PracticeSessionReceipt, SpeakingFeedback } from "@/src/types/speaking";

function cleanSentence(value: string | undefined) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function withPunctuation(value: string | undefined) {
  const cleaned = cleanSentence(value);
  if (!cleaned || /[.?!]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function normalizeText(value: string | undefined) {
  return cleanSentence(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(value: string | undefined) {
  const normalized = normalizeText(value);
  return normalized ? normalized.split(" ").length : 0;
}

function isSmallGreeting(value: string | undefined) {
  return ["hello", "hi", "namaste", "good morning", "good afternoon", "good evening"].includes(normalizeText(value));
}

function getUserTurns(turns: ConversationTurn[]) {
  return turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => ({
      text: withPunctuation(turn.text),
      score:
        typeof turn.pronunciation?.score === "number"
          ? Math.max(0, Math.min(100, turn.pronunciation.score <= 1 ? turn.pronunciation.score * 100 : turn.pronunciation.score))
          : undefined,
    }))
    .filter((turn) => turn.text);
}

function getBestSentence(turns: ConversationTurn[]) {
  const userTurns = getUserTurns(turns);
  const nonTinyTurns = userTurns.filter((turn) => !isSmallGreeting(turn.text));
  const candidates = nonTinyTurns.length ? nonTinyTurns : userTurns;

  return candidates
    .sort((left, right) => {
      const scoreDelta = (right.score ?? -1) - (left.score ?? -1);
      if (scoreDelta) return scoreDelta;
      return getWordCount(right.text) - getWordCount(left.text);
    })[0]?.text;
}

function getGrammarFix(feedback: SpeakingFeedback) {
  return feedback.grammar.improvedSentences.find((item) => {
    if (!item.improved) return false;
    if (!item.original) return true;
    return normalizeText(item.original) !== normalizeText(item.improved);
  });
}

function getQuotedSentence(value: string | undefined) {
  const match = cleanSentence(value).match(/"([^"]{3,180})"/);
  return match?.[1] ? withPunctuation(match[1]) : undefined;
}

function getRetrySentence(feedback: SpeakingFeedback, bestSentence: string | undefined, grammarFix: ReturnType<typeof getGrammarFix>) {
  if (grammarFix?.improved) return withPunctuation(grammarFix.improved);

  const quotedNextStep = getQuotedSentence(feedback.confidence.nextStep);
  if (quotedNextStep) return quotedNextStep;

  const retryPhrase = feedback.pronunciation.retryWords.find((word) => getWordCount(word) > 1);
  if (retryPhrase) return withPunctuation(retryPhrase);

  if (bestSentence && !isSmallGreeting(bestSentence)) return bestSentence;

  return "Today I feel good.";
}

function getNextStepLesson(feedback: SpeakingFeedback) {
  const focus = getLearnerPracticePlan({
    feedbackHistory: [feedback],
    mistakes: feedback.mistakes,
    reviewQueue: [],
    lessonAttempts: [],
    drillResults: [],
  }).find((item) => item.recommendedLessonId);
  const fallbackLessonId = typeof feedback.pronunciation.score === "number" && feedback.pronunciation.score < 85 ? "greetings-intro" : "neighbor-small-talk";
  const lessonId = focus?.recommendedLessonId ?? fallbackLessonId;
  const lesson = lessons.find((item) => item.id === lessonId);

  if (!lesson) return undefined;

  return {
    lessonId: lesson.id,
    title: lesson.title,
    reason: focus?.detail || "This lesson keeps the next practice short and connected to your speaking session.",
  };
}

export function buildPracticeSessionReceipt(
  feedback: SpeakingFeedback,
  turns: ConversationTurn[],
  completedAt = new Date().toISOString(),
): PracticeSessionReceipt {
  const userTurns = getUserTurns(turns);
  const bestSentence = getBestSentence(turns);
  const grammarFix = getGrammarFix(feedback);
  const pronunciationScore =
    typeof feedback.pronunciation.score === "number"
      ? Math.max(0, Math.min(100, feedback.pronunciation.score <= 1 ? feedback.pronunciation.score * 100 : feedback.pronunciation.score))
      : undefined;

  return {
    completedAt,
    turnCount: userTurns.length,
    ...(bestSentence ? { bestSentence } : {}),
    ...(grammarFix
      ? {
          grammarFix: {
            ...(grammarFix.original ? { original: grammarFix.original } : {}),
            improved: withPunctuation(grammarFix.improved),
          },
        }
      : {}),
    ...(pronunciationScore === undefined ? {} : { pronunciationScore }),
    retrySentence: getRetrySentence(feedback, bestSentence, grammarFix),
    nextStepLesson: getNextStepLesson(feedback),
  };
}

export function attachPracticeSessionReceipt(feedback: SpeakingFeedback, turns: ConversationTurn[]): SpeakingFeedback {
  return {
    ...feedback,
    sessionReceipt: buildPracticeSessionReceipt(feedback, turns),
  };
}
