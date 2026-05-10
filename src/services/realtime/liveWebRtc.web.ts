import { createRealtimeWebRtcAnswer } from "@/src/services/realtime/realtimeClient";
import type { LiveRealtimeEvent, LiveWebRtcConnection, LiveWebRtcOptions } from "./liveWebRtc";

export async function connectLiveWebRtc({ instructions, onEvent }: LiveWebRtcOptions): Promise<LiveWebRtcConnection> {
  if (!globalThis.RTCPeerConnection || !navigator.mediaDevices?.getUserMedia || !globalThis.document) {
    throw new Error("This browser does not expose WebRTC microphone APIs.");
  }

  const peer = new RTCPeerConnection();
  const audioElement = document.createElement("audio");
  audioElement.autoplay = true;
  audioElement.style.display = "none";
  document.body.appendChild(audioElement);

  peer.ontrack = (event) => {
    audioElement.srcObject = event.streams[0];
  };

  const stream = await navigator.mediaDevices.getUserMedia({
    audio: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
  });
  stream.getTracks().forEach((track) => peer.addTrack(track, stream));

  const channel = peer.createDataChannel("oai-events");
  const channelOpen = new Promise<void>((resolve, reject) => {
    channel.addEventListener("open", () => resolve(), { once: true });
    channel.addEventListener("error", () => reject(new Error("Realtime data channel had a connection problem.")), { once: true });
  });
  channel.addEventListener("message", (message) => {
    try {
      onEvent(JSON.parse(message.data) as LiveRealtimeEvent);
    } catch {
      // Ignore non-JSON diagnostic events.
    }
  });

  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  const answerSdp = await createRealtimeWebRtcAnswer(peer.localDescription?.sdp || offer.sdp || "", instructions);
  await peer.setRemoteDescription({ type: "answer", sdp: answerSdp });
  await channelOpen;

  return {
    close: () => {
      channel.close();
      peer.close();
      stream.getTracks().forEach((track) => track.stop());
      audioElement.remove();
    },
    sendEvent: (event) => {
      if (channel.readyState === "open") {
        channel.send(JSON.stringify(event));
      }
    },
    setMuted: (muted) => {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !muted;
      });
    },
  };
}
