import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Building, Clock, ArrowRight, Flag, CheckCircle, Timer, Download, FileText, Bot, Briefcase } from "lucide-react";
import { startReviewSession, markSessionApplied, flagSession, fetchClients, fetchApplier, fetchClientDocuments, fetchJobs } from "@/lib/api";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";
import type { ApplierJobSession, Client, ClientDocument, Job } from "@shared/schema";

interface JobCardState {
  session?: ApplierJobSession;
  timerSeconds: number;
  isTimerRunning: boolean;
  isLoading: boolean;
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
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
  const [jobs, setJobs] = useState<Job[]>([]);

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
          const assigned = allClients.filter(c => assignedIds.includes(c.id));
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

  // Fetch jobs for assigned clients
  useEffect(() => {
    if (!assignedClient) return;
    
    fetchJobs({ client_id: assignedClient.id })
      .then(setJobs)
      .catch(console.error);
  }, [assignedClient]);

  // Get download URLs for resume and cover letter
  const getDocumentUrl = (type: "resume_improved" | "cover_letter_A") => {
    const doc = clientDocuments.find(d => d.document_type === type);
    if (doc) {
      // Use the API endpoint to download from object storage
      return `/api/clients/${assignedClient?.id}/documents/${doc.document_type}/download`;
    }
    return null;
  };

  // Timer effect - runs every second for jobs with active timers
  useEffect(() => {
    const interval = setInterval(() => {
      setJobStates(prev => {
        const updates: Record<string, JobCardState> = {};
        let hasUpdates = false;
        
        for (const [jobId, state] of Object.entries(prev)) {
          if (state.isTimerRunning) {
            hasUpdates = true;
            updates[jobId] = {
              ...state,
              timerSeconds: state.timerSeconds + 1
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

  const handleStartReview = useCallback(async (job: Job) => {
    const state = jobStates[job.id];
    const jobUrl = `https://example.com/job/${job.id}`; // Placeholder until real URLs from DB
    
    if (state?.session?.status === 'in_progress' || state?.session?.status === 'applied') {
      // Already started or applied, just open URL
      window.open(jobUrl, '_blank');
      return;
    }

    setJobStates(prev => ({
      ...prev,
      [job.id]: { ...prev[job.id], isLoading: true, timerSeconds: 0, isTimerRunning: false }
    }));

    try {
      // Start review session - job details come from jobs table via JOIN
      const session = await startReviewSession({
        job_id: job.id,
        applier_id: "demo-applier-1", // Would come from user context
      });
      
      // Open job URL in new tab
      window.open(jobUrl, '_blank');
      
      setJobStates(prev => ({
        ...prev,
        [job.id]: {
          session,
          timerSeconds: 0,
          isTimerRunning: true,
          isLoading: false
        }
      }));
      
      toast.success("Review started! Timer is now running.");
    } catch (error) {
      console.error("Error starting review:", error);
      
      // Fallback: Open URL anyway and start local timer
      window.open(jobUrl, '_blank');
      
      setJobStates(prev => ({
        ...prev,
        [job.id]: {
          session: { id: `local-${job.id}`, status: 'in_progress' } as ApplierJobSession,
          timerSeconds: 0,
          isTimerRunning: true,
          isLoading: false
        }
      }));
      
      toast.info("Review started (offline mode). Timer is running.");
    }
  }, [jobStates]);

  const handleApplied = useCallback(async (job: Job) => {
    const state = jobStates[job.id];
    if (!state?.session?.id) return;

    setJobStates(prev => ({
      ...prev,
      [job.id]: { ...prev[job.id], isLoading: true }
    }));

    try {
      const result = await markSessionApplied(state.session.id);
      
      setJobStates(prev => ({
        ...prev,
        [job.id]: {
          ...prev[job.id],
          session: result.session,
          isTimerRunning: false,
          isLoading: false
        }
      }));
      
      toast.success(`Application recorded! Time: ${formatTime(state.timerSeconds)}`);
    } catch (error) {
      console.error("Error marking as applied:", error);
      
      // Fallback: stop timer locally
      setJobStates(prev => ({
        ...prev,
        [job.id]: {
          ...prev[job.id],
          session: { ...prev[job.id].session!, status: 'applied' },
          isTimerRunning: false,
          isLoading: false
        }
      }));
      
      toast.success(`Application recorded locally! Time: ${formatTime(state.timerSeconds)}`);
    }
  }, [jobStates]);

  const openFlagDialog = (jobId: string) => {
    setFlaggingJobId(jobId);
    setFlagComment("");
    setFlagDialogOpen(true);
  };

  const handleFlagSubmit = async () => {
    if (!flaggingJobId || !flagComment.trim()) return;
    
    const state = jobStates[flaggingJobId];
    if (!state?.session?.id) {
      toast.error("Please start a review before flagging");
      return;
    }
    
    setIsFlagging(true);
    
    try {
      const result = await flagSession(state.session.id, flagComment.trim());
      
      setJobStates(prev => ({
        ...prev,
        [flaggingJobId]: {
          ...prev[flaggingJobId],
          session: result.session,
          isTimerRunning: false
        }
      }));
      
      toast.success("Job flagged for admin review");
      setFlagDialogOpen(false);
    } catch (error) {
      console.error("Error flagging job:", error);
      
      // Fallback: mark as flagged locally
      setJobStates(prev => ({
        ...prev,
        [flaggingJobId]: {
          ...prev[flaggingJobId],
          session: { ...prev[flaggingJobId].session!, status: 'flagged' },
          isTimerRunning: false
        }
      }));
      
      toast.success("Job flagged locally for review");
      setFlagDialogOpen(false);
    } finally {
      setIsFlagging(false);
    }
  };

  const getJobState = (jobId: string): JobCardState => {
    return jobStates[jobId] || { timerSeconds: 0, isTimerRunning: false, isLoading: false };
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
        <p className="text-muted-foreground">53 jobs waiting for review</p>
      </div>

      {/* Client Context */}
      {assignedClient && (
        <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {assignedClient.first_name?.[0]}{assignedClient.last_name?.[0]}
            </div>
            <div>
              <div className="text-sm font-medium" data-testid="text-client-name">
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
                  window.open(resumeUrl, '_blank');
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
                const coverLetterUrl = getDocumentUrl("cover_letter_A");
                if (coverLetterUrl) {
                  window.open(coverLetterUrl, '_blank');
                } else {
                  toast.error("No cover letter uploaded for this client");
                }
              }}
              data-testid="button-download-cover-letter"
            >
              <FileText className="w-4 h-4 mr-2" />
              Cover Letter
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled
              data-testid="button-client-gpt"
            >
              <Bot className="w-4 h-4 mr-2" />
              ClientGPT
            </Button>
          </div>
        </div>
      )}

      {/* Job List */}
      <div className="space-y-4">
        {jobs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="p-12 text-center">
              <div className="text-muted-foreground space-y-2">
                <Briefcase className="w-12 h-12 mx-auto opacity-30" />
                <h3 className="text-lg font-medium">No jobs in queue</h3>
                <p className="text-sm">Jobs will appear here once they are added to the system.</p>
              </div>
            </CardContent>
          </Card>
        ) : jobs.map((job) => {
          const state = getJobState(job.id);
          const hasStarted = state.session?.status === 'in_progress';
          const isApplied = state.session?.status === 'applied';
          const isFlagged = state.session?.status === 'flagged';
          const isCompleted = isApplied || isFlagged;
          
          return (
            <Card 
              key={job.id} 
              className={`group transition-all duration-200 border-l-4 ${
                isApplied ? 'border-l-green-500 bg-green-500/5' : 
                isFlagged ? 'border-l-yellow-500 bg-yellow-500/5' :
                hasStarted ? 'border-l-blue-500' :
                'border-l-transparent hover:border-l-primary hover:shadow-md'
              }`}
              data-testid={`card-job-${job.id}`}
            >
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="flex-1 space-y-2">
                    <div>
                      <h3 className="text-xl font-bold font-heading" data-testid={`text-job-title-${job.id}`}>{(job as any).job_title || job.role}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {(job as any).company_name || job.company}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {(job as any).posted_date || job.posted_time || 'Recently'}</span>
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
                  </div>

                  <div className="flex items-center gap-3">
                    {/* Timer display */}
                    {(hasStarted || state.timerSeconds > 0) && !isCompleted && (
                      <div className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg min-w-[80px] justify-center" data-testid={`timer-${job.id}`}>
                        <Timer className={`w-4 h-4 ${state.isTimerRunning ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`} />
                        <span className="font-mono font-medium text-lg">{formatTime(state.timerSeconds)}</span>
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
                            data-testid={`button-start-review-${job.id}`}
                          >
                            {hasStarted ? 'Open Job' : 'Start Review'}
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                          
                          <Button 
                            size="lg" 
                            className="w-full bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleApplied(job)}
                            disabled={!hasStarted || state.isLoading}
                            data-testid={`button-applied-${job.id}`}
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
                        onClick={() => openFlagDialog(job.id)}
                        disabled={state.isLoading}
                        data-testid={`button-flag-${job.id}`}
                      >
                        <Flag className="w-5 h-5" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {jobs.length > 0 && (
          <Button variant="ghost" className="w-full py-8 text-muted-foreground border border-dashed border-border hover:bg-muted/50" data-testid="button-load-more">
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
              Describe the issue with this job posting. This will be sent to an admin for review.
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
            <Button variant="outline" onClick={() => setFlagDialogOpen(false)} data-testid="button-cancel-flag">
              Cancel
            </Button>
            <Button 
              onClick={handleFlagSubmit}
              disabled={!flagComment.trim() || isFlagging}
              className="bg-yellow-600 hover:bg-yellow-700"
              data-testid="button-submit-flag"
            >
              {isFlagging ? 'Submitting...' : 'Submit Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
