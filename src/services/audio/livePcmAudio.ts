export function isLivePcmAudioAvailable() {
  return false;
}

export function addLivePcmAudioChunkListener(_listener: (event: { audio: string; sampleRate: number; level: number }) => void) {
  return undefined;
}

export function addLivePcmAudioStateListener(_listener: (state: string) => void) {
  return undefined;
}

export function addLivePcmAudioErrorListener(_listener: (message: string) => void) {
  return undefined;
}

export async function startLivePcmAudioCapture() {
  throw new Error("Native live PCM audio is not available in this build.");
}

export async function stopLivePcmAudioCapture() {
  return undefined;
}

export async function playLivePcmAudioChunk(_base64Audio: string) {
  return undefined;
}

export async function clearLivePcmAudioPlayback() {
  return undefined;
}

export async function stopLivePcmAudio() {
  return undefined;
}
