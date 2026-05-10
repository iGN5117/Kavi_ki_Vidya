#!/usr/bin/env node

const configuredBaseUrl =
  process.env.LOCAL_API_BASE_URL || process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8787";

const requestTimeoutMs = Number(process.env.VERIFY_SPEAK_TIMEOUT_MS || 60000);
const rootBaseUrl = getRootBaseUrl(configuredBaseUrl);
const runVoiceChecks = process.argv.includes("--voice") || process.env.VERIFY_SPEAK_WITH_VOICE === "1";

function getRootBaseUrl(value) {
  const trimmed = String(value).replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -"/api".length) : trimmed;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function includesText(value, expected) {
  return normalizeText(value).includes(normalizeText(expected));
}

function stringify(value) {
  return JSON.stringify(value, null, 2);
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function requestRaw(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, options.timeoutMs || requestTimeoutMs);

  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal,
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not reach ${rootBaseUrl}. Start the local API with "npm run server" and retry. Detail: ${detail}`);
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson(urlPath, options = {}) {
  const url = urlPath.startsWith("http") ? urlPath : `${rootBaseUrl}${urlPath}`;
  const response = await requestRaw(url, options);
  const text = await response.text();
  let json = {};

  if (text) {
    try {
      json = JSON.parse(text);
    } catch {
      throw new Error(`Expected JSON from ${url}, got HTTP ${response.status}: ${text.slice(0, 240)}`);
    }
  }

  return { response, json };
}

async function postJson(urlPath, body, options = {}) {
  const { response, json } = await requestJson(urlPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    body: JSON.stringify(body),
    timeoutMs: options.timeoutMs,
  });

  assert(response.status >= 200 && response.status < 300, `POST ${urlPath} returned HTTP ${response.status}: ${stringify(json)}`);
  return json;
}

async function expectHealth() {
  const { response, json } = await requestJson("/health");
  assert(response.status === 200, `GET /health expected HTTP 200, got ${response.status}: ${stringify(json)}`);
  assert(json.ok === true, "/health should return ok: true.");
  console.log(`OK /health mode=${json.mode || "unknown"} openAI=${Boolean(json.openAIAvailable)}`);
  return json;
}

function getGrammarImprovements(feedback) {
  return Array.isArray(feedback?.grammar?.improvedSentences) ? feedback.grammar.improvedSentences : [];
}

function assertImprovedSentence(feedback, original, improved) {
  const matches = getGrammarImprovements(feedback).filter((item) => includesText(item?.original, original));
  assert(matches.length > 0, `Expected a grammar item for "${original}". Got: ${stringify(feedback.grammar)}`);
  assert(
    matches.some((item) => normalizeText(item?.improved) === normalizeText(improved)),
    `Expected "${original}" to improve to "${improved}". Got: ${stringify(matches)}`
  );
}

function assertDoesNotMention(payload, forbidden, label) {
  assert(!includesText(stringify(payload), forbidden), `${label} should not mention unrelated text "${forbidden}". Got: ${stringify(payload)}`);
}

function assertNoHiddenSupportContinuation(reply, supportText, label) {
  const replyText = String(reply || "");
  const support = String(supportText || "");
  const supportHasQuestion = /[?？]/.test(support);
  const replyHasQuestion = /[?？]/.test(replyText);
  const supportAddsEnglishContinuation =
    /\b(how|what|where|when|why|can you|could you|tell me|say it|repeat|now)\b/i.test(support) &&
    !includesText(replyText, support);

  assert(
    !supportHasQuestion || replyHasQuestion,
    `${label} supportText has a question that is missing from reply. Reply="${replyText}" supportText="${support}"`
  );
  assert(
    !supportAddsEnglishContinuation || replyHasQuestion,
    `${label} supportText appears to add a hidden continuation. Reply="${replyText}" supportText="${support}"`
  );
}

function assertNarratesModelSentence(reply, expectedSentence, label) {
  assert(
    includesText(reply, expectedSentence),
    `${label} should narrate the full model sentence "${expectedSentence}". Got reply="${reply}"`
  );
}

function assertDoesNotRepeatHighScoredSentence(reply, sentence, label) {
  const replyText = String(reply || "");
  const asksForRepeat = /\b(repeat|say this|say it again|try again|try it again|practice again|now you try|try the full sentence|listen:)\b/i.test(replyText);
  const mentionsSentence = includesText(replyText, sentence);

  assert(
    !(asksForRepeat && mentionsSentence),
    `${label} should continue after a high-scored sentence instead of asking for the same sentence again. Reply="${replyText}"`
  );
}

function assertDoesNotCreateSelfGreetingDrill(reply, label) {
  const replyText = String(reply || "");
  const createsDrill = /\b(can you say|say this|repeat this|say it again|now say|now tell me|please say)\b/i.test(replyText);
  const asksModelGreetingAnswer = includesText(replyText, "I am fine, thank you") || includesText(replyText, "I am fine");

  assert(
    !(createsDrill && asksModelGreetingAnswer),
    `${label} should answer the learner's greeting naturally instead of drilling the learner to say the coach's answer. Got reply="${replyText}"`
  );
}

function assertIHeardTranscriptIsEnglishScript(transcript, label) {
  assert(isMostlyLatin(transcript), `${label} "I heard" transcript should stay in English/Latin script. Got: "${transcript}"`);
}

function verifyDeterministicSpeakGuards() {
  assertNarratesModelSentence('Listen: "I am good." Add "am" when talking about yourself.', "I am good.", "Grammar retry");
  assertNoHiddenSupportContinuation("Good job. Tell me one more thing.", "Achha kiya.", "Scoped supportText");
  assertDoesNotRepeatHighScoredSentence(
    "Very clear. You said: \"Nice to meet you.\" What would you like to say next?",
    "Nice to meet you.",
    "High-score pronunciation reply"
  );
  assertIHeardTranscriptIsEnglishScript("I want to talk to the teacher.", "English transcript");
  console.log("OK deterministic Speak guard assertions passed");
}

async function verifyGreetingReviewUsesActualSession() {
  const feedback = await postJson("/api/feedback/session", {
    turns: [
      { speaker: "coach", text: "Namaste. Tell me anything you want to say in English." },
      {
        speaker: "user",
        text: "Hello.",
        pronunciation: {
          score: 98,
          verdict: "clear",
          scoringMode: "audio",
          summary: "Great job! The pronunciation was clear and natural.",
          retryWords: ["hello"],
          tips: ["Keep the same clear rhythm."],
        },
      },
      { speaker: "coach", text: "Hello! How are you today?", supportText: "Bahut badhiya! Ab aap kaise hain?" },
    ],
    context: { mode: "free" },
  });

  assert(feedback?.pronunciation?.score === 98, `Review should preserve the turn pronunciation score 98. Got: ${stringify(feedback.pronunciation)}`);
  assert(
    !Array.isArray(feedback?.pronunciation?.retryWords) || feedback.pronunciation.retryWords.length === 0,
    `Clear greeting should not create retry words. Got: ${stringify(feedback.pronunciation?.retryWords)}`
  );
  assert(
    getGrammarImprovements(feedback).length === 0,
    `A clean tiny greeting should not create a grammar card. Got: ${stringify(feedback.grammar)}`
  );
  assertDoesNotMention(feedback, "I cook breakfast in the morning", "Greeting session review");
  console.log("OK review uses actual greeting session and preserves 98% score");
}

async function verifyGrammarReviewCorrections() {
  const iGoodFeedback = await postJson("/api/feedback/session", {
    turns: [
      { speaker: "coach", text: "Namaste. Tell me anything you want to say in English." },
      {
        speaker: "user",
        text: "I good.",
        pronunciation: {
          score: 77,
          verdict: "practice-again",
          scoringMode: "audio",
          summary: "The pronunciation was mostly clear, but the sentence needs grammar improvement.",
          retryWords: [],
          tips: ["Keep the same clear rhythm."],
        },
      },
      {
        speaker: "coach",
        text: 'Listen: "I am good." Remember to add "am" when talking about yourself.',
        supportText: "Apne baare mein bolte waqt 'am' lagao.",
      },
    ],
    context: { mode: "free" },
  });

  assert(iGoodFeedback?.pronunciation?.score === 77, `Review should preserve the 77% turn score. Got: ${stringify(iGoodFeedback.pronunciation)}`);
  assertImprovedSentence(iGoodFeedback, "I good.", "I am good.");
  assertNarratesModelSentence(iGoodFeedback.grammar?.improvedSentences?.[0]?.improved, "I am good.", "Bad grammar correction");

  const niceDayFeedback = await postJson("/api/feedback/session", {
    turns: [
      { speaker: "coach", text: "Tell me one thing about today." },
      {
        speaker: "user",
        text: "It is nice day.",
        pronunciation: {
          score: 82,
          verdict: "practice-again",
          scoringMode: "audio",
          summary: "Understandable, but speak a little slower.",
          retryWords: [],
          tips: ["Pause between small words."],
        },
      },
      {
        speaker: "coach",
        text: 'Good. You can say: "It is a nice day."',
        supportText: "English mein singular day se pehle 'a' lagta hai.",
      },
    ],
    context: { mode: "free" },
  });

  assert(niceDayFeedback?.pronunciation?.score === 82, `Review should preserve the 82% turn score. Got: ${stringify(niceDayFeedback.pronunciation)}`);
  assertImprovedSentence(niceDayFeedback, "It is nice day.", "It is a nice day.");
  console.log("OK review grammar corrections use the actual spoken sentence");
}

async function verifyTextTurnSupportText() {
  const result = await postJson("/api/text/turn", {
    text: "Hello, how are you?",
    turns: [{ speaker: "coach", text: "Namaste. Tell me anything you want to say in English." }],
    instructions:
      "You are Kavi ki Vidya's warm Indian woman English speaking coach. Reply in one short spoken English sentence with one Hindi/Hinglish support line.",
  });

  assert(typeof result.reply === "string" && result.reply.trim().length > 0, `Text turn should return reply. Got: ${stringify(result)}`);
  assert(typeof result.supportText === "string" && result.supportText.trim().length > 0, `Text turn should return supportText. Got: ${stringify(result)}`);
  assertNoHiddenSupportContinuation(result.reply, result.supportText, "Text turn");
  assertDoesNotCreateSelfGreetingDrill(result.reply, "Text turn");
  console.log("OK text turn keeps supportText scoped to the visible reply");
}

async function verifyShortTextTurnHandling() {
  const emptyTurn = await postJson("/api/text/turn", {
    text: "",
    turns: [{ speaker: "coach", text: "Namaste. Tell me one short sentence in English." }],
    instructions:
      "You are Kavi ki Vidya's warm Indian woman English speaking coach. Reply gently when the learner sends an empty or too-short turn.",
  });

  assert(emptyTurn.transcript === "", `Empty text turn should preserve an empty transcript. Got: ${stringify(emptyTurn)}`);
  assert(typeof emptyTurn.reply === "string" && emptyTurn.reply.trim().length > 0, `Empty text turn should return a graceful reply. Got: ${stringify(emptyTurn)}`);
  assert(typeof emptyTurn.supportText === "string" && emptyTurn.supportText.trim().length > 0, `Empty text turn should return supportText. Got: ${stringify(emptyTurn)}`);
  assertNoHiddenSupportContinuation(emptyTurn.reply, emptyTurn.supportText, "Empty text turn");
  console.log("OK short/empty text turn is handled gracefully");
}

function isMostlyLatin(value) {
  const text = String(value || "").trim();
  if (!text) return false;
  const letters = Array.from(text).filter((char) => /\p{L}/u.test(char));
  if (!letters.length) return false;
  const latinLetters = letters.filter((char) => /\p{Script=Latin}/u.test(char));
  return latinLetters.length / letters.length >= 0.75;
}

async function createSentenceAudio(sentence) {
  const audio = await postJson("/api/audio/sentence", { text: sentence }, { timeoutMs: 90000 });
  assert(audio.audioUrl, `Expected audioUrl from /api/audio/sentence. Got: ${stringify(audio)}`);

  const audioResponse = await requestRaw(audio.audioUrl, { timeoutMs: 90000 });
  assert(audioResponse.status === 200, `Expected generated sentence audio HTTP 200, got ${audioResponse.status}.`);
  return Buffer.from(await audioResponse.arrayBuffer());
}

async function postVoiceTurn({ audioBuffer, filename, expectedText, turns }) {
  const form = new FormData();
  form.append("audio", new Blob([audioBuffer], { type: "audio/mpeg" }), filename);
  form.append("expectedText", expectedText);
  form.append(
    "turns",
    JSON.stringify(turns || [{ speaker: "coach", text: "Namaste. Tell me anything you want to say in English." }])
  );
  form.append(
    "instructions",
    "You are Kavi ki Vidya's warm Indian woman English speaking coach. Keep replies short, natural, and useful for an absolute beginner."
  );

  const { response, json } = await requestJson("/api/voice/turn", {
    method: "POST",
    body: form,
    timeoutMs: 120000,
  });
  assert(response.status >= 200 && response.status < 300, `POST /api/voice/turn returned HTTP ${response.status}: ${stringify(json)}`);
  return json;
}

async function verifyVoiceTurnRegression() {
  const clearAudio = await createSentenceAudio("Nice to meet you.");
  const clearTurn = await postVoiceTurn({
    audioBuffer: clearAudio,
    filename: "nice-to-meet-you.mp3",
    expectedText: "Nice to meet you.",
  });

  assertIHeardTranscriptIsEnglishScript(clearTurn.transcript, "Voice clear turn");
  assert(clearTurn.pronunciation?.score >= 85, `Clear generated speech should score at least 85. Got: ${stringify(clearTurn.pronunciation)}`);
  assertDoesNotRepeatHighScoredSentence(clearTurn.reply, "Nice to meet you.", "Voice clear turn");
  assertNoHiddenSupportContinuation(clearTurn.reply, clearTurn.supportText, "Voice clear turn");

  const mismatchTurn = await postVoiceTurn({
    audioBuffer: clearAudio,
    filename: "wrong-target.mp3",
    expectedText: "I want to talk to the teacher.",
  });

  assert(
    mismatchTurn.pronunciation?.score < 85 || mismatchTurn.pronunciation?.verdict !== "clear",
    `Mismatched expected text should not be marked clear. Got: ${stringify(mismatchTurn.pronunciation)}`
  );
  assert(
    includesText(mismatchTurn.reply, "I want to talk to the teacher"),
    `Retry coach reply should narrate the full model sentence. Got reply="${mismatchTurn.reply}"`
  );
  assert(
    includesText(mismatchTurn.pronunciation?.modelSentence, "I want to talk to the teacher"),
    `Retry pronunciation payload should include the full model sentence. Got: ${stringify(mismatchTurn.pronunciation)}`
  );
  assertNoHiddenSupportContinuation(mismatchTurn.reply, mismatchTurn.supportText, "Voice retry turn");

  const grammarRetryTurn = await postVoiceTurn({
    audioBuffer: clearAudio,
    filename: "grammar-target.mp3",
    expectedText: "I good.",
  });

  assertNarratesModelSentence(grammarRetryTurn.reply, "I am good.", "Voice grammar retry");
  assert(
    includesText(grammarRetryTurn.pronunciation?.modelSentence, "I am good"),
    `Voice grammar retry should expose the corrected model sentence. Got: ${stringify(grammarRetryTurn.pronunciation)}`
  );
  assertNoHiddenSupportContinuation(grammarRetryTurn.reply, grammarRetryTurn.supportText, "Voice grammar retry turn");
  console.log("OK voice turn transcript, scoring, retry narration, and supportText checks passed");
}

async function main() {
  console.log(`Verifying Speak regressions at ${rootBaseUrl}`);
  verifyDeterministicSpeakGuards();
  await expectHealth();
  await verifyGreetingReviewUsesActualSession();
  await verifyGrammarReviewCorrections();
  await verifyTextTurnSupportText();
  await verifyShortTextTurnHandling();

  if (runVoiceChecks) {
    await verifyVoiceTurnRegression();
  } else {
    console.log("SKIP voice turn checks: run `npm run verify:speak:voice` when you want the real audio path.");
  }

  await delay(10);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
