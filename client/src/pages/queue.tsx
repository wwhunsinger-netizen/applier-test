import { useState, useEffect, useCallback } from "react";
import { MOCK_JOBS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Building, Clock, Search, ArrowRight, Flag, CheckCircle, Timer } from "lucide-react";
import { startReviewSession, markSessionApplied, flagSession } from "@/lib/api";
import { toast } from "sonner";
import type { ApplierJobSession } from "@shared/schema";

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
  const [filter, setFilter] = useState("all");
  const [jobStates, setJobStates] = useState<Record<string, JobCardState>>({});
  const [flagDialogOpen, setFlagDialogOpen] = useState(false);
  const [flaggingJobId, setFlaggingJobId] = useState<string | null>(null);
  const [flagComment, setFlagComment] = useState("");
  const [isFlagging, setIsFlagging] = useState(false);

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

  const handleStartReview = useCallback(async (job: typeof MOCK_JOBS[0]) => {
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

  const handleApplied = useCallback(async (job: typeof MOCK_JOBS[0]) => {
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Review Queue</h1>
          <p className="text-muted-foreground">53 jobs waiting for review</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input type="search" placeholder="Search jobs..." className="pl-9 bg-background" data-testid="input-search" />
          </div>
          <Select defaultValue="match">
            <SelectTrigger className="w-[140px]" data-testid="select-sort">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="match">Best Match</SelectItem>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="oldest">Oldest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Client Context */}
      <div className="bg-muted/40 border border-border rounded-lg p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JS</div>
          <div>
            <div className="text-sm font-medium">John Smith</div>
            <div className="text-xs text-muted-foreground">Target: Remote Software Engineer • Day 47/90</div>
          </div>
        </div>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-muted-foreground block text-xs">Progress</span>
            <span className="font-mono font-medium">2,847/5k</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Interviews</span>
            <span className="font-mono font-medium text-success">18</span>
          </div>
          <div>
            <span className="text-muted-foreground block text-xs">Pending</span>
            <span className="font-mono font-medium text-warning">2</span>
          </div>
        </div>
      </div>

      {/* Job List */}
      <div className="space-y-4">
        {MOCK_JOBS.map((job) => {
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
                      <h3 className="text-xl font-bold font-heading" data-testid={`text-job-title-${job.id}`}>{job.role}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><Building className="w-3 h-3" /> {job.company}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {job.postedTime}</span>
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
        
        <Button variant="ghost" className="w-full py-8 text-muted-foreground border border-dashed border-border hover:bg-muted/50" data-testid="button-load-more">
          Load more jobs...
        </Button>
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
