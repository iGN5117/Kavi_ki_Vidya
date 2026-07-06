<claude-mem-context>
# Memory Context

# [English_Learning_App_Codex] recent context, 2026-07-05 7:54pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (20,366t read) | 1,224,642t work | 98% savings

### May 3, 2026
29 11:41a 🔵 sanitizeCoachReply Confirmed: sanitizeSupportText Applied Only to Parsed Path, Not Fallback
30 " 🔄 sanitizeCoachReply: Reply Extracted to Variable Before sanitizeSupportText Call
31 " ✅ Server Restarted with Full supportText Sanitization Pipeline
32 " 🔵 sanitizeSupportText Allows Matched Continuations When Both reply and supportText Have Questions
33 11:42a 🔵 Grammar Fix Pipelines Exist in Both Client and Server with Parallel Rules
34 11:50a 🟣 applyCommonLocalGrammarFixes Extended with Missing "To Be" Verb Rules
35 " 🟣 Missing "To Be" Verb Fix Ported to Client and Grammar Explanation Added
36 " 🟣 addedBeVerb Grammar Explanation Ported to Client-Side getGrammarExplanation
37 " 🔵 Grammar Fix Unit Test: he/she/it Rule Not Covered in Inline Test, Potential False Positive
38 " 🟣 Missing Copula Verb Fix Confirmed End-to-End in Text Turn and Feedback Session
39 " 🟣 Voice Turn E2E Confirmed: Coach Narrates "I am good." Not "I good." on Grammar Retry
### Jun 6, 2026
186 11:57p 🟣 Android UI Automated Testing Infrastructure via Maestro
187 " 🟣 EAS Android APK Build Triggered (Preview Profile)
188 " 🔴 Session Review Screen Showed Hardcoded/Mismatched Data
189 " ⚖️ Live Talk Feature Paused Until Physical Device Available
190 " ⚖️ Supabase Selected as Production Backend; OAuth Removed
191 " 🔴 Multiple Android-Specific UI Bugs Fixed
192 " 🟣 LLM Cost Optimization: Combined Reply and Support Text into Single API Call
### Jun 16, 2026
338 9:09a 🟣 50+ Expanded Lessons Added via expandedCurriculum.ts
339 " 🟣 Differentiated Pronunciation Scoring Thresholds for Known vs Free-Chat Targets
340 " 🟣 ConversationBubble Shows Pronunciation Focus Items and Tips
341 " 🟣 Voice Turn Regression Tests Extended with knownTarget Flag Assertions
342 " 🔵 Dev Server Only Reachable from Within verify Script Process, Not from Shell curl/node
### Jul 2, 2026
807 11:06p 🔵 Backend Architecture: Render API + Supabase Split
### Jul 5, 2026
850 2:52p ✅ English Learning App Multi-Perspective Review Initiated
851 " 🔵 English Learning App Codebase Structure Mapped
852 2:53p 🔵 Learn Tab Scoring Implementation — Key Bugs and Design Flaws Identified
853 " 🔵 Speak Tab Scoring — Drill Results Only, Free Sessions Unscored, Server Dependency Risk
854 " 🔵 realtimeClient.ts — Server Dependency for All AI Features Including Pronunciation
855 2:54p 🔵 Server Pronunciation Demo Mode Bug — Self-Comparison Always Returns 100%
856 " 🔵 Scattered and Inconsistent Pronunciation Score Thresholds Across Codebase
857 " 🔵 Fake Confidence Score in Fallback Feedback — Linear Formula Not Based on Actual Performance
858 " 🔵 Score-to-Pronunciation Range Normalization Bug — Scores 0–1 Handled Inconsistently
859 " 🔵 Zustand Store — Review Queue Scheduling Tied Directly to Lesson Score
860 2:55p 🔵 Product Requirements — Target User and Prototype Scope Constraints Documented
861 " 🔵 Theme System — Warm Indian-Aesthetic Color Palette, No Dark Mode
862 2:56p 🟣 Product Manager Review Document Created — Comprehensive Scoring Analysis
863 " 🟣 CTO Technical Review Document Created — 14 Bugs and Design Flaws Catalogued
S161 Speak tab per-sentence scoring redesign — user wants pronunciation, grammar, and intelligibility scoring with balanced difficulty (Jul 5 at 2:56 PM)
S159 Multi-perspective code review of "Kavi ki Vidya" English learning app — PM, CTO, and Design Expert reviews focused on Learn and Speak tab scoring effectiveness (Jul 5 at 2:56 PM)
864 2:58p ⚖️ Speak Tab Scoring Design Requirements Defined
S160 Speak tab scoring redesign — user wants per-sentence scoring of pronunciation, grammar, and intelligibility with balanced difficulty (Jul 5 at 2:59 PM)
S162 Speak tab per-sentence scoring design — full architecture proposal for pronunciation, grammar, and intelligibility with balanced calibration (Jul 5 at 3:05 PM)
865 3:06p 🔵 Audio Assessment Prompt Architecture — Grammar Explicitly Excluded from Per-Turn Scoring
866 6:31p 🟣 Credit Card Image Edit — Expiry Date Added
867 6:32p 🔵 claude_feedback Folder Contains Three Review Documents
868 " 🔵 Product Review: Scoring System Fundamentally Broken in Learn and Speak Tabs
869 " 🔵 CTO Technical Review: 15+ Bugs Catalogued Across Scoring, Auth, and Cost
870 " 🔵 Design Review: Typography, UI Copy Jargon, and Per-Turn Score Cards Are Top Issues
871 6:33p 🔵 Code Verification Confirms All Major Scoring Bugs from Feedback Reviews
872 " 🔵 Design Bugs Fully Confirmed: 123 fontWeight-900 Instances, Jargon in UI, End Session Icon-Only
873 " 🔵 Score Normalization Bug and Fabricated Fallback Scores Confirmed in Multiple Files
874 6:34p 🔵 Security and Infrastructure Bugs Confirmed: Unauthenticated OpenAI Endpoints and Single Sync Profile
875 " 🔵 Feedback Evaluation Complete: All Three Reviews Verified Accurate Against Codebase

Access 1225k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
