export type SupportLanguage = "hi-Deva" | "hi-Latn";
export type ExplanationPreference = "hi-Deva" | "hi-Latn" | "both";

export type LocalizedSupport = Partial<Record<SupportLanguage, string>>;

export type LessonSkillTag =
  | "advice-question"
  | "already"
  | "appointment"
  | "article-a"
  | "availability"
  | "bank-help"
  | "change-request"
  | "clarification"
  | "clinic-health"
  | "complete-sentence"
  | "confidence"
  | "contrast-connector"
  | "daily-routine"
  | "decision-discussion"
  | "directions"
  | "family"
  | "follow-up-question"
  | "formal-follow-up"
  | "future-plan"
  | "grammar-be-verb"
  | "greeting"
  | "guest-hosting"
  | "help"
  | "home-request"
  | "invitation"
  | "message"
  | "modal-should"
  | "negative-sentence"
  | "offering"
  | "ongoing-problem"
  | "phone-call"
  | "planning"
  | "polite-disagreement"
  | "polite-request"
  | "preference"
  | "prepositions"
  | "present-perfect"
  | "problem-reporting"
  | "problem-solving"
  | "pronunciation-clarity"
  | "purpose-connector"
  | "quantity"
  | "question-formation"
  | "reason-connector"
  | "school-family"
  | "self-introduction"
  | "service-request"
  | "shopping"
  | "simple-present"
  | "small-talk"
  | "summary"
  | "time-prepositions";

export type TeachingSentence = {
  id: string;
  targetLanguage: "en-IN";
  targetText: string;
  support: LocalizedSupport;
  notes?: LocalizedSupport;
};

export type LessonActivity =
  | {
      type: "sentence";
      prompt: string;
      sentence: TeachingSentence;
    }
  | {
      type: "choice";
      prompt: string;
      options: string[];
      answer: string;
      explanation: LocalizedSupport;
    }
  | {
      type: "chooseMeaning";
      prompt: string;
      sentence: TeachingSentence;
      options: string[];
      answer: string;
      explanation: LocalizedSupport;
    }
  | {
      type: "fillBlank";
      prompt: string;
      sentenceStart: string;
      sentenceEnd: string;
      options: string[];
      answer: string;
      explanation: LocalizedSupport;
    }
  | {
      type: "arrangeWords";
      prompt: string;
      words: string[];
      answer: string[];
      explanation: LocalizedSupport;
    }
  | {
      type: "fixSentence";
      prompt: string;
      incorrectSentence: string;
      options: string[];
      answer: string;
      explanation: LocalizedSupport;
    }
  | {
      type: "speak";
      prompt: string;
      sentence: TeachingSentence;
    };

export type Lesson = {
  id: string;
  moduleId: string;
  title: string;
  durationMinutes: number;
  overview: string;
  skipOverview: string[];
  activities: LessonActivity[];
};

export type LearningModule = {
  id: string;
  title: string;
  level: string;
  stage: number;
  skillFocus: string;
  challenge: string;
  overview: string;
  lessonIds: string[];
};

export type Scenario = {
  id: string;
  title: string;
  icon: string;
  goal: string;
  difficulty: "Easy" | "Guided" | "Natural";
  starter: string;
  suggestedReplies: string[];
};
