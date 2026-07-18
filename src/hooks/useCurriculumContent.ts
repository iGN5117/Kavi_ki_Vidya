import { useEffect, useState } from "react";
import {
  getBundledCurriculum,
  hasCurriculumEndpoint,
  loadCurriculumContent,
  type CurriculumSource,
} from "@/src/services/content/curriculumClient";
import type { CurriculumContent } from "@/src/types/content";

export type CurriculumStatus = "loading" | "ready";

export type CurriculumState = {
  curriculum: CurriculumContent;
  source: CurriculumSource;
  status: CurriculumStatus;
  errorMessage?: string;
};

export function useCurriculumContent(): CurriculumState {
  const [state, setState] = useState<CurriculumState>({
    curriculum: getBundledCurriculum(),
    source: "bundled",
    status: hasCurriculumEndpoint() ? "loading" : "ready",
  });

  useEffect(() => {
    let isMounted = true;

    loadCurriculumContent().then((result) => {
      if (!isMounted) return;
      setState({
        ...result,
        status: "ready",
      });
    });

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
