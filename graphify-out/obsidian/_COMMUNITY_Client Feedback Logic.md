---
type: community
cohesion: 0.15
members: 30
---

# Client Feedback Logic

**Cohesion:** 0.15 - loosely connected
**Members:** 30 nodes

## Members
- [[FeedbackScreen()]] - code - app/(tabs)/speak/feedback.tsx
- [[FeedbackSummary()]] - code - src/components/FeedbackSummary.tsx
- [[applyCommonGrammarFixes()]] - code - src/services/feedback/sampleFeedback.ts
- [[buildGrammarCorrection()]] - code - src/services/feedback/sampleFeedback.ts
- [[buildLocalFeedback()]] - code - src/services/feedback/sampleFeedback.ts
- [[cleanFeedbackLists()]] - code - src/services/feedback/sampleFeedback.ts
- [[cleanSentence()]] - code - src/services/feedback/sampleFeedback.ts
- [[emptySessionFeedback]] - code - app/(tabs)/speak/feedback.tsx
- [[extractQuotedSentences()]] - code - src/services/feedback/sampleFeedback.ts
- [[feedback.tsx]] - code - app/(tabs)/speak/feedback.tsx
- [[formatOutcome()]] - code - app/(tabs)/speak/feedback.tsx
- [[getAverageScore()]] - code - src/services/feedback/sampleFeedback.ts
- [[getCoachSuggestedSentence()]] - code - src/services/feedback/sampleFeedback.ts
- [[getGrammarExplanation()]] - code - src/services/feedback/sampleFeedback.ts
- [[getImprovedSentence()]] - code - src/services/feedback/sampleFeedback.ts
- [[getPronunciationChecks()]] - code - src/services/feedback/sampleFeedback.ts
- [[getRememberItems()]] - code - src/services/feedback/sampleFeedback.ts
- [[getRetryWords()]] - code - src/services/feedback/sampleFeedback.ts
- [[getSavedPhrases()]] - code - src/services/feedback/sampleFeedback.ts
- [[getWordCount()]] - code - src/services/feedback/sampleFeedback.ts
- [[hasMeaningfulOverlap()]] - code - src/services/feedback/sampleFeedback.ts
- [[isSmallGreeting()]] - code - src/services/feedback/sampleFeedback.ts
- [[isUsefulSavedPhrase()]] - code - src/services/feedback/sampleFeedback.ts
- [[personalizeFeedbackWithTurnPronunciation()]] - code - src/services/feedback/sampleFeedback.ts
- [[sampleFeedback]] - code - src/services/feedback/sampleFeedback.ts
- [[sampleFeedback.ts]] - code - src/services/feedback/sampleFeedback.ts
- [[sentenceCase()]] - code - src/services/feedback/sampleFeedback.ts
- [[simplifyForComparison()]] - code - src/services/feedback/sampleFeedback.ts
- [[styles_19]] - code - app/(tabs)/speak/feedback.tsx
- [[withPunctuation()]] - code - src/services/feedback/sampleFeedback.ts

## Live Query (requires Dataview plugin)

```dataview
TABLE source_file, type FROM #community/Client_Feedback_Logic
SORT file.name ASC
```

## Connections to other communities
- 10 edges to [[_COMMUNITY_Speak Conversation UI]]
- 3 edges to [[_COMMUNITY_Onboarding Speak Shell]]
- 2 edges to [[_COMMUNITY_Learning Path Controls]]
- 2 edges to [[_COMMUNITY_Route Entry Points]]
- 1 edge to [[_COMMUNITY_Product Requirements]]
- 1 edge to [[_COMMUNITY_Technical Architecture Docs]]
- 1 edge to [[_COMMUNITY_Auth Progress Docs]]

## Top bridge nodes
- [[feedback.tsx]] - degree 17, connects to 5 communities
- [[FeedbackSummary()]] - degree 4, connects to 3 communities
- [[sampleFeedback.ts]] - degree 28, connects to 1 community
- [[buildLocalFeedback()]] - degree 10, connects to 1 community
- [[personalizeFeedbackWithTurnPronunciation()]] - degree 9, connects to 1 community