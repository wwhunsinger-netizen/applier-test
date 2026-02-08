import { useState, useEffect, useRef, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Keyboard } from "lucide-react";
import { useTest } from "@/context/TestContext";
import { WARMUP_PARAGRAPH, TIMED_PARAGRAPH } from "@/lib/test-data";
import PageTransition from "@/components/PageTransition";

type Phase = "warmup-ready" | "warmup" | "timed-ready" | "timed" | "done";

export default function TypingTest() {
  const [, navigate] = useLocation();
  const { setTypingResults, setProgress, completeStep } = useTest();
  const [phase, setPhase] = useState<Phase>("warmup-ready");

  useEffect(() => {
    const map: Record<Phase, number> = {
      "warmup-ready": 33,
      "warmup": 35,
      "timed-ready": 38,
      "timed": 40,
      "done": 43,
    };
    setProgress(map[phase]);
  }, [phase, setProgress]);
  const [typed, setTyped] = useState("");
  const [warmupTyped, setWarmupTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [warmupWpm, setWarmupWpm] = useState(0);
  const [warmupAccuracy, setWarmupAccuracy] = useState(100);
  const [animatedWpm, setAnimatedWpm] = useState(0);
  const [animatedAccuracy, setAnimatedAccuracy] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const endTimeRef = useRef<number | null>(null);

  const currentParagraph = phase.includes("warmup") ? WARMUP_PARAGRAPH : TIMED_PARAGRAPH;
  const duration = phase.includes("warmup") ? 30 : 60;

  const calcStats = useCallback(
    (text: string, paragraph: string) => {
      const now = endTimeRef.current ?? Date.now();
      const elapsed = (now - startTimeRef.current) / 1000 / 60;
      const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
      const currentWpm = elapsed > 0 ? Math.round(wordCount / elapsed) : 0;

      // Only compare up to the paragraph length to avoid extra chars counting as errors
      const compareLen = Math.min(text.length, paragraph.length);
      let correct = 0;
      for (let i = 0; i < compareLen; i++) {
        if (text[i] === paragraph[i]) correct++;
      }
      const currentAccuracy =
        compareLen > 0 ? Math.round((correct / compareLen) * 100) : 0;

      return { wpm: currentWpm, accuracy: currentAccuracy };
    },
    []
  );

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startPhase = useCallback(
    (newPhase: "warmup" | "timed") => {
      setTyped("");
      setWpm(0);
      setAccuracy(100);
      setPhase(newPhase);
      endTimeRef.current = null;
      const dur = newPhase === "warmup" ? 30 : 60;
      setTimeLeft(dur);
      startTimeRef.current = Date.now();

      stopTimer();
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            stopTimer();
            endTimeRef.current = Date.now();
            if (newPhase === "warmup") {
              setPhase("timed-ready");
            } else {
              setPhase("done");
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimeout(() => textareaRef.current?.focus(), 50);
    },
    [stopTimer]
  );

  useEffect(() => {
    return () => stopTimer();
  }, [stopTimer]);

  useEffect(() => {
    let cancelled = false;

    if (phase === "timed-ready") {
      const stats = calcStats(typed, WARMUP_PARAGRAPH);
      setWarmupWpm(stats.wpm);
      setWarmupAccuracy(stats.accuracy);
      setWarmupTyped(typed);
      // Animate count-up
      setAnimatedWpm(0);
      setAnimatedAccuracy(0);
      const target = { wpm: stats.wpm, acc: stats.accuracy };
      const dur = 800;
      const start = Date.now();
      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const t = Math.min(elapsed / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3); // ease-out cubic
        setAnimatedWpm(Math.round(target.wpm * ease));
        setAnimatedAccuracy(Math.round(target.acc * ease));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
    if (phase === "done") {
      const stats = calcStats(typed, TIMED_PARAGRAPH);
      setWpm(stats.wpm);
      setAccuracy(stats.accuracy);
      // Animate count-up
      setAnimatedWpm(0);
      setAnimatedAccuracy(0);
      const target = { wpm: stats.wpm, acc: stats.accuracy };
      const dur = 800;
      const start = Date.now();
      const tick = () => {
        if (cancelled) return;
        const elapsed = Date.now() - start;
        const t = Math.min(elapsed / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        setAnimatedWpm(Math.round(target.wpm * ease));
        setAnimatedAccuracy(Math.round(target.acc * ease));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }

    return () => { cancelled = true; };
  }, [phase, typed, calcStats]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (phase !== "warmup" && phase !== "timed") return;
    const val = e.target.value;
    setTyped(val);

    const stats = calcStats(val, currentParagraph);
    setWpm(stats.wpm);
    setAccuracy(stats.accuracy);

    // Auto-end when they finish the paragraph
    if (val.length >= currentParagraph.length) {
      stopTimer();
      endTimeRef.current = Date.now();
      if (phase === "warmup") {
        setPhase("timed-ready");
      } else {
        setPhase("done");
      }
    }
  };

  const handleContinue = () => {
    setTypingResults({
      warmupWpm,
      warmupAccuracy,
      timedWpm: wpm,
      timedAccuracy: accuracy,
    });
    completeStep("typing");
    navigate("/test/review/1");
  };

  const renderParagraph = () => {
    return (
      <div className="font-mono text-sm leading-relaxed select-none">
        {currentParagraph.split("").map((char, i) => {
          let color = "text-muted-foreground/50";
          if (i < typed.length) {
            color = typed[i] === char ? "text-green-400" : "text-red-400 underline";
          } else if (i === typed.length) {
            color = "text-foreground bg-primary/20";
          }
          return (
            <span key={i} className={color}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const getEncouragement = (wpmVal: number, accVal: number) => {
    const lowAcc = accVal < 85;

    if (wpmVal >= 75) {
      return lowAcc
        ? "Wow, speed demon! Try slowing down a touch for accuracy."
        : "Wow, speed demon!";
    }
    if (wpmVal >= 50) {
      return lowAcc
        ? "Great speed! Focus on accuracy and you'll be unstoppable."
        : "Excellent! You're a natural.";
    }
    if (wpmVal >= 40) {
      return lowAcc
        ? "Nice pace! A bit more precision and you're golden."
        : "Great speed and accuracy!";
    }
    if (wpmVal >= 30) {
      return lowAcc
        ? "Solid speed! Watch those typos and you'll level up fast."
        : "Solid work, nice job!";
    }
    if (wpmVal >= 20) {
      return lowAcc
        ? "Good effort! Slow down a little and nail those keystrokes."
        : "Good effort, keep it up!";
    }
    return lowAcc
      ? "Take your time and focus on getting each word right."
      : "Nice start!";
  };

  const renderTypedResults = (text: string, paragraph: string) => {
    return (
      <div className="font-mono text-sm leading-relaxed max-h-32 overflow-y-auto">
        {text.split("").map((char, i) => {
          const correct = char === paragraph[i];
          return (
            <span key={i} className={correct ? "text-green-400" : "text-red-400 underline"}>
              {char}
            </span>
          );
        })}
      </div>
    );
  };

  const isActive = phase === "warmup" || phase === "timed";
  const progressPct = isActive ? ((duration - timeLeft) / duration) * 100 : 0;

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-3xl w-full space-y-6">
          {/* Logo + Header */}
          <div className="text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Keyboard className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-3xl font-bold">Typing Test</h1>
            <p className="text-muted-foreground">
              {phase === "warmup-ready" || phase === "warmup"
                ? "Warm-up round"
                : phase === "timed-ready"
                ? "Warm-up results"
                : phase === "timed"
                ? "Timed round"
                : "Done!"}
            </p>
          </div>

          {/* Stats bar - slides in when active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <div className="flex gap-3">
                    <Badge variant="outline" className="text-sm">
                      {wpm} WPM
                    </Badge>
                    <Badge variant="outline" className="text-sm">
                      {accuracy}% Accuracy
                    </Badge>
                  </div>
                  <Badge variant={timeLeft <= 10 ? "destructive" : "secondary"} className="text-sm font-mono">
                    {timeLeft}s
                  </Badge>
                </div>
                <Progress value={progressPct} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Typing area - slides in when active */}
          <AnimatePresence>
            {isActive && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-4">
                    {renderParagraph()}
                    <textarea
                      ref={textareaRef}
                      value={typed}
                      onChange={handleChange}
                      onPaste={(e) => e.preventDefault()}
                      onCopy={(e) => e.preventDefault()}
                      onCut={(e) => e.preventDefault()}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      className="w-full h-32 bg-transparent border border-input rounded-md p-3 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                      placeholder="Start typing here..."
                      autoFocus
                    />
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Done results */}
          <AnimatePresence>
            {phase === "done" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-5">
                    {/* What they typed */}
                    <div className="rounded-lg border border-border/50 bg-white/[0.02] p-4">
                      {renderTypedResults(typed, TIMED_PARAGRAPH)}
                    </div>

                    {/* Big animated stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center p-4 rounded-lg bg-secondary"
                      >
                        <p className="text-4xl font-bold">{animatedWpm}</p>
                        <p className="text-sm text-muted-foreground">WPM</p>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="text-center p-4 rounded-lg bg-secondary"
                      >
                        <p className="text-4xl font-bold">{animatedAccuracy}%</p>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                      </motion.div>
                    </div>

                    {/* Encouragement */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      className="text-center text-sm text-muted-foreground"
                    >
                      {getEncouragement(wpm, accuracy)}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.3 }}
                    >
                      <Button onClick={handleContinue} size="lg" className="w-full text-base">
                        Continue
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action button - always at the bottom, changes label by phase */}
          <AnimatePresence mode="wait">
            {phase === "warmup-ready" && (
              <motion.div
                key="warmup-btn"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.25 }}
                className="flex justify-center"
              >
                <Button onClick={() => startPhase("warmup")} size="lg" className="text-base px-8">
                  Start Warm-Up
                </Button>
              </motion.div>
            )}

            {phase === "timed-ready" && (
              <motion.div
                key="timed-results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardContent className="pt-6 space-y-5">
                    {/* What they typed */}
                    <div className="rounded-lg border border-border/50 bg-white/[0.02] p-4">
                      {renderTypedResults(warmupTyped, WARMUP_PARAGRAPH)}
                    </div>

                    {/* Big animated stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.4 }}
                        className="text-center p-4 rounded-lg bg-secondary"
                      >
                        <p className="text-4xl font-bold">{animatedWpm}</p>
                        <p className="text-sm text-muted-foreground">WPM</p>
                      </motion.div>
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.35, duration: 0.4 }}
                        className="text-center p-4 rounded-lg bg-secondary"
                      >
                        <p className="text-4xl font-bold">{animatedAccuracy}%</p>
                        <p className="text-sm text-muted-foreground">Accuracy</p>
                      </motion.div>
                    </div>

                    {/* Encouragement */}
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8, duration: 0.4 }}
                      className="text-center text-sm text-muted-foreground"
                    >
                      {getEncouragement(warmupWpm, warmupAccuracy)}
                    </motion.p>

                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1, duration: 0.3 }}
                      className="space-y-2"
                    >
                      <Button onClick={() => startPhase("timed")} size="lg" className="w-full text-base">
                        Start Timed Test
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button onClick={() => startPhase("warmup")} variant="outline" size="lg" className="w-full text-base">
                        Retake Warm-Up
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
