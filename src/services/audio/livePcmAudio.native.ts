import { NativeEventEmitter, NativeModules, Platform, type EmitterSubscription } from "react-native";

type KaviLiveAudioNativeModule = {
  start: (options: { sampleRate: number; bufferSize: number }) => Promise<{ sampleRate: number; isCapturing: boolean }>;
  stopCapture: () => Promise<{ isCapturing: boolean }>;
  playPcmChunk: (base64Audio: string) => Promise<{ queued: boolean }>;
  clearPlayback: () => Promise<{ cleared: boolean }>;
  stop: () => Promise<{ isCapturing: boolean }>;
};

type AudioChunkEvent = {
  audio?: string;
  sampleRate?: number;
  level?: number;
};

type StateEvent = {
  state?: string;
};

type ErrorEvent = {
  message?: string;
};

const nativeModule = NativeModules.KaviLiveAudio as KaviLiveAudioNativeModule | undefined;
const eventEmitter = nativeModule ? new NativeEventEmitter(nativeModule as any) : undefined;

export function isLivePcmAudioAvailable() {
  return Platform.OS === "ios" && Boolean(nativeModule && eventEmitter);
}

export function addLivePcmAudioChunkListener(listener: (event: { audio: string; sampleRate: number; level: number }) => void): EmitterSubscription | undefined {
  return eventEmitter?.addListener("KaviLiveAudioChunk", (event: AudioChunkEvent) => {
    if (!event.audio) return;
    listener({
      audio: event.audio,
      sampleRate: event.sampleRate || 24000,
      level: typeof event.level === "number" ? event.level : 0,
    });
  });
}

export function addLivePcmAudioStateListener(listener: (state: string) => void): EmitterSubscription | undefined {
  return eventEmitter?.addListener("KaviLiveAudioState", (event: StateEvent) => {
    listener(event.state || "unknown");
  });
}

export function addLivePcmAudioErrorListener(listener: (message: string) => void): EmitterSubscription | undefined {
  return eventEmitter?.addListener("KaviLiveAudioError", (event: ErrorEvent) => {
    listener(event.message || "Live audio had a native audio problem.");
  });
}

export async function startLivePcmAudioCapture() {
  if (!nativeModule) {
    throw new Error("Native live PCM audio is not available in this build.");
  }

  return nativeModule.start({
    sampleRate: 24000,
    bufferSize: 2048,
  });
}

export async function stopLivePcmAudioCapture() {
  if (!nativeModule) return;
  await nativeModule.stopCapture();
}

export async function playLivePcmAudioChunk(base64Audio: string) {
  if (!nativeModule) return;
  await nativeModule.playPcmChunk(base64Audio);
}

export async function clearLivePcmAudioPlayback() {
  if (!nativeModule) return;
  await nativeModule.clearPlayback();
}

export async function stopLivePcmAudio() {
  if (!nativeModule) return;
  await nativeModule.stop();
}
