const pronunciationScorePolicy = {
  clearThreshold: 85,
  practiceThreshold: 65,
};

function normalizePronunciationScore(score) {
  if (typeof score !== "number" || !Number.isFinite(score)) return undefined;
  return Math.max(0, Math.min(100, score));
}

function isPronunciationClear(score) {
  const normalized = normalizePronunciationScore(score);
  return typeof normalized === "number" && normalized >= pronunciationScorePolicy.clearThreshold;
}

function getPronunciationBand(score) {
  const normalized = normalizePronunciationScore(score);
  if (typeof normalized !== "number") return "unscored";
  if (normalized >= pronunciationScorePolicy.clearThreshold) return "clear";
  if (normalized >= pronunciationScorePolicy.practiceThreshold) return "practice-again";
  return "try-again";
}

module.exports = {
  pronunciationScorePolicy,
  normalizePronunciationScore,
  isPronunciationClear,
  getPronunciationBand,
};
