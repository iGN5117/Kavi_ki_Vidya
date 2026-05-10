import Constants from "expo-constants";
import { Platform } from "react-native";
import { mediaDevices, RTCPeerConnection, registerGlobals } from "react-native-webrtc";
import { createRealtimeWebRtcAnswer } from "@/src/services/realtime/realtimeClient";
import type { LiveRealtimeEvent, LiveWebRtcConnection, LiveWebRtcOptions } from "./liveWebRtc";

registerGlobals();

export async function connectLiveWebRtc({ instructions, onEvent }: LiveWebRtcOptions): Promise<LiveWebRtcConnection> {
  if (Platform.OS === "ios" && !Constants.isDevice) {
    throw new Error(
      "Live Realtime WebRTC is disabled on iOS Simulator because the simulator CoreAudio stack is crashing during native WebRTC audio setup. Please test Live conversation on a physical iPhone, or use turn-based Speak in the simulator."
    );
  }

  const peer = new RTCPeerConnection() as any;
  const stream = await mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    video: false,
  } as any);
  stream.getTracks().forEach((track: any) => peer.addTrack(track, stream));

  peer.addEventListener("track", (event: any) => {
    event.streams[0]?.getAudioTracks().forEach((track: any) => {
      track.enabled = true;
    });
  });

  const channel = peer.createDataChannel("oai-events") as any;
  const channelOpen = new Promise<void>((resolve, reject) => {
    channel.addEventListener("open", () => resolve(), { once: true });
    channel.addEventListener("error", () => reject(new Error("Realtime data channel had a connection problem.")), { once: true });
  });
  channel.addEventListener("message", (message: any) => {
    try {
      onEvent(JSON.parse(String(message.data)) as LiveRealtimeEvent);
    } catch {
      // Ignore non-JSON diagnostic events.
    }
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const localDescription = peer.localDescription || offer;
  const answerSdp = await createRealtimeWebRtcAnswer(localDescription.sdp || "", instructions);
  await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
  await channelOpen;

  return {
    close: () => {
      channel.close();
      peer.close();
      stream.getTracks().forEach((track: any) => track.stop());
      stream.release();
    },
    sendEvent: (event) => {
      if (channel.readyState === "open") {
        channel.send(JSON.stringify(event));
      }
    },
    setMuted: (muted) => {
      // Avoid toggling native iOS audio tracks during an active WebRTC call.
      // On simulator this can deadlock CoreAudio. The live screen gates turns
      // through Realtime buffer clear/commit instead.
      void muted;
    },
  };
}
