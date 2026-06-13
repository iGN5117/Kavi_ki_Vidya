import type { LocalizedSupport } from "@/src/types/content";

export type ConversationMode = "roleplay" | "free";

export type CoachState = "neutral" | "listening" | "speaking" | "encouraging" | "thinking";

export type PronunciationCheckResult = {
  transcript: string;
  expectedText: string;
  modelSentence?: string;
  score: number;
  scoringMode?: "audio" | "transcript";
  audioScore?: number;
  transcriptScore?: number;
  clarityScore?: number;
  soundAccuracyScore?: number;
  rhythmScore?: number;
  verdict: "clear" | "practice-again" | "try-again";
  summary: string;
  tips: string[];
  retryWords: string[];
  problemSounds?: string[];
  isDemo?: boolean;
};

export type ConversationTurn = {
  id: string;
  speaker: "user" | "coach";
  text: string;
  supportText?: string;
  support?: LocalizedSupport;
  label?: string;
  audioUrl?: string;
  pronunciation?: PronunciationCheckResult;
};

export type PracticeSessionReceipt = {
  completedAt: string;
  turnCount: number;
  bestSentence?: string;
  grammarFix?: {
    original?: string;
    improved: string;
  };
  pronunciationScore?: number;
  retrySentence: string;
  nextStepLesson?: {
    lessonId: string;
    title: string;
    reason: string;
  };
};

export type SpeakingFeedback = {
  pronunciation: {
    summary: string;
    score?: number;
    retryWords: string[];
    tips?: string[];
  };
  grammar: {
    improvedSentences: Array<{
      original?: string;
      improved: string;
      explanation: {
        "hi-Deva"?: string;
        "hi-Latn"?: string;
      };
    }>;
  };
  confidence: {
    note: string;
    nextStep: string;
    score?: number;
  };
  savedPhrases: string[];
  mistakes: string[];
  sessionReceipt?: PracticeSessionReceipt;
};
