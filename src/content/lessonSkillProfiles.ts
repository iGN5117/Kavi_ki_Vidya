import type { LessonSkillTag } from "@/src/types/content";
import { expandedLessonSkillProfiles } from "@/src/content/expandedCurriculum";

export const lessonSkillProfiles: Record<string, LessonSkillTag[]> = {
  "greetings-intro": [
    "greeting",
    "self-introduction",
    "grammar-be-verb",
    "complete-sentence",
    "confidence",
    "pronunciation-clarity",
  ],
  "polite-help": ["polite-request", "help", "negative-sentence", "complete-sentence", "pronunciation-clarity"],
  "family-routine": ["family", "daily-routine", "simple-present", "grammar-be-verb"],
  "home-needs": ["home-request", "polite-request", "help", "complete-sentence"],
  "guest-at-home": ["guest-hosting", "offering", "polite-request", "future-plan"],
  "child-school-day": ["school-family", "question-formation", "polite-request", "grammar-be-verb"],
  "shopping-price": ["shopping", "quantity", "question-formation", "directions"],
  "take-local-transport": ["directions", "prepositions", "polite-request", "question-formation"],
  "clinic-medicine": ["clinic-health", "advice-question", "question-formation", "family"],
  "society-office-help": ["problem-reporting", "service-request", "polite-request"],
  "bank-atm-help": ["bank-help", "problem-reporting", "help", "question-formation"],
  "repair-service-call": ["service-request", "problem-reporting", "future-plan", "question-formation"],
  "phone-call-basics": ["phone-call", "message", "polite-request", "self-introduction"],
  "neighbor-small-talk": ["small-talk", "greeting", "invitation", "article-a", "grammar-be-verb", "polite-request"],
  "appointment-timing": ["appointment", "availability", "future-plan", "question-formation", "time-prepositions"],
  "explain-small-problem": ["problem-reporting", "problem-solving", "modal-should", "question-formation"],
  "plan-family-event": ["planning", "time-prepositions", "future-plan", "article-a", "invitation"],
  "explain-delay-change": ["reason-connector", "change-request", "polite-request", "future-plan", "problem-reporting"],
  "community-issue-follow-up": ["ongoing-problem", "present-perfect", "formal-follow-up", "service-request"],
  "school-meeting-feedback": ["school-family", "formal-follow-up", "contrast-connector", "modal-should", "question-formation"],
  "polite-disagreement-preference": ["polite-disagreement", "preference", "reason-connector", "change-request", "article-a"],
  "handle-misunderstanding-follow-up": ["clarification", "follow-up-question", "modal-should", "polite-request"],
  "summarize-service-problem": ["summary", "already", "present-perfect", "service-request", "problem-reporting"],
  "community-decision-discussion": ["decision-discussion", "summary", "purpose-connector", "formal-follow-up", "polite-disagreement"],
  ...expandedLessonSkillProfiles,
};

export function getLessonSkillTags(lessonId: string): LessonSkillTag[] {
  return lessonSkillProfiles[lessonId] ?? [];
}

export function formatLessonSkillTag(tag: LessonSkillTag) {
  return tag
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
