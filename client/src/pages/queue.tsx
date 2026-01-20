import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Building,
  Clock,
  ArrowRight,
  Flag,
  CheckCircle,
  Timer,
  Download,
  FileText,
  Bot,
  Briefcase,
  MessageSquare,
  Send,
  Loader2,
  X,
  Target,
  Sparkles,
} from "lucide-react";
import {
  fetchClients,
  fetchApplier,
  fetchClientDocuments,
  apiFetch,
} from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import { motion, AnimatePresence } from "framer-motion";
import type { Client, ClientDocument } from "@shared/schema";

// Feed API job type
interface FeedJob {
  job_id: number;
  job_title: string;
  company_name: string;
  job_url: string;
  linkedin_url?: string | null;
  optimized_resume_url?: string | null;
  client_id: string;
  location?: string;
  posted_date?: string;
  source?: string | null;
  match_strength?: "strong" | "moderate" | "weak" | "none" | null;
}

interface JobCardState {
  status: "idle" | "reviewing" | "applied" | "flagged";
  timerSeconds: number;
  isTimerRunning: boolean;
  isLoading: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function QueuePage() {
  const { currentUser } = useUser();
  const [filter, setFilter] = useState("all");
  const [jobStates, setJobStates] = useState<Record<string, JobCardState>>({});
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flaggingJobId, setFlaggingJobId] = useState<string | null>(null);
  const [flagComment, setFlagComment] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [selectedClientIndex, setSelectedClientIndex] = useState(0);
  const [clientDocuments, setClientDocuments] = useState<ClientDocument[]>([]);
  const [jobs, setJobs] = useState<FeedJob[]>([]);

  // ClientGPT state
  const [showClientGPT, setShowClientGPT] = useState(false);
  const [gptQuestion, setGptQuestion] = useState("");
  const [gptAnswer, setGptAnswer] = useState("");
  const [gptLoading, setGptLoading] = useState(false);
  const [gptError, setGptError] = useState("");
  const [activeJob, setActiveJob] = useState<FeedJob | null>(null);

  const handleAskClientGPT = async () => {
    if (!gptQuestion.trim() || !currentUser?.id) return;

    setGptLoading(true);
    setGptError("");
    setGptAnswer("");

    try {
      const response = await apiFetch("/api/client-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applier_id: currentUser.id,
          question: gptQuestion.trim(),
          job_title: activeJob?.job_title,
          company_name: activeJob?.company_name,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get answer");
      }

      const data = await response.json();
      setGptAnswer(data.answer || "No answer received");
    } catch (error) {
      setGptError("Failed to get answer. Please try again.");
    } finally {
      setGptLoading(false);
    }
  };

  // Fetch assigned clients based on logged-in applier
  useEffect(() => {
    if (!currentUser || currentUser.role !== "Applier") return;

    // Fetch the applier's data to get their assigned_client_ids
    fetchApplier(currentUser.id)
      .then((applier) => {
        const assignedIds = applier.assigned_client_ids || [];
        if (assignedIds.length === 0) {
          console.log("No clients assigned to this applier");
          return;
        }

        // Fetch all clients and filter to only assigned ones
        return fetchClients().then((allClients) => {
          const assigned = allClients.filter((c) => assignedIds.includes(c.id));
          setAssignedClients(assigned);
        });
      })
      .catch(console.error);
  }, [currentUser]);

  const assignedClient = assignedClients[selectedClientIndex] || null;

  // Fetch documents for the selected client
  useEffect(() => {
    if (!assignedClient) return;

    fetchClientDocuments(assignedClient.id)
      .then(setClientDocuments)
      .catch(console.error);
  }, [assignedClient]);

  // Fetch queue jobs from Feed API
  useEffect(() => {
    if (!currentUser) return;

    const fetchQueue = async () => {
      try {
        const res = await apiFetch(
          `/api/queue-jobs?applier_id=${currentUser.id}`,
        );
        if (!res.ok) throw new Error("Failed to fetch queue");
        const data = await res.json();
        setJobs(data);
      } catch (error) {
        console.error("Error fetching queue:", error);
      }
    };

    fetchQueue();
  }, [currentUser]);

  // Get download URLs for resume and cover letter
  const getDocumentUrl = (
    type: "resume_improved" | "cover_letter_A" | "cover_letter_B",
  ) => {
    const doc = clientDocuments.find((d) => d.document_type === type);
    if (doc) {
      // Use the API endpoint to download from object storage
      return `/api/clients/${assignedClient?.id}/documents/${doc.document_type}/download`;
    }
    return null;
  };

  // Timer effect - runs every second for jobs with active timers
  useEffect(() => {
    const interval = setInterval(() => {
      setJobStates((prev) => {
        const updates: Record<string, JobCardState> = {};
        let hasUpdates = false;

        for (const [jobId, state] of Object.entries(prev)) {
          if (state.isTimerRunning) {
            hasUpdates = true;
            updates[jobId] = {
              ...state,
              timerSeconds: state.timerSeconds + 1,
            };
          }
        }

        if (hasUpdates) {
          return { ...prev, ...updates };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleStartReview = useCallback(
    (job: FeedJob) => {
      const jobId = String(job.job_id);
      const state = jobStates[jobId];

      // Set this as the active job for ClientGPT context
      setActiveJob(job);

      // If already reviewing or applied, just open URL
      if (state?.status === "reviewing" || state?.status === "applied") {
        window.open(job.job_url, "_blank");
        return;
      }

      // Open job URL in new tab
      window.open(job.job_url, "_blank");

      // Start local timer (no backend call needed)
      setJobStates((prev) => ({
        ...prev,
        [jobId]: {
          status: "reviewing",
          timerSeconds: 0,
          isTimerRunning: true,
          isLoading: false,
        },
      }));

      toast.success("Review started! Timer is now running.");
    },
    [jobStates],
  );

  const handleApplied = useCallback(
    async (job: FeedJob) => {
      const jobId = String(job.job_id);
      const state = jobStates[jobId];

      if (!state || state.status !== "reviewing") {
        toast.error("Please start reviewing before marking as applied");
        return;
      }

      setJobStates((prev) => ({
        ...prev,
        [jobId]: { ...prev[jobId], isLoading: true, isTimerRunning: false },
      }));

      try {
        // Call Feed API to mark as applied
        const res = await apiFetch("/api/apply-job", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            applier_id: currentUser?.id,
            job_id: job.job_id,
            client_id: job.client_id,
            duration_seconds: state.timerSeconds,
            job_title: job.job_title,
            company_name: job.company_name,
            job_url: job.job_url,
            linkedin_url: job.linkedin_url,
            source: job.source,
          }),
        });

        if (!res.ok) throw new Error("Failed to apply");

        // Remove job from queue
        setJobs((prev) => prev.filter((j) => j.job_id !== job.job_id));
        setJobStates((prev) => {
          const { [jobId]: removed, ...rest } = prev;
          return rest;
        });

        toast.success(
          `Application recorded! Time: ${formatTime(state.timerSeconds)}`,
        );
      } catch (error) {
        console.error("Error applying:", error);
        toast.error("Failed to record application");
        setJobStates((prev) => ({
          ...prev,
          [jobId]: { ...prev[jobId], isLoading: false, isTimerRunning: true },
        }));
      }
    },
    [jobStates, currentUser],
  );

  const openFlagDialog = (jobId: string) => {
    setFlaggingJobId(jobId);
    setFlagComment("");
    setFlagDialogOpen(true);
  };

  const handleFlagSubmit = async () => {
    if (!flaggingJobId || !flagComment.trim()) return;

    const job = jobs.find((j) => String(j.job_id) === flaggingJobId);
    if (!job) {
      toast.error("Job not found");
      return;
    }

    setIsFlagging(true);

    try {
      // Call Feed API to flag job
      const res = await apiFetch("/api/flag-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applier_id: currentUser?.id,
          job_id: job.job_id,
          comment: flagComment.trim(),
        }),
      });

      if (!res.ok) throw new Error("Failed to flag");

      // Remove job from queue
      setJobs((prev) => prev.filter((j) => j.job_id !== job.job_id));
      setJobStates((prev) => {
        const { [flaggingJobId]: removed, ...rest } = prev;
        return rest;
      });

      toast.success("Job flagged for admin review");
      setFlagDialogOpen(false);
    } catch (error) {
      console.error("Error flagging job:", error);
      toast.error("Failed to flag job");
    } finally {
      setIsFlagging(false);
    }
  };

  const getJobState = (jobId: string | number): JobCardState => {
    const key = String(jobId);
    return (
      jobStates[key] || {
        status: "idle",
        timerSeconds: 0,
        isTimerRunning: false,
        isLoading: false,
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">
            {jobs.length} jobs waiting for review
          </p>
        </div>
      </div>

      {/* Client Context */}
      {assignedClient && (
        <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {assignedClient.first_name?.[0]}
              {assignedClient.last_name?.[0]}
            </div>
            <div>
              <div
                className="text-sm font-medium"
                data-testid="text-client-name"
              >
                {assignedClient.first_name} {assignedClient.last_name}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const resumeUrl = getDocumentUrl("resume_improved");
                if (resumeUrl) {
                  window.open(resumeUrl, "_blank");
                } else {
                  toast.error("No resume uploaded for this client");
                }
              }}
              data-testid="button-download-resume"
            >
              <Download className="w-4 h-4 mr-2" />
              Resume
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = getDocumentUrl("cover_letter_A");
                if (url) {
                  window.open(url, "_blank");
                } else {
                  toast.error(
                    "No Narrative cover letter uploaded for this client",
                  );
                }
              }}
              data-testid="button-download-cover-letter-narrative"
            >
              <FileText className="w-4 h-4 mr-2" />
              CL (Narrative)
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const url = getDocumentUrl("cover_letter_B");
                if (url) {
                  window.open(url, "_blank");
                } else {
                  toast.error(
                    "No Exact Match cover letter uploaded for this client",
                  );
                }
              }}
              data-testid="button-download-cover-letter-exact-match"
            >
              <FileText className="w-4 h-4 mr-2" />
              CL (Exact Match)
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowClientGPT(!showClientGPT);
                if (showClientGPT) {
                  setGptQuestion("");
                  setGptAnswer("");
                  setGptError("");
                }
              }}
              data-testid="button-client-gpt"
            >
              <MessageSquare className="w-4 h-4 mr-2" />
              ClientGPT
            </Button>
          </div>
        </div>
      )}

      {/* ClientGPT Floating Panel */}
      <AnimatePresence>
        {showClientGPT && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 w-96 bg-card border border-border rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-lg">
              <div className="flex-1">
                <span className="font-medium text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-primary" />
                  ClientGPT
                </span>
                {activeJob && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {activeJob.job_title} @ {activeJob.company_name}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowClientGPT(false);
                  setGptQuestion("");
                  setGptAnswer("");
                  setGptError("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about their experience, skills, projects..."
                  value={gptQuestion}
                  onChange={(e) => setGptQuestion(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && !gptLoading && handleAskClientGPT()
                  }
                  className="flex-1 text-sm bg-muted/50"
                  data-testid="input-client-gpt-question"
                />
                <Button
                  size="sm"
                  onClick={handleAskClientGPT}
                  disabled={gptLoading || !gptQuestion.trim()}
                  data-testid="button-client-gpt-ask"
                >
                  {gptLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {gptLoading && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}

              {gptError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {gptError}
                </div>
              )}

              {gptAnswer && (
                <div
                  className="text-sm bg-muted/30 p-3 rounded-lg max-h-64 overflow-y-auto"
                  data-testid="text-client-gpt-answer"
                >
                  <p className="whitespace-pre-wrap">{gptAnswer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Job List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground space-y-2">
                <Briefcase className="w-12 h-12 mx-auto opacity-30" />
                <h3 className="text-lg font-medium">No jobs in queue</h3>
                <p className="text-sm">
                  Jobs will appear here once they are added to the system.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          jobs.map((job) => {
            const jobId = String(job.job_id);
            const state = getJobState(jobId);
            const hasStarted = state.status === "reviewing";
            const isApplied = state.status === "applied";
            const isFlagged = state.status === "flagged";
            const isCompleted = isApplied || isFlagged;
            const isStrongMatch = job.match_strength === "strong";

            return (
              <Card
                key={job.job_id}
                className={`group transition-all duration-200 border-l-4 ${
                  isApplied
                    ? "border-l-green-500 bg-green-500/5"
                    : isFlagged
                      ? "border-l-yellow-500 bg-yellow-500/5"
                      : isStrongMatch
                        ? "border-l-amber-400 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-400/30"
                        : hasStarted
                          ? "border-l-blue-500"
                          : "border-l-transparent hover:border-l-primary hover:shadow-md"
                }`}
                data-testid={`card-job-${job.job_id}`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            className={`text-xl font-bold font-heading ${isStrongMatch ? "text-amber-200" : ""}`}
                            data-testid={`text-job-title-${job.job_id}`}
                          >
                            {job.job_title}
                          </h3>
                          {isStrongMatch && (
                            <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                          )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" /> {job.company_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />{" "}
                            {job.posted_date
                              ? formatDistanceToNow(new Date(job.posted_date), {
                                  addSuffix: true,
                                })
                              : "Recently"}
                          </span>
                          {isStrongMatch && (
                            <span className="flex items-center gap-1 text-amber-400 font-medium">
                              <Target className="w-3 h-3" /> Strong Match
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Status indicators */}
                      {isApplied && (
                        <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                          <CheckCircle className="w-4 h-4" />
                          Applied - {formatTime(state.timerSeconds)}
                        </div>
                      )}
                      {isFlagged && (
                        <div className="flex items-center gap-2 text-yellow-600 text-sm font-medium">
                          <Flag className="w-4 h-4" />
                          Flagged for review
                        </div>
                      )}

                      {/* Tailored Resume Download */}
                      {job.optimized_resume_url && (
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              window.open(job.optimized_resume_url!, "_blank")
                            }
                            className="border-primary/30 text-primary hover:bg-primary/10"
                            data-testid={`button-resume-${job.job_id}`}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Tailored Resume
                          </Button>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Timer display */}
                      {(hasStarted || state.timerSeconds > 0) &&
                        !isCompleted && (
                          <div
                            className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg min-w-[80px] justify-center"
                            data-testid={`timer-${job.job_id}`}
                          >
                            <Timer
                              className={`w-4 h-4 ${state.isTimerRunning ? "text-blue-500 animate-pulse" : "text-muted-foreground"}`}
                            />
                            <span className="font-mono font-medium text-lg">
                              {formatTime(state.timerSeconds)}
                            </span>
                          </div>
                        )}

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 min-w-[140px]">
                        {!isCompleted && (
                          <>
                            <Button
                              size="lg"
                              className="w-full shadow-lg shadow-primary/10"
                              onClick={() => handleStartReview(job)}
                              disabled={state.isLoading}
                              data-testid={`button-start-review-${job.job_id}`}
                            >
                              {hasStarted ? "Open Job" : "Start Review"}
                              <ArrowRight className="w-4 h-4 ml-2" />
                            </Button>

                            <Button
                              size="lg"
                              className="w-full bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleApplied(job)}
                              disabled={!hasStarted || state.isLoading}
                              data-testid={`button-applied-${job.job_id}`}
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Applied
                            </Button>
                          </>
                        )}

                        {isApplied && (
                          <div className="text-center text-green-600 font-medium py-2">
                            Completed
                          </div>
                        )}

                        {isFlagged && (
                          <div className="text-center text-yellow-600 font-medium py-2">
                            Sent for Review
                          </div>
                        )}
                      </div>

                      {/* Flag button */}
                      {!isCompleted && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-[88px] w-12 border-dashed hover:border-yellow-500 hover:text-yellow-600"
                          onClick={() => openFlagDialog(jobId)}
                          disabled={state.isLoading}
                          data-testid={`button-flag-${job.job_id}`}
                        >
                          <Flag className="w-5 h-5" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}

        {jobs.length > 0 && (
          <Button
            variant="ghost"
            className="w-full py-8 text-muted-foreground border border-dashed border-border hover:bg-muted/50"
            data-testid="button-load-more"
          >
            Load more jobs...
          </Button>
        )}
      </div>

      {/* Flag Dialog */}
      <Dialog open={flagDialogOpen} onOpenChange={setFlagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Flag Job for Review</DialogTitle>
            <DialogDescription>
              Describe the issue with this job posting. This will be sent to an
              admin for review.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="What's wrong with this job? (e.g., duplicate listing, job expired, incorrect requirements...)"
              value={flagComment}
              onChange={(e) => setFlagComment(e.target.value)}
              rows={4}
              data-testid="textarea-flag-comment"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setFlagDialogOpen(false)}
              data-testid="button-cancel-flag"
            >
              Cancel
            </Button>
            <Button
              onClick={handleFlagSubmit}
              disabled={!flagComment.trim() || isFlagging}
              className="bg-yellow-600 hover:bg-yellow-700"
              data-testid="button-submit-flag"
            >
              {isFlagging ? "Submitting..." : "Submit Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
