import { useEffect, useRef } from "react";
import PageTransition from "@/components/PageTransition";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Keyboard,
  FileText,
  Eye,
  ClipboardCheck,
} from "lucide-react";
import { useTest } from "@/context/TestContext";

export default function Results() {
  const {
    candidateName,
    candidateEmail,
    screeningAnswers,
    typingResults,
    reviewResults,
    applicationResult,
    getElapsedSeconds,
    setProgress,
    completeStep,
  } = useTest();
  const submittedRef = useRef(false);

  useEffect(() => {
    setProgress(100);
    completeStep("results");
  }, [setProgress, completeStep]);

  const elapsed = getElapsedSeconds();
  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}m ${sec}s`;
  };

  // --- Scoring ---

  // Typing: score based on WPM and accuracy (0-100)
  const typingScore = typingResults
    ? Math.min(100, Math.round(
        (Math.min(typingResults.timedWpm, 60) / 60) * 50 +
        (typingResults.timedAccuracy / 100) * 50
      ))
    : 0;

  // Reviews: average accuracy across all 3 (0-100)
  const reviewIds = [1, 2, 3];
  const reviewScores = reviewIds.map((id) => {
    const r = reviewResults[id];
    if (!r) return 0;
    const flagAccuracy = r.totalErrors > 0 ? (r.correctFlags / r.totalErrors) * 100 : 100;
    const penalty = r.falseFlags * 10;
    return Math.max(0, Math.round(flagAccuracy - penalty));
  });
  const completedReviews = reviewIds.filter((id) => reviewResults[id]).length;
  const reviewScore = Math.round(reviewScores.reduce((a, b) => a + b, 0) / 3);

  // Application fill-out: percentage correct (0-100)
  const appScore = applicationResult
    ? Math.round((applicationResult.correctCount / applicationResult.totalScored) * 100)
    : 0;

  // Overall: weighted average
  const overallScore = Math.round(
    typingScore * 0.2 +
    reviewScore * 0.4 +
    appScore * 0.4
  );

  // Pass requires: overall 65%+, typing 25+ WPM & 70%+ accuracy, reviews 40%+, app 5/9+ fields
  const typingWpm = typingResults?.timedWpm ?? 0;
  const typingAcc = typingResults?.timedAccuracy ?? 0;
  const appCorrect = applicationResult?.correctCount ?? 0;
  const passed =
    overallScore >= 65 &&
    typingWpm >= 25 &&
    typingAcc >= 70 &&
    reviewScore >= 40 &&
    appCorrect >= 5 &&
    completedReviews === 3;

  // Submit results to backend (once)
  useEffect(() => {
    if (submittedRef.current) return;
    if (!candidateEmail) return;
    submittedRef.current = true;

    const reviewDetails: Record<number, { correctFlags: number; falseFlags: number; totalErrors: number }> = {};
    reviewIds.forEach((id) => {
      const r = reviewResults[id];
      if (r) {
        reviewDetails[id] = {
          correctFlags: r.correctFlags,
          falseFlags: r.falseFlags,
          totalErrors: r.totalErrors,
        };
      }
    });

    fetch("/api/test-submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        candidate_name: candidateName,
        candidate_email: candidateEmail,
        passed,
        overall_score: overallScore,
        typing_wpm: typingWpm,
        typing_accuracy: typingAcc,
        typing_score: typingScore,
        review_score: reviewScore,
        review_details: reviewDetails,
        app_correct_count: appCorrect,
        app_total_scored: applicationResult?.totalScored ?? 0,
        app_score: appScore,
        screening_answers: screeningAnswers,
        elapsed_seconds: elapsed,
      }),
    }).catch((err) => {
      console.error("Failed to submit test results:", err);
    });
  }, [candidateEmail]); // eslint-disable-line react-hooks/exhaustive-deps

  const ScoreBar = ({ score, label }: { score: number; label: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{score}%</span>
      </div>
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
          }`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );

  return (
    <PageTransition>
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            {passed ? (
              <CheckCircle className="h-16 w-16 text-green-500" />
            ) : (
              <XCircle className="h-16 w-16 text-red-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold">Assessment Complete</h1>
          <p className="text-muted-foreground">
            {candidateName
              ? `Thanks, ${candidateName}. Here's your performance summary.`
              : "Here's your performance summary."}
          </p>
          <Badge variant={passed ? "default" : "destructive"} className="text-sm">
            {passed ? "PASSED" : "DID NOT PASS"}
          </Badge>
        </div>

        {/* Overall score */}
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <p className="text-5xl font-bold">{overallScore}%</p>
              <p className="text-sm text-muted-foreground">Overall Score</p>
            </div>
          </CardContent>
        </Card>

        {/* Section breakdowns */}
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Typing */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Keyboard className="h-4 w-4 text-primary" />
                Typing Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {typingResults ? (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="text-xl font-bold">{typingResults.timedWpm}</p>
                      <p className="text-xs text-muted-foreground">WPM</p>
                    </div>
                    <div className="text-center p-2 rounded-lg bg-secondary">
                      <p className="text-xl font-bold">{typingResults.timedAccuracy}%</p>
                      <p className="text-xs text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                  <ScoreBar score={typingScore} label="Section Score" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Reviews */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-4 w-4 text-primary" />
                Application Reviews
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {completedReviews > 0 ? (
                <>
                  <div className="space-y-2 text-sm">
                    {reviewIds.map((id) => {
                      const r = reviewResults[id];
                      if (!r) return (
                        <div key={id} className="flex justify-between text-muted-foreground">
                          <span>Review {id}</span>
                          <span>Not completed</span>
                        </div>
                      );
                      return (
                        <div key={id} className="flex justify-between">
                          <span className="text-muted-foreground">Review {id}</span>
                          <span className="font-medium">
                            {r.correctFlags}/{r.totalErrors} found
                            {r.falseFlags > 0 && (
                              <span className="text-yellow-500 ml-1">({r.falseFlags} false)</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <ScoreBar score={reviewScore} label="Section Score" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Application fill-out */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="h-4 w-4 text-primary" />
                Application Fill-out
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {applicationResult ? (
                <>
                  <div className="text-center p-2 rounded-lg bg-secondary">
                    <p className="text-xl font-bold">
                      {applicationResult.correctCount} / {applicationResult.totalScored}
                    </p>
                    <p className="text-xs text-muted-foreground">Fields Correct</p>
                  </div>
                  <ScoreBar score={appScore} label="Section Score" />
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not completed</p>
              )}
            </CardContent>
          </Card>

          {/* Time */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4 text-primary" />
                Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Application Time</span>
                  <span className="font-semibold">{formatTime(elapsed)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reviews Completed</span>
                  <span className="font-semibold">{completedReviews} / 3</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Passing Threshold</span>
                  <span className="font-semibold">65%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next steps */}
        {passed && (
          <Card className="border-green-500/20">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                We'll review your results and reach out via email if you're a good fit. Keep an eye on your inbox.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Failure message */}
        {!passed && (
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground text-center">
                Unfortunately, your scores did not meet the minimum requirements for this role. You may close this window.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="pb-8" />
      </div>
    </div>
    </PageTransition>
  );
}
