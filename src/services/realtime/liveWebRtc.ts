export type LiveRealtimeEvent = Record<string, any>;

export type LiveWebRtcConnection = {
  close: () => void;
  sendEvent: (event: Record<string, unknown>) => void;
  setMuted: (muted: boolean) => void;
};

export type LiveWebRtcOptions = {
  instructions: string;
  onEvent: (event: LiveRealtimeEvent) => void;
};

export async function connectLiveWebRtc(_options: LiveWebRtcOptions): Promise<LiveWebRtcConnection> {
  throw new Error("Live WebRTC is unavailable on this platform build.");
}
