import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";

export interface TypingResults {
  warmupWpm: number;
  warmupAccuracy: number;
  timedWpm: number;
  timedAccuracy: number;
}

export interface ApplicationFormData {
  [key: string]: string;
}

export interface ReviewResult {
  correctFlags: number;
  falseFlags: number;
  missedErrors: number;
  totalErrors: number;
}

export interface ApplicationResult {
  correctCount: number;
  totalScored: number;
}

export interface TestState {
  // Entry
  candidateName: string;
  candidateEmail: string;

  // Screening
  screeningAnswers: Record<string, string>;
  screeningPassed: boolean | null;

  // Typing test
  typingResults: TypingResults | null;

  // Questions
  questionAnswers: Record<number, string>;

  // Applications (keyed by app id 1/2/3/4)
  applicationData: Record<number, ApplicationFormData>;

  // Review results (keyed by review id 1/2/3)
  reviewResults: Record<number, ReviewResult>;

  // Application fill-out results
  applicationResult: ApplicationResult | null;

  // EEO (app 3)
  eeoData: Record<string, string>;

  // Global timer (15 min countdown)
  testStartTime: number | null;

  // Fill-out timer
  applicationStartTime: number | null;
  applicationEndTime: number | null;

  // Notes to reviewer (app 2)
  reviewerNotes: string;

  // Completion tracking for route guards
  completedSteps: string[];
}

interface TestContextValue extends TestState {
  setCandidate: (name: string, email: string) => void;
  startTestTimer: () => void;
  getTestSecondsRemaining: () => number;
  setScreeningAnswer: (key: string, value: string) => void;
  setScreeningPassed: (passed: boolean) => void;
  setTypingResults: (results: TypingResults) => void;
  setQuestionAnswer: (questionId: number, answer: string) => void;
  setApplicationField: (appId: number, field: string, value: string) => void;
  setEeoField: (field: string, value: string) => void;
  setReviewerNotes: (notes: string) => void;
  setReviewResult: (reviewId: number, result: ReviewResult) => void;
  setApplicationResult: (result: ApplicationResult) => void;
  startApplicationTimer: () => void;
  stopApplicationTimer: () => void;
  getElapsedSeconds: () => number;
  completeStep: (step: string) => void;
  hasCompletedStep: (step: string) => boolean;
  resetTest: () => void;
  progress: number;
  setProgress: (value: number) => void;
}

const STORAGE_KEY = "jumpseat-test-state";

const initialState: TestState = {
  candidateName: "",
  candidateEmail: "",
  testStartTime: null,
  screeningAnswers: {},
  screeningPassed: null,
  typingResults: null,
  questionAnswers: {},
  applicationData: { 1: {}, 2: {}, 3: {}, 4: {} },
  reviewResults: {},
  applicationResult: null,
  eeoData: {},
  applicationStartTime: null,
  applicationEndTime: null,
  reviewerNotes: "",
  completedSteps: [],
};

function loadState(): TestState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...initialState, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }
  return initialState;
}

function saveState(state: TestState) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

const TestContext = createContext<TestContextValue | null>(null);

export function TestProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<TestState>(loadState);
  const [progress, setProgress] = useState(0);
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
    saveState(state);
  }, [state]);

  const setCandidate = (name: string, email: string) => {
    setState((prev) => ({ ...prev, candidateName: name, candidateEmail: email }));
  };

  const startTestTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      testStartTime: prev.testStartTime ?? Date.now(),
    }));
  }, []);

  const getTestSecondsRemaining = useCallback(() => {
    const s = stateRef.current;
    if (!s.testStartTime) return 15 * 60;
    const elapsed = Math.floor((Date.now() - s.testStartTime) / 1000);
    return Math.max(0, 15 * 60 - elapsed);
  }, []);

  const setScreeningAnswer = (key: string, value: string) => {
    setState((prev) => ({
      ...prev,
      screeningAnswers: { ...prev.screeningAnswers, [key]: value },
    }));
  };

  const setScreeningPassed = (passed: boolean) => {
    setState((prev) => ({ ...prev, screeningPassed: passed }));
  };

  const setTypingResults = (results: TypingResults) => {
    setState((prev) => ({ ...prev, typingResults: results }));
  };

  const setQuestionAnswer = (questionId: number, answer: string) => {
    setState((prev) => ({
      ...prev,
      questionAnswers: { ...prev.questionAnswers, [questionId]: answer },
    }));
  };

  const setApplicationField = (appId: number, field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      applicationData: {
        ...prev.applicationData,
        [appId]: { ...prev.applicationData[appId], [field]: value },
      },
    }));
  };

  const setEeoField = (field: string, value: string) => {
    setState((prev) => ({
      ...prev,
      eeoData: { ...prev.eeoData, [field]: value },
    }));
  };

  const setReviewerNotes = (notes: string) => {
    setState((prev) => ({ ...prev, reviewerNotes: notes }));
  };

  const setReviewResult = (reviewId: number, result: ReviewResult) => {
    setState((prev) => ({
      ...prev,
      reviewResults: { ...prev.reviewResults, [reviewId]: result },
    }));
  };

  const setApplicationResult = (result: ApplicationResult) => {
    setState((prev) => ({ ...prev, applicationResult: result }));
  };

  const startApplicationTimer = useCallback(() => {
    setState((prev) => ({
      ...prev,
      applicationStartTime: prev.applicationStartTime ?? Date.now(),
    }));
  }, []);

  const stopApplicationTimer = useCallback(() => {
    setState((prev) => ({ ...prev, applicationEndTime: Date.now() }));
  }, []);

  const getElapsedSeconds = useCallback(() => {
    const s = stateRef.current;
    if (!s.applicationStartTime) return 0;
    const end = s.applicationEndTime ?? Date.now();
    return Math.floor((end - s.applicationStartTime) / 1000);
  }, []);

  const completeStep = (step: string) => {
    setState((prev) => ({
      ...prev,
      completedSteps: prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step],
    }));
  };

  const hasCompletedStep = useCallback((step: string) => {
    return stateRef.current.completedSteps.includes(step);
  }, []);

  const resetTest = () => {
    setState(initialState);
    setProgress(0);
    try { sessionStorage.removeItem(STORAGE_KEY); } catch {}
  };

  return (
    <TestContext.Provider
      value={{
        ...state,
        setCandidate,
        startTestTimer,
        getTestSecondsRemaining,
        setScreeningAnswer,
        setScreeningPassed,
        setTypingResults,
        setQuestionAnswer,
        setApplicationField,
        setEeoField,
        setReviewerNotes,
        setReviewResult,
        setApplicationResult,
        startApplicationTimer,
        stopApplicationTimer,
        getElapsedSeconds,
        completeStep,
        hasCompletedStep,
        resetTest,
        progress,
        setProgress,
      }}
    >
      {children}
    </TestContext.Provider>
  );
}

export function useTest() {
  const ctx = useContext(TestContext);
  if (!ctx) throw new Error("useTest must be used within TestProvider");
  return ctx;
}
