import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { useCallback, useEffect, useRef, useState } from "react";

type PlayableAudioOptions = {
  label: string;
};

export function usePlayableAudio({ label }: PlayableAudioOptions) {
  const [source, setSource] = useState<string | null>(null);
  const [pendingUrl, setPendingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const loggedPlayingUrlRef = useRef<string | null>(null);
  const audioPlayer = useAudioPlayer(source, {
    downloadFirst: true,
    keepAudioSessionActive: true,
    updateInterval: 100,
  });
  const audioStatus = useAudioPlayerStatus(audioPlayer);

  const playLoadedSource = useCallback(
    async (audioUrl: string) => {
      await audioPlayer.seekTo(0).catch(() => undefined);
      audioPlayer.play();
      console.info(`[kavi-audio] ${label} play-called ${audioUrl}`);
    },
    [audioPlayer, label]
  );

  const playUrl = useCallback(
    async (audioUrl: string) => {
      setError(null);
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        shouldRouteThroughEarpiece: false,
        interruptionMode: "doNotMix",
      });
      console.info(`[kavi-audio] ${label} play-requested ${audioUrl}`);
      setPendingUrl(audioUrl);

      if (source === audioUrl && audioStatus.isLoaded) {
        await playLoadedSource(audioUrl);
        setPendingUrl(null);
        return;
      }

      setSource(audioUrl);
    },
    [audioStatus.isLoaded, label, playLoadedSource, source]
  );

  useEffect(() => {
    if (!pendingUrl || source !== pendingUrl || !audioStatus.isLoaded) return;

    playLoadedSource(pendingUrl)
      .then(() => setPendingUrl(null))
      .catch((playError) => {
        const message = playError instanceof Error ? playError.message : "Audio playback failed.";
        setError(message);
        setPendingUrl(null);
        console.warn(`[kavi-audio] ${label} play-failed ${message}`);
      });
  }, [audioStatus.isLoaded, label, pendingUrl, playLoadedSource, source]);

  useEffect(() => {
    if (!source || !audioStatus.playing || loggedPlayingUrlRef.current === source) return;
    loggedPlayingUrlRef.current = source;
    console.info(`[kavi-audio] ${label} playing ${source}`);
  }, [audioStatus.playing, label, source]);

  return {
    audioPlayer,
    audioStatus,
    error,
    playUrl,
    source,
  };
}
