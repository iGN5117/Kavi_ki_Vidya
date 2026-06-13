import {
  AudioQuality,
  IOSOutputFormat,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { router, useLocalSearchParams } from "expo-router";
import { CheckCircle2, Mic2, RotateCcw, Volume2 } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MeaningPanel } from "@/src/components/MeaningPanel";
import { PrimaryActionButton } from "@/src/components/PrimaryActionButton";
import { Screen } from "@/src/components/Screen";
import { SkipConfirmationSheet } from "@/src/components/SkipConfirmationSheet";
import { lessons, getLesson } from "@/src/content/lessons";
import { modules } from "@/src/content/modules";
import { usePlayableAudio } from "@/src/hooks/usePlayableAudio";
import { checkLessonPronunciation, createLessonAudio } from "@/src/services/realtime/realtimeClient";
import { useAppStore } from "@/src/store/useAppStore";
import { colors, radii, spacing } from "@/src/theme/theme";
import type { LessonActivity } from "@/src/types/content";
import type { PronunciationCheckResult } from "@/src/types/speaking";

const orderedLessonIds = modules.flatMap((module) => module.lessonIds);
const pronunciationRecordingOptions = {
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

type PronunciationStatus = "idle" | "loading-model" | "model-ready" | "recording" | "checking" | "checked" | "error";

export default function LessonScreen() {
  const { lessonId } = useLocalSearchParams<{ lessonId: string }>();
  const lesson = useMemo(() => getLesson(lessonId) ?? getLesson("greetings-intro")!, [lessonId]);
  const recorder = useAudioRecorder(pronunciationRecordingOptions);
  const recorderState = useAudioRecorderState(recorder);
  const modelAudioPlayback = usePlayableAudio({ label: "learn-model" });
  const [activityIndex, setActivityIndex] = useState(-1);
  const [meaningVisible, setMeaningVisible] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [selectedMeaningOption, setSelectedMeaningOption] = useState<string | null>(null);
  const [selectedFillBlankAnswer, setSelectedFillBlankAnswer] = useState<string | null>(null);
  const [selectedFixedSentence, setSelectedFixedSentence] = useState<string | null>(null);
  const [arrangedWordIndexes, setArrangedWordIndexes] = useState<number[]>([]);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [repeatedConfirmed, setRepeatedConfirmed] = useState(false);
  const [spokenConfirmed, setSpokenConfirmed] = useState(false);
  const [checkedCount, setCheckedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [reviewPrompts, setReviewPrompts] = useState<string[]>([]);
  const [skipVisible, setSkipVisible] = useState(false);
  const [modelAudioUrl, setModelAudioUrl] = useState<string | null>(null);
  const [pronunciationStatus, setPronunciationStatus] = useState<PronunciationStatus>("idle");
  const [pronunciationResult, setPronunciationResult] = useState<PronunciationCheckResult | null>(null);
  const [pronunciationHelp, setPronunciationHelp] = useState<string | null>(null);
  const { explanationPreference, completeLesson, skipLesson, completedLessons, skippedLessons, skippedModules } = useAppStore();

  const activity = lesson.activities[activityIndex] as LessonActivity | undefined;
  const isOverview = activityIndex < 0;
  const isDone = activityIndex >= lesson.activities.length;
  const progressValue = isOverview ? 0 : isDone ? 1 : (activityIndex + 1) / lesson.activities.length;
  const progressPercent = Math.round(progressValue * 100);
  const selectedChoiceIsCorrect = activity?.type === "choice" && selectedOption === activity.answer;
  const selectedMeaningIsCorrect = activity?.type === "chooseMeaning" && selectedMeaningOption === activity.answer;
  const selectedFillBlankIsCorrect = activity?.type === "fillBlank" && selectedFillBlankAnswer === activity.answer;
  const selectedFixSentenceIsCorrect = activity?.type === "fixSentence" && selectedFixedSentence === activity.answer;
  const arrangedWords = activity?.type === "arrangeWords" ? arrangedWordIndexes.map((index) => activity.words[index]) : [];
  const arrangeComplete = activity?.type === "arrangeWords" && arrangedWordIndexes.length === activity.words.length;
  const arrangedWordsAreCorrect =
    activity?.type === "arrangeWords" &&
    arrangeComplete &&
    arrangedWords.every((word, index) => word === activity.answer[index]);
  const isCheckableActivity =
    activity?.type === "choice" ||
    activity?.type === "chooseMeaning" ||
    activity?.type === "fillBlank" ||
    activity?.type === "arrangeWords" ||
    activity?.type === "fixSentence";
  const hasCheckableAnswer =
    (activity?.type === "choice" && Boolean(selectedOption)) ||
    (activity?.type === "chooseMeaning" && Boolean(selectedMeaningOption)) ||
    (activity?.type === "fillBlank" && Boolean(selectedFillBlankAnswer)) ||
    (activity?.type === "arrangeWords" && arrangeComplete) ||
    (activity?.type === "fixSentence" && Boolean(selectedFixedSentence));
  const canContinue =
    !activity ||
    (activity.type === "sentence" && repeatedConfirmed) ||
    (isCheckableActivity && hasCheckableAnswer && answerChecked) ||
    (activity.type === "speak" && spokenConfirmed);
  const targetSentence = activity?.type === "sentence" || activity?.type === "speak" ? activity.sentence.targetText : undefined;
  const isPronunciationBusy =
    pronunciationStatus === "loading-model" || pronunciationStatus === "recording" || pronunciationStatus === "checking";
  const nextLesson = useMemo(() => {
    const currentIndex = orderedLessonIds.indexOf(lesson.id);
    const remainingLessonIds = orderedLessonIds.slice(currentIndex + 1);

    return remainingLessonIds
      .map((nextLessonId) => lessons.find((candidate) => candidate.id === nextLessonId))
      .find(
        (candidate) =>
          candidate &&
          !completedLessons.includes(candidate.id) &&
          !skippedLessons.includes(candidate.id) &&
          !skippedModules.includes(candidate.moduleId),
      );
  }, [completedLessons, lesson.id, skippedLessons, skippedModules]);
  const lessonScore = checkedCount ? Math.round((correctCount / checkedCount) * 100) : 100;

  useEffect(() => {
    resetInteractionState();
    resetAttemptState();
  }, [lesson.id]);

  useEffect(() => {
    let isMounted = true;

    setModelAudioUrl(null);
    setPronunciationResult(null);
    setPronunciationHelp(null);

    if (!targetSentence) {
      setPronunciationStatus("idle");
      return () => {
        isMounted = false;
      };
    }

    setPronunciationStatus("loading-model");
    createLessonAudio(targetSentence)
      .then(async (result) => {
        if (!isMounted) return;
        if (result.audioUrl) {
          setModelAudioUrl(result.audioUrl);
          setPronunciationStatus("model-ready");
          setPronunciationHelp("Listen first, then record your repeat.");
          await playSentenceAudio(result.audioUrl);
        } else {
          setPronunciationStatus("model-ready");
          setPronunciationHelp("Model audio is unavailable, but you can still record your repeat.");
        }
      })
      .catch((error) => {
        if (!isMounted) return;
        const message = error instanceof Error ? error.message : "Unknown audio error.";
        console.warn(`[kavi-audio] learn-model load-failed ${message}`);
        setPronunciationStatus("model-ready");
        setPronunciationHelp("Model audio could not load. Record your repeat when ready.");
      });

    return () => {
      isMounted = false;
    };
  }, [targetSentence]);

  function resetInteractionState() {
    setMeaningVisible(false);
    setSelectedOption(null);
    setSelectedMeaningOption(null);
    setSelectedFillBlankAnswer(null);
    setSelectedFixedSentence(null);
    setArrangedWordIndexes([]);
    setAnswerChecked(false);
    setRepeatedConfirmed(false);
    setSpokenConfirmed(false);
    setModelAudioUrl(null);
    setPronunciationStatus("idle");
    setPronunciationResult(null);
    setPronunciationHelp(null);
  }

  function resetAttemptState() {
    setCheckedCount(0);
    setCorrectCount(0);
    setRetryCount(0);
    setReviewPrompts([]);
  }

  function next() {
    resetInteractionState();
    if (activityIndex + 1 >= lesson.activities.length) {
      completeLesson(lesson.id, lesson.durationMinutes, {
        score: lessonScore,
        correctCount,
        checkedCount,
        retryCount,
        reviewPrompts: getUniqueReviewPrompts(reviewPrompts),
      });
      setActivityIndex(lesson.activities.length);
      return;
    }
    setActivityIndex(activityIndex + 1);
  }

  function confirmSkip() {
    skipLesson(lesson.id);
    setSkipVisible(false);
    router.back();
  }

  function openNextLesson(nextLessonId: string) {
    setActivityIndex(-1);
    resetInteractionState();
    resetAttemptState();
    router.replace(`/learn/lesson/${nextLessonId}`);
  }

  function selectArrangeWord(wordIndex: number) {
    setAnswerChecked(false);
    setArrangedWordIndexes((indexes) => [...indexes, wordIndex]);
  }

  function removeArrangeWord(selectedIndex: number) {
    setAnswerChecked(false);
    setArrangedWordIndexes((indexes) => indexes.filter((_, index) => index !== selectedIndex));
  }

  function handlePrimaryAction() {
    if (isCheckableActivity && hasCheckableAnswer && !answerChecked) {
      const answerIsCorrect = isCurrentAnswerCorrect(
        activity,
        selectedOption,
        selectedMeaningOption,
        selectedFillBlankAnswer,
        selectedFixedSentence,
        arrangedWords,
      );
      setCheckedCount((count) => count + 1);
      if (answerIsCorrect) {
        setCorrectCount((count) => count + 1);
      } else {
        setRetryCount((count) => count + 1);
        setReviewPrompts((prompts) => getUniqueReviewPrompts([...prompts, getReviewPromptForActivity(activity)]));
      }
      setAnswerChecked(true);
      setMeaningVisible(true);
      return;
    }

    next();
  }

  async function playSentenceAudio(audioUrl = modelAudioUrl) {
    if (!audioUrl) return;

    await modelAudioPlayback.playUrl(audioUrl);
  }

  async function startPronunciationRecording() {
    if (!targetSentence || isPronunciationBusy) return;

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setPronunciationStatus("error");
      setPronunciationHelp("Microphone access is off. Allow mic access to verify pronunciation.");
      return;
    }

    try {
      setPronunciationResult(null);
      setPronunciationHelp(null);
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPronunciationStatus("recording");
      setPronunciationHelp("Recording. Say the full sentence once, then stop.");
    } catch {
      setPronunciationStatus("error");
      setPronunciationHelp("The microphone did not start. Try again.");
    }
  }

  async function stopPronunciationRecording() {
    if (!targetSentence || pronunciationStatus !== "recording") return;

    try {
      setPronunciationStatus("checking");
      setPronunciationHelp("Checking your pronunciation...");
      await recorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
      });

      const audioUri = recorder.uri;
      if (!audioUri) {
        throw new Error("No recording was created.");
      }

      const result = await checkLessonPronunciation(audioUri, targetSentence);
      setPronunciationResult(result);
      setPronunciationStatus("checked");
      setPronunciationHelp(null);
      if (activity?.type === "sentence") {
        setRepeatedConfirmed(true);
      }
      if (activity?.type === "speak") {
        setSpokenConfirmed(true);
      }
      setCheckedCount((count) => count + 1);
      if (result.score >= 82) {
        setCorrectCount((count) => count + 1);
      } else {
        setRetryCount((count) => count + 1);
        setReviewPrompts((prompts) => getUniqueReviewPrompts([...prompts, targetSentence]));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Pronunciation check failed.";
      setPronunciationStatus("error");
      setPronunciationHelp(message.includes("transcribe") ? "Could not hear the sentence clearly. Try again slowly." : "Could not check that recording. Try once more.");
    }
  }

  function retryPronunciation() {
    if (activity?.type === "sentence") setRepeatedConfirmed(false);
    if (activity?.type === "speak") setSpokenConfirmed(false);
    setPronunciationResult(null);
    setPronunciationStatus(modelAudioUrl ? "model-ready" : "idle");
    setPronunciationHelp("Try again slowly, one word at a time.");
  }

  function getPrimaryActionLabel() {
    if (activityIndex + 1 >= lesson.activities.length && canContinue) {
      return "Finish lesson";
    }

    if (isCheckableActivity && !answerChecked) {
      return "Check answer";
    }

    return "Continue";
  }

  if (isDone) {
    return (
      <Screen testID="lesson-complete-screen">
        <LessonProgressBar currentStep={lesson.activities.length} totalSteps={lesson.activities.length} progressPercent={100} />
        <View style={styles.success}>
          <Text style={styles.successIcon}>✓</Text>
          <Text style={styles.title}>Good effort</Text>
          <Text style={styles.copy}>You completed a short English practice. Your streak has started for today.</Text>
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Lesson score</Text>
            <Text style={styles.scoreValue}>{lessonScore}%</Text>
            <Text style={styles.scoreDetail}>
              {retryCount
                ? `${retryCount} sentence${retryCount === 1 ? "" : "s"} added to Review.`
                : "Everything looked ready for light review."}
            </Text>
          </View>
          {nextLesson ? (
            <PrimaryActionButton label={`Next: ${nextLesson.title}`} onPress={() => openNextLesson(nextLesson.id)} />
          ) : (
            <PrimaryActionButton label="Practice speaking" onPress={() => router.push("/speak")} />
          )}
          <PrimaryActionButton label="Back to Learn" variant="ghost" onPress={() => router.back()} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen testID={isOverview ? "lesson-overview-screen" : "lesson-activity-screen"}>
      <LessonProgressBar
        currentStep={isOverview ? 0 : activityIndex + 1}
        totalSteps={lesson.activities.length}
        progressPercent={progressPercent}
      />
      {isOverview ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>Lesson overview • {lesson.durationMinutes} min</Text>
          <Text style={styles.title}>{lesson.title}</Text>
          <Text style={styles.copy}>{lesson.overview}</Text>
          <View style={styles.overviewList}>
            {lesson.skipOverview.map((item) => (
              <Text key={item} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
          <PrimaryActionButton testID="lesson-overview-start-button" label="Start lesson" onPress={next} />
          <PrimaryActionButton label="Skip lesson" variant="ghost" onPress={() => setSkipVisible(true)} />
        </View>
      ) : activity ? (
        <View style={styles.card}>
          <Text style={styles.eyebrow}>
            Step {activityIndex + 1} of {lesson.activities.length}
          </Text>
          <Text style={styles.prompt}>{activity.prompt}</Text>
          {activity.type === "choice" ? (
            <View style={styles.options}>
              {activity.options.map((option) => {
                const selected = selectedOption === option;
                const revealCorrect = Boolean(selectedOption) && option === activity.answer;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      setSelectedOption(option);
                      setAnswerChecked(false);
                    }}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    style={[
                      styles.option,
                      answerChecked && selected && selectedChoiceIsCorrect && styles.correctOption,
                      answerChecked && selected && !selectedChoiceIsCorrect && styles.tryAgainOption,
                      answerChecked && revealCorrect && !selected && styles.revealedCorrectOption,
                    ]}
                  >
                    <Text style={styles.optionText}>{option}</Text>
                  </Pressable>
                );
              })}
              {selectedOption && answerChecked ? (
                <>
                  <View style={[styles.feedback, selectedChoiceIsCorrect ? styles.correctFeedback : styles.tryAgainFeedback]}>
                    <Text style={styles.feedbackTitle}>
                      {selectedChoiceIsCorrect ? "Correct. Nicely chosen." : "Good try. Look at the natural sentence."}
                    </Text>
                    <Text style={styles.feedbackCopy}>
                      {selectedChoiceIsCorrect
                        ? "This is the sentence you can safely use while speaking."
                        : `The best answer is: ${activity.answer}`}
                    </Text>
                  </View>
                  <MeaningPanel
                    visible={meaningVisible}
                    onToggle={() => setMeaningVisible((visible) => !visible)}
                    preference={explanationPreference}
                    support={activity.explanation}
                  />
                </>
              ) : null}
            </View>
          ) : activity.type === "chooseMeaning" ? (
            <View style={styles.chooseMeaningPractice}>
              <View style={styles.sentenceCard}>
                <View style={styles.sentenceRow}>
                  <Text style={styles.sentence}>{activity.sentence.targetText}</Text>
                  <Volume2 color={colors.primary} size={22} />
                </View>
              </View>
              <View style={styles.options}>
                {activity.options.map((option) => {
                  const selected = selectedMeaningOption === option;
                  const revealCorrect = Boolean(selectedMeaningOption) && option === activity.answer;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setSelectedMeaningOption(option);
                        setAnswerChecked(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.option,
                        answerChecked && selected && selectedMeaningIsCorrect && styles.correctOption,
                        answerChecked && selected && !selectedMeaningIsCorrect && styles.tryAgainOption,
                        answerChecked && revealCorrect && !selected && styles.revealedCorrectOption,
                      ]}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedMeaningOption && answerChecked ? (
                <>
                  <View style={[styles.feedback, selectedMeaningIsCorrect ? styles.correctFeedback : styles.tryAgainFeedback]}>
                    <Text style={styles.feedbackTitle}>
                      {selectedMeaningIsCorrect ? "Correct. You understood the meaning." : "Good try. Review the meaning once."}
                    </Text>
                    <Text style={styles.feedbackCopy}>
                      {selectedMeaningIsCorrect ? activity.answer : `Best meaning: ${activity.answer}`}
                    </Text>
                  </View>
                  <MeaningPanel
                    visible={meaningVisible}
                    onToggle={() => setMeaningVisible((visible) => !visible)}
                    preference={explanationPreference}
                    support={activity.explanation}
                  />
                </>
              ) : null}
            </View>
          ) : activity.type === "fillBlank" ? (
            <View style={styles.fillBlankPractice}>
              <View style={styles.fillSentence}>
                <Text style={styles.fillSentenceText}>{activity.sentenceStart}</Text>
                <View style={[styles.blankSlot, selectedFillBlankAnswer && styles.filledBlankSlot]}>
                  <Text style={[styles.blankSlotText, selectedFillBlankAnswer && styles.filledBlankSlotText]}>
                    {selectedFillBlankAnswer ?? "____"}
                  </Text>
                </View>
                <Text style={styles.fillSentenceText}>{activity.sentenceEnd}</Text>
              </View>
              <View style={styles.options}>
                {activity.options.map((option) => {
                  const selected = selectedFillBlankAnswer === option;
                  const revealCorrect = Boolean(selectedFillBlankAnswer) && option === activity.answer;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setSelectedFillBlankAnswer(option);
                        setAnswerChecked(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.option,
                        answerChecked && selected && selectedFillBlankIsCorrect && styles.correctOption,
                        answerChecked && selected && !selectedFillBlankIsCorrect && styles.tryAgainOption,
                        answerChecked && revealCorrect && !selected && styles.revealedCorrectOption,
                      ]}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedFillBlankAnswer && answerChecked ? (
                <>
                  <View style={[styles.feedback, selectedFillBlankIsCorrect ? styles.correctFeedback : styles.tryAgainFeedback]}>
                    <Text style={styles.feedbackTitle}>
                      {selectedFillBlankIsCorrect ? "Correct. The sentence is complete." : "Good try. Check the missing word."}
                    </Text>
                    <Text style={styles.feedbackCopy}>
                      {selectedFillBlankIsCorrect
                        ? `${activity.sentenceStart}${activity.answer}${activity.sentenceEnd}`
                        : `Best answer: ${activity.answer}`}
                    </Text>
                  </View>
                  <MeaningPanel
                    visible={meaningVisible}
                    onToggle={() => setMeaningVisible((visible) => !visible)}
                    preference={explanationPreference}
                    support={activity.explanation}
                  />
                </>
              ) : null}
            </View>
          ) : activity.type === "arrangeWords" ? (
            <View style={styles.arrangePractice}>
              <View style={styles.arrangedSentence}>
                {arrangedWordIndexes.length > 0 ? (
                  arrangedWords.map((word, index) => (
                    <Pressable
                      key={`${word}-${index}`}
                      onPress={() => removeArrangeWord(index)}
                      accessibilityRole="button"
                      style={styles.selectedWordChip}
                    >
                      <Text style={styles.selectedWordText}>{word}</Text>
                    </Pressable>
                  ))
                ) : (
                  <Text style={styles.arrangePlaceholder}>Tap the words in the correct order.</Text>
                )}
              </View>
              <View style={styles.wordBank}>
                {activity.words.map((word, index) => {
                  const selected = arrangedWordIndexes.includes(index);

                  return (
                    <Pressable
                      key={`${word}-${index}`}
                      onPress={() => selectArrangeWord(index)}
                      disabled={selected}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: selected }}
                      style={[styles.wordChip, selected && styles.usedWordChip]}
                    >
                      <Text style={[styles.wordChipText, selected && styles.usedWordChipText]}>{word}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {arrangedWordIndexes.length > 0 ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    setArrangedWordIndexes([]);
                    setAnswerChecked(false);
                  }}
                  style={styles.resetArrangeButton}
                >
                  <Text style={styles.resetArrangeText}>Clear</Text>
                </Pressable>
              ) : null}
              {arrangeComplete && answerChecked ? (
                <>
                  <View style={[styles.feedback, arrangedWordsAreCorrect ? styles.correctFeedback : styles.tryAgainFeedback]}>
                    <Text style={styles.feedbackTitle}>
                      {arrangedWordsAreCorrect ? "Correct. The sentence is in order." : "Good try. Notice the natural order."}
                    </Text>
                    <Text style={styles.feedbackCopy}>
                      {arrangedWordsAreCorrect
                        ? arrangedWords.join(" ")
                        : `Best order: ${activity.answer.join(" ")}`}
                    </Text>
                  </View>
                  <MeaningPanel
                    visible={meaningVisible}
                    onToggle={() => setMeaningVisible((visible) => !visible)}
                    preference={explanationPreference}
                    support={activity.explanation}
                  />
                </>
              ) : null}
            </View>
          ) : activity.type === "fixSentence" ? (
            <View style={styles.fixSentencePractice}>
              <View style={styles.incorrectSentenceCard}>
                <Text style={styles.incorrectLabel}>Fix this sentence</Text>
                <Text style={styles.incorrectSentence}>{activity.incorrectSentence}</Text>
              </View>
              <View style={styles.options}>
                {activity.options.map((option) => {
                  const selected = selectedFixedSentence === option;
                  const revealCorrect = Boolean(selectedFixedSentence) && option === activity.answer;

                  return (
                    <Pressable
                      key={option}
                      onPress={() => {
                        setSelectedFixedSentence(option);
                        setAnswerChecked(false);
                      }}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      style={[
                        styles.option,
                        answerChecked && selected && selectedFixSentenceIsCorrect && styles.correctOption,
                        answerChecked && selected && !selectedFixSentenceIsCorrect && styles.tryAgainOption,
                        answerChecked && revealCorrect && !selected && styles.revealedCorrectOption,
                      ]}
                    >
                      <Text style={styles.optionText}>{option}</Text>
                    </Pressable>
                  );
                })}
              </View>
              {selectedFixedSentence && answerChecked ? (
                <>
                  <View style={[styles.feedback, selectedFixSentenceIsCorrect ? styles.correctFeedback : styles.tryAgainFeedback]}>
                    <Text style={styles.feedbackTitle}>
                      {selectedFixSentenceIsCorrect ? "Correct. The sentence is natural now." : "Good try. Notice the corrected sentence."}
                    </Text>
                    <Text style={styles.feedbackCopy}>
                      {selectedFixSentenceIsCorrect ? activity.answer : `Best sentence: ${activity.answer}`}
                    </Text>
                  </View>
                  <MeaningPanel
                    visible={meaningVisible}
                    onToggle={() => setMeaningVisible((visible) => !visible)}
                    preference={explanationPreference}
                    support={activity.explanation}
                  />
                </>
              ) : null}
            </View>
          ) : (
            <View style={styles.sentenceCard}>
              <View style={styles.sentenceRow}>
                <Text style={styles.sentence}>{activity.sentence.targetText}</Text>
                <Volume2 color={colors.primary} size={22} />
              </View>
              <MeaningPanel
                visible={meaningVisible}
                onToggle={() => setMeaningVisible((visible) => !visible)}
                preference={explanationPreference}
                support={activity.sentence.support}
              />
              {activity.type === "sentence" ? (
                <View style={styles.repeatPractice}>
                  <Text style={styles.speakHint}>Listen to the model voice, then record yourself repeating the sentence.</Text>
                  <PronunciationPractice
                    modelAudioUrl={modelAudioUrl}
                    status={pronunciationStatus}
                    result={pronunciationResult}
                    helpText={pronunciationHelp}
                    durationMillis={recorderState.durationMillis}
                    isModelPlaying={modelAudioPlayback.audioStatus.playing}
                    onPlayModel={() => playSentenceAudio()}
                    onRecord={startPronunciationRecording}
                    onStop={stopPronunciationRecording}
                    onRetry={retryPronunciation}
                  />
                </View>
              ) : null}
              {activity.type === "speak" ? (
                <View style={styles.speakPractice}>
                  <Text style={styles.speakHint}>Listen first. Then record the sentence slowly once for a pronunciation check.</Text>
                  <PronunciationPractice
                    modelAudioUrl={modelAudioUrl}
                    status={pronunciationStatus}
                    result={pronunciationResult}
                    helpText={pronunciationHelp}
                    durationMillis={recorderState.durationMillis}
                    isModelPlaying={modelAudioPlayback.audioStatus.playing}
                    onPlayModel={() => playSentenceAudio()}
                    onRecord={startPronunciationRecording}
                    onStop={stopPronunciationRecording}
                    onRetry={retryPronunciation}
                  />
                </View>
              ) : null}
            </View>
          )}
          <PrimaryActionButton
            label={getPrimaryActionLabel()}
            disabled={isCheckableActivity ? !hasCheckableAnswer : !canContinue}
            onPress={handlePrimaryAction}
          />
        </View>
      ) : null}
      <SkipConfirmationSheet
        visible={skipVisible}
        title={lesson.title}
        overview={lesson.skipOverview}
        onCancel={() => setSkipVisible(false)}
        onConfirm={confirmSkip}
      />
    </Screen>
  );
}

function isCurrentAnswerCorrect(
  activity: LessonActivity | undefined,
  selectedOption: string | null,
  selectedMeaningOption: string | null,
  selectedFillBlankAnswer: string | null,
  selectedFixedSentence: string | null,
  arrangedWords: string[],
) {
  if (activity?.type === "choice") return selectedOption === activity.answer;
  if (activity?.type === "chooseMeaning") return selectedMeaningOption === activity.answer;
  if (activity?.type === "fillBlank") return selectedFillBlankAnswer === activity.answer;
  if (activity?.type === "arrangeWords") return arrangedWords.every((word, index) => word === activity.answer[index]);
  if (activity?.type === "fixSentence") return selectedFixedSentence === activity.answer;
  return true;
}

function getReviewPromptForActivity(activity: LessonActivity | undefined) {
  if (activity?.type === "choice") return activity.answer;
  if (activity?.type === "chooseMeaning") return activity.sentence.targetText;
  if (activity?.type === "fillBlank") return `${activity.sentenceStart}${activity.answer}${activity.sentenceEnd}`;
  if (activity?.type === "arrangeWords") return activity.answer.join(" ");
  if (activity?.type === "fixSentence") return activity.answer;
  if (activity?.type === "sentence" || activity?.type === "speak") return activity.sentence.targetText;
  return "Repeat the lesson sentence slowly.";
}

function getUniqueReviewPrompts(prompts: string[]) {
  return Array.from(new Set(prompts.map((prompt) => prompt.trim()).filter(Boolean))).slice(0, 6);
}

function PronunciationPractice({
  modelAudioUrl,
  status,
  result,
  helpText,
  durationMillis,
  isModelPlaying,
  onPlayModel,
  onRecord,
  onStop,
  onRetry,
}: {
  modelAudioUrl: string | null;
  status: PronunciationStatus;
  result: PronunciationCheckResult | null;
  helpText: string | null;
  durationMillis: number;
  isModelPlaying: boolean;
  onPlayModel: () => void;
  onRecord: () => void;
  onStop: () => void;
  onRetry: () => void;
}) {
  const isRecording = status === "recording";
  const isChecking = status === "checking";
  const isLoadingModel = status === "loading-model";
  const verdictTone = result?.verdict === "clear" ? styles.correctFeedback : styles.tryAgainFeedback;

  return (
    <View style={styles.pronunciationPanel}>
      <View style={styles.pronunciationActions}>
        <Pressable
          testID="lesson-play-model-button"
          accessibilityRole="button"
          accessibilityLabel="Play model voice"
          onPress={onPlayModel}
          disabled={!modelAudioUrl || isRecording || isChecking || isLoadingModel}
          style={[
            styles.practiceButton,
            (!modelAudioUrl || isRecording || isChecking || isLoadingModel) && styles.practiceButtonDisabled,
          ]}
        >
          <Volume2 color={colors.primary} size={20} />
          <Text style={styles.practiceButtonText}>{isLoadingModel ? "Loading voice" : "Play model"}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isRecording ? "Stop pronunciation recording" : "Record pronunciation"}
          onPress={isRecording ? onStop : onRecord}
          disabled={isChecking || isLoadingModel}
          style={[
            styles.practiceButton,
            isRecording && styles.recordingPracticeButton,
            (isChecking || isLoadingModel) && styles.practiceButtonDisabled,
          ]}
        >
          {result && !isRecording ? (
            <CheckCircle2 color={colors.primary} size={20} />
          ) : (
            <Mic2 color={isRecording ? colors.surface : colors.primary} size={20} />
          )}
          <Text style={[styles.practiceButtonText, isRecording && styles.recordingPracticeText]}>
            {isRecording ? `Stop ${formatRecordingTime(durationMillis)}` : isChecking ? "Checking..." : "Record repeat"}
          </Text>
        </Pressable>
      </View>
      {isModelPlaying ? (
        <Text testID="lesson-model-audio-playing" style={styles.pronunciationHelp}>
          Playing model voice
        </Text>
      ) : null}
      {helpText ? <Text style={styles.pronunciationHelp}>{helpText}</Text> : null}
      {result ? (
        <View style={[styles.feedback, verdictTone]}>
          <View style={styles.verdictHeader}>
            <Text style={styles.feedbackTitle}>{getPronunciationVerdictTitle(result.verdict)}</Text>
            <Text style={styles.scorePill}>{Math.round(result.score)}%</Text>
          </View>
          <Text style={styles.feedbackCopy}>{result.summary}</Text>
          <Text style={styles.scoringModeText}>
            {result.scoringMode === "audio" ? "Deep audio scoring" : "Transcript-only fallback"}
          </Text>
          <Text style={styles.transcriptText}>Heard: {result.transcript || "No clear words heard."}</Text>
          <View style={styles.scoreBreakdown}>
            {typeof result.audioScore === "number" ? (
              <Text style={styles.scoreBreakdownText}>Audio: {Math.round(result.audioScore)}%</Text>
            ) : null}
            {typeof result.transcriptScore === "number" ? (
              <Text style={styles.scoreBreakdownText}>Words: {Math.round(result.transcriptScore)}%</Text>
            ) : null}
            {typeof result.clarityScore === "number" ? (
              <Text style={styles.scoreBreakdownText}>Clarity: {Math.round(result.clarityScore)}%</Text>
            ) : null}
            {typeof result.rhythmScore === "number" ? (
              <Text style={styles.scoreBreakdownText}>Rhythm: {Math.round(result.rhythmScore)}%</Text>
            ) : null}
          </View>
          {result.problemSounds?.length ? (
            <Text style={styles.transcriptText}>Watch: {result.problemSounds.join(", ")}</Text>
          ) : null}
          {result.tips.length ? (
            <View style={styles.tipList}>
              {result.tips.map((tip) => (
                <Text key={tip} style={styles.tipText}>
                  • {tip}
                </Text>
              ))}
            </View>
          ) : null}
          {result.verdict !== "clear" ? (
            <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retryButton}>
              <RotateCcw color={colors.primary} size={18} />
              <Text style={styles.retryButtonText}>Try once more</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function getPronunciationVerdictTitle(verdict: PronunciationCheckResult["verdict"]) {
  if (verdict === "clear") return "Clear. You can continue.";
  if (verdict === "practice-again") return "Good try. Practice once more.";
  return "Try again slowly.";
}

function formatRecordingTime(durationMillis: number) {
  const seconds = Math.max(0, Math.round(durationMillis / 1000));
  return `${seconds}s`;
}

function LessonProgressBar({
  currentStep,
  totalSteps,
  progressPercent,
}: {
  currentStep: number;
  totalSteps: number;
  progressPercent: number;
}) {
  return (
    <View style={styles.progressCard}>
      <View style={styles.progressTextRow}>
        <Text style={styles.progressLabel}>{currentStep === 0 ? "Overview" : `Step ${currentStep} of ${totalSteps}`}</Text>
        <Text style={styles.progressPercent}>{progressPercent}%</Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressCard: {
    gap: spacing.sm,
  },
  progressTextRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressLabel: {
    color: colors.primary,
    fontWeight: "900",
  },
  progressPercent: {
    color: colors.muted,
    fontWeight: "800",
  },
  progressTrack: {
    height: 10,
    backgroundColor: colors.border,
    borderRadius: radii.round,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: colors.secondary,
    borderRadius: radii.round,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderColor: colors.border,
    borderWidth: 1,
    padding: spacing.lg,
    gap: spacing.lg,
  },
  eyebrow: {
    color: colors.primary,
    fontWeight: "900",
  },
  title: {
    color: colors.ink,
    fontSize: 26,
    fontWeight: "900",
  },
  prompt: {
    color: colors.ink,
    fontSize: 21,
    lineHeight: 29,
    fontWeight: "900",
  },
  copy: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 23,
  },
  overviewList: {
    gap: spacing.sm,
  },
  listItem: {
    color: colors.ink,
    lineHeight: 22,
  },
  sentenceCard: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.lg,
    gap: spacing.md,
  },
  sentenceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  sentence: {
    flex: 1,
    color: colors.ink,
    fontSize: 24,
    lineHeight: 31,
    fontWeight: "900",
  },
  speakHint: {
    color: colors.secondary,
    fontWeight: "800",
  },
  repeatPractice: {
    gap: spacing.md,
  },
  repeatButton: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  repeatButtonDone: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  repeatButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  repeatButtonTextDone: {
    color: colors.surface,
  },
  speakPractice: {
    gap: spacing.md,
  },
  speakButton: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  spokenButton: {
    backgroundColor: colors.secondary,
    borderColor: colors.secondary,
  },
  speakButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  spokenButtonText: {
    color: colors.surface,
  },
  spokenFeedback: {
    backgroundColor: colors.secondarySoft,
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pronunciationPanel: {
    gap: spacing.md,
  },
  pronunciationActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  practiceButton: {
    minHeight: 50,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  practiceButtonDisabled: {
    opacity: 0.45,
  },
  recordingPracticeButton: {
    backgroundColor: colors.primary,
  },
  practiceButtonText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },
  recordingPracticeText: {
    color: colors.surface,
  },
  pronunciationHelp: {
    color: colors.muted,
    lineHeight: 20,
    fontWeight: "700",
  },
  verdictHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  scorePill: {
    minWidth: 58,
    borderRadius: radii.round,
    backgroundColor: colors.surface,
    color: colors.primary,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    textAlign: "center",
    fontWeight: "900",
  },
  transcriptText: {
    color: colors.ink,
    lineHeight: 20,
    fontWeight: "800",
  },
  scoringModeText: {
    color: colors.primaryDark,
    lineHeight: 20,
    fontWeight: "900",
  },
  scoreBreakdown: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  scoreBreakdownText: {
    borderRadius: radii.round,
    backgroundColor: colors.surface,
    color: colors.muted,
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    fontWeight: "800",
  },
  tipList: {
    gap: spacing.xs,
  },
  tipText: {
    color: colors.muted,
    lineHeight: 20,
  },
  retryButton: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  retryButtonText: {
    color: colors.primary,
    fontWeight: "900",
  },
  options: {
    gap: spacing.md,
  },
  chooseMeaningPractice: {
    gap: spacing.md,
  },
  fillBlankPractice: {
    gap: spacing.md,
  },
  fillSentence: {
    minHeight: 86,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm,
  },
  fillSentenceText: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900",
  },
  blankSlot: {
    minHeight: 42,
    minWidth: 92,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  filledBlankSlot: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  blankSlotText: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: "900",
  },
  filledBlankSlotText: {
    color: colors.ink,
  },
  arrangePractice: {
    gap: spacing.md,
  },
  arrangedSentence: {
    minHeight: 86,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    flexDirection: "row",
    flexWrap: "wrap",
    alignContent: "flex-start",
    gap: spacing.sm,
  },
  arrangePlaceholder: {
    color: colors.muted,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  wordBank: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  wordChip: {
    minHeight: 46,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  usedWordChip: {
    borderColor: colors.border,
    backgroundColor: colors.background,
    opacity: 0.45,
  },
  wordChipText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: "900",
  },
  usedWordChipText: {
    color: colors.muted,
  },
  selectedWordChip: {
    minHeight: 42,
    borderRadius: radii.md,
    backgroundColor: colors.secondarySoft,
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  selectedWordText: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: "900",
  },
  resetArrangeButton: {
    alignSelf: "flex-start",
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  resetArrangeText: {
    color: colors.primary,
    fontWeight: "900",
  },
  fixSentencePractice: {
    gap: spacing.md,
  },
  incorrectSentenceCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    padding: spacing.md,
    gap: spacing.xs,
  },
  incorrectLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  incorrectSentence: {
    color: colors.ink,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: "900",
  },
  option: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  correctOption: {
    borderColor: colors.secondary,
    backgroundColor: colors.secondarySoft,
  },
  tryAgainOption: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceWarm,
  },
  revealedCorrectOption: {
    borderColor: colors.secondary,
  },
  optionText: {
    color: colors.ink,
    fontWeight: "800",
    fontSize: 16,
  },
  feedback: {
    borderRadius: radii.md,
    padding: spacing.md,
    gap: spacing.xs,
  },
  correctFeedback: {
    backgroundColor: colors.secondarySoft,
  },
  tryAgainFeedback: {
    backgroundColor: colors.surfaceWarm,
  },
  feedbackTitle: {
    color: colors.ink,
    fontWeight: "900",
  },
  feedbackCopy: {
    color: colors.muted,
    lineHeight: 20,
  },
  success: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.xl,
    gap: spacing.lg,
    alignItems: "center",
  },
  successIcon: {
    color: colors.success,
    fontSize: 58,
    fontWeight: "900",
  },
  scoreCard: {
    width: "100%",
    borderRadius: radii.md,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    gap: spacing.xs,
    alignItems: "center",
  },
  scoreLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: "900",
    textTransform: "uppercase",
  },
  scoreValue: {
    color: colors.ink,
    fontSize: 34,
    fontWeight: "900",
  },
  scoreDetail: {
    color: colors.muted,
    textAlign: "center",
    lineHeight: 20,
  },
});
