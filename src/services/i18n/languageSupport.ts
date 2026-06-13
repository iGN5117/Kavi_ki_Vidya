import type { ExplanationPreference, LocalizedSupport } from "@/src/types/content";
import type { PronunciationCheckResult } from "@/src/types/speaking";

export function getLocalizedSupportLines(
  support: LocalizedSupport | undefined,
  preference: ExplanationPreference,
  fallbackSupportText?: string,
) {
  const lines: string[] = [];
  const showHindi = preference === "hi-Deva" || preference === "both";
  const showHinglish = preference === "hi-Latn" || preference === "both";

  if (showHindi && support?.["hi-Deva"]?.trim()) {
    lines.push(support["hi-Deva"]!.trim());
  }

  if (showHinglish && support?.["hi-Latn"]?.trim()) {
    lines.push(support["hi-Latn"]!.trim());
  }

  if (!lines.length && showHinglish && fallbackSupportText?.trim()) {
    lines.push(fallbackSupportText.trim());
  }

  return lines;
}

export function getPronunciationSupport(result: PronunciationCheckResult): LocalizedSupport {
  const modelSentence = getUsefulModelSentence(result);
  const watchWords = result.problemSounds?.length ? result.problemSounds.slice(0, 3).join(", ") : "";

  if (result.verdict === "clear") {
    return {
      "hi-Deva": "आपका उच्चारण साफ था। इसी rhythm को बनाए रखें।",
      "hi-Latn": "Aapka pronunciation clear tha. Isi rhythm ko banaye rakhein.",
    };
  }

  const sentencePart = modelSentence
    ? {
        "hi-Deva": `सही वाक्य सुनकर धीरे बोलिए: "${modelSentence}"`,
        "hi-Latn": `Sahi sentence sunkar dheere boliye: "${modelSentence}"`,
      }
    : {
        "hi-Deva": "पूरा वाक्य धीरे बोलिए। हर शब्द साफ बोलने की कोशिश करें।",
        "hi-Latn": "Pura sentence dheere boliye. Har word clear bolne ki koshish karein.",
      };

  if (result.verdict === "practice-again") {
    return {
      "hi-Deva": watchWords ? `${sentencePart["hi-Deva"]} इन शब्दों पर ध्यान दें: ${watchWords}.` : sentencePart["hi-Deva"],
      "hi-Latn": watchWords ? `${sentencePart["hi-Latn"]} In words par dhyan dein: ${watchWords}.` : sentencePart["hi-Latn"],
    };
  }

  return {
    "hi-Deva": watchWords
      ? `एक बार फिर धीरे बोलिए। इन शब्दों को अलग-अलग साफ बोलें: ${watchWords}.`
      : "एक बार फिर धीरे बोलिए। हर शब्द अलग-अलग साफ बोलें।",
    "hi-Latn": watchWords
      ? `Ek baar phir dheere boliye. In words ko alag-alag clear bolen: ${watchWords}.`
      : "Ek baar phir dheere boliye. Har word alag-alag clear bolen.",
  };
}

export function getPronunciationHelpSupport(helpText: string | null | undefined): LocalizedSupport | undefined {
  const normalized = String(helpText || "").toLowerCase();
  if (!normalized) return undefined;

  if (normalized.includes("listen")) {
    return {
      "hi-Deva": "पहले model voice सुनिए, फिर अपना वाक्य record कीजिए।",
      "hi-Latn": "Pehle model voice suniye, phir apna sentence record kijiye.",
    };
  }

  if (normalized.includes("recording")) {
    return {
      "hi-Deva": "पूरा वाक्य एक बार साफ बोलिए, फिर stop दबाइए।",
      "hi-Latn": "Pura sentence ek baar clear boliye, phir stop dabaiye.",
    };
  }

  if (normalized.includes("checking")) {
    return {
      "hi-Deva": "आपका pronunciation check हो रहा है।",
      "hi-Latn": "Aapka pronunciation check ho raha hai.",
    };
  }

  if (normalized.includes("microphone") || normalized.includes("mic")) {
    return {
      "hi-Deva": "Microphone permission on करके फिर कोशिश करें।",
      "hi-Latn": "Microphone permission on karke phir koshish karein.",
    };
  }

  if (normalized.includes("could not hear") || normalized.includes("try again") || normalized.includes("try once")) {
    return {
      "hi-Deva": "Phone के पास बोलिए और वाक्य थोड़ा धीरे दोहराइए।",
      "hi-Latn": "Phone ke paas boliye aur sentence thoda dheere dohraiye.",
    };
  }

  return undefined;
}

function getUsefulModelSentence(result: PronunciationCheckResult) {
  const modelSentence = result.modelSentence?.trim();
  if (!modelSentence) return result.expectedText?.trim();

  const normalizedModel = normalizeSpeechText(modelSentence);
  const normalizedTranscript = normalizeSpeechText(result.transcript);
  return normalizedModel && normalizedModel !== normalizedTranscript ? modelSentence : result.expectedText?.trim();
}

function normalizeSpeechText(value: string | undefined) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
