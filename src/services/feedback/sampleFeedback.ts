import type { SpeakingFeedback } from "@/src/types/speaking";
import type { ConversationTurn } from "@/src/types/speaking";

export const sampleFeedback: SpeakingFeedback = {
  pronunciation: {
    summary: "Complete a speaking session to get feedback from your own conversation.",
    retryWords: [],
    tips: ["Say one short sentence, then end the session to review it."],
  },
  grammar: {
    improvedSentences: [
      {
        original: "No spoken answer was captured.",
        improved: "I can say one short English sentence.",
        explanation: {
          "hi-Deva": "एक छोटा वाक्य बोलिए, फिर review में वही sentence दिखेगा।",
          "hi-Latn": "Ek chhota sentence boliye, phir review mein wahi sentence dikhega.",
        },
      },
    ],
  },
  confidence: {
    note: "Your next session will create a personal review from the words you speak.",
    nextStep: "Start a short conversation and say one full sentence.",
  },
  savedPhrases: [],
  mistakes: [],
};

function cleanSentence(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function sentenceCase(value: string) {
  const cleaned = cleanSentence(value);
  if (!cleaned) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function withPunctuation(value: string) {
  const cleaned = sentenceCase(value);
  if (!cleaned || /[.?!]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function simplifyForComparison(value: string) {
  return cleanSentence(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getWordCount(value: string) {
  const normalized = simplifyForComparison(value);
  return normalized ? normalized.split(" ").length : 0;
}

function isSmallGreeting(value: string) {
  const normalized = simplifyForComparison(value);
  return ["hello", "hi", "namaste", "good morning", "good afternoon", "good evening"].includes(normalized);
}

function isUsefulSavedPhrase(value: string) {
  return getWordCount(value) >= 3 && !isSmallGreeting(value);
}

function hasMeaningfulOverlap(original: string, candidate: string) {
  const originalWords = simplifyForComparison(original).split(" ").filter((word) => word.length > 1);
  const candidateWords = new Set(simplifyForComparison(candidate).split(" ").filter((word) => word.length > 1));
  if (originalWords.length < 3 || !candidateWords.size) return false;

  const overlap = originalWords.filter((word) => candidateWords.has(word)).length;
  return overlap >= Math.max(2, Math.ceil(originalWords.length * 0.5));
}

function extractQuotedSentences(value: string) {
  const suggestions: string[] = [];
  const patterns = [/"([^"]{3,180})"/g, /“([^”]{3,180})”/g];

  patterns.forEach((pattern) => {
    for (const match of value.matchAll(pattern)) {
      const sentence = cleanSentence(match[1] ?? "");
      if (sentence) suggestions.push(sentence);
    }
  });

  return suggestions;
}

function getCoachSuggestedSentence(turns: ConversationTurn[], original: string) {
  if (isSmallGreeting(original)) return undefined;

  const lastUserIndex = turns.map((turn) => turn.speaker).lastIndexOf("user");
  if (lastUserIndex < 0) return undefined;

  const coachTurns = turns.slice(lastUserIndex + 1).filter((turn) => turn.speaker === "coach");
  for (const turn of coachTurns) {
    const candidates = extractQuotedSentences(turn.text);
    const matched = candidates.find((candidate) => hasMeaningfulOverlap(original, candidate));
    if (matched) return withPunctuation(matched);
  }

  return undefined;
}

function applyCommonGrammarFixes(value: string) {
  return value
    .replace(/\bi ((?:very|so|too) )?(good|fine|happy|ready|busy|tired|hungry|okay|ok|well|sorry)\b/gi, "I am $1$2")
    .replace(/\byou ((?:very|so|too) )?(good|fine|happy|ready|busy|tired|hungry|okay|ok|well|sorry)\b/gi, "you are $1$2")
    .replace(/\b(he|she|it) ((?:very|so|too) )?(good|fine|happy|ready|busy|tired|hungry|okay|ok|well|sorry)\b/gi, "$1 is $2$3")
    .replace(/\b(we|they) ((?:very|so|too) )?(good|fine|happy|ready|busy|tired|hungry|okay|ok|well|sorry)\b/gi, "$1 are $2$3")
    .replace(/\b(it|this|that) is (nice|beautiful|good|bad|busy|rainy|sunny|lovely|great) day\b/gi, "$1 is a $2 day")
    .replace(/\b(it|this|that) was (nice|beautiful|good|bad|busy|rainy|sunny|lovely|great) day\b/gi, "$1 was a $2 day")
    .replace(/\btoday is (nice|beautiful|good|bad|busy|rainy|sunny|lovely|great) day\b/gi, "today is a $1 day")
    .replace(/\bi am going market\b/gi, "I am going to the market")
    .replace(/\bi went market\b/gi, "I went to the market")
    .replace(/\bi go market\b/gi, "I go to the market")
    .replace(/\bi want talk\b/gi, "I want to talk")
    .replace(/\btalk teacher\b/gi, "talk to the teacher")
    .replace(/\bname my\b/gi, "my name is")
    .replace(/\bi am fine thank you\b/gi, "I am fine, thank you");
}

function getImprovedSentence(original: string, turns: ConversationTurn[] = []) {
  const cleaned = cleanSentence(original);
  if (!cleaned) return "I can say one short English sentence.";

  const coachSuggestion = getCoachSuggestedSentence(turns, cleaned);
  if (coachSuggestion) return coachSuggestion;

  return withPunctuation(applyCommonGrammarFixes(cleaned));
}

function getGrammarExplanation(original: string, improved: string, hasLearnerSpeech: boolean) {
  const originalSimple = simplifyForComparison(original);
  const improvedSimple = simplifyForComparison(improved);
  const addedArticle = /\ba\s+\w+\s+day\b/.test(improvedSimple) && !/\ba\s+\w+\s+day\b/.test(originalSimple);
  const addedBeVerb =
    /\b(i am|you are|he is|she is|it is|we are|they are)\b/.test(improvedSimple) &&
    !/\b(am|are|is)\b/.test(originalSimple);

  if (addedArticle) {
    return {
      "hi-Deva": "English में singular countable noun से पहले 'a' लगता है: a nice day.",
      "hi-Latn": "English mein singular countable noun se pehle 'a' lagta hai: a nice day.",
    };
  }

  if (addedBeVerb) {
    return {
      "hi-Deva": "English में अपने बारे में adjective बोलते समय 'am' लगता है: I am good.",
      "hi-Latn": "English mein apne baare mein adjective bolte waqt 'am' lagta hai: I am good.",
    };
  }

  return {
    "hi-Deva": hasLearnerSpeech
      ? "आपके बोले हुए sentence को थोड़ा साफ करके practice के लिए रखा गया है।"
      : "एक छोटा sentence बोलिए ताकि review personal हो सके।",
    "hi-Latn": hasLearnerSpeech
      ? "Aapke bole hue sentence ko thoda saaf karke practice ke liye rakha gaya hai."
      : "Ek chhota sentence boliye taaki review personal ho sake.",
  };
}

function buildGrammarCorrection(original: string, improved: string, hasLearnerSpeech: boolean) {
  return {
    original: hasLearnerSpeech ? original : "No spoken answer was captured.",
    improved,
    explanation: getGrammarExplanation(original, improved, hasLearnerSpeech),
  };
}

function getRetryWords(sentence: string) {
  if (!isUsefulSavedPhrase(sentence)) return [];

  const skipWords = new Set(["a", "an", "and", "are", "for", "i", "in", "is", "it", "of", "on", "the", "to", "you"]);
  const words = sentence
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !skipWords.has(word));

  return Array.from(new Set(words)).slice(-3);
}

function getSavedPhrases(userTexts: string[], improved: string) {
  return Array.from(new Set([improved, ...userTexts.slice(-2).map((text) => getImprovedSentence(text))].filter(isUsefulSavedPhrase))).slice(0, 3);
}

function getRememberItems(original: string, improved: string) {
  if (!cleanSentence(original)) {
    return [];
  }

  if (simplifyForComparison(original) !== simplifyForComparison(improved)) {
    return [`Try "${improved}" instead of "${cleanSentence(original)}".`];
  }

  return [];
}

function getPronunciationChecks(turns: ConversationTurn[]) {
  return turns
    .filter((turn) => turn.speaker === "user" && turn.pronunciation && Number.isFinite(turn.pronunciation.score))
    .map((turn) => turn.pronunciation!)
    .map((pronunciation) => ({
      ...pronunciation,
      score: Math.max(0, Math.min(100, pronunciation.score <= 1 ? pronunciation.score * 100 : pronunciation.score)),
    }));
}

function getAverageScore(scores: number[]) {
  if (!scores.length) return undefined;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function cleanFeedbackLists(feedback: SpeakingFeedback, lastUserText: string, improved: string, score?: number) {
  const hasClearPronunciation = typeof score === "number" && score >= 85;
  const retryWords = hasClearPronunciation
    ? []
    : feedback.pronunciation.retryWords.filter((word) => isUsefulSavedPhrase(word) || getWordCount(word) === 1);
  const savedPhrases = feedback.savedPhrases.filter(isUsefulSavedPhrase);
  const mistakes = feedback.mistakes.filter((mistake) => {
    if (!mistake.trim()) return false;
    if (isSmallGreeting(lastUserText) && simplifyForComparison(lastUserText) === simplifyForComparison(improved)) return false;
    return simplifyForComparison(mistake) !== simplifyForComparison(`Practice this sentence again ${improved}`);
  });

  return { retryWords, savedPhrases, mistakes };
}

export function personalizeFeedbackWithTurnPronunciation(
  feedback: SpeakingFeedback,
  turns: ConversationTurn[],
): SpeakingFeedback {
  const userTexts = turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => cleanSentence(turn.text))
    .filter(Boolean);
  const lastUserText = userTexts.at(-1) ?? "";
  const localImproved = getImprovedSentence(lastUserText, turns);
  const feedbackImproved = feedback.grammar.improvedSentences[0]?.improved;
  const hasFeedbackCorrection = feedback.grammar.improvedSentences.some(
    (item) => item.original && simplifyForComparison(item.original) !== simplifyForComparison(item.improved),
  );
  const hasLocalCorrection = simplifyForComparison(lastUserText) !== simplifyForComparison(localImproved);
  const improved = hasFeedbackCorrection ? feedbackImproved ?? localImproved : localImproved;
  const checks = getPronunciationChecks(turns);
  const latestCheck = checks.at(-1);
  const pronunciationScore = getAverageScore(checks.map((check) => check.score));
  const hasClearPronunciation = typeof pronunciationScore === "number" && pronunciationScore >= 85;
  const cleanedLists = cleanFeedbackLists(feedback, lastUserText, improved, pronunciationScore);
  const hasGrammarCorrection = hasFeedbackCorrection || hasLocalCorrection;
  const improvedSentences = hasFeedbackCorrection
    ? feedback.grammar.improvedSentences
    : hasLocalCorrection
      ? [buildGrammarCorrection(lastUserText, localImproved, true)]
      : feedback.grammar.improvedSentences;

  return {
    ...feedback,
    pronunciation: {
      ...feedback.pronunciation,
      summary: latestCheck?.summary ?? feedback.pronunciation.summary,
      ...(pronunciationScore === undefined ? {} : { score: pronunciationScore }),
      retryWords: latestCheck
        ? hasClearPronunciation
          ? []
          : latestCheck.retryWords.filter(Boolean)
        : cleanedLists.retryWords,
      tips: latestCheck?.tips?.length ? latestCheck.tips : feedback.pronunciation.tips,
    },
    grammar: {
      improvedSentences: hasGrammarCorrection || !isSmallGreeting(lastUserText) ? improvedSentences : [],
    },
    confidence: {
      ...feedback.confidence,
      score: isSmallGreeting(lastUserText) ? undefined : feedback.confidence.score,
    },
    savedPhrases: cleanedLists.savedPhrases,
    mistakes: cleanedLists.mistakes,
  };
}

export function buildLocalFeedback(turns: ConversationTurn[]): SpeakingFeedback {
  const userTexts = turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => cleanSentence(turn.text))
    .filter(Boolean);
  const lastUserText = userTexts.at(-1) ?? "";
  const improved = getImprovedSentence(lastUserText, turns);
  const retryWords = getRetryWords(improved);
  const hasLearnerSpeech = userTexts.length > 0;
  const isTinyGreeting = isSmallGreeting(lastUserText);

  return {
    pronunciation: {
      summary: hasLearnerSpeech
        ? `Feedback is based on your last spoken sentence: "${lastUserText}". Practice slowly and keep each word separate.`
        : "No spoken learner sentence was captured in this session yet.",
      score: hasLearnerSpeech ? Math.min(92, 68 + userTexts.length * 4) : undefined,
      retryWords,
      tips: hasLearnerSpeech
        ? isTinyGreeting
          ? ["Keep the same clear rhythm.", "Next, try one full sentence about your day."]
          : ["Pause briefly between words.", "Repeat your own sentence once at a slower speed."]
        : ["Say one short sentence before ending the speaking session."],
    },
    grammar: {
      improvedSentences:
        isTinyGreeting && simplifyForComparison(lastUserText) === simplifyForComparison(improved)
          ? []
          : [
              {
                original: hasLearnerSpeech ? lastUserText : "No spoken answer was captured.",
                improved,
                explanation: getGrammarExplanation(lastUserText, improved, hasLearnerSpeech),
              },
            ],
    },
    confidence: {
      note: hasLearnerSpeech
        ? `Good effort. You completed ${userTexts.length} speaking turn${userTexts.length === 1 ? "" : "s"}.`
        : "Start with one sentence and the app will create a personal review from it.",
      nextStep: hasLearnerSpeech
        ? isTinyGreeting
          ? "Next, try one full sentence about your day."
          : `Repeat this once more: "${improved}"`
        : "Say one full sentence in the speaking tab.",
      score: hasLearnerSpeech && !isTinyGreeting ? Math.min(94, 66 + userTexts.length * 6) : undefined,
    },
    savedPhrases: hasLearnerSpeech ? getSavedPhrases(userTexts, improved) : [],
    mistakes: getRememberItems(lastUserText, improved),
  };
}
