import type { ConversationMode, ConversationTurn, PronunciationCheckResult, SpeakingFeedback } from "@/src/types/speaking";
import { Platform } from "react-native";

export type RealtimeSessionInfo = {
  clientSecret?: string;
  expiresAt?: number;
  model?: string;
};

export type CoachTurnResult = {
  transcript: string;
  reply: string;
  supportText?: string;
  audioUrl?: string;
  isDemo?: boolean;
  pronunciation?: PronunciationCheckResult;
};

export type LessonAudioResult = {
  audioUrl?: string;
  isDemo?: boolean;
};

export type PracticeSessionContext = {
  mode: ConversationMode;
  scenario?: {
    id: string;
    title: string;
    goal: string;
    difficulty: string;
  };
  focus?: {
    itemId?: string;
    source: "lesson" | "speaking";
    prompt: string;
    detail?: string;
  };
};

export type PracticeConnectionStatus = {
  hasEndpoint: boolean;
  isDemoMode: boolean;
  localApiReachable: boolean;
  openAIAvailable: boolean;
  openAIUnavailable: boolean;
  label: string;
  detail: string;
};

type HealthResponse = {
  ok?: boolean;
  openAIAvailable?: boolean;
  openaiAvailable?: boolean;
  openAIConfigured?: boolean;
  openaiConfigured?: boolean;
};

const endpoint = process.env.EXPO_PUBLIC_REALTIME_SESSION_ENDPOINT;

function getConfiguredEndpoint() {
  const configuredEndpoint = endpoint?.replace(/\/+$/, "");
  if (!configuredEndpoint || Platform.OS !== "android") return configuredEndpoint;

  return configuredEndpoint.replace(/^(https?:\/\/)(localhost|127\.0\.0\.1)(?=[:/]|$)/i, "$110.0.2.2");
}

function getEndpoint(path: "voice" | "text" | "feedback" | "lessonAudio" | "pronunciation") {
  const configuredEndpoint = getConfiguredEndpoint();
  if (!configuredEndpoint) return undefined;
  const routeByPath = {
    voice: "/voice/turn",
    text: "/text/turn",
    feedback: "/feedback/session",
    lessonAudio: "/audio/sentence",
    pronunciation: "/pronunciation/check",
  };

  return configuredEndpoint.replace(/\/realtime\/session$/, routeByPath[path]);
}

function getHealthEndpoint() {
  const configuredEndpoint = getConfiguredEndpoint();
  if (!configuredEndpoint) return undefined;
  if (configuredEndpoint.endsWith("/api/realtime/session")) {
    return configuredEndpoint.slice(0, -"/api/realtime/session".length) + "/health";
  }

  return configuredEndpoint.replace(/\/realtime\/session$/, "/health");
}

function getRealtimeCallEndpoint() {
  const configuredEndpoint = getConfiguredEndpoint();
  if (!configuredEndpoint) return undefined;
  if (configuredEndpoint.endsWith("/api/realtime/session")) {
    return configuredEndpoint.slice(0, -"/api/realtime/session".length) + "/api/realtime/call";
  }

  return configuredEndpoint.replace(/\/realtime\/session$/, "/realtime/call");
}

export function getRealtimeWebSocketEndpoint(instructions?: string, options?: { turnDetection?: "manual" | "server_vad" }) {
  const configuredEndpoint = getConfiguredEndpoint();
  if (!configuredEndpoint) return undefined;

  const httpEndpoint = configuredEndpoint.endsWith("/api/realtime/session")
    ? configuredEndpoint.slice(0, -"/api/realtime/session".length) + "/api/realtime/ws"
    : configuredEndpoint.replace(/\/realtime\/session$/, "/realtime/ws");
  const wsEndpoint = httpEndpoint.replace(/^http:/, "ws:").replace(/^https:/, "wss:");
  const params = new URLSearchParams();

  if (instructions?.trim()) {
    params.set("instructions", instructions);
  }

  if (options?.turnDetection) {
    params.set("turnDetection", options.turnDetection);
  }

  const query = params.toString();
  if (!query) return wsEndpoint;

  const separator = wsEndpoint.includes("?") ? "&" : "?";
  return `${wsEndpoint}${separator}${query}`;
}

async function getErrorMessage(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string; detail?: string };
    return [payload.error, payload.detail].filter(Boolean).join(" ") || fallback;
  } catch {
    return fallback;
  }
}

function getAudioUploadInfo(audioUri: string) {
  const cleanUri = audioUri.split("?")[0] || audioUri;
  const extensionMatch = cleanUri.match(/\.([a-z0-9]+)$/i);
  const extension = extensionMatch?.[1]?.toLowerCase() || "m4a";
  const mimeTypes: Record<string, string> = {
    "3gp": "audio/3gpp",
    caf: "audio/x-caf",
    m4a: "audio/mp4",
    mp3: "audio/mpeg",
    mp4: "audio/mp4",
    wav: "audio/wav",
    webm: "audio/webm",
  };

  return {
    name: `learner.${extension}`,
    type: mimeTypes[extension] || "audio/mp4",
  };
}

export function hasPracticeEndpoint() {
  return Boolean(getConfiguredEndpoint());
}

export function getInitialPracticeConnectionStatus(): PracticeConnectionStatus {
  if (!getConfiguredEndpoint()) {
    return {
      hasEndpoint: false,
      isDemoMode: true,
      localApiReachable: false,
      openAIAvailable: false,
      openAIUnavailable: false,
      label: "Demo mode",
      detail: "Local API is not configured. Text and voice practice use built-in demo replies.",
    };
  }

  return {
    hasEndpoint: true,
    isDemoMode: true,
    localApiReachable: false,
    openAIAvailable: false,
    openAIUnavailable: false,
    label: "Checking AI",
    detail: "Checking the local practice API before using live replies.",
  };
}

export async function checkPracticeConnection(timeoutMs = 2500): Promise<PracticeConnectionStatus> {
  const healthEndpoint = getHealthEndpoint();
  if (!healthEndpoint) return getInitialPracticeConnectionStatus();

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(healthEndpoint, { signal: controller.signal });
    if (!response.ok) {
      return {
        hasEndpoint: true,
        isDemoMode: true,
        localApiReachable: false,
        openAIAvailable: false,
        openAIUnavailable: false,
        label: "Demo mode",
        detail: "Local API is not reachable. Built-in demo replies are available.",
      };
    }

    const payload = (await response.json()) as HealthResponse;
    const openAIAvailable = Boolean(
      payload.openAIAvailable ?? payload.openaiAvailable ?? payload.openAIConfigured ?? payload.openaiConfigured
    );

    if (!openAIAvailable) {
      return {
        hasEndpoint: true,
        isDemoMode: true,
        localApiReachable: true,
        openAIAvailable: false,
        openAIUnavailable: true,
        label: "Local demo",
        detail: "Local API is connected, but OpenAI is unavailable. Demo replies will be used.",
      };
    }

    return {
      hasEndpoint: true,
      isDemoMode: false,
      localApiReachable: true,
      openAIAvailable: true,
      openAIUnavailable: false,
      label: "Local AI connected",
      detail: "Local API and OpenAI are available for text and voice practice.",
    };
  } catch {
    return {
      hasEndpoint: true,
      isDemoMode: true,
      localApiReachable: false,
      openAIAvailable: false,
      openAIUnavailable: false,
      label: "Demo mode",
      detail: "Local API is not reachable. Built-in demo replies are available.",
    };
  } finally {
    clearTimeout(timeout);
  }
}

export async function createRealtimeSession(instructions: string): Promise<RealtimeSessionInfo> {
  const configuredEndpoint = getConfiguredEndpoint();
  if (!configuredEndpoint) {
    throw new Error("Practice is in demo mode until the local AI endpoint is configured.");
  }

  const response = await fetch(configuredEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ instructions }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Realtime session failed: ${response.status}`));
  }

  return response.json();
}

export async function createRealtimeWebRtcAnswer(sdp: string, instructions: string) {
  const realtimeCallEndpoint = getRealtimeCallEndpoint();
  if (!realtimeCallEndpoint) {
    throw new Error("Live conversation needs the local Realtime endpoint.");
  }

  if (!sdp.trim().startsWith("v=0")) {
    throw new Error("Live conversation could not create a valid WebRTC offer. Please try again.");
  }

  const response = await fetch(realtimeCallEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/sdp",
      "X-Kavi-Instructions": instructions,
    },
    body: sdp,
  });

  const answerSdp = await response.text();
  if (!response.ok) {
    throw new Error(answerSdp || `Realtime WebRTC call failed: ${response.status}`);
  }

  return answerSdp;
}

export async function sendVoiceTurn(audioUri: string, instructions: string, turns: ConversationTurn[] = [], expectedText?: string) {
  const voiceEndpoint = getEndpoint("voice");
  if (!voiceEndpoint) {
    throw new Error("Practice is in demo mode until the local AI endpoint is configured.");
  }

  const formData = new FormData();
  const audioUploadInfo = getAudioUploadInfo(audioUri);

  formData.append("instructions", instructions);
  formData.append("turns", JSON.stringify(turns));
  if (expectedText?.trim()) {
    formData.append("expectedText", expectedText.trim());
  }
  formData.append("audio", {
    uri: audioUri,
    name: audioUploadInfo.name,
    type: audioUploadInfo.type,
  } as unknown as Blob);

  const response = await fetch(voiceEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Voice turn failed: ${response.status}`));
  }

  return response.json() as Promise<CoachTurnResult>;
}

export async function sendTextTurn(text: string, instructions: string, turns: ConversationTurn[] = []) {
  const textEndpoint = getEndpoint("text");
  if (!textEndpoint) {
    throw new Error("Practice is in demo mode until the local AI endpoint is configured.");
  }

  const response = await fetch(textEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text, instructions, turns }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Text turn failed: ${response.status}`));
  }

  return response.json() as Promise<CoachTurnResult>;
}

export async function createLessonAudio(text: string) {
  const audioEndpoint = getEndpoint("lessonAudio");
  if (!audioEndpoint) {
    throw new Error("Lesson audio needs the local AI endpoint.");
  }

  let response: Response;
  try {
    response = await fetch(audioEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text }),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "network request failed";
    throw new Error(`Lesson audio request failed at ${audioEndpoint}: ${message}`);
  }

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Lesson audio failed: ${response.status}`));
  }

  return response.json() as Promise<LessonAudioResult>;
}

export async function checkLessonPronunciation(audioUri: string, expectedText: string) {
  const pronunciationEndpoint = getEndpoint("pronunciation");
  if (!pronunciationEndpoint) {
    throw new Error("Pronunciation check needs the local AI endpoint.");
  }

  const formData = new FormData();
  const audioUploadInfo = getAudioUploadInfo(audioUri);

  formData.append("expectedText", expectedText);
  formData.append("audio", {
    uri: audioUri,
    name: audioUploadInfo.name,
    type: audioUploadInfo.type,
  } as unknown as Blob);

  const response = await fetch(pronunciationEndpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Pronunciation check failed: ${response.status}`));
  }

  return response.json() as Promise<PronunciationCheckResult>;
}

export async function generateSessionFeedback(turns: ConversationTurn[], context?: PracticeSessionContext) {
  const feedbackEndpoint = getEndpoint("feedback");
  if (!feedbackEndpoint) {
    throw new Error("Practice feedback is in demo mode until the local AI endpoint is configured.");
  }

  const response = await fetch(feedbackEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ turns, context }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, `Feedback failed: ${response.status}`));
  }

  return response.json() as Promise<SpeakingFeedback>;
}
