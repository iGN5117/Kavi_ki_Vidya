<claude-mem-context>
# Memory Context

# [English_Learning_App_Codex] recent context, 2026-06-13 4:05pm EDT

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision 🚨security_alert 🔐security_note
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 45 obs (17,505t read) | 520,153t work | 97% savings

### May 3, 2026
2 11:11a 🔵 Turn-Based Chat Broken — Infinite Refresh Spinner
3 " 🔵 Voice/Turn Endpoint Receives Audio But Produces No Response
4 " 🔵 Voice/Turn Pipeline Architecture Mapped: 3 Sequential OpenAI Calls
5 11:12a 🔵 Voice/Turn Actually Has 4 OpenAI Calls; Audio Assessment Step Likely Cause of Hang
6 " 🔴 Added OpenAI Request Timeouts to Prevent Infinite Hang in Voice/Turn Pipeline
7 " 🔴 withTimeout Applied to Three of Four OpenAI Call Sites in Voice Pipeline
8 " 🔴 Audio Pronunciation Assessment (gpt-4o-audio-preview) Now Covered by withTimeout
9 11:13a 🔄 Voice/Turn Handler Gains Timing Logs and Uses Shared transcribeAudioFile Function
10 " ✅ All Patches Validated Clean; Old Server Process Killed for Restart
11 " ✅ Dev Server Restarted Successfully with Timeout and Logging Fixes Active
12 11:14a 🔵 End-to-End Voice/Turn Test Reveals ReferenceError: "startedAt is not defined"
13 11:15a 🔵 startedAt Scope Bug Persisted: Variable Placed in Wrong Handler (realtime/session vs voice/turn)
14 11:16a 🔴 Voice/Turn End-to-End Test Passes — Turn-Based Chat Fully Restored
15 11:17a 🔵 Voice/Turn Pipeline Step Timings Confirmed by Server Logs
16 " 🔵 iOS Speaking Recorder Uses LinearPCM WAV at 16kHz; MIME Type Mismatch Between Client and Server
17 " 🔵 WAV Audio Path Confirmed Working — 4482ms, Score 97, Full Audio Scoring Mode
18 " ⚖️ Feature Request: Coach Should Narrate Correctly Pronounced Sentence on Failed Attempts
19 " 🔵 Model Pronunciation Audio Feature: Architecture Mapped for Implementation
20 11:29a 🔵 audio/vnd.wave Is Accepted by getAudioAssessmentFormat via Substring Match
21 11:30a 🔵 getCoachReplyFromAssessment Bypasses createCoachReply When gpt-4o-audio-preview Returns coachReply
22 " 🟣 Coach Narrates Model Sentence on Pronunciation Retry
23 11:37a 🔵 Happy-Path Voice Turn Unaffected by Pronunciation Narration Feature
24 11:40a 🔵 Coach Reply Architecture: Dual Path with supportText/coachSupportText Field Split
25 " ✅ coachReplyJsonSchema supportText Description Tightened
26 " ✅ withStructuredCoachInstructions Reinforces supportText Scope Constraint
27 11:41a 🟣 Post-Processing Pipeline for supportText Added: sanitizeSupportText
28 " ✅ sanitizeSupportText Rolled Out to All Coach Reply Paths
29 " 🔵 sanitizeCoachReply Confirmed: sanitizeSupportText Applied Only to Parsed Path, Not Fallback
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

Access 520k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- ALWAYS read graphify-out/GRAPH_REPORT.md before reading any source files, running grep/glob searches, or answering codebase questions. The graph is your primary map of the codebase.
- IF graphify-out/wiki/index.md EXISTS, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
