import { useState, useRef, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  User,
  Clock,
  MapPin,
  DollarSign,
  Building2,
  PenLine,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useTest } from "@/context/TestContext";
import { JOB_DESCRIPTIONS, CLIENT_PROFILE } from "@/lib/test-data";
import ClientDrawer from "@/components/ClientDrawer";
import EEOSection from "@/components/EEOSection";

const APPLICATION_TIME_LIMIT = 180; // 3 minutes

export default function JobApplication() {
  const [, navigate] = useLocation();
  const {
    applicationData,
    setApplicationField,
    startApplicationTimer,
    stopApplicationTimer,
    setProgress,
    setApplicationResult,
    completeStep,
  } = useTest();

  const job = JOB_DESCRIPTIONS.find((j) => j.id === 4) ?? JOB_DESCRIPTIONS[3];
  const data = applicationData[4] || {};
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showTimeUp, setShowTimeUp] = useState(false);

  // Correct answers from client profile
  const CORRECT_ANSWERS: Record<string, string> = {
    fullName: CLIENT_PROFILE.name,
    email: CLIENT_PROFILE.email,
    phone: CLIENT_PROFILE.phone,
    linkedin: CLIENT_PROFILE.linkedin,
    location: CLIENT_PROFILE.location,
    yearsExp: String(CLIENT_PROFILE.yearsExperience),
    currentCompany: CLIENT_PROFILE.currentCompany,
    currentTitle: CLIENT_PROFILE.currentTitle,
    desiredSalary: CLIENT_PROFILE.desiredSalary,
  };

  const SCORED_FIELDS = [
    { key: "fullName", label: "Full Name" },
    { key: "email", label: "Email Address" },
    { key: "phone", label: "Phone Number" },
    { key: "linkedin", label: "LinkedIn URL" },
    { key: "location", label: "Location" },
    { key: "yearsExp", label: "Years of Experience" },
    { key: "currentCompany", label: "Current Company" },
    { key: "currentTitle", label: "Current Title" },
    { key: "desiredSalary", label: "Desired Salary" },
  ];

  const normalizeField = (key: string, value: string): string => {
    const v = value.trim().toLowerCase();
    switch (key) {
      case "phone":
        return v.replace(/\D/g, "");
      case "desiredSalary":
        return v.replace(/[$,\s]/g, "");
      case "linkedin":
        return v.replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
      default:
        return v;
    }
  };

  const isFieldCorrect = (key: string) => {
    const entered = normalizeField(key, data[key] || "");
    const correct = normalizeField(key, CORRECT_ANSWERS[key] || "");
    return entered === correct;
  };

  // Tutorial state
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialName, setTutorialName] = useState("");
  const [tutorialShake, setTutorialShake] = useState(false);

  // Progress: tutorial=78, active=85, submitted=92
  useEffect(() => {
    if (showTutorial) setProgress(78);
    else if (submitted) setProgress(92);
    else setProgress(85);
  }, [showTutorial, submitted, setProgress]);

  // 3-minute countdown - only starts after tutorial
  const [timeLeft, setTimeLeft] = useState(APPLICATION_TIME_LIMIT);
  const [timerActive, setTimerActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    if (timerRef.current) return;
    setTimerActive(true);
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

  const isCorrectName = tutorialName.trim().toLowerCase() === CLIENT_PROFILE.name.split(" ")[0].toLowerCase();

  const handleBeginAttempt = () => {
    if (isCorrectName) {
      setShowTutorial(false);
      startTimer();
      startApplicationTimer();
    } else {
      setTutorialShake(true);
      setTimeout(() => setTutorialShake(false), 500);
    }
  };

  // Auto-submit when time runs out
  useEffect(() => {
    if (timeLeft === 0 && timerActive && !submitted && !showTutorial) {
      setShowTimeUp(true);
      stopApplicationTimer();
      setTimeout(() => {
        setSubmitted(true);
        setShowTimeUp(false);
      }, 1200);
    }
  }, [timeLeft, timerActive, submitted, showTutorial, stopApplicationTimer]);

  const setField = (field: string, value: string) => {
    setApplicationField(4, field, value);
  };

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const isLow = timeLeft <= 30;

  const correctCount = submitted
    ? SCORED_FIELDS.filter((f) => isFieldCorrect(f.key)).length
    : 0;

  // Save results to context when submitted
  useEffect(() => {
    if (!submitted) return;
    const correct = SCORED_FIELDS.filter((f) => isFieldCorrect(f.key)).length;
    setApplicationResult({ correctCount: correct, totalScored: SCORED_FIELDS.length });
    completeStep("application");
  }, [submitted]);

  const handleSubmit = () => {
    if (submitting || submitted) return;
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    stopApplicationTimer();
    setSubmitted(true);
  };

  const handleContinue = () => {
    navigate("/test/results");
  };

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
            <p className="text-sm text-muted-foreground mt-1">Submitting your application...</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Top bar */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">Fill-out Application</Badge>
          <div className="flex items-center gap-3">
            {timerActive && !submitted && (
              <Badge
                variant={isLow ? "destructive" : "secondary"}
                className={`flex items-center gap-1 font-mono ${timeLeft <= 10 && timeLeft > 0 ? "animate-pulse" : ""}`}
              >
                <Clock className="h-3 w-3" />
                {mins}:{secs.toString().padStart(2, "0")}
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              <User className="h-4 w-4 mr-1" />
              View Client Details
            </Button>
          </div>
        </div>

        {/* Tutorial */}
        <AnimatePresence mode="wait">
          {showTutorial && (
            <motion.div
              key="tutorial"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center text-center space-y-5 py-8"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <PenLine className="h-6 w-6 text-primary" />
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold">Fill out the application</p>
                <p className="text-sm text-muted-foreground max-w-sm">
                  Use "View Client Details" in the top-right to find the correct answers. You'll have 3 minutes once you begin.
                </p>
              </div>

              {/* Sample field */}
              <motion.div
                animate={tutorialShake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm rounded-lg border border-border/50 bg-white/[0.02] p-4 text-left space-y-2"
              >
                <Label htmlFor="tutorial-name" className="text-xs text-muted-foreground">First Name</Label>
                <Input
                  id="tutorial-name"
                  autoFocus
                  value={tutorialName}
                  onChange={(e) => setTutorialName(e.target.value)}
                  placeholder="Type client's first name"
                  className={`text-sm ${tutorialShake ? "border-red-500" : ""}`}
                />
              </motion.div>

              <motion.div
                initial={false}
                animate={{ opacity: tutorialName.trim() ? 1 : 0.3 }}
                transition={{ duration: 0.3 }}
              >
                <Button
                  size="lg"
                  className="text-base px-8"
                  disabled={!tutorialName.trim()}
                  onClick={handleBeginAttempt}
                >
                  Begin
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main form - hidden during tutorial */}
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

            {/* Application form / Results */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {submitted ? "Results" : "Application Form"}
                </CardTitle>
                <CardDescription>
                  {submitted
                    ? `${correctCount} of ${SCORED_FIELDS.length} fields correct`
                    : "Fill out this application using the client's information."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {!submitted ? (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="fullName">Full Name</Label>
                        <Input
                          id="fullName"
                          value={data.fullName || ""}
                          onChange={(e) => setField("fullName", e.target.value)}
                          placeholder="Full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={data.email || ""}
                          onChange={(e) => setField("email", e.target.value)}
                          placeholder="Email"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          value={data.phone || ""}
                          onChange={(e) => setField("phone", e.target.value)}
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn URL</Label>
                        <Input
                          id="linkedin"
                          value={data.linkedin || ""}
                          onChange={(e) => setField("linkedin", e.target.value)}
                          placeholder="LinkedIn profile URL"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={data.location || ""}
                          onChange={(e) => setField("location", e.target.value)}
                          placeholder="City, State"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="yearsExp">Years of Experience</Label>
                        <Input
                          id="yearsExp"
                          value={data.yearsExp || ""}
                          onChange={(e) => setField("yearsExp", e.target.value)}
                          placeholder="e.g. 4"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentCompany">Current Company</Label>
                        <Input
                          id="currentCompany"
                          value={data.currentCompany || ""}
                          onChange={(e) => setField("currentCompany", e.target.value)}
                          placeholder="Current employer"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currentTitle">Current Title</Label>
                        <Input
                          id="currentTitle"
                          value={data.currentTitle || ""}
                          onChange={(e) => setField("currentTitle", e.target.value)}
                          placeholder="Current job title"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="desiredSalary">Desired Salary</Label>
                      <Input
                        id="desiredSalary"
                        value={data.desiredSalary || ""}
                        onChange={(e) => setField("desiredSalary", e.target.value)}
                        placeholder="Salary expectations"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="whyRole">Why are you interested in this role?</Label>
                      <Textarea
                        id="whyRole"
                        value={data.whyRole || ""}
                        onChange={(e) => setField("whyRole", e.target.value)}
                        placeholder="Write a brief explanation..."
                        rows={4}
                      />
                    </div>

                    <EEOSection />
                  </>
                ) : (
                  /* Submitted results view */
                  <>
                    {SCORED_FIELDS.map((field) => {
                      const correct = isFieldCorrect(field.key);
                      const entered = (data[field.key] || "").trim();
                      return (
                        <div
                          key={field.key}
                          className={`p-3 rounded-lg border transition-all ${
                            correct
                              ? "border-green-500 bg-green-500/5"
                              : "border-red-500 bg-red-500/5"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-muted-foreground mb-1">{field.label}</p>
                              <p className="text-sm break-words">
                                {entered || <span className="text-muted-foreground italic">Left blank</span>}
                              </p>
                            </div>
                            {correct ? (
                              <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                            ) : (
                              <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-1" />
                            )}
                          </div>
                          {!correct && (
                            <p className="text-xs text-red-400 mt-2">
                              Correct: {CORRECT_ANSWERS[field.key]}
                            </p>
                          )}
                        </div>
                      );
                    })}

                    {/* Show whyRole as unscored */}
                    {data.whyRole && (
                      <div className="p-3 rounded-lg border border-border opacity-60">
                        <p className="text-xs text-muted-foreground mb-1">Why are you interested in this role?</p>
                        <p className="text-sm break-words">{data.whyRole}</p>
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex justify-center pb-8">
              {!submitted ? (
                <Button onClick={handleSubmit} size="lg">
                  Submit Application
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleContinue} size="lg">
                  Continue to Results
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
