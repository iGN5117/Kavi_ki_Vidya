import { getRealtimeWebSocketEndpoint } from "@/src/services/realtime/realtimeClient";
import type { LiveRealtimeEvent, LiveWebRtcConnection, LiveWebRtcOptions } from "./liveWebRtc";

type LiveWebSocketOptions = LiveWebRtcOptions & {
  turnDetection?: "manual" | "server_vad";
};

export async function connectLiveWebSocket({ instructions, onEvent, turnDetection = "manual" }: LiveWebSocketOptions): Promise<LiveWebRtcConnection> {
  const endpoint = getRealtimeWebSocketEndpoint(instructions, { turnDetection });
  if (!endpoint) {
    throw new Error("Live conversation needs the local Realtime WebSocket endpoint.");
  }

  const socket = new WebSocket(endpoint);
  let didResolve = false;
  let didCloseIntentionally = false;

  const connection: LiveWebRtcConnection = {
    close: () => {
      didCloseIntentionally = true;
      socket.close();
    },
    sendEvent: (event) => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify(event));
      }
    },
    setMuted: () => undefined,
  };

  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      if (didResolve) return;
      didCloseIntentionally = true;
      socket.close();
      reject(new Error("Realtime WebSocket did not connect in time."));
    }, 10000);

    function settleResolve() {
      if (didResolve) return;
      didResolve = true;
      clearTimeout(timeout);
      resolve(connection);
    }

    function settleReject(error: Error) {
      if (didResolve) return;
      didResolve = true;
      clearTimeout(timeout);
      reject(error);
    }

    socket.onmessage = (message) => {
      try {
        const event = JSON.parse(String(message.data)) as LiveRealtimeEvent;
        if (event.type === "kavi.bridge.opened") {
          return;
        }
        if (event.type === "session.updated" && !didResolve) {
          onEvent(event);
          settleResolve();
          return;
        }
        if (event.type === "error" && !didResolve) {
          settleReject(new Error(event.error?.message || "Realtime WebSocket returned an error."));
          return;
        }
        onEvent(event);
      } catch {
        // Ignore non-JSON diagnostic frames.
      }
    };

    socket.onerror = (event) => {
      const message = typeof event === "object" && event && "message" in event ? String(event.message) : "Realtime WebSocket had a connection problem.";
      if (!didResolve) {
        settleReject(new Error(message));
        return;
      }
      onEvent({
        type: "error",
        error: {
          message,
        },
      });
    };

    socket.onclose = () => {
      if (!didResolve && !didCloseIntentionally) {
        settleReject(new Error("Realtime WebSocket closed before the session was ready."));
      }
    };
  });
}
