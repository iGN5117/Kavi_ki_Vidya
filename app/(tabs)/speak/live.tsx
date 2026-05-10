import Constants from "expo-constants";
import { router, useLocalSearchParams } from "expo-router";
import { Mic, MicOff, PhoneOff, Radio } from "lucide-react-native";
import { useEffect, useMemo, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, type EmitterSubscription } from "react-native";
import { Screen } from "@/src/components/Screen";
import {
  addLivePcmAudioChunkListener,
  addLivePcmAudioErrorListener,
  addLivePcmAudioStateListener,
  clearLivePcmAudioPlayback,
  isLivePcmAudioAvailable,
  playLivePcmAudioChunk,
  startLivePcmAudioCapture,
  stopLivePcmAudio,
  stopLivePcmAudioCapture,
} from "@/src/services/audio/livePcmAudio";
import { connectLiveWebRtc } from "@/src/services/realtime/liveWebRtc";
import type { LiveWebRtcConnection } from "@/src/services/realtime/liveWebRtc";
import { connectLiveWebSocket } from "@/src/services/realtime/liveWebSocket";
import { buildRealtimeInstructions } from "@/src/services/realtime/sessionConfig";
import { colors, radii, spacing } from "@/src/theme/theme";

type LiveState = "idle" | "connecting" | "live" | "error";
type LiveLog = {
  id: string;
  role: "system" | "coach" | "learner";
  text: string;
};

export default function LiveConversationScreen() {
  const params = useLocalSearchParams<{ autostart?: string; autostartMic?: string }>();
  const isIosSimulator = Platform.OS === "ios" && !Constants.isDevice;
  const simulatorUnsupportedMessage =
    "iOS Simulator uses native PCM audio streaming through the local Realtime WebSocket bridge because native WebRTC audio crashes Simulator CoreAudio.";
  const instructions = useMemo(() => buildRealtimeInstructions("free"), []);
  const connectionRef = useRef<LiveWebRtcConnection | null>(null);
  const liveAudioSubscriptionsRef = useRef<EmitterSubscription[]>([]);
  const autoStartedRef = useRef(false);
  const autoStartedMicRef = useRef(false);
  const assistantDraftRef = useRef("");
  const assistantAudioChunksRef = useRef<string[]>([]);
  const learnerDraftRef = useRef("");
  const assistantSpeakingRef = useRef(false);
  const responsePendingRef = useRef(false);
  const isListeningRef = useRef(false);
  const liveStateRef = useRef<LiveState>("idle");
  const userMutedRef = useRef(true);
  const connectedLoggedRef = useRef(false);
  const simulatorAudioChunkCountRef = useRef(0);
  const simulatorTurnCommittedRef = useRef(false);
  const simulatorHeardSpeechRef = useRef(false);
  const simulatorSilenceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const simulatorCommitFallbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoreMicTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [liveState, setLiveState] = useState<LiveState>("idle");
  const [isListening, setIsListening] = useState(false);
  const [isAssistantSpeaking, setIsAssistantSpeakingState] = useState(false);
  const [isResponsePending, setIsResponsePendingState] = useState(false);
  const [logs, setLogs] = useState<LiveLog[]>([
    {
      id: "intro",
      role: "system",
      text: isIosSimulator
        ? "Live mode connects to the Realtime model through the local backend WebSocket bridge."
        : "Live mode streams your microphone directly to the Realtime model for lower-latency voice practice.",
    },
    ...(isIosSimulator
      ? [
          {
            id: "ios-simulator-warning",
            role: "system" as const,
            text: simulatorUnsupportedMessage,
          },
        ]
      : []),
  ]);

  useEffect(() => disconnectLive, []);

  useEffect(() => {
    liveStateRef.current = liveState;
  }, [liveState]);

  function addLog(role: LiveLog["role"], text: string) {
    const cleanText = text.trim();
    if (!cleanText) return;
    setLogs((current) => [
      ...current.filter((log) => log.text !== cleanText).slice(-10),
      {
        id: `${role}-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        role,
        text: cleanText,
      },
    ]);
  }

  function setResponsePending(isPending: boolean) {
    if (responsePendingRef.current === isPending) return;
    responsePendingRef.current = isPending;
    setIsResponsePendingState(isPending);
  }

  function disconnectLive() {
    if (restoreMicTimeoutRef.current) {
      clearTimeout(restoreMicTimeoutRef.current);
      restoreMicTimeoutRef.current = null;
    }
    clearSimulatorSilenceTimer();
    clearSimulatorCommitFallbackTimer();
    removeLivePcmListeners();
    if (isIosSimulator) {
      void stopLivePcmAudio();
    }
    connectionRef.current?.close();
    connectionRef.current = null;
    assistantDraftRef.current = "";
    assistantAudioChunksRef.current = [];
    learnerDraftRef.current = "";
    assistantSpeakingRef.current = false;
    setIsAssistantSpeakingState(false);
    setResponsePending(false);
    isListeningRef.current = false;
    userMutedRef.current = true;
    connectedLoggedRef.current = false;
    simulatorAudioChunkCountRef.current = 0;
    simulatorTurnCommittedRef.current = false;
    simulatorHeardSpeechRef.current = false;
    setIsListening(false);
    setLiveState((current) => (current === "error" ? "error" : "idle"));
  }

  function sendEvent(event: Record<string, unknown>) {
    connectionRef.current?.sendEvent(event);
  }

  function clearSimulatorSilenceTimer() {
    if (!simulatorSilenceTimeoutRef.current) return;
    clearTimeout(simulatorSilenceTimeoutRef.current);
    simulatorSilenceTimeoutRef.current = null;
  }

  function clearSimulatorCommitFallbackTimer() {
    if (!simulatorCommitFallbackTimeoutRef.current) return;
    clearTimeout(simulatorCommitFallbackTimeoutRef.current);
    simulatorCommitFallbackTimeoutRef.current = null;
  }

  function maybeAutoSendSimulatorTurn(level: number) {
    if (!isIosSimulator || !isListeningRef.current || simulatorTurnCommittedRef.current || responsePendingRef.current || assistantSpeakingRef.current) {
      return;
    }

    if (level >= 0.018) {
      simulatorHeardSpeechRef.current = true;
      clearSimulatorSilenceTimer();
      return;
    }

    if (!simulatorHeardSpeechRef.current || simulatorSilenceTimeoutRef.current) {
      return;
    }

    simulatorSilenceTimeoutRef.current = setTimeout(() => {
      simulatorSilenceTimeoutRef.current = null;
      if (!isListeningRef.current || simulatorTurnCommittedRef.current || responsePendingRef.current || assistantSpeakingRef.current) {
        return;
      }

      void stopSimulatorStreaming({ commitTurn: true });
    }, 1200);
  }

  function removeLivePcmListeners() {
    liveAudioSubscriptionsRef.current.forEach((subscription) => subscription.remove());
    liveAudioSubscriptionsRef.current = [];
  }

  function attachLivePcmListeners() {
    if (liveAudioSubscriptionsRef.current.length) return;

    const chunkSubscription = addLivePcmAudioChunkListener((event) => {
      if (!connectionRef.current || userMutedRef.current || assistantSpeakingRef.current || responsePendingRef.current) return;
      if (isIosSimulator) {
        simulatorAudioChunkCountRef.current += 1;
      }
      connectionRef.current.sendEvent({
        type: "input_audio_buffer.append",
        audio: event.audio,
      });
      maybeAutoSendSimulatorTurn(event.level);
    });
    const stateSubscription = addLivePcmAudioStateListener((state) => {
      if (state === "capturing") {
        isListeningRef.current = true;
        setIsListening(true);
      }
      if (state === "idle") {
        isListeningRef.current = false;
        setIsListening(false);
      }
    });
    const errorSubscription = addLivePcmAudioErrorListener((message) => {
      addLog("system", message);
    });

    const subscriptions: EmitterSubscription[] = [];
    if (chunkSubscription) subscriptions.push(chunkSubscription);
    if (stateSubscription) subscriptions.push(stateSubscription);
    if (errorSubscription) subscriptions.push(errorSubscription);
    liveAudioSubscriptionsRef.current = subscriptions;
  }

  function requestCoachResponse(instructions?: string) {
    if (!connectionRef.current || responsePendingRef.current) return;
    setResponsePending(true);
    connectionRef.current.sendEvent({
      type: "response.create",
      response: {
        instructions:
          instructions ||
          "Answer the learner's last turn in one short English (India) reply. Add Hindi/Hinglish support only if useful. Ask one tiny follow-up question.",
      },
    });
  }

  function applyTransportMute() {
    connectionRef.current?.setMuted(userMutedRef.current || assistantSpeakingRef.current);
  }

  function startLearnerTurn() {
    if (liveState !== "live" || responsePendingRef.current || assistantSpeakingRef.current) return;
    if (isIosSimulator) {
      void startSimulatorStreaming();
      return;
    }
    learnerDraftRef.current = "";
    isListeningRef.current = true;
    userMutedRef.current = false;
    setIsListening(true);
    applyTransportMute();
    sendEvent({ type: "input_audio_buffer.clear" });
    addLog("system", "Listening...");
  }

  function finishLearnerTurn(shouldRequestResponse: boolean) {
    isListeningRef.current = false;
    userMutedRef.current = true;
    setIsListening(false);
    applyTransportMute();
    if (shouldRequestResponse) {
      requestCoachResponse();
    }
  }

  function sendLearnerTurn() {
    if (isIosSimulator) {
      void stopSimulatorStreaming({ commitTurn: true });
      return;
    }
    userMutedRef.current = true;
    setIsListening(false);
    applyTransportMute();
    sendEvent({ type: "input_audio_buffer.commit" });
  }

  function setAssistantSpeaking(isSpeaking: boolean) {
    if (restoreMicTimeoutRef.current) {
      clearTimeout(restoreMicTimeoutRef.current);
      restoreMicTimeoutRef.current = null;
    }

    if (isSpeaking) {
      if (assistantSpeakingRef.current) {
        return;
      }
      assistantSpeakingRef.current = true;
      setIsAssistantSpeakingState(true);
      isListeningRef.current = false;
      userMutedRef.current = true;
      setIsListening(false);
      applyTransportMute();
      if (isIosSimulator) {
        void stopSimulatorStreaming({ commitTurn: false });
        void clearLivePcmAudioPlayback();
      }
      return;
    }

    if (!assistantSpeakingRef.current) {
      return;
    }

    restoreMicTimeoutRef.current = setTimeout(() => {
      assistantSpeakingRef.current = false;
      setIsAssistantSpeakingState(false);
      applyTransportMute();
      if (isIosSimulator && connectionRef.current && liveStateRef.current === "live") {
        void startSimulatorStreaming();
      }
      restoreMicTimeoutRef.current = null;
    }, 350);
  }

  function handleRealtimeEvent(event: Record<string, any>) {
    if (event.type === "session.created" || event.type === "session.updated") {
      if (!connectedLoggedRef.current) {
        connectedLoggedRef.current = true;
        addLog("system", isIosSimulator ? "Connected. The mic will turn on between coach replies." : "Connected. Tap Speak when you are ready.");
      }
      return;
    }

    if (event.type === "response.created") {
      setResponsePending(true);
      assistantAudioChunksRef.current = [];
      if (isIosSimulator) {
        void clearLivePcmAudioPlayback();
      }
      setAssistantSpeaking(true);
    }

    if (event.type === "response.output_item.added" || event.type === "response.content_part.added" || event.type === "response.audio.delta" || event.type === "response.output_audio.delta" || event.type === "response.output_audio_transcript.delta") {
      setResponsePending(true);
      setAssistantSpeaking(true);
    }

    if ((event.type === "response.output_audio.delta" || event.type === "response.audio.delta") && event.delta) {
      if (isIosSimulator) {
        void playLivePcmAudioChunk(event.delta);
        return;
      }
      assistantAudioChunksRef.current.push(event.delta);
      return;
    }

    if (event.type === "response.output_audio.done" || event.type === "response.audio.done") {
      return;
    }

    if (event.type === "input_audio_buffer.speech_started") {
      learnerDraftRef.current = "";
      if (!isIosSimulator && (!isListeningRef.current || assistantSpeakingRef.current || responsePendingRef.current)) {
        sendEvent({ type: "input_audio_buffer.clear" });
        finishLearnerTurn(false);
      }
      return;
    }

    if (event.type === "conversation.item.input_audio_transcription.completed") {
      const transcript = event.transcript || "";
      if (!isIosSimulator && !isListeningRef.current && !transcript.trim()) return;
      if (!isIosSimulator && !isListeningRef.current && transcript.trim()) {
        sendEvent({ type: "input_audio_buffer.clear" });
        return;
      }
      addLog("learner", transcript);
      if (!isIosSimulator && transcript.trim() && !assistantSpeakingRef.current && !responsePendingRef.current) {
        finishLearnerTurn(true);
      }
      return;
    }

    if (event.type === "input_audio_buffer.committed") {
      if (isIosSimulator) {
        simulatorTurnCommittedRef.current = true;
        clearSimulatorSilenceTimer();
        clearSimulatorCommitFallbackTimer();
        requestCoachResponse();
        return;
      }
      if (!isListeningRef.current) {
        sendEvent({ type: "input_audio_buffer.clear" });
        return;
      }
      if (!assistantSpeakingRef.current && !responsePendingRef.current) {
        finishLearnerTurn(true);
      }
      return;
    }

    if (event.type === "response.output_audio_transcript.delta") {
      assistantDraftRef.current += event.delta || "";
      return;
    }

    if (event.type === "response.output_audio_transcript.done") {
      addLog("coach", assistantDraftRef.current || event.transcript || "");
      assistantDraftRef.current = "";
      return;
    }

    if (event.type === "response.done") {
      if (assistantDraftRef.current.trim()) {
        addLog("coach", assistantDraftRef.current);
        assistantDraftRef.current = "";
      }
      if (assistantAudioChunksRef.current.length) {
        assistantAudioChunksRef.current = [];
      }
      setResponsePending(false);
      setAssistantSpeaking(false);
      return;
    }

    if (event.type === "error") {
      setResponsePending(false);
      setAssistantSpeaking(false);
      addLog("system", event.error?.message || "Realtime session returned an error.");
    }
  }

  async function connectLive() {
    if (liveState === "connecting" || liveState === "live") return;

    try {
      if (isIosSimulator && !isLivePcmAudioAvailable()) {
        throw new Error("Native live PCM audio is not available. Rebuild the iOS app so the KaviLiveAudio module is included.");
      }

      setLiveState("connecting");
      addLog("system", "Opening live voice connection...");
      const connection = isIosSimulator
        ? await connectLiveWebSocket({
            instructions,
            onEvent: handleRealtimeEvent,
            turnDetection: "manual",
          })
        : await connectLiveWebRtc({
            instructions,
            onEvent: handleRealtimeEvent,
          });
      connectionRef.current = connection;
      if (isIosSimulator) {
        attachLivePcmListeners();
      }
      userMutedRef.current = true;
      isListeningRef.current = false;
      connection.setMuted(true);
      setIsListening(false);
      setLiveState("live");
      sendEvent({
        type: "conversation.item.create",
        item: {
          type: "message",
          role: "user",
          content: [
            {
              type: "input_text",
              text: "Please greet me and invite me to speak.",
            },
          ],
        },
      });
      requestCoachResponse("Greet the learner warmly in one short English sentence, then invite her to speak about her day. Do not use any language except English with optional Hindi support.");
    } catch (error) {
      disconnectLive();
      setLiveState("error");
      addLog("system", error instanceof Error ? error.message : "Could not start live conversation.");
    }
  }

  useEffect(() => {
    if (params.autostart !== "1" || autoStartedRef.current) return;
    autoStartedRef.current = true;
    void connectLive();
  }, [params.autostart]);

  async function startSimulatorStreaming(attempt = 0) {
    if (!isIosSimulator || isListeningRef.current || assistantSpeakingRef.current || responsePendingRef.current) return;

    try {
      attachLivePcmListeners();
      sendEvent({ type: "input_audio_buffer.clear" });
      simulatorAudioChunkCountRef.current = 0;
      simulatorTurnCommittedRef.current = false;
      simulatorHeardSpeechRef.current = false;
      clearSimulatorSilenceTimer();
      userMutedRef.current = false;
      isListeningRef.current = true;
      setIsListening(true);
      await startLivePcmAudioCapture();
      addLog("system", "Listening live...");
    } catch (error) {
      userMutedRef.current = true;
      isListeningRef.current = false;
      setIsListening(false);
      const message = error instanceof Error ? error.message : "";
      if (message.includes("simulator microphone is not ready") && attempt < 4) {
        setTimeout(() => {
          void startSimulatorStreaming(attempt + 1);
        }, 250);
        return;
      }
      addLog("system", error instanceof Error ? `Could not start live mic: ${error.message}` : "Could not start live mic.");
    }
  }

  async function stopSimulatorStreaming(options: { commitTurn?: boolean } = {}) {
    if (!isIosSimulator) return;

    userMutedRef.current = true;
    isListeningRef.current = false;
    setIsListening(false);
    clearSimulatorSilenceTimer();
    clearSimulatorCommitFallbackTimer();
    try {
      await stopLivePcmAudioCapture();
    } catch (error) {
      addLog("system", error instanceof Error ? `Could not stop live mic: ${error.message}` : "Could not stop live mic.");
    }

    if (!options.commitTurn || simulatorTurnCommittedRef.current) {
      return;
    }

    if (simulatorAudioChunkCountRef.current === 0) {
      sendEvent({ type: "input_audio_buffer.clear" });
      addLog("system", "I could not hear audio. Try once more.");
      return;
    }

    simulatorTurnCommittedRef.current = true;
    addLog("system", "Sending your turn...");
    sendEvent({ type: "input_audio_buffer.commit" });
    simulatorCommitFallbackTimeoutRef.current = setTimeout(() => {
      simulatorCommitFallbackTimeoutRef.current = null;
      if (!connectionRef.current || responsePendingRef.current || assistantSpeakingRef.current) {
        return;
      }

      requestCoachResponse();
    }, 1800);
  }

  const isMicBusy = isResponsePending || isAssistantSpeaking;
  const statusLabel =
    liveState === "live" ? (isMicBusy ? "Coach speaking" : isListening ? "Listening" : "Tap to speak") : liveState === "connecting" ? "Connecting" : liveState === "error" ? "Needs attention" : "Ready";

  useEffect(() => {
    if (params.autostartMic !== "1" || autoStartedMicRef.current || liveState !== "live" || isMicBusy || isListening) return;
    const timer = setTimeout(() => {
      if (autoStartedMicRef.current || liveStateRef.current !== "live" || responsePendingRef.current || assistantSpeakingRef.current || isListeningRef.current) {
        return;
      }

      autoStartedMicRef.current = true;
      startLearnerTurn();
    }, 700);
    return () => clearTimeout(timer);
  }, [params.autostartMic, liveState, isMicBusy, isListening]);

  return (
    <Screen>
      <View style={styles.header}>
        <View style={[styles.statusIcon, liveState === "live" && styles.statusIconLive]}>
          <Radio color={liveState === "live" ? colors.surface : colors.primary} size={28} />
        </View>
        <Text style={styles.eyebrow}>Realtime comparison</Text>
        <Text style={styles.title}>Live conversation</Text>
        <Text style={styles.copy}>Use this to compare against the turn-based Speak flow. Web, iOS, and Android builds use the same Realtime connection.</Text>
        <Text style={[styles.status, liveState === "live" && styles.statusLive]}>{statusLabel}</Text>
      </View>

      <View style={styles.controls}>
        {liveState === "live" ? (
          <>
            <Pressable
              accessibilityRole="button"
              onPress={isListening ? sendLearnerTurn : startLearnerTurn}
              disabled={isMicBusy}
              style={[styles.controlButton, isListening && styles.controlButtonListening, isMicBusy && styles.controlButtonMuted]}
            >
              {isListening ? <MicOff color={colors.surface} size={22} /> : <Mic color={colors.surface} size={22} />}
              <Text style={styles.controlText}>{isListening ? (isIosSimulator ? "Send turn" : "Mute mic") : "Start mic"}</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={disconnectLive} style={[styles.controlButton, styles.endButton]}>
              <PhoneOff color={colors.surface} size={22} />
              <Text style={styles.controlText}>End live</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            accessibilityRole="button"
            onPress={connectLive}
            disabled={liveState === "connecting"}
            style={styles.startButton}
          >
            <Mic color={colors.surface} size={22} />
            <Text style={styles.startText}>{liveState === "connecting" ? "Connecting..." : isIosSimulator ? "Start simulator live" : "Start live conversation"}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.logPanel}>
        <Text style={styles.logTitle}>Live transcript</Text>
        <ScrollView contentContainerStyle={styles.logContent}>
          {logs.map((log) => (
            <View key={log.id} style={[styles.logBubble, log.role === "coach" && styles.coachLog, log.role === "learner" && styles.learnerLog]}>
              <Text style={styles.logRole}>{log.role === "coach" ? "Coach" : log.role === "learner" ? "You" : "System"}</Text>
              <Text style={styles.logText}>{log.text}</Text>
            </View>
          ))}
        </ScrollView>
      </View>

      <Pressable accessibilityRole="button" onPress={() => router.push("/speak/conversation?mode=free")} style={styles.compareLink}>
        <Text style={styles.compareText}>Open turn-based free chat</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.surfaceWarm,
    borderRadius: radii.md,
    padding: spacing.xl,
    gap: spacing.sm,
    alignItems: "center",
  },
  statusIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
  },
  statusIconLive: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 30,
    fontWeight: "900",
    textAlign: "center",
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
    textAlign: "center",
  },
  status: {
    color: colors.primary,
    fontWeight: "900",
  },
  statusLive: {
    color: colors.secondary,
  },
  controls: {
    flexDirection: "row",
    gap: spacing.md,
  },
  startButton: {
    minHeight: 56,
    flex: 1,
    borderRadius: radii.md,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  startButtonDisabled: {
    backgroundColor: colors.muted,
  },
  startText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "900",
  },
  controlButton: {
    minHeight: 56,
    flex: 1,
    borderRadius: radii.md,
    backgroundColor: colors.secondary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  controlButtonMuted: {
    backgroundColor: colors.primary,
  },
  controlButtonListening: {
    backgroundColor: colors.primaryDark,
  },
  endButton: {
    backgroundColor: colors.danger,
  },
  controlText: {
    color: colors.surface,
    fontWeight: "900",
  },
  logPanel: {
    minHeight: 280,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.md,
  },
  logTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: "900",
  },
  logContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  logBubble: {
    borderRadius: radii.md,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.xs,
  },
  coachLog: {
    backgroundColor: colors.surfaceWarm,
  },
  learnerLog: {
    backgroundColor: colors.secondarySoft,
  },
  logRole: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  logText: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  compareLink: {
    alignSelf: "center",
    padding: spacing.md,
  },
  compareText: {
    color: colors.secondary,
    fontWeight: "900",
  },
});
