import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ArrowRight, XCircle } from "lucide-react";
import { useTest } from "@/context/TestContext";
import PageTransition from "@/components/PageTransition";

interface ScreeningQuestion {
  key: string;
  title: string;
  description: string;
  options: { value: string; label: string }[];
}

const SCREENING_QUESTIONS: ScreeningQuestion[] = [
  {
    key: "englishFluency",
    title: "How would you rate your English fluency?",
    description: "This role requires strong written English for filling out job applications on behalf of clients.",
    options: [
      { value: "native", label: "Native speaker" },
      { value: "fluent", label: "Fluent (comfortable writing professionally)" },
      { value: "conversational", label: "Conversational (can communicate but not fully comfortable writing)" },
      { value: "basic", label: "Basic (limited English)" },
    ],
  },
  {
    key: "hoursPerWeek",
    title: "How many hours per week can you commit?",
    description: "Appliers work on their own schedule, but consistent availability helps us assign clients.",
    options: [
      { value: "40+", label: "40+ hours (full-time)" },
      { value: "20-39", label: "20-39 hours" },
      { value: "10-19", label: "10-19 hours" },
      { value: "under10", label: "Less than 10 hours" },
    ],
  },
  {
    key: "recruitingExperience",
    title: "Do you have any experience in recruiting, HR, staffing, or talent acquisition?",
    description: "Prior experience isn't required, but it helps us understand your background.",
    options: [
      { value: "yes", label: "Yes, I've worked in recruiting or staffing" },
      { value: "some", label: "Some exposure (career services, helping friends job search, etc.)" },
      { value: "no", label: "No, this would be new to me" },
    ],
  },
  {
    key: "repetitiveWork",
    title: "This role is repetitive by nature. Are you good with that?",
    description: "The satisfaction comes from getting faster and more accurate over time, not from variety.",
    options: [
      { value: "yes", label: "That sounds like a good fit for me" },
      { value: "maybe", label: "I'm open to it, but I'm not sure yet" },
      { value: "no", label: "I'd prefer more variety in my work" },
    ],
  },
  {
    key: "equipment",
    title: "Do you have the right setup?",
    description: "You'll need your own computer, reliable internet, and ideally a second monitor. We don't provide equipment.",
    options: [
      { value: "dual", label: "Yes, with a second monitor" },
      { value: "single", label: "Yes, but just one screen" },
      { value: "no-monitor", label: "No, but I can get a second monitor" },
    ],
  },
];

// Rejection criteria
function getRejectReasons(answers: Record<string, string>): string[] {
  const reasons: string[] = [];
  const english = answers.englishFluency;
  if (english === "basic" || english === "conversational") {
    reasons.push("This role requires fluent or native-level written English.");
  }
  if (answers.hoursPerWeek === "under10") {
    reasons.push("We require a minimum of 10 hours per week availability.");
  }
  if (answers.repetitiveWork === "no") {
    reasons.push("This role involves repetitive tasks and requires comfort with that work style.");
  }
  return reasons;
}

export default function Screening() {
  const [, navigate] = useLocation();
  const { screeningAnswers, setScreeningAnswer, startTestTimer, setProgress, setScreeningPassed, completeStep } = useTest();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [rejected, setRejected] = useState(false);
  const [rejectReasons, setRejectReasons] = useState<string[]>([]);

  useEffect(() => {
    startTestTimer();
  }, [startTestTimer]);

  useEffect(() => {
    if (rejected) {
      setProgress(30);
    } else {
      // 14 to 30 across 5 questions
      setProgress(14 + Math.round((currentIndex / 4) * 16));
    }
  }, [currentIndex, rejected, setProgress]);

  const total = SCREENING_QUESTIONS.length;
  const question = SCREENING_QUESTIONS[currentIndex];
  const selected = screeningAnswers[question?.key] || "";

  const handleNext = () => {
    if (currentIndex < total - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Check for rejection after last question - only reject if 2+ flags
      const reasons = getRejectReasons(screeningAnswers);
      if (reasons.length >= 2) {
        setRejectReasons(reasons);
        setRejected(true);
        setScreeningPassed(false);
      } else {
        setScreeningPassed(true);
        completeStep("screening");
        navigate("/test/typing");
      }
    }
  };

  // Progress dots
  const dots = Array.from({ length: total }, (_, i) => i);

  if (rejected) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <CardHeader className="text-center">
                  <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-2">
                    <XCircle className="h-6 w-6 text-red-500" />
                  </div>
                  <CardTitle className="text-xl">Not the right fit</CardTitle>
                  <CardDescription>
                    Based on your answers, this role isn't a match right now.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {rejectReasons.map((reason, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-lg border border-red-500/20 bg-red-500/5 text-sm text-muted-foreground"
                    >
                      {reason}
                    </div>
                  ))}
                  <p className="text-sm text-muted-foreground text-center pt-2">
                    You may close this window.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-xl w-full space-y-6">
          {/* Progress dots */}
          <div className="flex justify-center gap-2">
            {dots.map((i) => (
              <motion.div
                key={i}
                layout
                className={`h-2 rounded-full ${
                  i === currentIndex
                    ? "w-8 bg-primary"
                    : i < currentIndex
                    ? "w-2 bg-primary/50"
                    : "w-2 bg-white/10"
                }`}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl">{question.title}</CardTitle>
                  <CardDescription className="leading-relaxed">
                    {question.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <RadioGroup
                    value={selected}
                    onValueChange={(val) => setScreeningAnswer(question.key, val)}
                  >
                    {question.options.map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setScreeningAnswer(question.key, opt.value)}
                        className="flex items-start space-x-3 p-3 rounded-lg border border-border hover:bg-secondary/50 transition-colors cursor-pointer"
                      >
                        <RadioGroupItem value={opt.value} id={`${question.key}-${opt.value}`} className="mt-0.5" />
                        <Label
                          htmlFor={`${question.key}-${opt.value}`}
                          className="text-sm font-normal cursor-pointer leading-relaxed"
                        >
                          {opt.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>

                  <Button
                    onClick={handleNext}
                    disabled={!selected}
                    className="w-full"
                    size="lg"
                  >
                    {currentIndex < total - 1 ? "Next" : "Continue to Typing Test"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
