import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  useAudioPlayer,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { router, useFocusEffect, useLocalSearchParams, useNavigation } from "expo-router";
import { ArrowLeft, Check, Mic, Square } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ConversationBubble } from "@/src/components/ConversationBubble";
import { Screen } from "@/src/components/Screen";
import { scenarios } from "@/src/content/scenarios";
import { getTabBarStyle } from "@/src/navigation/tabBarStyle";
import { buildLocalFeedback, personalizeFeedbackWithTurnPronunciation } from "@/src/services/feedback/sampleFeedback";
import { attachPracticeSessionReceipt } from "@/src/services/feedback/sessionReceipt";
import { buildRealtimeInstructions } from "@/src/services/realtime/sessionConfig";
import {
  checkPracticeConnection,
  checkLessonPronunciation,
  createRealtimeSession,
  generateSessionFeedback,
  getInitialPracticeConnectionStatus,
  sendVoiceTurn,
} from "@/src/services/realtime/realtimeClient";
import type { DrillResultOutcome } from "@/src/services/sync/progressSync";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { ConversationMode, ConversationTurn, CoachState, PronunciationCheckResult, SpeakingFeedback } from "@/src/types/speaking";

type VoiceTurnResult = {
  transcript: string;
  reply: string;
  supportText?: string;
  audioUrl?: string;
  isDemo?: boolean;
  pronunciation?: PronunciationCheckResult;
};

type PracticeDrill = {
  itemId?: string;
  source: "lesson" | "speaking";
  prompt: string;
  detail?: string;
};

const speakingRecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  extension: ".wav",
  numberOfChannels: 1,
  sampleRate: 16000,
  bitRate: 256000,
  android: {
    extension: ".m4a",
    outputFormat: "mpeg4",
    audioEncoder: "aac",
  },
  ios: {
    extension: ".wav",
    outputFormat: IOSOutputFormat.LINEARPCM,
    audioQuality: AudioQuality.MAX,
    linearPCMBitDepth: 16,
    linearPCMIsBigEndian: false,
    linearPCMIsFloat: false,
  },
  web: {
    mimeType: "audio/webm",
    bitsPerSecond: 128000,
  },
} satisfies typeof RecordingPresets.HIGH_QUALITY;

function withTimeout<T>(promise: Promise<T>, timeoutMillis: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out.")), timeoutMillis);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeout));
  });
}

function normalizeParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getPracticeDrill(params: {
  practiceItemId?: string | string[];
  practiceSource?: string | string[];
  practicePrompt?: string | string[];
  practiceDetail?: string | string[];
}): PracticeDrill | undefined {
  const prompt = normalizeParam(params.practicePrompt)?.trim();
  if (!prompt) return undefined;

  const rawSource = normalizeParam(params.practiceSource);
  return {
    itemId: normalizeParam(params.practiceItemId),
    source: rawSource === "lesson" ? "lesson" : "speaking",
    prompt: prompt.slice(0, 180),
    detail: normalizeParam(params.practiceDetail)?.trim().slice(0, 220),
  };
}

function getStarterTurn(scenario?: (typeof scenarios)[number], practiceDrill?: PracticeDrill): ConversationTurn {
  if (practiceDrill) {
    return {
      id: "coach-start",
      speaker: "coach",
      text: `Let's practice this: "${practiceDrill.prompt}" Say it once slowly, then say it naturally.`,
      supportText: practiceDrill.detail ?? "Pehle dheere boliye, phir natural speed mein boliye.",
    };
  }

  return {
    id: "coach-start",
    speaker: "coach",
    text: scenario?.starter ?? "Namaste. Tell me anything you want to say in English.",
    supportText: "Hindi, English, or mixed language is okay.",
  };
}

const roleplayContext: Record<string, { situation: string; partner: string }> = {
  introductions: {
    situation: "You are meeting someone and speaking about yourself.",
    partner: "Your coach is a friendly new person.",
  },
  shopping: {
    situation: "You are at a local shop asking for price and quantity.",
    partner: "Your coach is the shopkeeper.",
  },
  "parent-teacher": {
    situation: "You are speaking to your child's teacher at school.",
    partner: "Your coach is the teacher.",
  },
  travel: {
    situation: "You need help with directions or local transport.",
    partner: "Your coach is the driver or helper.",
  },
  "customer-service": {
    situation: "You are explaining a simple problem on a support call.",
    partner: "Your coach is customer support.",
  },
  interview: {
    situation: "You are giving a short self-introduction.",
    partner: "Your coach is the interviewer.",
  },
  "office-call": {
    situation: "You are making a polite phone call to an office.",
    partner: "Your coach is the office staff.",
  },
  "small-talk": {
    situation: "You are having a friendly chat with a neighbor or guest.",
    partner: "Your coach is the other person.",
  },
  "guest-at-home": {
    situation: "A guest has come home and you are welcoming them.",
    partner: "Your coach is the guest.",
  },
  "family-routine": {
    situation: "You are talking about cooking, children, and your morning.",
    partner: "Your coach is listening and asking simple questions.",
  },
  "child-homework": {
    situation: "Your child has come home from school.",
    partner: "Your coach is the child.",
  },
  "home-help": {
    situation: "You need polite help with a small home task.",
    partner: "Your coach is the family member or helper.",
  },
  "clinic-chemist": {
    situation: "You are at a clinic or chemist asking about fever, medicine, or dosage.",
    partner: "Your coach is the clinic staff or chemist.",
  },
  "society-office": {
    situation: "You are speaking to the society office about maintenance or a home issue.",
    partner: "Your coach is the society office staff.",
  },
  "bank-atm": {
    situation: "You are at the bank or ATM and need simple help.",
    partner: "Your coach is the bank helper.",
  },
  "repair-service": {
    situation: "You are calling a repair service for a home problem.",
    partner: "Your coach is the repair service person.",
  },
  "appointment-call": {
    situation: "You are calling to ask for an appointment time.",
    partner: "Your coach is the receptionist or office helper.",
  },
  "explain-problem": {
    situation: "You need to explain a small problem clearly and calmly.",
    partner: "Your coach is the person who can help you.",
  },
};

export default function ConversationScreen() {
  const params = useLocalSearchParams<{
    mode?: ConversationMode;
    scenarioId?: string;
    practiceItemId?: string;
    practiceSource?: string;
    practicePrompt?: string;
    practiceDetail?: string;
  }>();
  const mode: ConversationMode = params.mode === "roleplay" ? "roleplay" : "free";
  const scenario = scenarios.find((item) => item.id === params.scenarioId);
  const practiceDrill = useMemo(() => getPracticeDrill(params), [params.practiceDetail, params.practiceItemId, params.practicePrompt, params.practiceSource]);
  const addSpeakingFeedback = useAppStore((state) => state.addSpeakingFeedback);
  const addDrillResult = useAppStore((state) => state.addDrillResult);
  const savedPhrases = useAppStore((state) => state.savedPhrases);
  const mistakes = useAppStore((state) => state.mistakes);
  const feedbackHistory = useAppStore((state) => state.feedbackHistory);
  const recorder = useAudioRecorder(speakingRecordingOptions);
  const recorderState = useAudioRecorderState(recorder);
  const audioPlayer = useAudioPlayer();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const scrollRef = useRef<ScrollView>(null);
  const [coachState, setCoachState] = useState<CoachState>("neutral");
  const [isProcessing, setIsProcessing] = useState(false);
  const [micHelpText, setMicHelpText] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState(getInitialPracticeConnectionStatus);
  const [connectionNote, setConnectionNote] = useState(() => getInitialPracticeConnectionStatus().detail);
  const [turns, setTurns] = useState<ConversationTurn[]>(() => [getStarterTurn(scenario, practiceDrill)]);
  const turnsRef = useRef<ConversationTurn[]>(turns);

  const learnerMemory = useMemo(() => buildLearnerMemory(savedPhrases, mistakes, feedbackHistory), [feedbackHistory, mistakes, savedPhrases]);
  const baseInstructions = useMemo(() => buildRealtimeInstructions(mode, scenario), [mode, scenario]);
  const instructions = useMemo(() => {
    const memoryInstructions = learnerMemory
      ? `${baseInstructions}

Learner memory from recent practice:
${learnerMemory}
Use this memory quietly. Do not list it back. Choose one useful phrase or correction when it helps.`
      : baseInstructions;

    if (!practiceDrill) return memoryInstructions;

    return `${memoryInstructions}

This session is a targeted pronunciation/review drill.
Practice target: "${practiceDrill.prompt}".
Source: ${practiceDrill.source}.
Coach the learner to say the target slowly once, then naturally once, then use it in one tiny sentence if possible.
If the learner uses Hindi or Hinglish, help her return to this exact English target.`;
  }, [baseInstructions, learnerMemory, practiceDrill]);
  const practiceContext = useMemo(
    () => ({
      mode,
      scenario: scenario
        ? {
            id: scenario.id,
            title: scenario.title,
            goal: scenario.goal,
            difficulty: scenario.difficulty,
          }
        : undefined,
      focus: practiceDrill,
    }),
    [mode, scenario, practiceDrill]
  );

  useFocusEffect(
    useCallback(() => {
      const tabNavigation = navigation.getParent();
      tabNavigation?.setOptions({ tabBarStyle: { display: "none" } });

      return () => {
        tabNavigation?.setOptions({ tabBarStyle: getTabBarStyle(Math.max(insets.bottom, 8)) });
      };
    }, [insets.bottom, navigation])
  );

  useEffect(() => {
    const starterTurns = [getStarterTurn(scenario, practiceDrill)];
    turnsRef.current = starterTurns;
    setTurns(starterTurns);
    setMicHelpText(null);
    setCoachState("neutral");
  }, [mode, scenario?.id, practiceDrill?.prompt]);

  useEffect(() => {
    turnsRef.current = turns;
  }, [turns]);

  useEffect(() => {
    let isMounted = true;

    checkPracticeConnection().then((status) => {
      if (!isMounted) return;
      setConnectionStatus(status);
      setConnectionNote(status.detail);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  function createTurnId(prefix: string) {
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  function scrollConversationToEnd() {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    });
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 80);
  }

  async function appendCoachResult(result: VoiceTurnResult, userTurnLabel?: string) {
    setTurns((current) => {
      const nextTurns: ConversationTurn[] = [
        ...current,
        {
          id: createTurnId("user"),
          speaker: "user",
          text: result.transcript,
          label: userTurnLabel,
          pronunciation: result.pronunciation,
        },
        {
          id: createTurnId("coach"),
          speaker: "coach",
          text: result.reply,
          supportText: result.supportText,
          audioUrl: result.audioUrl,
        },
      ];
      turnsRef.current = nextTurns;
      return nextTurns;
    });
    scrollConversationToEnd();
    setCoachState("speaking");
    if (result.audioUrl) {
      audioPlayer.replace(result.audioUrl);
      audioPlayer.play();
      setConnectionNote("Playing coach audio from the voice endpoint.");
    }
    setTimeout(() => setCoachState("neutral"), 1200);
  }

  function replayCoachAudio(audioUrl: string) {
    setCoachState("speaking");
    audioPlayer.replace(audioUrl);
    audioPlayer.play();
    setConnectionNote("Replaying the coach audio.");
    setTimeout(() => setCoachState("neutral"), 1200);
  }

  async function exitConversation() {
    if (isProcessing) return;

    if (recorderState.isRecording) {
      try {
        await recorder.stop();
        await setAudioModeAsync({
          allowsRecording: false,
          playsInSilentMode: true,
        });
      } catch {
        // If stopping the recorder fails, still let the learner leave the screen.
      }
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    router.replace("/speak");
  }

  async function startRecording() {
    if (isProcessing) return;

    setMicHelpText(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setCoachState("neutral");
      setMicHelpText("Microphone access is off. Allow mic access and try again.");
      setConnectionNote("Voice practice is waiting for mic access.");
      return;
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      setCoachState("listening");
      await recorder.prepareToRecordAsync();
      recorder.record();
      setMicHelpText(null);
      setConnectionNote(
        connectionStatus.localApiReachable
          ? "Listening with the local API ready. Speak naturally, then stop recording."
          : "Recording for demo practice. Speak naturally, then stop recording."
      );
      void withTimeout(createRealtimeSession(instructions), 1200).catch(() => undefined);
    } catch (error) {
      setCoachState("neutral");
      const message = error instanceof Error ? error.message : "Could not start recording.";
      setMicHelpText("The microphone did not start. Try again.");
      setConnectionNote(`Voice practice could not start right now. ${message}`);
    }
  }

  function getVoiceRetryText(message: string) {
    const normalized = message.toLowerCase();
    if (normalized.includes("demo mode") || normalized.includes("configured")) {
      return "Voice replies need the local AI server. Try again after the server is connected.";
    }

    if (normalized.includes("timed out") || normalized.includes("timeout")) {
      return "Voice took too long to process. Try a shorter recording.";
    }

    if (normalized.includes("no recording")) {
      return "No recording was saved. Tap the mic and try once more.";
    }

    return "Voice did not process. Try recording again.";
  }

  async function stopRecording() {
    try {
      setIsProcessing(true);
      setCoachState("thinking");
      setMicHelpText(null);
      setConnectionNote("Coach is listening to your recording and preparing a reply.");
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });
      const audioUri = recorder.uri;
      if (!audioUri) {
        throw new Error("No recording was created.");
      }

      let result: VoiceTurnResult;
      try {
        result = await sendVoiceTurn(audioUri, instructions, turnsRef.current, practiceDrill?.prompt);
        setConnectionStatus((current) => ({
          ...current,
          isDemoMode: Boolean(result.isDemo),
          localApiReachable: true,
          openAIAvailable: !result.isDemo,
          openAIUnavailable: Boolean(result.isDemo),
          label: result.isDemo ? "Local demo" : "Local AI connected",
        }));
        setConnectionNote(
          result.isDemo
            ? "Local API returned a demo voice reply because OpenAI is unavailable."
            : "Local AI used your recording and conversation history."
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Voice could not be processed.";
        setMicHelpText(getVoiceRetryText(message));
        setConnectionNote("Voice practice could not process that recording.");
        setCoachState("neutral");
        return;
      }

      if (!result.transcript.trim()) {
        setMicHelpText("I could not catch clear words. Try recording again.");
        setConnectionNote("Voice practice needs a clearer recording before the coach can reply.");
        setCoachState("neutral");
        return;
      }

      try {
        if (result.pronunciation) {
          setConnectionNote(
            result.pronunciation.scoringMode === "audio"
              ? `Deep pronunciation score: ${Math.round(result.pronunciation.score)}%. Coach reply is ready.`
              : `Pronunciation fallback score: ${Math.round(result.pronunciation.score)}%. Coach reply is ready.`
          );
          await appendCoachResult(result, "I heard...");
          return;
        }

        const expectedText = practiceDrill?.prompt || result.transcript;
        const pronunciation = await checkLessonPronunciation(audioUri, expectedText);
        result = { ...result, pronunciation };
        setConnectionNote(
          pronunciation.scoringMode === "audio"
            ? `Deep pronunciation score: ${Math.round(pronunciation.score)}%. Coach reply is ready.`
            : `Pronunciation fallback score: ${Math.round(pronunciation.score)}%. Coach reply is ready.`
        );
      } catch {
        setConnectionNote("Coach reply is ready. Deep pronunciation scoring was unavailable for this turn.");
      }

      await appendCoachResult(result, "I heard...");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not process this voice turn.";
      setMicHelpText(getVoiceRetryText(message));
      setConnectionNote(`Voice practice had trouble with that turn. ${message}`);
      setCoachState("neutral");
    } finally {
      setIsProcessing(false);
    }
  }

  async function endSession() {
    if (isProcessing) return;

    setIsProcessing(true);
    setCoachState("thinking");
    setMicHelpText(null);
    setConnectionNote("Coach is preparing your practice feedback.");
    const sessionTurns = turnsRef.current;
    const learnerTurnCount = sessionTurns.filter((turn) => turn.speaker === "user").length;
    if (learnerTurnCount === 0) {
      setCoachState("neutral");
      setMicHelpText("Say one sentence before ending the session.");
      setConnectionNote("Feedback is created only after the coach has heard your words.");
      setIsProcessing(false);
      return;
    }

    let didSaveDrillResult = false;
    try {
      const feedback = attachPracticeSessionReceipt(
        personalizeFeedbackWithTurnPronunciation(await generateSessionFeedback(sessionTurns, practiceContext), sessionTurns),
        sessionTurns,
      );
      addSpeakingFeedback(feedback);
      if (practiceDrill && learnerTurnCount > 0) {
        addDrillResult(buildDrillResult(practiceDrill, feedback, learnerTurnCount));
        didSaveDrillResult = true;
      }
    } catch {
      const fallbackFeedback = attachPracticeSessionReceipt(
        personalizeFeedbackWithTurnPronunciation(buildLocalFeedback(sessionTurns), sessionTurns),
        sessionTurns,
      );
      addSpeakingFeedback(fallbackFeedback);
      if (practiceDrill && learnerTurnCount > 0) {
        addDrillResult(buildDrillResult(practiceDrill, fallbackFeedback, learnerTurnCount));
        didSaveDrillResult = true;
      }
    }
    router.push(didSaveDrillResult ? "/speak/feedback?showDrill=1" : "/speak/feedback");
    setIsProcessing(false);
  }

  const topControlsTop = Math.max(insets.top, spacing.sm);
  const topControlsHeight = 44;
  const topControlsClearance = topControlsTop + topControlsHeight + spacing.md;

  return (
    <Screen testID="speak-conversation-screen" scroll={false} edges={["right", "bottom", "left"]}>
      <View style={styles.container}>
        <ScrollView
          testID="conversation-message-list"
          ref={scrollRef}
          style={styles.messages}
          contentContainerStyle={[
            styles.messagesContent,
            {
              paddingTop: topControlsClearance,
              paddingBottom: Math.max(insets.bottom, spacing.lg) + 104,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
        >
          {turns.map((turn, index) => (
            <ConversationBubble
              key={turn.id}
              testID={index === 0 ? "conversation-first-message" : undefined}
              turn={turn}
              onReplayAudio={replayCoachAudio}
            />
          ))}
        </ScrollView>
        <Pressable
          testID="conversation-back-button"
          accessibilityRole="button"
          accessibilityLabel="Back to speaking options"
          onPress={exitConversation}
          disabled={isProcessing}
          style={[
            styles.topButton,
            {
              top: topControlsTop,
              left: spacing.md,
            },
            isProcessing && styles.floatingButtonDisabled,
          ]}
        >
          <ArrowLeft color={colors.ink} size={20} />
        </Pressable>
        <Pressable
          testID="conversation-end-button"
          accessibilityRole="button"
          accessibilityLabel="End speaking session"
          onPress={endSession}
          disabled={isProcessing}
          style={[
            styles.topButton,
            {
              top: topControlsTop,
              right: spacing.md,
            },
            isProcessing && styles.floatingButtonDisabled,
          ]}
        >
          <Check color={colors.primary} size={18} />
        </Pressable>
        <Pressable
          testID={recorderState.isRecording ? "speak-stop-recording-button" : "speak-start-recording-button"}
          accessibilityRole="button"
          accessibilityLabel={recorderState.isRecording ? "Stop recording" : isProcessing ? "Processing voice" : "Start recording"}
          onPress={recorderState.isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          style={[
            styles.floatingMic,
            {
              right: spacing.lg,
              bottom: Math.max(insets.bottom, spacing.md) + spacing.sm,
            },
            recorderState.isRecording && styles.floatingMicRecording,
            isProcessing && styles.floatingButtonDisabled,
          ]}
        >
          {isProcessing ? (
            <ActivityIndicator color={colors.surface} />
          ) : recorderState.isRecording ? (
            <Square color={colors.surface} size={28} />
          ) : (
            <Mic color={colors.surface} size={30} />
          )}
        </Pressable>
      </View>
    </Screen>
  );
}

function buildDrillResult(
  practiceDrill: PracticeDrill,
  feedback: SpeakingFeedback,
  learnerTurnCount: number,
) {
  const rawScore =
    typeof feedback.pronunciation.score === "number"
      ? feedback.pronunciation.score
      : typeof feedback.confidence.score === "number"
        ? feedback.confidence.score
        : undefined;
  const score = typeof rawScore === "number" ? (rawScore <= 1 ? rawScore * 100 : rawScore) : undefined;
  const outcome: DrillResultOutcome =
    typeof score === "number" && score >= 82 ? "improved" : learnerTurnCount > 1 || (score ?? 0) >= 60 ? "practiced" : "needs-retry";

  return {
    itemId: practiceDrill.itemId,
    source: practiceDrill.source,
    target: practiceDrill.prompt,
    outcome,
    attempted: true,
    learnerTurnCount,
    score,
    summary: feedback.pronunciation.summary || feedback.confidence.note,
    tips: feedback.pronunciation.tips?.length ? feedback.pronunciation.tips : [feedback.confidence.nextStep],
  };
}

function normalizePracticeText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function getRoleplayProgress(scenario: (typeof scenarios)[number] | undefined, turns: ConversationTurn[]) {
  const phrases = scenario?.suggestedReplies ?? [];
  const learnerText = normalizePracticeText(turns.filter((turn) => turn.speaker === "user").map((turn) => turn.text).join(" "));
  const items = phrases.map((phrase) => {
    const normalizedPhrase = normalizePracticeText(phrase);
    const keywords = normalizedPhrase.split(" ").filter((word) => word.length > 2);
    const matchedKeywords = keywords.filter((word) => learnerText.includes(word)).length;

    return {
      phrase,
      done: normalizedPhrase ? learnerText.includes(normalizedPhrase) || matchedKeywords >= Math.max(1, Math.ceil(keywords.length * 0.6)) : false,
    };
  });

  return {
    total: items.length,
    completed: items.filter((item) => item.done).length,
    items,
  };
}

function buildLearnerMemory(savedPhrases: string[], mistakes: string[], feedbackHistory: SpeakingFeedback[]) {
  const recentFeedback = feedbackHistory[0];
  const parts = [
    savedPhrases.length ? `Saved phrases: ${savedPhrases.slice(0, 4).join(" | ")}` : "",
    mistakes.length ? `Recent correction patterns: ${mistakes.slice(0, 4).join(" | ")}` : "",
    recentFeedback?.confidence?.nextStep ? `Last next step: ${recentFeedback.confidence.nextStep}` : "",
    recentFeedback?.pronunciation?.retryWords?.length ? `Retry words: ${recentFeedback.pronunciation.retryWords.slice(0, 4).join(", ")}` : "",
  ].filter(Boolean);

  return parts.join("\n");
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messages: {
    flex: 1,
    backgroundColor: colors.background,
  },
  messagesContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  topButton: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
  },
  floatingMic: {
    position: "absolute",
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 18,
    elevation: 8,
  },
  floatingMicRecording: {
    backgroundColor: colors.danger,
  },
  floatingButtonDisabled: {
    opacity: 0.45,
  },
});
