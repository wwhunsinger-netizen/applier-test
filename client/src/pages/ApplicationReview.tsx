import { useState, useEffect, useRef } from "react";
import { useLocation, useParams } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowRight,
  User,
  MapPin,
  DollarSign,
  Building2,
  CheckCircle,
  XCircle,
  Flag,
  Clock,
  MousePointerClick,
} from "lucide-react";
import { JOB_DESCRIPTIONS, REVIEW_APPLICATIONS } from "@/lib/test-data";
import { useTest } from "@/context/TestContext";
import ClientDrawer from "@/components/ClientDrawer";

type TutorialStep = "client-details" | "flag-fields" | "time-limit" | null;

const REVIEW_TIME_LIMIT = 60; // 1 minute per review

export default function ApplicationReview() {
  const params = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const reviewId = Math.min(Math.max(parseInt(params.id || "1", 10), 1), REVIEW_APPLICATIONS.length);

  const review = REVIEW_APPLICATIONS[reviewId - 1];
  const job = JOB_DESCRIPTIONS.find((j) => j.id === review.jobId) ?? JOB_DESCRIPTIONS[0];

  const { setProgress, setReviewResult, completeStep } = useTest();
  const [flaggedFields, setFlaggedFields] = useState<Set<string>>(new Set());
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Tutorial state - only on review 1
  const [tutorialStep, setTutorialStep] = useState<TutorialStep>(
    reviewId === 1 ? "client-details" : null
  );
  const showTutorial = tutorialStep !== null;

  // Progress: review 1 = 46-55, review 2 = 58-65, review 3 = 68-75
  useEffect(() => {
    const base = reviewId === 1 ? 46 : reviewId === 2 ? 58 : 68;
    const range = reviewId === 1 ? 9 : 7;
    if (showTutorial) {
      setProgress(base);
    } else if (submitted) {
      setProgress(base + range);
    } else {
      setProgress(base + Math.round(range / 2));
    }
  }, [reviewId, showTutorial, submitted, setProgress]);

  // Interactive tutorial step 2 state
  const [tutorialFound, setTutorialFound] = useState(false);
  const [tutorialWrongClick, setTutorialWrongClick] = useState<string | null>(null);
  const [tutorialPhoneFlash, setTutorialPhoneFlash] = useState(false);

  const handleTutorialFieldClick = (field: "name" | "email" | "phone") => {
    if (tutorialFound) return;
    if (field === "phone") {
      setTutorialFound(true);
      setTutorialWrongClick(null);
      setTutorialPhoneFlash(false);
    } else {
      setTutorialWrongClick(field);
      setTutorialPhoneFlash(true);
      setTimeout(() => setTutorialPhoneFlash(false), 1500);
    }
  };

  // Countdown timer - starts after tutorial (review 1) or immediately (reviews 2/3)
  const [timeLeft, setTimeLeft] = useState(REVIEW_TIME_LIMIT);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerStarted = useRef(false);

  const startTimer = () => {
    if (timerStarted.current) return;
    timerStarted.current = true;
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Start timer for reviews 2/3 after brief delay to let page render
  useEffect(() => {
    let delayTimer: ReturnType<typeof setTimeout> | null = null;
    if (reviewId > 1) {
      delayTimer = setTimeout(() => startTimer(), 800);
    }
    return () => {
      if (delayTimer) clearTimeout(delayTimer);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [reviewId]);

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && timerStarted.current && !submitted && !showTutorial) {
      setShowTimeUp(true);
      setTimeout(() => {
        setSubmitted(true);
        setShowTimeUp(false);
      }, 1200);
    }
  }, [timeLeft, submitted, showTutorial]);

  const toggleFlag = (key: string) => {
    if (submitted || showTutorial) return;
    setFlaggedFields((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Save results to context when submitted
  useEffect(() => {
    if (!submitted) return;
    const errors = review.fields.filter((f) => f.hasError);
    const correct = errors.filter((f) => flaggedFields.has(f.key));
    const falseFlagsCount = review.fields.filter((f) => !f.hasError && flaggedFields.has(f.key)).length;
    setReviewResult(reviewId, {
      correctFlags: correct.length,
      falseFlags: falseFlagsCount,
      missedErrors: errors.length - correct.length,
      totalErrors: errors.length,
    });
    completeStep(`review-${reviewId}`);
  }, [submitted]);

  const handleSubmit = () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    setSubmitted(true);
  };

  const handleNext = () => {
    if (reviewId < 3) {
      navigate(`/test/review/${reviewId + 1}`);
    } else {
      navigate("/test/application");
    }
  };

  const errorFields = review.fields.filter((f) => f.hasError);
  const correctFlags = errorFields.filter((f) => flaggedFields.has(f.key));
  const falseFlags = review.fields.filter((f) => !f.hasError && flaggedFields.has(f.key));

  const getFieldStyle = (field: typeof review.fields[0]) => {
    if (!submitted) {
      if (flaggedFields.has(field.key)) {
        return "border-primary bg-primary/5 ring-1 ring-primary";
      }
      return "border-border hover:border-muted-foreground/50 cursor-pointer";
    }

    if (field.hasError && flaggedFields.has(field.key)) {
      return "border-green-500 bg-green-500/5";
    }
    if (field.hasError && !flaggedFields.has(field.key)) {
      return "border-red-500 bg-red-500/5";
    }
    if (!field.hasError && flaggedFields.has(field.key)) {
      return "border-yellow-500 bg-yellow-500/5";
    }
    return "border-border opacity-50";
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLow = timeLeft <= 15;

  return (
    <PageTransition>
      {/* Time's up overlay */}
      <AnimatePresence>
        {showTimeUp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center"
            >
              <Clock className="h-12 w-12 text-red-500 mx-auto mb-3" />
              <p className="text-2xl font-bold">Time's up!</p>
              <p className="text-sm text-muted-foreground mt-1">Submitting your review...</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Badge variant="outline">Review {reviewId} of 3</Badge>
              <Progress value={(reviewId / 3) * 100} className="w-32" />
            </div>
            <div className="flex items-center gap-3">
              {!showTutorial && !submitted && (
                <Badge
                  variant={isLow ? "destructive" : "secondary"}
                  className={`flex items-center gap-1 font-mono ${timeLeft <= 10 && timeLeft > 0 ? "animate-pulse" : ""}`}
                >
                  <Clock className="h-3 w-3" />
                  {mins}:{secs.toString().padStart(2, "0")}
                </Badge>
              )}
              {!submitted && !showTutorial && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Flag className="h-3 w-3" />
                  {flaggedFields.size} flagged
                </Badge>
              )}
              <div className="relative">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (tutorialStep === "client-details") {
                      setDrawerOpen(true);
                      setTutorialStep("flag-fields");
                    } else {
                      setDrawerOpen(true);
                    }
                  }}
                  className={tutorialStep === "client-details" ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}
                >
                  <User className="h-4 w-4 mr-1" />
                  View Client Details
                </Button>
              </div>
            </div>
          </div>

          {/* Tutorial overlay */}
          <AnimatePresence mode="wait">
            {tutorialStep === "client-details" && (
              <motion.div
                key="tutorial-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center space-y-4 py-12"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Step 1: Review Client Details</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Click "View Client Details" above to see the client's profile. You'll use this to spot errors.
                  </p>
                </div>
              </motion.div>
            )}

            {tutorialStep === "flag-fields" && (
              <motion.div
                key="tutorial-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center space-y-5 py-8"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MousePointerClick className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Step 2: Select the incorrect entry</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Click on the field that contains an error.
                  </p>
                </div>

                {/* Interactive example */}
                <div className="w-full max-w-sm rounded-lg border border-border/50 bg-white/[0.02] p-3 space-y-2">
                  {/* Full Name - correct */}
                  <div
                    onClick={() => handleTutorialFieldClick("name")}
                    className={`p-2.5 rounded-md border text-sm text-left cursor-pointer transition-all ${
                      tutorialWrongClick === "name"
                        ? "border-yellow-500 bg-yellow-500/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Full Name</p>
                    <p className="text-foreground/70">Jordan Rivera</p>
                    {tutorialWrongClick === "name" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-yellow-400 mt-1"
                      >
                        No error here. Try again.
                      </motion.p>
                    )}
                  </div>

                  {/* Email - correct */}
                  <div
                    onClick={() => handleTutorialFieldClick("email")}
                    className={`p-2.5 rounded-md border text-sm text-left cursor-pointer transition-all ${
                      tutorialWrongClick === "email"
                        ? "border-yellow-500 bg-yellow-500/5"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground mb-1">Email</p>
                    <p className="text-foreground/70">jordan.rivera@gmail.com</p>
                    {tutorialWrongClick === "email" && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-yellow-400 mt-1"
                      >
                        No error here. Try again.
                      </motion.p>
                    )}
                  </div>

                  {/* Phone - incorrect (missing digit) */}
                  <div
                    onClick={() => handleTutorialFieldClick("phone")}
                    className={`p-2.5 rounded-md border text-sm text-left cursor-pointer transition-all ${
                      tutorialFound
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : tutorialPhoneFlash
                        ? "border-primary/60 bg-primary/5 animate-pulse"
                        : "border-border hover:border-muted-foreground/50"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Phone</p>
                        <p className="text-foreground/70">(555) 234-891</p>
                      </div>
                      {tutorialFound && (
                        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <Flag className="h-4 w-4 text-primary shrink-0 mt-1" />
                        </motion.div>
                      )}
                    </div>
                    {tutorialFound && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-xs text-green-400 mt-1"
                      >
                        Correct! This phone number is missing a digit.
                      </motion.p>
                    )}
                  </div>
                </div>

                <motion.div
                  initial={false}
                  animate={{ opacity: tutorialFound ? 1 : 0.3 }}
                  transition={{ duration: 0.3 }}
                >
                  <Button
                    size="lg"
                    className="text-base px-8"
                    disabled={!tutorialFound}
                    onClick={() => setTutorialStep("time-limit")}
                  >
                    Next
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </motion.div>
              </motion.div>
            )}

            {tutorialStep === "time-limit" && (
              <motion.div
                key="tutorial-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25 }}
                className="flex flex-col items-center text-center space-y-5 py-8"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-semibold">Step 3: You have 1 minute per review</p>
                  <p className="text-sm text-muted-foreground max-w-sm">
                    Flag as many errors as you can before time runs out.
                  </p>
                </div>

                <Button
                  size="lg"
                  className="text-base px-8"
                  onClick={() => {
                    setTutorialStep(null);
                    startTimer();
                  }}
                >
                  Begin
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main review content - hidden during tutorial */}
          {!showTutorial && (
            <>
              {/* Job header */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-xl">{job.title}</CardTitle>
                      <CardDescription className="flex items-center gap-3 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3.5 w-3.5" />
                          {job.company}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {job.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="h-3.5 w-3.5" />
                          {job.salaryRange}
                        </span>
                      </CardDescription>
                    </div>
                    <Badge>{job.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{job.description}</p>
                </CardContent>
              </Card>

              {/* Instructions */}
              {!submitted && (
                <p className="text-sm text-muted-foreground text-center">
                  Click on any field that contains an error. Then submit when you're done.
                </p>
              )}

              {/* Application fields */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {submitted ? "Results" : "Application to Review"}
                  </CardTitle>
                  {submitted && (
                    <CardDescription>
                      {correctFlags.length} of {errorFields.length} errors found
                      {falseFlags.length > 0 && `, ${falseFlags.length} false flag${falseFlags.length > 1 ? "s" : ""}`}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {review.fields.map((field) => (
                    <div
                      key={field.key}
                      onClick={() => toggleFlag(field.key)}
                      className={`p-3 rounded-lg border transition-all ${getFieldStyle(field)}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                          <p className="text-sm break-words">{field.value}</p>
                        </div>
                        {!submitted && flaggedFields.has(field.key) && (
                          <Flag className="h-4 w-4 text-primary shrink-0 mt-1" />
                        )}
                        {submitted && field.hasError && flaggedFields.has(field.key) && (
                          <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                        )}
                        {submitted && field.hasError && !flaggedFields.has(field.key) && (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                        )}
                        {submitted && !field.hasError && flaggedFields.has(field.key) && (
                          <Flag className="h-4 w-4 text-yellow-500 shrink-0 mt-1" />
                        )}
                      </div>
                      {submitted && field.hasError && field.errorExplanation && (
                        <p className={`text-xs mt-2 ${flaggedFields.has(field.key) ? "text-green-400" : "text-red-400"}`}>
                          {field.errorExplanation}
                        </p>
                      )}
                      {submitted && !field.hasError && flaggedFields.has(field.key) && (
                        <p className="text-xs mt-2 text-yellow-400">
                          This field is correct. No error here.
                        </p>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-center pb-8">
                {!submitted ? (
                  <Button onClick={handleSubmit} size="lg">
                    Submit Review
                  </Button>
                ) : (
                  <Button onClick={handleNext} size="lg">
                    {reviewId < 3 ? "Next Review" : "Continue to Application"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

        <ClientDrawer open={drawerOpen} onOpenChange={setDrawerOpen} />
      </div>
    </PageTransition>
  );
}
