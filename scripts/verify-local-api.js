#!/usr/bin/env node

const http = require("node:http");
const https = require("node:https");
const WebSocket = require("ws");

const configuredBaseUrl =
  process.env.LOCAL_API_BASE_URL || process.env.API_BASE_URL || process.env.EXPO_PUBLIC_API_BASE_URL || "http://127.0.0.1:8787";

function getRootBaseUrl(value) {
  const trimmed = String(value).replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed.slice(0, -"/api".length) : trimmed;
}

const rootBaseUrl = getRootBaseUrl(configuredBaseUrl);
const profileId = process.env.VERIFY_PROFILE_ID || "verify-local-api";

function progressUrl(id = profileId) {
  return `${rootBaseUrl}/api/progress/${encodeURIComponent(id)}`;
}

function authUrl(path) {
  return `${rootBaseUrl}/api/auth/${path.replace(/^\/+/, "")}`;
}

async function requestJson(url, options) {
  const urlObject = new URL(url);
  const transport = urlObject.protocol === "https:" ? https : http;
  const body = options?.body;

  const response = await new Promise((resolve, reject) => {
    const request = transport.request(
      urlObject,
      {
        method: options?.method || "GET",
        headers: {
          ...(options?.headers || {}),
          ...(body ? { "Content-Length": Buffer.byteLength(body) } : {}),
        },
      },
      (incoming) => {
        let text = "";
        incoming.setEncoding("utf8");
        incoming.on("data", (chunk) => {
          text += chunk;
        });
        incoming.on("end", () => {
          resolve({
            status: incoming.statusCode || 0,
            text,
          });
        });
      }
    );

    request.on("error", reject);
    if (body) request.write(body);
    request.end();
  }).catch((error) => {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Could not reach ${rootBaseUrl}. Start the local API with "npm run server" and retry. Detail: ${detail}`);
  });

  let json = {};
  if (response.text) {
    try {
      json = JSON.parse(response.text);
    } catch {
      throw new Error(`Expected JSON from ${url}, got: ${response.text.slice(0, 120)}`);
    }
  }

  return {
    response: { status: response.status },
    json,
  };
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function expectStatus(label, status, url, options) {
  const { response, json } = await requestJson(url, options);
  assert(response.status === status, `${label} expected HTTP ${status}, got ${response.status}: ${JSON.stringify(json)}`);
  return json;
}

function getRealtimeWebSocketUrl() {
  const url = new URL(rootBaseUrl);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = "/api/realtime/ws";
  url.searchParams.set("instructions", "You are a concise English speaking coach.");
  return url.toString();
}

function getManualRealtimeWebSocketUrl() {
  const url = new URL(getRealtimeWebSocketUrl());
  url.searchParams.set("turnDetection", "manual");
  return url.toString();
}

function createToneWavBase64(durationMs = 300, rate = 24000) {
  const samples = Math.floor((rate * durationMs) / 1000);
  const data = Buffer.alloc(samples * 2);
  for (let index = 0; index < samples; index += 1) {
    const sample = Math.round(Math.sin((2 * Math.PI * 440 * index) / rate) * 8000);
    data.writeInt16LE(sample, index * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]).toString("base64");
}

async function verifyRealtimeWebSocketSession() {
  const events = [];
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(getRealtimeWebSocketUrl());
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`Realtime WebSocket did not confirm session.updated. Events: ${JSON.stringify(events)}`));
    }, 15000);

    socket.on("message", (data) => {
      let event;
      try {
        event = JSON.parse(data.toString());
      } catch {
        return;
      }

      events.push({
        type: event.type,
        error: event.error?.message,
        code: event.error?.code,
        model: event.session?.model,
      });

      if (event.type === "session.updated") {
        clearTimeout(timeout);
        socket.close();
        resolve();
        return;
      }

      if (event.type === "error") {
        clearTimeout(timeout);
        socket.close();
        reject(new Error(`Realtime WebSocket returned error: ${event.error?.message || JSON.stringify(event)}`));
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  console.log("OK realtime WebSocket session updated");
}

async function verifyRealtimeWebSocketAudioTurn() {
  const events = [];
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(getManualRealtimeWebSocketUrl());
    let sentAudio = false;
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`Realtime WebSocket did not commit audio. Events: ${JSON.stringify(events)}`));
    }, 15000);

    socket.on("message", (data) => {
      let event;
      try {
        event = JSON.parse(data.toString());
      } catch {
        return;
      }

      events.push({
        type: event.type,
        error: event.error?.message,
        code: event.error?.code,
      });

      if (event.type === "session.updated" && !sentAudio) {
        sentAudio = true;
        socket.send(
          JSON.stringify({
            type: "kavi.input_audio",
            format: "wav",
            rate: 24000,
            audio: createToneWavBase64(),
            createResponse: false,
          })
        );
        return;
      }

      if (event.type === "input_audio_buffer.committed") {
        clearTimeout(timeout);
        socket.close();
        resolve();
        return;
      }

      if (event.type === "error") {
        clearTimeout(timeout);
        socket.close();
        reject(new Error(`Realtime WebSocket audio turn returned error: ${event.error?.message || JSON.stringify(event)}`));
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  console.log("OK realtime WebSocket audio turn committed");
}

async function verifyRealtimeWebSocketTextResponse() {
  const events = [];
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(getManualRealtimeWebSocketUrl());
    let sentText = false;
    let sawAudio = false;
    let sawTranscript = false;
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error(`Realtime WebSocket did not return a coach response. Events: ${JSON.stringify(events)}`));
    }, 20000);

    socket.on("message", (data) => {
      let event;
      try {
        event = JSON.parse(data.toString());
      } catch {
        return;
      }

      events.push({
        type: event.type,
        error: event.error?.message,
        code: event.error?.code,
      });

      if (event.type === "session.updated" && !sentText) {
        sentText = true;
        socket.send(
          JSON.stringify({
            type: "conversation.item.create",
            item: {
              type: "message",
              role: "user",
              content: [{ type: "input_text", text: "Hello, how are you?" }],
            },
          })
        );
        socket.send(
          JSON.stringify({
            type: "response.create",
            response: {
              instructions: "Reply with one short spoken sentence in English.",
            },
          })
        );
        return;
      }

      if (event.type === "response.output_audio.delta" || event.type === "response.audio.delta") {
        sawAudio = true;
      }

      if (event.type === "response.output_audio_transcript.delta" || event.type === "response.audio_transcript.delta") {
        sawTranscript = true;
      }

      if (event.type === "response.done") {
        clearTimeout(timeout);
        socket.close();
        assert(sawAudio, "Realtime coach response should include audio deltas.");
        assert(sawTranscript, "Realtime coach response should include transcript deltas.");
        resolve();
        return;
      }

      if (event.type === "error") {
        clearTimeout(timeout);
        socket.close();
        reject(new Error(`Realtime WebSocket text response returned error: ${event.error?.message || JSON.stringify(event)}`));
      }
    });

    socket.on("error", (error) => {
      clearTimeout(timeout);
      reject(error);
    });
  });

  console.log("OK realtime WebSocket coach response returned audio and transcript");
}

async function main() {
  console.log(`Verifying local API at ${rootBaseUrl}`);

  const health = await expectStatus("GET /health", 200, `${rootBaseUrl}/health`);
  assert(health.ok === true, "Health response should include ok: true.");
  assert(
    ["file-json", "supabase-rest"].includes(health.progressStorage?.provider),
    "Health response should describe the progress storage provider."
  );
  assert(health.realtimeWebSocket === true, "Health response should expose realtimeWebSocket: true.");
  console.log(`OK /health mode=${health.mode || "unknown"}`);

  if (health.openAIAvailable) {
    await verifyRealtimeWebSocketSession();
    await verifyRealtimeWebSocketAudioTurn();
    await verifyRealtimeWebSocketTextResponse();
  } else {
    console.log("SKIP realtime WebSocket: OpenAI is not available.");
  }

  await expectStatus("GET invalid profile", 400, progressUrl("bad.profile"));
  await expectStatus("PUT missing progress", 400, progressUrl(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Direct body should be rejected" }),
  });
  await expectStatus("PUT invalid progress shape", 400, progressUrl(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress: [] }),
  });
  await expectStatus("PUT invalid field type", 400, progressUrl(), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ progress: { dailyGoalMinutes: "5" } }),
  });
  await expectStatus("GET invalid bearer session", 401, progressUrl(), {
    headers: { Authorization: "Bearer missing-session" },
  });
  console.log("OK invalid progress requests return 400");

  const progress = {
    isSignedIn: true,
    hasCompletedOnboarding: true,
    authProfile: {
      provider: "local",
      providerUserId: "verify-local-api",
      syncProfileId: profileId,
      displayName: "  Verification Learner  ",
      email: "verify@example.com",
      signedInAt: "2026-04-29T11:55:00.000Z",
    },
    name: "  Verification Learner  ",
    explanationPreference: "both",
    dailyGoalMinutes: 999,
    streakCount: 2,
    minutesToday: 7,
    dailyProgressDate: "2026-04-29",
    lastActiveDate: "2026-04-29",
    completedLessons: ["greetings-intro", "greetings-intro", ""],
    skippedLessons: [],
    skippedModules: [],
    lessonAttempts: [
      {
        lessonId: "greetings-intro",
        completedAt: "2026-04-29T12:00:00.000Z",
        score: 88,
        correctCount: 7,
        checkedCount: 8,
        retryCount: 1,
        reviewPrompts: ["Say hello politely."],
        ignoredNestedKey: "nested flexible JSON is sanitized but preserved when safe",
      },
    ],
    reviewQueue: [
      {
        id: "lesson-greetings-intro-hello",
        source: "lesson",
        title: "Practice greeting",
        prompt: "Say hello politely.",
        detail: "Use a warm complete sentence.",
        createdAt: "2026-04-29T12:00:00.000Z",
        completedAt: null,
      },
    ],
    drillResults: [
      {
        id: "drill-verification",
        itemId: "lesson-greetings-intro-hello",
        source: "lesson",
        target: "Say hello politely.",
        practicedAt: "2026-04-29T12:05:00.000Z",
        outcome: "practiced",
        attempted: true,
        learnerTurnCount: 1,
        score: 82,
        summary: "Clear enough to continue.",
        tips: ["Keep the last word clear."],
      },
    ],
    savedPhrases: ["  I need help, please.  "],
    mistakes: ["Use small words clearly."],
    feedbackHistory: [
      {
        pronunciation: {
          summary: "Clear enough for practice.",
          retryWords: ["please"],
          score: 76,
          tips: ["Slow down a little."],
        },
      },
    ],
    ignoredPrototypeField: "this should not be stored",
  };

  const session = await expectStatus("POST dev session", 200, authUrl("dev-session"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ authProfile: progress.authProfile }),
  });
  assert(typeof session.token === "string" && session.token.length > 20, "Session response should include a bearer token.");
  assert(session.profileId === profileId, "Session should be scoped to the auth profile syncProfileId.");

  const currentSession = await expectStatus("GET current session", 200, authUrl("session"), {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  assert(currentSession.userId === "local:verify-local-api", "Session lookup should return the scoped local user.");

  await expectStatus("GET wrong profile with session", 403, progressUrl("other-profile"), {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  console.log("OK dev session auth scopes progress access");

  const putRecord = await expectStatus("PUT progress", 200, progressUrl(), {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.token}` },
    body: JSON.stringify({ progress }),
  });
  assert(putRecord.profileId === profileId, "PUT response should echo the sanitized session profile ID.");
  assert(putRecord.source === "local-session-storage", "PUT response should include local-session-storage source.");
  assert(putRecord.ownerUserId === "local:verify-local-api", "PUT response should include the session owner user ID.");
  assert(putRecord.authProvider === "local", "PUT response should include the session auth provider.");
  assert(putRecord.revision >= 1, "PUT response should include a positive revision.");
  assert(putRecord.progress.name === "Verification Learner", "Progress name should be trimmed.");
  assert(putRecord.progress.authProfile?.syncProfileId === profileId, "authProfile should be preserved and sanitized.");
  assert(putRecord.progress.authProfile?.displayName === "Verification Learner", "authProfile displayName should be trimmed.");
  assert(putRecord.progress.dailyGoalMinutes === 60, "dailyGoalMinutes should be clamped to 60.");
  assert(putRecord.progress.completedLessons.length === 1, "completedLessons should be deduplicated and cleaned.");
  assert(putRecord.progress.lessonAttempts.length === 1, "lessonAttempts should be preserved as a bounded JSON array.");
  assert(putRecord.progress.reviewQueue.length === 1, "reviewQueue should be preserved as a bounded JSON array.");
  assert(putRecord.progress.drillResults.length === 1, "drillResults should be preserved as a bounded JSON array.");
  assert(!Object.prototype.hasOwnProperty.call(putRecord.progress, "ignoredPrototypeField"), "Unknown progress fields should not be stored.");

  const getRecord = await expectStatus("GET progress", 200, progressUrl(), {
    headers: { Authorization: `Bearer ${session.token}` },
  });
  assert(getRecord.profileId === profileId, "GET response should echo the sanitized session profile ID.");
  assert(getRecord.revision === putRecord.revision, "GET response should return the stored revision.");
  assert(getRecord.ownerUserId === putRecord.ownerUserId, "GET response should return stored owner metadata.");
  assert(getRecord.progress.name === putRecord.progress.name, "GET response should return the stored sanitized progress.");
  console.log(`OK progress PUT/GET revision=${getRecord.revision}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
