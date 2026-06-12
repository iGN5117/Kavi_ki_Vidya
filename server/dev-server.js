require("dotenv").config();

const cors = require("cors");
const { spawnSync } = require("node:child_process");
const crypto = require("node:crypto");
const express = require("express");
const fs = require("node:fs");
const path = require("node:path");
const ffmpegPath = require("ffmpeg-static");
const multer = require("multer");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const { WebSocket, WebSocketServer } = require("ws");
const { createProgressRepository } = require("./progress-store");

const app = express();
const upload = multer({
  dest: "server/tmp",
  limits: {
    fileSize: 15 * 1024 * 1024,
    fields: 8,
    fieldSize: 24 * 1024,
  },
});
const port = Number(process.env.PORT || 8787);
const openaiRequestTimeoutMs = Number(process.env.OPENAI_REQUEST_TIMEOUT_MS || 20000);
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY, timeout: openaiRequestTimeoutMs })
  : null;
const voiceTranscriptionTimeoutMs = Number(process.env.VOICE_TRANSCRIPTION_TIMEOUT_MS || 15000);
const voiceAssessmentTimeoutMs = Number(process.env.VOICE_ASSESSMENT_TIMEOUT_MS || 12000);
const voiceReplyTimeoutMs = Number(process.env.VOICE_REPLY_TIMEOUT_MS || 10000);
const voiceTtsTimeoutMs = Number(process.env.VOICE_TTS_TIMEOUT_MS || 8000);
const transcriptionLanguage = process.env.OPENAI_TRANSCRIBE_LANGUAGE || "en";
const transcriptionPrompt =
  process.env.OPENAI_TRANSCRIBE_PROMPT ||
  "The speaker is an Indian learner practicing spoken English. Transcribe as English words in Latin script only. If pronunciation is unclear, write the closest English words. Never output Urdu, Arabic, Devanagari, or any non-Latin script.";
let openaiLastError = null;
const progressStorageDir = path.join("server", "tmp", "progress");
const authSessions = new Map();
const authSessionTtlMs = 24 * 60 * 60 * 1000;
const progressRepository = createProgressRepository({
  env: process.env,
  storageDir: progressStorageDir,
  sanitizeProgressPayload,
  clampText,
  clampNumber,
});

fs.mkdirSync("server/tmp/audio", { recursive: true });

app.use(cors());
app.use(express.json({ limit: "128kb" }));
app.use("/audio", express.static("server/tmp/audio"));

app.use((error, _request, response, next) => {
  if (!error) {
    next();
    return;
  }

  if (error.type === "entity.too.large") {
    response.status(413).json({ error: "Request body is too large." });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    response.status(400).json({ error: "Request body must be valid JSON." });
    return;
  }

  next(error);
});

app.get("/health", (_request, response) => {
  const openAIConfigured = Boolean(openai);
  const openAIAvailable = openAIConfigured && !openaiLastError;

  response.json({
    ok: true,
    service: "kavi-ki-vidya-dev-server",
    openAIConfigured,
    openAIAvailable,
    mode: openAIAvailable ? "live-ai" : openAIConfigured ? "openai-error-demo" : "local-demo",
    openAIStatus: openAIAvailable ? "ready" : openAIConfigured ? "last-request-failed" : "missing-key",
    openAIError: openaiLastError,
    progressStorage: progressRepository.info(),
    realtimeWebSocket: true,
  });
});

app.post("/api/auth/dev-session", (request, response) => {
  const body = request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body : undefined;
  if (!body || !body.authProfile || typeof body.authProfile !== "object" || Array.isArray(body.authProfile)) {
    response.status(400).json({ error: "Auth session request must include an authProfile object." });
    return;
  }

  const validationErrors = validateProgressPayload({ authProfile: body.authProfile });
  if (validationErrors.length) {
    response.status(400).json({
      error: "Auth profile is invalid.",
      details: validationErrors,
    });
    return;
  }

  const authProfile = sanitizeAuthProfile(body.authProfile);
  if (!authProfile) {
    response.status(400).json({ error: "Auth profile could not be sanitized." });
    return;
  }

  response.json(createAuthSession(authProfile));
});

app.get("/api/auth/session", (request, response) => {
  const session = getSessionFromRequest(request);
  if (!session) {
    response.status(401).json({ error: "A valid bearer session is required." });
    return;
  }

  response.json(session);
});

app.get("/api/progress/:profileId", async (request, response) => {
  const access = resolveProgressAccess(request, response);
  if (!access) return;

  try {
    const stored = await progressRepository.read(access.profileId);
    response.json({
      profileId: access.profileId,
      progress: stored?.progress || sanitizeProgressPayload({}),
      updatedAt: stored?.updatedAt || null,
      revision: stored?.revision || 0,
      ownerUserId: stored?.ownerUserId || access.session?.userId || null,
      authProvider: stored?.authProvider || access.session?.provider || null,
      source: access.session ? "local-session-storage" : "local-dev-storage",
    });
  } catch (error) {
    response.status(503).json({ error: getStorageErrorMessage(error, "Progress storage read failed.") });
  }
});

app.put("/api/progress/:profileId", async (request, response) => {
  const access = resolveProgressAccess(request, response);
  if (!access) return;

  const body = request.body && typeof request.body === "object" && !Array.isArray(request.body) ? request.body : undefined;
  if (!body) {
    response.status(400).json({ error: "Progress request body must be a JSON object." });
    return;
  }

  if (!Object.prototype.hasOwnProperty.call(body, "progress")) {
    response.status(400).json({ error: "Progress request body must include a progress object." });
    return;
  }

  const progressInput = body.progress;
  if (!progressInput || typeof progressInput !== "object" || Array.isArray(progressInput)) {
    response.status(400).json({ error: "Progress field must be a JSON object." });
    return;
  }

  const validationErrors = validateProgressPayload(progressInput);
  if (validationErrors.length) {
    response.status(400).json({
      error: "Progress payload is invalid.",
      details: validationErrors,
    });
    return;
  }

  try {
    const record = await progressRepository.write(
      access.profileId,
      sanitizeProgressPayload(progressInput),
      access.session ?? undefined,
    );

    response.json({
      ...record,
      source: access.session ? "local-session-storage" : "local-dev-storage",
    });
  } catch (error) {
    response.status(503).json({ error: getStorageErrorMessage(error, "Progress storage write failed.") });
  }
});

const coachReplyJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["reply", "supportText"],
  properties: {
    reply: {
      type: "string",
      description:
        "English coach reply: acknowledge intent, give one natural English sentence, then ask a tiny follow-up or repeat prompt.",
    },
    supportText: {
      type: "string",
      description:
        "Short Hindi/Hinglish meaning of the English reply only. Do not add any question, prompt, or conversation continuation that is not already in reply.",
    },
  },
};

const feedbackJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["pronunciation", "grammar", "confidence", "savedPhrases", "mistakes"],
  properties: {
    pronunciation: {
      type: "object",
      additionalProperties: false,
      required: ["summary", "retryWords"],
      properties: {
        summary: { type: "string" },
        retryWords: {
          type: "array",
          items: { type: "string" },
          maxItems: 4,
        },
        score: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Optional beginner-friendly pronunciation score from 0 to 100.",
        },
        tips: {
          type: "array",
          items: { type: "string" },
          maxItems: 3,
          description: "Optional short pronunciation tips for the next attempt.",
        },
      },
    },
    grammar: {
      type: "object",
      additionalProperties: false,
      required: ["improvedSentences"],
      properties: {
        improvedSentences: {
          type: "array",
          minItems: 1,
          maxItems: 3,
          items: {
            type: "object",
            additionalProperties: false,
            required: ["original", "improved", "explanation"],
            properties: {
              original: { type: "string" },
              improved: { type: "string" },
              explanation: {
                type: "object",
                additionalProperties: false,
                required: ["hi-Deva", "hi-Latn"],
                properties: {
                  "hi-Deva": { type: "string" },
                  "hi-Latn": { type: "string" },
                },
              },
            },
          },
        },
      },
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      required: ["note", "nextStep"],
      properties: {
        note: { type: "string" },
        nextStep: { type: "string" },
        score: {
          type: "number",
          minimum: 0,
          maximum: 100,
          description: "Optional confidence score from 0 to 100 based on participation, clarity, and willingness to continue.",
        },
      },
    },
    savedPhrases: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
    mistakes: {
      type: "array",
      items: { type: "string" },
      maxItems: 5,
    },
  },
};

const pronunciationCheckJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["score", "verdict", "summary", "tips", "retryWords"],
  properties: {
    score: {
      type: "number",
      minimum: 0,
      maximum: 100,
      description: "Beginner-friendly intelligibility score from 0 to 100.",
    },
    verdict: {
      type: "string",
      enum: ["clear", "practice-again", "try-again"],
      description: "Supportive verdict for whether the learner can continue or should retry.",
    },
    summary: {
      type: "string",
      description: "One short supportive verdict sentence.",
    },
    tips: {
      type: "array",
      items: { type: "string" },
      maxItems: 3,
      description: "Short next-attempt pronunciation tips.",
    },
    retryWords: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
      description: "Words from the target sentence to retry.",
    },
    problemSounds: {
      type: "array",
      items: { type: "string" },
      maxItems: 4,
      description: "Specific sounds, syllables, or words that sounded unclear.",
    },
    clarityScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    soundAccuracyScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
    rhythmScore: {
      type: "number",
      minimum: 0,
      maximum: 100,
    },
  },
};

function clampText(value, fallback = "", maxLength = 500) {
  if (typeof value !== "string") return fallback;
  const trimmed = value.replace(/\s+/g, " ").trim();
  return trimmed ? trimmed.slice(0, maxLength) : fallback;
}

function clampRawText(value, fallback = "", maxLength = 500) {
  if (typeof value !== "string") return fallback;
  return value.trim() ? value.slice(0, maxLength) : fallback;
}

function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
}

function normalizeSdpText(value) {
  const raw = clampRawText(value, "", 200000);
  if (!raw) return "";
  const normalized = raw.replace(/\r?\n/g, "\r\n");
  return normalized.endsWith("\r\n") ? normalized : `${normalized}\r\n`;
}

function validateWebRtcOfferSdp(sdp) {
  const normalized = typeof sdp === "string" ? sdp.replace(/\r\n/g, "\n") : "";
  const missing = [];
  if (!normalized.startsWith("v=0")) missing.push("v=0");
  if (!/\no=-/.test(normalized)) missing.push("o=-");
  if (!/\ns=-/.test(normalized)) missing.push("s=-");
  if (!/\nt=0 0/.test(normalized)) missing.push("t=0 0");
  if (!/\nm=audio /.test(normalized)) missing.push("m=audio");
  if (!/\na=ice-ufrag:/.test(normalized)) missing.push("a=ice-ufrag");
  if (!/\na=fingerprint:/.test(normalized)) missing.push("a=fingerprint");

  if (!missing.length) return null;

  return {
    missing,
    length: sdp.length,
    preview: sdp.slice(0, 220),
  };
}

function clampNumber(value, fallback, min, max) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Math.min(max, Math.max(min, Math.round(value)));
}

function sanitizeProfileId(value) {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return /^[a-zA-Z0-9][a-zA-Z0-9_-]{0,63}$/.test(trimmed) ? trimmed : undefined;
}

function hasOwn(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function sanitizeDateKey(value) {
  if (value === null) return null;
  if (typeof value !== "string") return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function sanitizeStringArray(value, maxItems = 100, maxLength = 160) {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value
        .map((item) => clampText(item, "", maxLength))
        .filter(Boolean)
        .slice(0, maxItems)
    )
  );
}

function sanitizeJsonValue(value, depth = 0) {
  if (value === null || typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") return value.replace(/\s+/g, " ").trim().slice(0, 1000);
  if (depth >= 5) return undefined;

  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeJsonValue(item, depth + 1))
      .filter((item) => item !== undefined);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 30)
        .map(([key, item]) => [key.replace(/[^a-zA-Z0-9_.-]/g, "").slice(0, 64), sanitizeJsonValue(item, depth + 1)])
        .filter(([key, item]) => key && item !== undefined)
    );
  }

  return undefined;
}

function sanitizeJsonArray(value, maxItems = 40) {
  if (!Array.isArray(value)) return [];

  return value
    .slice(0, maxItems)
    .map((item) => sanitizeJsonValue(item))
    .filter((item) => item && typeof item === "object");
}

function sanitizeAuthProfile(value) {
  if (value === null || value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const provider = ["local", "google", "apple"].includes(value.provider) ? value.provider : "local";
  const providerUserId = clampText(value.providerUserId, provider === "local" ? "kavita-local" : `${provider}-prototype`, 120);
  const displayName = clampText(value.displayName, "Kavita", 80);
  const email = clampText(value.email, "", 160);
  const syncProfileId = sanitizeProfileId(value.syncProfileId) || (provider === "local" ? "local-kavita" : sanitizeProfileId(`${provider}-prototype`));
  const signedInAt = clampText(value.signedInAt, new Date(0).toISOString(), 40);

  return {
    provider,
    providerUserId,
    syncProfileId,
    displayName,
    ...(email ? { email } : {}),
    signedInAt,
  };
}

function createAuthSession(authProfile) {
  const issuedAt = new Date();
  const expiresAt = new Date(issuedAt.getTime() + authSessionTtlMs);
  const session = {
    token: crypto.randomBytes(32).toString("base64url"),
    userId: `${authProfile.provider}:${authProfile.providerUserId}`,
    profileId: authProfile.syncProfileId,
    provider: authProfile.provider,
    displayName: authProfile.displayName,
    ...(authProfile.email ? { email: authProfile.email } : {}),
    issuedAt: issuedAt.toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: "local-dev-session",
  };

  authSessions.set(session.token, session);
  return session;
}

function getBearerToken(request) {
  const header = request.headers.authorization;
  if (typeof header !== "string") return undefined;

  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim();
}

function getSessionFromRequest(request) {
  const token = getBearerToken(request);
  if (!token) return undefined;

  const session = authSessions.get(token);
  if (!session) return undefined;

  if (Date.parse(session.expiresAt) <= Date.now()) {
    authSessions.delete(token);
    return undefined;
  }

  return session;
}

function resolveProgressAccess(request, response) {
  const profileId = sanitizeProfileId(request.params.profileId);
  if (!profileId) {
    response.status(400).json({ error: "Profile ID must be 1-64 characters: letters, numbers, underscore, or hyphen." });
    return undefined;
  }

  if (!getBearerToken(request)) {
    return { profileId };
  }

  const session = getSessionFromRequest(request);
  if (!session) {
    response.status(401).json({ error: "A valid bearer session is required for authenticated progress sync." });
    return undefined;
  }

  if (session.profileId !== profileId) {
    response.status(403).json({ error: "This session cannot access the requested progress profile." });
    return undefined;
  }

  return { profileId, session };
}

function getStorageErrorMessage(error, fallback) {
  const detail = error instanceof Error ? error.message : "";
  return detail ? `${fallback} ${detail}` : fallback;
}

function validateProgressPayload(value) {
  const errors = [];
  const booleanFields = ["isSignedIn", "hasCompletedOnboarding"];
  const numberFields = ["dailyGoalMinutes", "streakCount", "minutesToday"];
  const dateFields = ["dailyProgressDate", "lastActiveDate"];
  const stringArrayFields = ["completedLessons", "skippedLessons", "skippedModules", "savedPhrases", "mistakes"];
  const jsonArrayFields = ["lessonAttempts", "reviewQueue", "drillResults", "feedbackHistory"];

  for (const field of booleanFields) {
    if (hasOwn(value, field) && typeof value[field] !== "boolean") {
      errors.push(`${field} must be a boolean.`);
    }
  }

  if (hasOwn(value, "name") && typeof value.name !== "string") {
    errors.push("name must be a string.");
  }

  if (hasOwn(value, "authProfile") && value.authProfile !== null) {
    if (!value.authProfile || typeof value.authProfile !== "object" || Array.isArray(value.authProfile)) {
      errors.push("authProfile must be an object or null.");
    } else {
      if (hasOwn(value.authProfile, "provider") && !["local", "google", "apple"].includes(value.authProfile.provider)) {
        errors.push("authProfile.provider must be local, google, or apple.");
      }
      for (const field of ["providerUserId", "syncProfileId", "displayName", "email", "signedInAt"]) {
        if (hasOwn(value.authProfile, field) && value.authProfile[field] !== undefined && typeof value.authProfile[field] !== "string") {
          errors.push(`authProfile.${field} must be a string.`);
        }
      }
    }
  }

  if (
    hasOwn(value, "explanationPreference") &&
    !["hi-Deva", "hi-Latn", "both"].includes(value.explanationPreference)
  ) {
    errors.push("explanationPreference must be hi-Deva, hi-Latn, or both.");
  }

  for (const field of numberFields) {
    if (hasOwn(value, field) && (typeof value[field] !== "number" || !Number.isFinite(value[field]))) {
      errors.push(`${field} must be a finite number.`);
    }
  }

  for (const field of dateFields) {
    if (hasOwn(value, field) && value[field] !== null && typeof value[field] !== "string") {
      errors.push(`${field} must be a YYYY-MM-DD string or null.`);
    } else if (hasOwn(value, field) && typeof value[field] === "string" && !/^\d{4}-\d{2}-\d{2}$/.test(value[field])) {
      errors.push(`${field} must use YYYY-MM-DD format.`);
    }
  }

  for (const field of stringArrayFields) {
    if (hasOwn(value, field) && !Array.isArray(value[field])) {
      errors.push(`${field} must be an array of strings.`);
    } else if (hasOwn(value, field) && value[field].some((item) => typeof item !== "string")) {
      errors.push(`${field} must contain only strings.`);
    }
  }

  for (const field of jsonArrayFields) {
    if (hasOwn(value, field) && !Array.isArray(value[field])) {
      errors.push(`${field} must be an array.`);
    }
  }

  return errors;
}

function sanitizeProgressPayload(value) {
  const input = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const explanationPreference = ["hi-Deva", "hi-Latn", "both"].includes(input.explanationPreference)
    ? input.explanationPreference
    : "both";

  return {
    isSignedIn: Boolean(input.isSignedIn),
    hasCompletedOnboarding: Boolean(input.hasCompletedOnboarding),
    authProfile: sanitizeAuthProfile(input.authProfile),
    name: clampText(input.name, "Kavita", 80),
    explanationPreference,
    dailyGoalMinutes: clampNumber(input.dailyGoalMinutes, 5, 1, 60),
    streakCount: clampNumber(input.streakCount, 0, 0, 3650),
    minutesToday: clampNumber(input.minutesToday, 0, 0, 1440),
    dailyProgressDate: sanitizeDateKey(input.dailyProgressDate),
    lastActiveDate: sanitizeDateKey(input.lastActiveDate),
    completedLessons: sanitizeStringArray(input.completedLessons, 300, 80),
    skippedLessons: sanitizeStringArray(input.skippedLessons, 300, 80),
    skippedModules: sanitizeStringArray(input.skippedModules, 100, 80),
    lessonAttempts: sanitizeJsonArray(input.lessonAttempts, 80),
    reviewQueue: sanitizeJsonArray(input.reviewQueue, 120),
    drillResults: sanitizeJsonArray(input.drillResults, 120),
    savedPhrases: sanitizeStringArray(input.savedPhrases, 300, 200),
    mistakes: sanitizeStringArray(input.mistakes, 300, 220),
    feedbackHistory: sanitizeJsonArray(input.feedbackHistory, 20),
  };
}

function parseJsonField(value, fallback) {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function extractJsonObject(value) {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(withoutFence);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
  } catch {
    // Continue to balanced-brace extraction below.
  }

  const start = withoutFence.indexOf("{");
  if (start === -1) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < withoutFence.length; index += 1) {
    const char = withoutFence[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (char === "\\") {
      escaped = inString;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{") depth += 1;
    if (char === "}") depth -= 1;

    if (depth === 0) {
      try {
        const parsed = JSON.parse(withoutFence.slice(start, index + 1));
        return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

function parseConversationTurns(value) {
  const parsed = parseJsonField(value, []);
  if (!Array.isArray(parsed)) return [];

  return parsed
    .filter((turn) => turn && (turn.speaker === "user" || turn.speaker === "coach") && typeof turn.text === "string")
    .map((turn) => ({
      speaker: turn.speaker,
      text: turn.text.slice(0, 1000),
      supportText: typeof turn.supportText === "string" ? turn.supportText.slice(0, 500) : undefined,
      pronunciation: parseTurnPronunciation(turn.pronunciation),
    }))
    .slice(-12);
}

function parseTurnPronunciation(value) {
  if (!value || typeof value !== "object") return undefined;
  const score = getOptionalScore(value.score, undefined);
  if (score === undefined) return undefined;

  return {
    score,
    verdict: ["clear", "practice-again", "try-again"].includes(value.verdict) ? value.verdict : undefined,
    scoringMode: value.scoringMode === "audio" || value.scoringMode === "transcript" ? value.scoringMode : undefined,
    summary: clampText(value.summary, "", 240),
    tips: asStringArray(value.tips, [], 3, 120),
    retryWords: asStringArray(value.retryWords, [], 4, 40),
  };
}

function parseSessionContext(value) {
  const parsed = parseJsonField(value, undefined);
  if (!parsed || typeof parsed !== "object") return undefined;

  return {
    mode: parsed.mode === "roleplay" ? "roleplay" : "free",
    scenario:
      parsed.scenario && typeof parsed.scenario === "object"
        ? {
            id: String(parsed.scenario.id || "").slice(0, 80),
            title: String(parsed.scenario.title || "").slice(0, 120),
            goal: String(parsed.scenario.goal || "").slice(0, 240),
            difficulty: String(parsed.scenario.difficulty || "").slice(0, 40),
          }
        : undefined,
    focus:
      parsed.focus && typeof parsed.focus === "object" && typeof parsed.focus.prompt === "string"
        ? {
            itemId: typeof parsed.focus.itemId === "string" ? parsed.focus.itemId.slice(0, 120) : undefined,
            source: parsed.focus.source === "lesson" ? "lesson" : "speaking",
            prompt: parsed.focus.prompt.slice(0, 180),
            detail: typeof parsed.focus.detail === "string" ? parsed.focus.detail.slice(0, 220) : undefined,
          }
        : undefined,
  };
}

function formatConversationTurns(turns) {
  if (!turns.length) return "No previous turns yet.";

  return turns
    .map((turn) => {
      const speaker = turn.speaker === "user" ? "Learner" : "Coach";
      const support = turn.supportText ? `\nSupport: ${turn.supportText}` : "";
      const pronunciation = turn.pronunciation
        ? `\nPronunciation: ${Math.round(turn.pronunciation.score)}%${turn.pronunciation.verdict ? `, ${turn.pronunciation.verdict}` : ""}. ${
            turn.pronunciation.summary || ""
          }`
        : "";
      return `${speaker}: ${turn.text}${support}${pronunciation}`;
    })
    .join("\n\n");
}

function formatSessionContext(context) {
  if (!context) return "Mode: unknown.";
  const focus = context.focus
    ? ` Focus drill: ${context.focus.prompt}. Source: ${context.focus.source}. Detail: ${context.focus.detail || "none"}.`
    : "";
  if (context.mode === "roleplay" && context.scenario) {
    return `Mode: guided roleplay. Scenario: ${context.scenario.title}. Goal: ${context.scenario.goal}. Difficulty: ${context.scenario.difficulty}.${focus}`;
  }

  return `Mode: free chat.${focus}`;
}

function withTeachingStructureInstructions(instructions) {
  return `${instructions}

Every coach reply must follow this exact teaching structure:
1. Acknowledge the learner's intent or effort in a warm, adult tone.
2. If the learner asks you a greeting or question, answer it directly as the conversation partner. Do not ask the learner to say the answer to her own question.
3. If the learner is trying to express an idea and needs help, give exactly one natural English sentence she can say.
4. Give one short Hinglish support line.
5. End with a tiny follow-up question.

Ask the learner to repeat the same sentence only when pronunciation or grammar context says another attempt is needed. If pronunciation is clear, continue the conversation with a related next question instead of asking for the same sentence again.`;
}

function getRealtimeAudioRate(value, fallback = 24000) {
  const rate = Number(value);
  return [24000, 48000].includes(rate) ? rate : fallback;
}

function createRealtimeSessionConfig(instructions, options = {}) {
  const inputRate = getRealtimeAudioRate(options.inputRate, 24000);
  const outputRate = getRealtimeAudioRate(options.outputRate, 24000);
  const turnDetection =
    options.turnDetection === "manual"
      ? null
      : {
          type: "server_vad",
          threshold: 0.72,
          prefix_padding_ms: 300,
          silence_duration_ms: 850,
          create_response: false,
          interrupt_response: false,
        };

  return {
    type: "realtime",
    model: process.env.OPENAI_REALTIME_MODEL || "gpt-realtime",
    output_modalities: ["audio"],
    instructions: withTeachingStructureInstructions(instructions),
    audio: {
      input: {
        format: {
          type: "audio/pcm",
          rate: inputRate,
        },
        transcription: {
          model: process.env.OPENAI_REALTIME_TRANSCRIPTION_MODEL || "gpt-4o-mini-transcribe",
          language: "en",
        },
        turn_detection: turnDetection,
      },
      output: {
        format: {
          type: "audio/pcm",
          rate: outputRate,
        },
        voice: process.env.OPENAI_REALTIME_VOICE || "alloy",
      },
    },
  };
}

function createRealtimeSessionUpdate(instructions, options) {
  return {
    type: "session.update",
    session: createRealtimeSessionConfig(instructions, options),
  };
}

function createRealtimeInstructionsUpdate(instructions) {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      instructions: withTeachingStructureInstructions(instructions),
    },
  };
}

function createRealtimeInputFormatUpdate(inputRate) {
  return {
    type: "session.update",
    session: {
      type: "realtime",
      audio: {
        input: {
          format: {
            type: "audio/pcm",
            rate: getRealtimeAudioRate(inputRate, 24000),
          },
        },
      },
    },
  };
}

function withStructuredCoachInstructions(instructions) {
  return `${withTeachingStructureInstructions(instructions)}

Return only JSON with keys "reply" and "supportText". Do not include markdown.
supportText must be the Hindi/Hinglish meaning of reply only. It must not contain any extra question, instruction, or conversation continuation that is missing from reply.`;
}

function localCoachReply(input, turns = [], pronunciation) {
  const conversationText = turns.map((turn) => turn.text).join(" ");
  const normalized = `${conversationText} ${String(input || "")}`.toLowerCase();

  if (needsPronunciationRetry(pronunciation)) {
    const modelSentence = getPronunciationModelSentence(pronunciation.expectedText, input);
    return {
      reply: `Listen once: "${modelSentence}" Now you try the full sentence slowly.`,
      supportText: `Pehle pura sentence suno, phir dheere se repeat karo: "${modelSentence}"`,
      isDemo: true,
    };
  }

  if (normalized.includes("how are you")) {
    return {
      reply: "I am fine, thank you. How are you feeling today?",
      supportText: "Main theek hoon, dhanyavaad. Aap aaj kaisa feel kar rahi hain?",
      isDemo: true,
    };
  }

  if (/\b(hello|hi|namaste)\b/.test(normalized)) {
    return {
      reply: "Hello. It is nice to talk to you. How was your day?",
      supportText: "Hello. Aapse baat karke accha laga. Aapka din kaisa tha?",
      isDemo: true,
    };
  }

  if (pronunciation?.verdict === "clear" || pronunciation?.score >= 85) {
    const cleanInput = clampText(input, "That was clear.", 140);
    return {
      reply: `Very clear. You said: "${cleanInput}" What else would you like to say?`,
      supportText: "Bahut clear tha. Ab ek aur kaam ke baare mein batayein.",
      isDemo: true,
    };
  }

  if (normalized.includes("teacher")) {
    return {
      reply: 'I understand. Say: "I want to talk to the teacher." Can you repeat it slowly?',
      supportText: 'Aap keh sakti hain: "I want to talk to the teacher."',
      isDemo: true,
    };
  }

  if (normalized.includes("price") || normalized.includes("much")) {
    return {
      reply: 'Nice question. Say: "How much is this?" Ask me once.',
      supportText: 'Aap bol sakti hain: "How much is this?"',
      isDemo: true,
    };
  }

  if (normalized.includes("name")) {
    return {
      reply: 'Good start. Say: "My name is Kavita." Now say it with your own name.',
      supportText: 'Simple English: "My name is Kavita." Apna naam daal dijiye.',
      isDemo: true,
    };
  }

  return {
    reply: 'I understand your meaning. Say: "I need help, please." Repeat it once slowly.',
    supportText: 'Aapka meaning clear tha. Simple English: "I need help, please."',
    isDemo: true,
  };
}

function formatPronunciationContext(pronunciation) {
  if (!pronunciation) {
    return "No pronunciation score is available for this turn.";
  }

  const modelSentence = getPronunciationModelSentence(pronunciation.expectedText, pronunciation.transcript);
  const score = typeof pronunciation.score === "number" ? Math.round(pronunciation.score) : undefined;
  const retryWords = Array.isArray(pronunciation.retryWords) && pronunciation.retryWords.length
    ? pronunciation.retryWords.join(", ")
    : "none";
  const tips = Array.isArray(pronunciation.tips) && pronunciation.tips.length
    ? pronunciation.tips.slice(0, 2).join(" | ")
    : "none";

  return [
    `Pronunciation verdict: ${pronunciation.verdict || "unknown"}.`,
    score === undefined ? "" : `Pronunciation score: ${score}%.`,
    `Summary: ${pronunciation.summary || "none"}.`,
    `Retry words: ${retryWords}.`,
    `Tips: ${tips}.`,
    `Model sentence to narrate if retry is needed: "${modelSentence}".`,
    "If verdict is clear or score is 85 or above, do not ask the learner to repeat the same sentence. Praise briefly and continue with a natural next question.",
    'If verdict is practice-again or try-again, first narrate the full model sentence exactly in quotes after the word "Listen:", then ask for one repeat and mention one specific tip.',
  ].filter(Boolean).join(" ");
}

function needsPronunciationRetry(pronunciation) {
  if (!pronunciation) return false;
  if (pronunciation.verdict === "practice-again" || pronunciation.verdict === "try-again") return true;
  return typeof pronunciation.score === "number" && pronunciation.score < 85;
}

function getPronunciationModelSentence(expectedText, transcript) {
  const source = cleanFeedbackSentence(expectedText) || cleanFeedbackSentence(transcript);
  return getLocalImprovedSentence(source, undefined, []);
}

function ensureRetryReplyNarratesSentence(reply, pronunciation) {
  const cleanedReply = clampText(reply, "", 420);
  if (!needsPronunciationRetry(pronunciation)) return cleanedReply;

  const modelSentence = getPronunciationModelSentence(pronunciation.expectedText, pronunciation.transcript);
  if (!modelSentence) return cleanedReply;

  const normalizedReply = simplifyFeedbackSentence(cleanedReply);
  const normalizedSentence = simplifyFeedbackSentence(modelSentence);
  if (normalizedReply.includes(normalizedSentence)) return cleanedReply;

  const prefix = `Listen: "${modelSentence}" `;
  return clampText(`${prefix}${cleanedReply || "Now repeat the full sentence slowly."}`, "", 420);
}

function hasConversationContinuation(value) {
  const normalized = clampText(value, "", 500).toLowerCase();
  return /[?]/.test(normalized) || /\b(how|what|where|when|why|tell me|can you|could you|repeat|try once|try it|now say|now you)\b/.test(normalized);
}

function getFirstSupportSentence(value) {
  const cleaned = clampText(value, "", 260);
  if (!cleaned) return "";

  const sentences = cleaned.match(/[^.!?]+[.!?]?/g) || [cleaned];
  const firstStatement = sentences
    .map((sentence) => clampText(sentence, "", 160))
    .find((sentence) => sentence && !hasConversationContinuation(sentence));

  return firstStatement || "";
}

function getSupportTextFallback(reply, fallback = "") {
  const normalized = simplifyFeedbackSentence(reply);

  if (normalized.includes("listen")) {
    return "Pehle pura sentence suno, phir dheere se repeat karo.";
  }

  if (normalized.includes("nice and clear") || normalized.includes("very clear") || normalized.includes("pronunciation")) {
    return "Bahut achha, aapki baat clear thi.";
  }

  if (normalized.includes("nice to meet you")) {
    return "Aapse milkar accha laga.";
  }

  if (normalized.includes("weather")) {
    return "Aapke yahan mausam kaisa hai?";
  }

  if (normalized.includes("how was your day")) {
    return "Aapka din kaisa tha?";
  }

  if (normalized.includes("how are you")) {
    return "Aap kaisi hain?";
  }

  if (normalized.includes("what else would you like")) {
    return "Ab aap aur kya kehna chahengi?";
  }

  return clampText(fallback, "", 160) || "Iska matlab samajh kar ek chhota jawab dijiye.";
}

function sanitizeSupportText(reply, supportText, fallback = "") {
  const cleanedReply = clampText(reply, "", 420);
  const cleanedSupport = clampText(supportText, "", 260);
  if (!cleanedSupport) return getSupportTextFallback(cleanedReply, fallback);

  const replyHasContinuation = hasConversationContinuation(cleanedReply);
  const supportHasContinuation = hasConversationContinuation(cleanedSupport);

  if (!replyHasContinuation && supportHasContinuation) {
    return getFirstSupportSentence(cleanedSupport) || getSupportTextFallback(cleanedReply, fallback);
  }

  if (cleanedSupport.length > Math.max(120, cleanedReply.length * 2)) {
    return getFirstSupportSentence(cleanedSupport) || getSupportTextFallback(cleanedReply, fallback);
  }

  return cleanedSupport;
}

function getCoachReplyFromAssessment(assessment) {
  const reply = ensureRetryReplyNarratesSentence(assessment?.coachReply, assessment);
  if (!reply) return undefined;

  return {
    reply,
    supportText: sanitizeSupportText(reply, assessment?.coachSupportText, ""),
    isDemo: false,
  };
}

function cleanFeedbackSentence(value) {
  return clampText(value, "", 500).replace(/\s+/g, " ").trim();
}

function sentenceCase(value) {
  const cleaned = cleanFeedbackSentence(value);
  if (!cleaned) return cleaned;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function withSentencePunctuation(value) {
  const cleaned = sentenceCase(value);
  if (!cleaned || /[.?!]$/.test(cleaned)) return cleaned;
  return `${cleaned}.`;
}

function simplifyFeedbackSentence(value) {
  return cleanFeedbackSentence(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getFeedbackWordCount(value) {
  const normalized = simplifyFeedbackSentence(value);
  return normalized ? normalized.split(" ").length : 0;
}

function isSmallFeedbackGreeting(value) {
  const normalized = simplifyFeedbackSentence(value);
  return ["hello", "hi", "namaste", "good morning", "good afternoon", "good evening"].includes(normalized);
}

function isUsefulLocalSavedPhrase(value) {
  return getFeedbackWordCount(value) >= 3 && !isSmallFeedbackGreeting(value);
}

function hasMeaningfulFeedbackOverlap(original, candidate) {
  const originalWords = simplifyFeedbackSentence(original).split(" ").filter((word) => word.length > 1);
  const candidateWords = new Set(simplifyFeedbackSentence(candidate).split(" ").filter((word) => word.length > 1));
  if (originalWords.length < 3 || !candidateWords.size) return false;

  const overlap = originalWords.filter((word) => candidateWords.has(word)).length;
  return overlap >= Math.max(2, Math.ceil(originalWords.length * 0.5));
}

function extractQuotedFeedbackSentences(value) {
  const suggestions = [];
  const patterns = [/"([^"]{3,180})"/g, /“([^”]{3,180})”/g];

  patterns.forEach((pattern) => {
    let match;
    while ((match = pattern.exec(value))) {
      const sentence = cleanFeedbackSentence(match[1] || "");
      if (sentence) suggestions.push(sentence);
    }
  });

  return suggestions;
}

function getCoachSuggestedFeedbackSentence(turns, original) {
  if (isSmallFeedbackGreeting(original)) return undefined;

  const lastUserIndex = turns.map((turn) => turn.speaker).lastIndexOf("user");
  if (lastUserIndex < 0) return undefined;

  const coachTurns = turns.slice(lastUserIndex + 1).filter((turn) => turn.speaker === "coach");
  for (const turn of coachTurns) {
    const matched = extractQuotedFeedbackSentences(turn.text).find((candidate) =>
      hasMeaningfulFeedbackOverlap(original, candidate)
    );
    if (matched) return withSentencePunctuation(matched);
  }

  return undefined;
}

function applyCommonLocalGrammarFixes(value) {
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

function getLocalGrammarExplanation(original, improved, hasLearnerSpeech) {
  const originalSimple = simplifyFeedbackSentence(original);
  const improvedSimple = simplifyFeedbackSentence(improved);
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

function buildLocalGrammarCorrection(original, improved, hasLearnerSpeech) {
  return {
    original: hasLearnerSpeech ? original : "No spoken answer was captured.",
    improved,
    explanation: getLocalGrammarExplanation(original, improved, hasLearnerSpeech),
  };
}

function getLocalImprovedSentence(original, focusPrompt, turns = []) {
  if (focusPrompt) return withSentencePunctuation(focusPrompt);

  const cleaned = cleanFeedbackSentence(original);
  if (!cleaned) return "I can say one short English sentence.";

  const coachSuggestion = getCoachSuggestedFeedbackSentence(turns, cleaned);
  if (coachSuggestion) return coachSuggestion;

  return withSentencePunctuation(applyCommonLocalGrammarFixes(cleaned));
}

function getLocalFeedbackRetryWords(sentence) {
  if (!isUsefulLocalSavedPhrase(sentence)) return [];

  const skipWords = new Set(["a", "an", "and", "are", "for", "i", "in", "is", "it", "of", "on", "the", "to", "you"]);
  const words = cleanFeedbackSentence(sentence)
    .toLowerCase()
    .replace(/[^a-z\s']/g, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 2 && !skipWords.has(word));

  return Array.from(new Set(words)).slice(-3);
}

function getLocalFeedbackSavedPhrases(userTexts, improved) {
  return Array.from(new Set([improved, ...userTexts.slice(-2).map((text) => getLocalImprovedSentence(text))].filter(isUsefulLocalSavedPhrase))).slice(0, 3);
}

function getLocalFeedbackMistakes(original, improved) {
  if (!cleanFeedbackSentence(original)) {
    return [];
  }

  if (simplifyFeedbackSentence(original) !== simplifyFeedbackSentence(improved)) {
    return [`Try "${improved}" instead of "${cleanFeedbackSentence(original)}".`];
  }

  return [];
}

function getTurnPronunciationChecks(turns) {
  return turns
    .filter((turn) => turn.speaker === "user" && turn.pronunciation && Number.isFinite(turn.pronunciation.score))
    .map((turn) => ({
      ...turn.pronunciation,
      score: clampNumber(turn.pronunciation.score, 0, 0, 100),
    }));
}

function getAverageFeedbackScore(scores) {
  if (!scores.length) return undefined;
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

function localFeedback(turns, context) {
  const userTexts = turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => cleanFeedbackSentence(turn.text))
    .filter(Boolean);
  const lastUserText = userTexts.at(-1) || "";
  const scenarioTitle = context?.scenario?.title;
  const focusPrompt = context?.focus?.prompt;
  const hasLearnerSpeech = userTexts.length > 0;
  const improved = getLocalImprovedSentence(lastUserText, focusPrompt, turns);
  const pronunciationChecks = getTurnPronunciationChecks(turns);
  const latestPronunciation = pronunciationChecks.at(-1);
  const pronunciationScore = getAverageFeedbackScore(pronunciationChecks.map((check) => check.score));
  const hasClearPronunciation = typeof pronunciationScore === "number" && pronunciationScore >= 85;
  const retryWords = hasClearPronunciation ? [] : latestPronunciation?.retryWords?.filter(Boolean) || getLocalFeedbackRetryWords(improved);
  const isTinyGreeting = isSmallFeedbackGreeting(lastUserText);

  return {
    pronunciation: {
      summary: latestPronunciation?.summary || (hasLearnerSpeech
        ? `Feedback is based on your last spoken sentence: "${lastUserText}". Practice slowly and keep each word separate.`
        : "No spoken learner sentence was captured in this session yet."),
      retryWords,
      score: pronunciationScore ?? (hasLearnerSpeech ? Math.min(92, 68 + userTexts.length * 4) : undefined),
      tips: latestPronunciation?.tips?.length
        ? latestPronunciation.tips
        : hasLearnerSpeech
        ? isTinyGreeting
          ? ["Keep the same clear rhythm.", "Next, try one full sentence about your day."]
          : ["Pause between words.", "Repeat your own sentence once at a slower speed."]
        : ["Say one short sentence before ending the speaking session."],
    },
    grammar: {
      improvedSentences:
        isTinyGreeting && simplifyFeedbackSentence(lastUserText) === simplifyFeedbackSentence(improved)
          ? []
          : [buildLocalGrammarCorrection(lastUserText, improved, hasLearnerSpeech)],
    },
    confidence: {
      note: hasLearnerSpeech
        ? `Good effort. You completed ${userTexts.length} speaking turn${userTexts.length === 1 ? "" : "s"}.`
        : "Start with one sentence and the app will create a personal review from it.",
      nextStep: hasLearnerSpeech
        ? scenarioTitle
          ? isTinyGreeting
            ? `Try the ${scenarioTitle} practice with one full sentence next.`
            : `Try the ${scenarioTitle} practice once more and say: "${improved}"`
          : isTinyGreeting
            ? "Next, try one full sentence about your day."
            : `Repeat this once more: "${improved}"`
        : "Say one full sentence in the speaking tab.",
      score: hasLearnerSpeech && !isTinyGreeting ? Math.min(94, 66 + userTexts.length * 6) : undefined,
    },
    savedPhrases: hasLearnerSpeech ? getLocalFeedbackSavedPhrases(userTexts, improved) : [],
    mistakes: getLocalFeedbackMistakes(lastUserText, improved),
  };
}

function personalizeFeedbackWithTurnPronunciation(feedback, turns) {
  const userTexts = turns
    .filter((turn) => turn.speaker === "user")
    .map((turn) => cleanFeedbackSentence(turn.text))
    .filter(Boolean);
  const lastUserText = userTexts.at(-1) || "";
  const localImproved = getLocalImprovedSentence(lastUserText, undefined, turns);
  const feedbackGrammarItems = Array.isArray(feedback.grammar?.improvedSentences)
    ? feedback.grammar.improvedSentences
    : [];
  const feedbackImproved = feedbackGrammarItems[0]?.improved;
  const pronunciationChecks = getTurnPronunciationChecks(turns);
  const latestPronunciation = pronunciationChecks.at(-1);
  const pronunciationScore = getAverageFeedbackScore(pronunciationChecks.map((check) => check.score));
  const hasClearPronunciation = typeof pronunciationScore === "number" && pronunciationScore >= 85;
  const hasFeedbackCorrection = feedbackGrammarItems.some(
    (item) =>
      item?.improved &&
      simplifyFeedbackSentence(item.original || lastUserText) !== simplifyFeedbackSentence(item.improved)
  );
  const hasLocalCorrection = simplifyFeedbackSentence(lastUserText) !== simplifyFeedbackSentence(localImproved);
  const hasGrammarCorrection = hasFeedbackCorrection || hasLocalCorrection;
  const improved = hasFeedbackCorrection ? feedbackImproved || localImproved : localImproved;
  const improvedSentences = hasFeedbackCorrection
    ? feedbackGrammarItems
    : hasLocalCorrection
      ? [buildLocalGrammarCorrection(lastUserText, localImproved, true)]
      : feedbackGrammarItems;
  const isTinyGreeting = isSmallFeedbackGreeting(lastUserText);
  const fallbackRetryWords = Array.isArray(feedback.pronunciation?.retryWords)
    ? feedback.pronunciation.retryWords.filter((word) => isUsefulLocalSavedPhrase(word) || getFeedbackWordCount(word) === 1)
    : [];
  const savedPhrases = Array.isArray(feedback.savedPhrases) ? feedback.savedPhrases.filter(isUsefulLocalSavedPhrase) : [];
  const mistakes = Array.isArray(feedback.mistakes)
    ? feedback.mistakes.filter((mistake) => {
        if (!cleanFeedbackSentence(mistake)) return false;
        if (isTinyGreeting && simplifyFeedbackSentence(lastUserText) === simplifyFeedbackSentence(improved)) return false;
        return simplifyFeedbackSentence(mistake) !== simplifyFeedbackSentence(`Practice this sentence again ${improved}`);
      })
    : [];

  return {
    ...feedback,
    pronunciation: {
      ...feedback.pronunciation,
      summary: latestPronunciation?.summary || feedback.pronunciation.summary,
      retryWords: latestPronunciation
        ? hasClearPronunciation
          ? []
          : latestPronunciation.retryWords.filter(Boolean)
        : hasClearPronunciation
          ? []
          : fallbackRetryWords,
      ...(pronunciationScore === undefined ? {} : { score: pronunciationScore }),
      tips: latestPronunciation?.tips?.length ? latestPronunciation.tips : feedback.pronunciation.tips,
    },
    grammar: {
      improvedSentences: hasGrammarCorrection || !isTinyGreeting ? improvedSentences : [],
    },
    confidence: {
      ...feedback.confidence,
      score: isTinyGreeting ? undefined : feedback.confidence.score,
    },
    savedPhrases,
    mistakes,
  };
}

function sanitizeCoachReply(rawOutput, fallback) {
  const parsed = extractJsonObject(rawOutput);

  if (!parsed) {
    return {
      reply: clampText(rawOutput, fallback.reply, 420),
      supportText: fallback.supportText,
      isDemo: Boolean(fallback.isDemo),
    };
  }

  const reply = clampText(parsed.reply || parsed.coachReply || parsed.message, fallback.reply, 420);

  return {
    reply,
    supportText: sanitizeSupportText(
      reply,
      parsed.supportText || parsed.hinglishSupport || parsed.support,
      fallback.supportText
    ),
    isDemo: Boolean(fallback.isDemo),
  };
}

function getSafeOpenAIError(error) {
  const status = error && typeof error === "object" && "status" in error ? error.status : undefined;
  const message = error instanceof Error ? error.message : "OpenAI request failed.";
  const safeMessage = String(message).replace(/sk-[A-Za-z0-9_-]+/g, "[redacted]");

  return {
    status: typeof status === "number" ? status : undefined,
    message: safeMessage.slice(0, 240),
  };
}

function getAudioFileDebugInfo(audioFile) {
  if (!audioFile) return undefined;

  return {
    size: audioFile.size,
    mimetype: audioFile.mimetype,
    originalname: audioFile.originalname,
  };
}

function getSafeAudioFilename(audioFile) {
  const originalName = typeof audioFile?.originalname === "string" ? audioFile.originalname : "";
  const cleaned = originalName.replace(/[^a-zA-Z0-9._-]/g, "").slice(0, 80);

  if (/\.(3gp|aac|caf|flac|m4a|mp3|mp4|mpeg|mpga|oga|ogg|opus|wav|webm)$/i.test(cleaned)) {
    return cleaned;
  }

  const extensionByMimeType = {
    "audio/3gpp": "3gp",
    "audio/aac": "aac",
    "audio/caf": "caf",
    "audio/flac": "flac",
    "audio/mp4": "m4a",
    "audio/m4a": "m4a",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/opus": "opus",
    "audio/wav": "wav",
    "audio/webm": "webm",
    "audio/x-caf": "caf",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  const extension = extensionByMimeType[audioFile?.mimetype] || "m4a";
  const baseName = cleaned.replace(/\.[^.]+$/, "") || "learner";

  return `${baseName}.${extension}`;
}

function getAudioAssessmentFormat(audioFile) {
  const originalName = typeof audioFile?.originalname === "string" ? audioFile.originalname.toLowerCase() : "";
  const mimetype = typeof audioFile?.mimetype === "string" ? audioFile.mimetype.toLowerCase() : "";

  if (mimetype.includes("wav") || originalName.endsWith(".wav")) return "wav";
  if (mimetype.includes("mpeg") || mimetype.includes("mp3") || originalName.endsWith(".mp3")) return "mp3";
  return undefined;
}

function getAudioFileExtension(audioFile) {
  const originalName = typeof audioFile?.originalname === "string" ? audioFile.originalname.toLowerCase() : "";
  const match = originalName.match(/\.([a-z0-9]+)$/i);
  return match ? match[1] : "";
}

function canConvertAudioForAssessment(audioFile) {
  const extension = getAudioFileExtension(audioFile);
  const mimetype = typeof audioFile?.mimetype === "string" ? audioFile.mimetype.toLowerCase() : "";
  const convertibleExtensions = new Set(["3gp", "aac", "caf", "flac", "m4a", "mp4", "oga", "ogg", "opus", "webm"]);
  const convertibleMimeTypes = new Set([
    "audio/3gpp",
    "audio/aac",
    "audio/caf",
    "audio/flac",
    "audio/m4a",
    "audio/mp4",
    "audio/ogg",
    "audio/opus",
    "audio/webm",
    "audio/x-caf",
    "video/mp4",
    "video/webm",
  ]);

  if (convertibleExtensions.has(extension)) return true;
  if (convertibleMimeTypes.has(mimetype)) return true;
  return mimetype.startsWith("audio/mp4") || mimetype.startsWith("video/mp4");
}

function convertAudioForAssessment(audioFile) {
  if (!ffmpegPath) {
    throw new Error("ffmpeg-static did not provide a binary path.");
  }

  const outputPath = path.join("server", "tmp", "audio", `assessment-${Date.now()}-${crypto.randomUUID()}.wav`);
  const startedAt = Date.now();
  const result = spawnSync(
    ffmpegPath,
    [
      "-y",
      "-hide_banner",
      "-loglevel",
      "error",
      "-i",
      audioFile.path,
      "-ac",
      "1",
      "-ar",
      "16000",
      "-f",
      "wav",
      outputPath,
    ],
    {
      encoding: "utf8",
      maxBuffer: 1024 * 1024,
    }
  );

  if (result.status !== 0 || !fs.existsSync(outputPath) || fs.statSync(outputPath).size < 44) {
    fs.unlink(outputPath, () => undefined);
    const detail = result.stderr || result.error?.message || "Unknown ffmpeg conversion failure.";
    throw new Error(`Audio conversion failed: ${detail.slice(0, 240)}`);
  }

  console.log("[pronunciation/assessment] converted audio for deep scoring", {
    ms: Date.now() - startedAt,
    from: {
      mimetype: audioFile.mimetype,
      originalname: audioFile.originalname,
    },
    outputBytes: fs.statSync(outputPath).size,
  });

  return {
    path: outputPath,
    format: "wav",
    cleanupPath: outputPath,
  };
}

function prepareAudioForAssessment(audioFile) {
  const directFormat = getAudioAssessmentFormat(audioFile);
  if (directFormat) {
    return {
      path: audioFile.path,
      format: directFormat,
      cleanupPath: undefined,
    };
  }

  if (!canConvertAudioForAssessment(audioFile)) {
    return undefined;
  }

  return convertAudioForAssessment(audioFile);
}

function asStringArray(value, fallback, maxItems = 5, maxLength = 120) {
  if (!Array.isArray(value)) return fallback;
  const cleaned = value
    .map((item) => clampText(item, "", maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
  return cleaned.length ? cleaned : fallback;
}

function getOptionalScore(value, fallback) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return clampNumber(value, 0, 0, 100);
  }

  return typeof fallback === "number" && Number.isFinite(fallback) ? clampNumber(fallback, 0, 0, 100) : undefined;
}

function normalizeSpeechText(value) {
  return clampText(value, "", 500)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hasMostlyNonLatinScript(value) {
  const letters = Array.from(clampText(value, "", 1200)).filter((char) => /\p{L}/u.test(char));
  if (!letters.length) return false;

  const latinLetters = letters.filter((char) => /\p{Script=Latin}/u.test(char));
  return latinLetters.length / letters.length < 0.5;
}

function getWordOverlapScore(expectedText, transcript) {
  const expectedWords = normalizeSpeechText(expectedText).split(" ").filter(Boolean);
  const heardWords = new Set(normalizeSpeechText(transcript).split(" ").filter(Boolean));
  if (!expectedWords.length || !heardWords.size) return 0;

  const matchedWords = expectedWords.filter((word) => heardWords.has(word)).length;
  return matchedWords / expectedWords.length;
}

function getEditDistance(left, right) {
  const leftLength = left.length;
  const rightLength = right.length;
  const previous = Array.from({ length: rightLength + 1 }, (_, index) => index);
  const current = new Array(rightLength + 1);

  for (let leftIndex = 1; leftIndex <= leftLength; leftIndex += 1) {
    current[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= rightLength; rightIndex += 1) {
      const cost = left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1;
      current[rightIndex] = Math.min(
        current[rightIndex - 1] + 1,
        previous[rightIndex] + 1,
        previous[rightIndex - 1] + cost
      );
    }
    for (let index = 0; index <= rightLength; index += 1) {
      previous[index] = current[index];
    }
  }

  return previous[rightLength];
}

function getPhraseSimilarityScore(expectedText, transcript) {
  const expected = normalizeSpeechText(expectedText);
  const heard = normalizeSpeechText(transcript);
  if (!expected || !heard) return 0;

  const distance = getEditDistance(expected, heard);
  return Math.max(0, 1 - distance / Math.max(expected.length, heard.length, 1));
}

function scorePronunciationAttempt(expectedText, transcript) {
  const wordScore = getWordOverlapScore(expectedText, transcript);
  const phraseScore = getPhraseSimilarityScore(expectedText, transcript);
  return clampNumber(Math.round((wordScore * 0.7 + phraseScore * 0.3) * 100), 0, 0, 100);
}

function getRetryWords(expectedText, transcript) {
  const heardWords = new Set(normalizeSpeechText(transcript).split(" ").filter(Boolean));
  return normalizeSpeechText(expectedText)
    .split(" ")
    .filter(Boolean)
    .filter((word) => !heardWords.has(word))
    .slice(0, 4);
}

function localPronunciationCheck(expectedText, transcript) {
  const score = scorePronunciationAttempt(expectedText, transcript);
  const retryWords = getRetryWords(expectedText, transcript);
  const verdict = score >= 82 ? "clear" : score >= 58 ? "practice-again" : "try-again";

  return {
    transcript: clampText(transcript, "", 500),
    expectedText: clampText(expectedText, "", 300),
    modelSentence: getPronunciationModelSentence(expectedText, transcript),
    score,
    scoringMode: "transcript",
    transcriptScore: score,
    verdict,
    summary:
      verdict === "clear"
        ? "Clear enough to continue. Your words matched the sentence well."
        : verdict === "practice-again"
          ? "Good attempt. Say it a little slower once more."
          : "Try again slowly. The app could not hear enough of the target sentence.",
    tips:
      verdict === "clear"
        ? ["Keep the same clear rhythm.", "Now try it at natural speed."]
        : ["Say each word separately once.", "Keep the phone close and speak for the full sentence."],
    retryWords,
    problemSounds: retryWords,
  };
}

function sanitizePronunciationCheck(rawOutput, fallback) {
  const parsed = extractJsonObject(rawOutput);
  if (!parsed) return fallback;

  const score = getOptionalScore(parsed.score, fallback.score) ?? fallback.score;
  const verdict = ["clear", "practice-again", "try-again"].includes(parsed.verdict) ? parsed.verdict : fallback.verdict;
  const clarityScore = getOptionalScore(parsed.clarityScore, undefined);
  const soundAccuracyScore = getOptionalScore(parsed.soundAccuracyScore, undefined);
  const rhythmScore = getOptionalScore(parsed.rhythmScore, undefined);
  const coachReply = clampText(parsed.coachReply || parsed.reply, "", 420);
  const coachSupportText = clampText(parsed.coachSupportText || parsed.supportText || parsed.hinglishSupport, "", 260);

  return {
    ...fallback,
    score,
    scoringMode: "audio",
    audioScore: score,
    verdict,
    summary: clampText(parsed.summary, fallback.summary, 240),
    tips: asStringArray(parsed.tips, fallback.tips, 3, 120),
    retryWords: asStringArray(parsed.retryWords, fallback.retryWords, 4, 40),
    problemSounds: asStringArray(parsed.problemSounds, fallback.problemSounds || [], 4, 40),
    ...(clarityScore === undefined ? {} : { clarityScore }),
    ...(soundAccuracyScore === undefined ? {} : { soundAccuracyScore }),
    ...(rhythmScore === undefined ? {} : { rhythmScore }),
    ...(coachReply ? { coachReply } : {}),
    ...(coachSupportText ? { coachSupportText } : {}),
  };
}

function sanitizeFeedback(rawOutput, fallback) {
  const parsed = extractJsonObject(rawOutput);
  if (!parsed) return fallback;

  const pronunciationScore = getOptionalScore(parsed.pronunciation?.score, fallback.pronunciation?.score);
  const pronunciationTips = asStringArray(parsed.pronunciation?.tips, fallback.pronunciation?.tips || [], 3, 120);
  const confidenceScore = getOptionalScore(parsed.confidence?.score, fallback.confidence?.score);

  const firstImproved =
    parsed.grammar &&
    typeof parsed.grammar === "object" &&
    Array.isArray(parsed.grammar.improvedSentences) &&
    parsed.grammar.improvedSentences.length
      ? parsed.grammar.improvedSentences
      : fallback.grammar.improvedSentences;

  const improvedSentences = firstImproved
    .map((item, index) => {
      const fallbackItem = fallback.grammar.improvedSentences[index] || fallback.grammar.improvedSentences[0];
      const explanation = item && typeof item.explanation === "object" ? item.explanation : {};
      return {
        original: clampText(item?.original, fallbackItem.original, 300),
        improved: clampText(item?.improved, fallbackItem.improved, 300),
        explanation: {
          "hi-Deva": clampText(explanation["hi-Deva"], fallbackItem.explanation["hi-Deva"], 300),
          "hi-Latn": clampText(explanation["hi-Latn"], fallbackItem.explanation["hi-Latn"], 300),
        },
      };
    })
    .filter((item) => item.improved)
    .slice(0, 3);

  return {
    pronunciation: {
      summary: clampText(parsed.pronunciation?.summary, fallback.pronunciation.summary, 300),
      retryWords: asStringArray(parsed.pronunciation?.retryWords, fallback.pronunciation.retryWords, 4, 40),
      ...(pronunciationScore === undefined ? {} : { score: pronunciationScore }),
      ...(pronunciationTips.length ? { tips: pronunciationTips } : {}),
    },
    grammar: {
      improvedSentences: improvedSentences.length ? improvedSentences : fallback.grammar.improvedSentences,
    },
    confidence: {
      note: clampText(parsed.confidence?.note, fallback.confidence.note, 300),
      nextStep: clampText(parsed.confidence?.nextStep, fallback.confidence.nextStep, 300),
      ...(confidenceScore === undefined ? {} : { score: confidenceScore }),
    },
    savedPhrases: asStringArray(parsed.savedPhrases, fallback.savedPhrases, 5, 120),
    mistakes: asStringArray(parsed.mistakes, fallback.mistakes, 5, 160),
  };
}

async function createCoachReply({ instructions, learnerText, turns = [], pronunciation }) {
  const fallback = localCoachReply(learnerText, turns, pronunciation);
  if (!openai) {
    return fallback;
  }

  const conversationText = formatConversationTurns(turns);
  const pronunciationContext = formatPronunciationContext(pronunciation);
  try {
    const textResult = await withTimeout(
      openai.responses.create({
        model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
        instructions: withStructuredCoachInstructions(instructions),
        text: {
          format: {
            type: "json_schema",
            name: "coach_reply",
            schema: coachReplyJsonSchema,
            strict: true,
          },
        },
        input:
          "The learner just wrote or spoke in a spoken English practice session. Use the conversation so far for context. " +
          "Reply naturally in simple Indian English. Keep the learner moving. Use one gentle correction only if useful. " +
          "If the current learner turn is a greeting or question addressed to you, answer it directly as the coach or roleplay partner. " +
          "Do not ask the learner to say the answer to her own question. " +
          'If she needs wording help, the reply can include: Say: "one natural English sentence." Otherwise continue naturally with a tiny follow-up question.\n\n' +
          `Conversation so far:\n${conversationText}\n\nCurrent learner turn:\n${learnerText}\n\n${pronunciationContext}`,
      }),
      voiceReplyTimeoutMs,
      "Coach reply"
    );

    openaiLastError = null;
    return {
      ...sanitizeCoachReply(textResult.output_text, fallback),
      isDemo: false,
    };
  } catch (error) {
    openaiLastError = getSafeOpenAIError(error);
    return {
      ...fallback,
      isDemo: true,
      openAIError: openaiLastError,
    };
  }
}

async function createCoachAudioUrl({ request, reply }) {
  if (!openai) return undefined;

  try {
    const speech = await withTimeout(
      openai.audio.speech.create({
        model: process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts",
        voice: process.env.OPENAI_TTS_VOICE || "alloy",
        input: reply,
        response_format: "mp3",
      }),
      voiceTtsTimeoutMs,
      "Coach audio"
    );
    const speechBuffer = Buffer.from(await speech.arrayBuffer());
    const audioName = `coach-${Date.now()}.mp3`;
    fs.writeFileSync(`server/tmp/audio/${audioName}`, speechBuffer);
    openaiLastError = null;
    return `${request.protocol}://${request.get("host")}/audio/${audioName}`;
  } catch (error) {
    openaiLastError = getSafeOpenAIError(error);
    return undefined;
  }
}

async function transcribeAudioFile(audioFile) {
  const transcriptionFile = await toFile(
    fs.createReadStream(audioFile.path),
    getSafeAudioFilename(audioFile),
    audioFile.mimetype ? { type: audioFile.mimetype } : undefined
  );
  const transcriptResult = await withTimeout(
    openai.audio.transcriptions.create({
      file: transcriptionFile,
      model: process.env.OPENAI_TRANSCRIBE_MODEL || "gpt-4o-mini-transcribe",
      language: transcriptionLanguage,
      prompt: transcriptionPrompt,
    }),
    voiceTranscriptionTimeoutMs,
    "Transcription"
  );
  openaiLastError = null;
  const transcript = clampText(transcriptResult.text, "", 1200);
  return hasMostlyNonLatinScript(transcript) ? "" : transcript;
}

async function createAudioPronunciationAssessment({ audioFile, expectedText, transcript, fallback, coachContext }) {
  if (!openai) {
    return fallback;
  }

  let assessmentAudio;
  try {
    assessmentAudio = prepareAudioForAssessment(audioFile);
  } catch (error) {
    console.error("[pronunciation/assessment] audio conversion failed", {
      error: error instanceof Error ? error.message : String(error),
      audio: getAudioFileDebugInfo(audioFile),
    });
    return {
      ...fallback,
      summary: "Deep audio scoring could not convert this recording, so this attempt used transcript-only scoring.",
    };
  }

  if (!assessmentAudio) {
    return {
      ...fallback,
      summary: "Deep audio scoring needs a WAV/MP3 recording, or an M4A/AAC-style recording the server can convert. Using transcript-only scoring for this attempt.",
    };
  }

  const base64Audio = fs.readFileSync(assessmentAudio.path).toString("base64");
  const transcriptScore = fallback.transcriptScore ?? fallback.score;

  try {
    const assessmentResult = await withTimeout(
      openai.chat.completions.create({
        model: process.env.OPENAI_AUDIO_ASSESSMENT_MODEL || "gpt-audio-1.5",
        modalities: ["text"],
        messages: [
          {
            role: "system",
            content:
              "You are Kavi ki Vidya's pronunciation assessor and warm Indian woman English speaking coach for Indian learners. Listen to the learner audio itself. Be accent-aware and supportive, but strict about whether the target sentence was pronounced clearly enough for a real listener.",
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text:
                  "Assess this pronunciation attempt. Do not rely only on the transcript; use the audio for clarity, sounds, syllables, stress, rhythm, and missing words. " +
                  "Return only JSON with score, verdict, summary, tips, retryWords, problemSounds, clarityScore, soundAccuracyScore, rhythmScore, coachReply, and coachSupportText. " +
                  "Use score 85-100 only when the full sentence is clearly understandable. Use 60-84 when understandable but noticeably unclear. Use below 60 when key words or sounds are unclear. " +
                  'verdict must be "clear", "practice-again", or "try-again". Tips must be short next-attempt actions. ' +
                  "coachReply should be the next thing the coach says. If verdict is clear, do not ask for the same sentence again; answer greetings/questions directly and continue with a tiny related question. " +
                  'If verdict is practice-again or try-again, coachReply must first narrate the full correct model sentence after Listen:, for example: Listen: "I want to talk to the teacher." Then give one specific tip and ask for one repeat. Do not only mention isolated letters or sounds. ' +
                  "coachSupportText should be one short Hindi/Hinglish meaning of coachReply only. It must not add any question, instruction, or conversation continuation that is missing from coachReply.\n\n" +
                  `Expected sentence: ${expectedText}\nTranscript from ASR: ${transcript}\nTranscript-match score: ${transcriptScore}\n\n${coachContext || ""}`,
              },
              {
                type: "input_audio",
                input_audio: {
                  data: base64Audio,
                  format: assessmentAudio.format,
                },
              },
            ],
          },
        ],
      }),
      voiceAssessmentTimeoutMs,
      "Pronunciation assessment"
    );

    const audioAssessment = sanitizePronunciationCheck(assessmentResult.choices[0]?.message?.content, fallback);
    const audioScore = audioAssessment.audioScore ?? audioAssessment.score;
    const finalScore = Math.round(audioScore * 0.78 + transcriptScore * 0.22);
    const verdict = finalScore >= 85 ? "clear" : finalScore >= 62 ? "practice-again" : "try-again";
    openaiLastError = null;

    return {
      ...audioAssessment,
      score: finalScore,
      audioScore,
      transcriptScore,
      verdict,
      scoringMode: "audio",
    };
  } catch (error) {
    openaiLastError = getSafeOpenAIError(error);
    console.error("[pronunciation/assessment] deep audio scoring failed", {
      error: openaiLastError,
      audio: getAudioFileDebugInfo(audioFile),
      format: assessmentAudio.format,
    });
    return {
      ...fallback,
      summary: "Deep audio scoring was unavailable, so this attempt used transcript-only scoring.",
    };
  } finally {
    if (assessmentAudio.cleanupPath) {
      fs.unlink(assessmentAudio.cleanupPath, () => undefined);
    }
  }
}

app.post("/api/audio/sentence", async (request, response) => {
  try {
    const text = clampText(request.body?.text, "", 300);
    if (!text) {
      response.status(400).json({ error: "Sentence audio request must include text." });
      return;
    }

    const audioUrl = await createCoachAudioUrl({ request, reply: text });
    response.json({
      audioUrl,
      isDemo: !audioUrl,
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Sentence audio failed." });
  }
});

app.post("/api/pronunciation/check", upload.single("audio"), async (request, response) => {
  const audioFile = request.file;
  if (!audioFile) {
    response.status(400).json({ error: "Missing audio file." });
    return;
  }

  try {
    const expectedText = clampText(request.body?.expectedText, "", 300);
    const audioDebug = getAudioFileDebugInfo(audioFile);

    if (!expectedText) {
      response.status(400).json({ error: "Pronunciation check must include expectedText." });
      return;
    }

    if (!audioFile.size || audioFile.size < 1000) {
      response.status(422).json({
        error: "Recording was empty or too short.",
        detail: "Record the full sentence before stopping.",
        audio: audioDebug,
      });
      return;
    }

    if (!openai) {
      response.json({
        ...localPronunciationCheck(expectedText, expectedText),
        isDemo: true,
      });
      return;
    }

    let transcript = "";
    try {
      transcript = await transcribeAudioFile(audioFile);
    } catch (error) {
      openaiLastError = getSafeOpenAIError(error);
      console.error("[pronunciation/check] transcription failed", { error: openaiLastError, audio: audioDebug });
      response.status(502).json({
        error: "Could not transcribe recording.",
        detail: openaiLastError.message,
        audio: audioDebug,
      });
      return;
    }

    if (!transcript) {
      response.status(422).json({
        error: "Could not hear speech in this recording.",
        detail: "Try speaking closer to the microphone, then stop after one clear sentence.",
        audio: audioDebug,
      });
      return;
    }

    const fallback = localPronunciationCheck(expectedText, transcript);

    const assessment = await createAudioPronunciationAssessment({
      audioFile,
      expectedText,
      transcript,
      fallback,
    });

    response.json({
      ...assessment,
      transcript,
      expectedText,
      isDemo: assessment.scoringMode !== "audio",
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Pronunciation check failed." });
  } finally {
    fs.unlink(audioFile.path, () => undefined);
  }
});

app.post("/api/realtime/session", async (request, response) => {
  if (!process.env.OPENAI_API_KEY) {
    response.status(501).json({ error: "OPENAI_API_KEY is not configured." });
    return;
  }

  try {
    const instructions = clampText(
      request.body?.instructions,
      "You are a supportive English speaking coach.",
      2000
    );
    const sessionResponse = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createRealtimeSessionConfig(instructions)),
    });

    const payload = await sessionResponse.json();
    if (!sessionResponse.ok) {
      response.status(sessionResponse.status).json(payload);
      return;
    }

    response.json({
      clientSecret: payload.client_secret?.value,
      expiresAt: payload.client_secret?.expires_at,
      model: payload.model,
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Realtime session failed." });
  }
});

app.post("/api/realtime/call", express.text({ type: ["application/sdp", "text/plain"], limit: "256kb" }), async (request, response) => {
  if (!process.env.OPENAI_API_KEY) {
    response.status(501).type("text/plain").send("OPENAI_API_KEY is not configured.");
    return;
  }

  const offerSdp = normalizeSdpText(request.body);
  if (!offerSdp) {
    response.status(400).type("text/plain").send("Realtime call requires an SDP offer body.");
    return;
  }

  const invalidOffer = validateWebRtcOfferSdp(offerSdp);
  if (invalidOffer) {
    response.status(400).json({
      error: "Realtime call received an invalid WebRTC SDP offer before contacting OpenAI.",
      detail: `Missing SDP fields: ${invalidOffer.missing.join(", ")}`,
      length: invalidOffer.length,
      preview: invalidOffer.preview,
    });
    return;
  }

  try {
    const rawInstructions = Array.isArray(request.headers["x-kavi-instructions"])
      ? request.headers["x-kavi-instructions"][0]
      : request.headers["x-kavi-instructions"];
    const instructions = clampText(rawInstructions, "You are a supportive English speaking coach.", 3500);
    const fd = new FormData();
    fd.set("sdp", offerSdp);
    fd.set(
      "session",
      JSON.stringify(createRealtimeSessionConfig(instructions))
    );

    const callResponse = await fetch("https://api.openai.com/v1/realtime/calls", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: fd,
    });
    const answerSdp = await callResponse.text();
    if (!callResponse.ok) {
      openaiLastError = {
        status: callResponse.status,
        message: answerSdp.slice(0, 240),
      };
      response.status(callResponse.status).type("text/plain").send(answerSdp);
      return;
    }

    openaiLastError = null;
    response.type("application/sdp").send(answerSdp);
  } catch (error) {
    openaiLastError = getSafeOpenAIError(error);
    response.status(500).type("text/plain").send(error instanceof Error ? error.message : "Realtime call failed.");
  }
});

app.post("/api/voice/turn", upload.single("audio"), async (request, response) => {
  const audioFile = request.file;
  if (!audioFile) {
    response.status(400).json({ error: "Missing audio file." });
    return;
  }

  try {
    const startedAt = Date.now();
    const instructions = clampText(
      request.body?.instructions,
      "You are a supportive English speaking coach.",
      2000
    );
    const turns = parseConversationTurns(request.body?.turns ?? request.body?.conversationTurns);
    const audioDebug = getAudioFileDebugInfo(audioFile);

    console.log("[voice/turn] received audio", audioDebug);

    if (!audioFile.size || audioFile.size < 1000) {
      response.status(422).json({
        error: "Recording was empty or too short.",
        detail: "Check the Simulator audio input and try speaking for at least one second before stopping.",
        audio: audioDebug,
      });
      return;
    }

    if (!openai) {
      const transcript = "I want talk teacher.";
      const pronunciation = localPronunciationCheck(transcript, transcript);
      const coach = localCoachReply(transcript, turns, pronunciation);

      response.json({
        transcript,
        reply: coach.reply,
        supportText: coach.supportText,
        pronunciation,
        isDemo: true,
      });
      return;
    }

    let transcript = "";
    try {
      transcript = await transcribeAudioFile(audioFile);
      console.log("[voice/turn] transcribed", { ms: Date.now() - startedAt, transcript: transcript.slice(0, 80) });
    } catch (error) {
      openaiLastError = getSafeOpenAIError(error);
      console.error("[voice/turn] transcription failed", { error: openaiLastError, audio: audioDebug });
      response.status(502).json({
        error: "Could not transcribe recording.",
        detail: openaiLastError.message,
        audio: audioDebug,
      });
      return;
    }

    if (!transcript) {
      response.status(422).json({
        error: "Could not hear speech in this recording.",
        detail: "Try speaking closer to the microphone, then stop recording after one clear sentence.",
        audio: audioDebug,
      });
      return;
    }

    const expectedText = clampText(request.body?.expectedText, "", 300) || transcript;
    const fallback = localPronunciationCheck(expectedText, transcript);
    const conversationText = formatConversationTurns(turns);
    const coachContext =
      `${withTeachingStructureInstructions(instructions)}\n\n` +
      "The learner just spoke in a spoken English practice session. " +
      "Use the conversation so far for context. Reply naturally in simple Indian English. " +
      "If the current learner turn is a greeting or question addressed to you, answer it directly as the coach or roleplay partner. " +
      "Do not ask the learner to say the answer to her own question. Use one gentle correction only if useful.\n\n" +
      `Conversation so far:\n${conversationText}\n\nCurrent learner turn:\n${transcript}`;
    const pronunciation = await createAudioPronunciationAssessment({
      audioFile,
      expectedText,
      transcript,
      fallback,
      coachContext,
    });
    console.log("[voice/turn] pronunciation ready", {
      ms: Date.now() - startedAt,
      score: pronunciation.score,
      mode: pronunciation.scoringMode,
    });

    const coach = getCoachReplyFromAssessment(pronunciation) || await createCoachReply({ instructions, learnerText: transcript, turns, pronunciation });
    const audioUrl = await createCoachAudioUrl({ request, reply: coach.reply });
    const { coachReply, coachSupportText, ...pronunciationForClient } = pronunciation;
    console.log("[voice/turn] completed", {
      ms: Date.now() - startedAt,
      hasAudio: Boolean(audioUrl),
      demo: Boolean(coach.isDemo) || pronunciation.scoringMode !== "audio",
    });

    response.json({
      transcript,
      reply: coach.reply,
      supportText: coach.supportText,
      audioUrl,
      pronunciation: {
        ...pronunciationForClient,
        transcript,
        expectedText,
        isDemo: pronunciation.scoringMode !== "audio",
      },
      isDemo: Boolean(coach.isDemo),
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Voice turn failed." });
  } finally {
    fs.unlink(audioFile.path, () => undefined);
  }
});

app.post("/api/text/turn", async (request, response) => {
  try {
    const instructions = clampText(
      request.body?.instructions,
      "You are a supportive English speaking coach.",
      2000
    );
    const learnerText = clampText(request.body?.text, "", 1200);
    const turns = parseConversationTurns(request.body?.turns ?? request.body?.conversationTurns);
    const coach = await createCoachReply({ instructions, learnerText, turns });
    const audioUrl = await createCoachAudioUrl({ request, reply: coach.reply });

    response.json({
      transcript: learnerText,
      reply: coach.reply,
      supportText: coach.supportText,
      audioUrl,
      isDemo: Boolean(coach.isDemo),
    });
  } catch (error) {
    response.status(500).json({ error: error instanceof Error ? error.message : "Text turn failed." });
  }
});

app.post("/api/feedback/session", async (request, response) => {
  const turns = parseConversationTurns(request.body?.turns);
  const context = parseSessionContext(request.body?.context);
  const fallback = localFeedback(turns, context);
  if (!openai) {
    response.json(personalizeFeedbackWithTurnPronunciation(fallback, turns));
    return;
  }

  try {
    const instructions =
      "You are Kavi ki Vidya's warm Indian woman English speaking coach. Give concise, supportive feedback for an absolute beginner. Return JSON only.";
    const feedbackResult = await openai.responses.create({
      model: process.env.OPENAI_TEXT_MODEL || "gpt-4.1-mini",
      instructions,
      text: {
        format: {
          type: "json_schema",
          name: "speaking_feedback",
          schema: feedbackJsonSchema,
          strict: true,
        },
      },
      input:
        "Create a JSON feedback object for an absolute beginner Indian homemaker learning spoken English. " +
        "Return only valid JSON with pronunciation.summary, pronunciation.retryWords, pronunciation.score, " +
        "pronunciation.tips, grammar.improvedSentences, confidence.note, confidence.nextStep, confidence.score, savedPhrases, and mistakes. " +
        "Keep feedback supportive and practical. Pronunciation score should be encouraging and realistic from 0 to 100, " +
        "and pronunciation tips should be short next-attempt actions. " +
        "For grammar.improvedSentences, include original, improved, and explanation with hi-Deva and hi-Latn. " +
        "Use the mode and scenario context when choosing the next step.\n\n" +
        `Session context: ${formatSessionContext(context)}\n\nConversation:\n${formatConversationTurns(turns)}`,
    });

    response.json(personalizeFeedbackWithTurnPronunciation(sanitizeFeedback(feedbackResult.output_text, fallback), turns));
  } catch (error) {
    response.json(personalizeFeedbackWithTurnPronunciation(fallback, turns));
  }
});

function getRealtimeWebSocketInstructions(request) {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    return clampText(url.searchParams.get("instructions"), "You are a supportive English speaking coach.", 3500);
  } catch {
    return "You are a supportive English speaking coach.";
  }
}

function getRealtimeWebSocketInputRate(request) {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    return getRealtimeAudioRate(url.searchParams.get("inputRate"), 24000);
  } catch {
    return 24000;
  }
}

function getRealtimeWebSocketTurnDetection(request) {
  try {
    const url = new URL(request.url || "", `http://${request.headers.host || "localhost"}`);
    return url.searchParams.get("turnDetection") === "manual" ? "manual" : "server_vad";
  } catch {
    return "server_vad";
  }
}

function getRealtimeWebSocketUrl() {
  const model = encodeURIComponent(process.env.OPENAI_REALTIME_MODEL || "gpt-realtime");
  return `wss://api.openai.com/v1/realtime?model=${model}`;
}

function sendSocketJson(socket, payload) {
  if (socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function readUInt16LE(buffer, offset) {
  return offset + 2 <= buffer.length ? buffer.readUInt16LE(offset) : undefined;
}

function readUInt32LE(buffer, offset) {
  return offset + 4 <= buffer.length ? buffer.readUInt32LE(offset) : undefined;
}

function prepareRealtimeInputAudio(event, fallbackRate) {
  const encodedAudio = clampRawText(event?.audio, "", 20 * 1024 * 1024);
  if (!encodedAudio) {
    throw new Error("Missing audio for Realtime input.");
  }

  const sourceBuffer = Buffer.from(encodedAudio.replace(/^data:audio\/[^;]+;base64,/, ""), "base64");
  const isWav = event?.format === "wav" || sourceBuffer.subarray(0, 4).toString("ascii") === "RIFF";
  if (!isWav) {
    const audioBuffer = Buffer.from(sourceBuffer);
    if (process.env.KAVI_REALTIME_WS_DEBUG === "1") {
      console.log("[realtime-ws] forwarding raw audio", {
        bytes: audioBuffer.length,
        rate: getRealtimeAudioRate(event?.rate, fallbackRate),
      });
    }
    return {
      audio: audioBuffer.toString("base64"),
      rate: getRealtimeAudioRate(event?.rate, fallbackRate),
    };
  }

  if (sourceBuffer.subarray(8, 12).toString("ascii") !== "WAVE") {
    throw new Error("Realtime input audio is not a valid WAV file.");
  }

  let offset = 12;
  let sampleRate = fallbackRate;
  let channels = 1;
  let bitsPerSample = 16;
  let dataBuffer = null;

  while (offset + 8 <= sourceBuffer.length) {
    const chunkId = sourceBuffer.subarray(offset, offset + 4).toString("ascii");
    const chunkSize = readUInt32LE(sourceBuffer, offset + 4) || 0;
    const chunkStart = offset + 8;
    const chunkEnd = Math.min(chunkStart + chunkSize, sourceBuffer.length);

    if (chunkId === "fmt ") {
      channels = readUInt16LE(sourceBuffer, chunkStart + 2) || channels;
      sampleRate = readUInt32LE(sourceBuffer, chunkStart + 4) || sampleRate;
      bitsPerSample = readUInt16LE(sourceBuffer, chunkStart + 14) || bitsPerSample;
    }

    if (chunkId === "data") {
      dataBuffer = sourceBuffer.subarray(chunkStart, chunkEnd);
      break;
    }

    offset = chunkStart + chunkSize + (chunkSize % 2);
  }

  if (!dataBuffer?.length) {
    throw new Error("Realtime input WAV did not include audio data.");
  }

  if (channels !== 1 || bitsPerSample !== 16) {
    throw new Error(`Realtime input WAV must be mono 16-bit PCM. Got ${channels} channel(s), ${bitsPerSample}-bit.`);
  }

  const audioBuffer = Buffer.from(dataBuffer);
  if (process.env.KAVI_REALTIME_WS_DEBUG === "1") {
    console.log("[realtime-ws] extracted wav audio", {
      sourceBytes: sourceBuffer.length,
      audioBytes: audioBuffer.length,
      sampleRate,
      channels,
      bitsPerSample,
    });
  }

  return {
    audio: audioBuffer.toString("base64"),
    rate: getRealtimeAudioRate(event?.rate, sampleRate),
  };
}

function installRealtimeWebSocketBridge(httpServer) {
  const realtimeSocketServer = new WebSocketServer({
    server: httpServer,
    path: "/api/realtime/ws",
  });

  realtimeSocketServer.on("connection", (clientSocket, request) => {
    if (!process.env.OPENAI_API_KEY) {
      sendSocketJson(clientSocket, {
        type: "error",
        error: {
          message: "OPENAI_API_KEY is not configured.",
        },
      });
      clientSocket.close(1011, "missing key");
      return;
    }

    const pendingClientEvents = [];
    const initialInstructions = getRealtimeWebSocketInstructions(request);
    const initialInputRate = getRealtimeWebSocketInputRate(request);
    const turnDetection = getRealtimeWebSocketTurnDetection(request);
    const upstreamSocket = new WebSocket(getRealtimeWebSocketUrl(), {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
    });

    function queueOrSendUpstream(rawEvent) {
      if (upstreamSocket.readyState === WebSocket.OPEN) {
        upstreamSocket.send(rawEvent);
        return;
      }

      if (upstreamSocket.readyState === WebSocket.CONNECTING) {
        pendingClientEvents.push(rawEvent);
        return;
      }

      sendSocketJson(clientSocket, {
        type: "error",
        error: {
          message: "Realtime connection is not open.",
        },
      });
    }

    upstreamSocket.on("open", () => {
      upstreamSocket.send(JSON.stringify(createRealtimeSessionUpdate(initialInstructions, { inputRate: initialInputRate, turnDetection })));
      while (pendingClientEvents.length) {
        upstreamSocket.send(pendingClientEvents.shift());
      }
      sendSocketJson(clientSocket, {
        type: "kavi.bridge.opened",
      });
    });

    upstreamSocket.on("message", (data, isBinary) => {
      if (clientSocket.readyState !== WebSocket.OPEN) return;
      clientSocket.send(isBinary ? data : data.toString());
    });

    upstreamSocket.on("error", (error) => {
      openaiLastError = getSafeOpenAIError(error);
      sendSocketJson(clientSocket, {
        type: "error",
        error: {
          message: openaiLastError.message,
          status: openaiLastError.status,
        },
      });
    });

    upstreamSocket.on("close", (code, reasonBuffer) => {
      const reason = reasonBuffer.toString().slice(0, 160);
      if (clientSocket.readyState === WebSocket.OPEN) {
        sendSocketJson(clientSocket, {
          type: "kavi.bridge.closed",
          code,
          reason,
        });
        clientSocket.close(code === 1000 ? 1000 : 1011, "upstream closed");
      }
    });

    clientSocket.on("message", (data, isBinary) => {
      if (isBinary) {
        sendSocketJson(clientSocket, {
          type: "error",
          error: {
            message: "Send Realtime client events as JSON text. Audio chunks should use input_audio_buffer.append with base64 audio.",
          },
        });
        return;
      }

      const rawEvent = data.toString();
      let event;
      try {
        event = JSON.parse(rawEvent);
      } catch {
        sendSocketJson(clientSocket, {
          type: "error",
          error: {
            message: "Realtime WebSocket messages must be valid JSON.",
          },
        });
        return;
      }

      if (event?.type === "kavi.session.update") {
        const nextInstructions = clampText(event.instructions, initialInstructions, 3500);
        queueOrSendUpstream(JSON.stringify(createRealtimeInstructionsUpdate(nextInstructions)));
        return;
      }

      if (event?.type === "kavi.input_audio") {
        try {
          const preparedAudio = prepareRealtimeInputAudio(event, initialInputRate);
          if (preparedAudio.rate !== initialInputRate) {
            queueOrSendUpstream(JSON.stringify(createRealtimeInputFormatUpdate(preparedAudio.rate)));
          }
          queueOrSendUpstream(JSON.stringify({ type: "input_audio_buffer.clear" }));
          queueOrSendUpstream(JSON.stringify({ type: "input_audio_buffer.append", audio: preparedAudio.audio }));
          queueOrSendUpstream(JSON.stringify({ type: "input_audio_buffer.commit" }));
          if (event.createResponse !== false) {
            queueOrSendUpstream(
              JSON.stringify({
                type: "response.create",
                response: {
                  instructions: clampText(
                    event.responseInstructions,
                    "Answer the learner's last turn in one short English (India) reply. Add Hindi/Hinglish support only if useful. Ask one tiny follow-up question.",
                    600
                  ),
                },
              })
            );
          }
        } catch (error) {
          sendSocketJson(clientSocket, {
            type: "error",
            error: {
              message: error instanceof Error ? error.message : "Could not prepare Realtime input audio.",
            },
          });
        }
        return;
      }

      queueOrSendUpstream(rawEvent);
    });

    clientSocket.on("close", () => {
      if (upstreamSocket.readyState === WebSocket.CONNECTING || upstreamSocket.readyState === WebSocket.OPEN) {
        upstreamSocket.close(1000, "client closed");
      }
    });
  });
}

const server = app.listen(port, () => {
  console.log(`Kavi ki Vidya dev server running on http://localhost:${port}`);
});

installRealtimeWebSocketBridge(server);
