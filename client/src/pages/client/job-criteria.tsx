import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MOCK_JOBS } from "@/lib/mockData";
import { Check, X, ChevronDown, ChevronUp, MapPin, Clock, Building, AlertCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function ClientJobCriteriaPage() {
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  const [jobs, setJobs] = useState(MOCK_JOBS);
  const [rejectingJobId, setRejectingJobId] = useState<string | null>(null);
  const [rejectionComment, setRejectionComment] = useState("");
  const [rejectedJobs, setRejectedJobs] = useState<Record<string, string>>({}); // jobId -> comment
  const [approvedJobs, setApprovedJobs] = useState<string[]>([]);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    // Prevent expanding if clicking action buttons
    if ((e.target as HTMLElement).closest('button')) return;
    setExpandedJobId(expandedJobId === id ? null : id);
  };

  const handleApprove = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setApprovedJobs([...approvedJobs, id]);
    toast.success("Job criteria confirmed");
  };

  const initiateReject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRejectingJobId(id);
    setRejectionComment("");
  };

  const confirmReject = () => {
    if (rejectingJobId && rejectionComment) {
      setRejectedJobs({ ...rejectedJobs, [rejectingJobId]: rejectionComment });
      setRejectingJobId(null);
      setRejectionComment("");
      toast.success("Feedback recorded");
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Check if all jobs have been reviewed
  const allReviewed = jobs.every(job => approvedJobs.includes(job.id) || rejectedJobs[job.id]);

  const handleSubmit = () => {
    setIsSubmitting(true);
    
    // Simulate API call/processing time
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Save completion state to localStorage for the Overview page to detect
      localStorage.setItem('jobCriteriaCompleted', 'true');
      toast.success("Job criteria submitted successfully!");
    }, 1500);
  };

  if (isSubmitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 mb-4 animate-in bounce-in duration-1000 delay-300">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-3xl font-bold text-white">All Set!</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          Thanks for your feedback. We'll use this to calibrate your job search and start applying to the best matches.
        </p>
        <Button 
          className="mt-8 bg-white/10 hover:bg-white/20 text-white"
          onClick={() => window.location.href = '/'}
        >
          Return to Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-32 max-w-4xl mx-auto relative">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Confirm Job Criteria</h1>
        <p className="text-muted-foreground mt-1">Review sample jobs to help us calibrate your search.</p>
      </div>

      <motion.div 
        className="space-y-4"
        animate={isSubmitting ? { opacity: 0, height: 0, overflow: "hidden" } : { opacity: 1, height: "auto" }}
        transition={{ duration: 0.5 }}
      >
        {jobs.map((job) => {
          const isRejected = !!rejectedJobs[job.id];
          const isApproved = approvedJobs.includes(job.id);

          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 1 }}
              animate={{ opacity: isApproved ? 0.5 : 1 }}
              transition={{ duration: 0.3 }}
            >
              <Card 
                className={cn(
                  "border-white/10 overflow-hidden transition-all duration-300 relative group cursor-pointer",
                  isRejected ? "bg-red-950/20 border-red-500/30" : "bg-[#111] hover:border-white/20",
                  isApproved && "bg-green-950/10 border-green-500/30"
                )}
                onClick={(e) => toggleExpand(job.id, e)}
              >
                {/* Rejected Overlay Line */}
                {isRejected && (
                  <div className="absolute top-6 left-0 right-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/50 text-red-500 px-6 py-2 rounded-full font-bold text-lg transform -rotate-2 shadow-xl max-w-[80%] text-center truncate">
                      {rejectedJobs[job.id]}
                    </div>
                  </div>
                )}

                <CardContent className="p-0">
                  <div className="p-6 flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-xl font-bold text-white group-hover:text-primary transition-colors">{job.role}</h3>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1"><Building className="w-3.5 h-3.5" /> {job.company}</span>
                            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {job.location}</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {job.postedTime}</span>
                          </div>
                        </div>
                        <Badge variant="secondary" className={cn(
                          "ml-2", 
                          job.matchScore >= 90 ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        )}>
                          {job.matchScore}% Match
                        </Badge>
                      </div>

                      {/* Requirements Preview */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                        {job.requirements.slice(0, 2).map((req, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            {req.met ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                            )}
                            <span className="text-gray-300">{req.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-3 self-center pl-4 border-l border-white/10">
                      {!isRejected && !isApproved && (
                        <>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-12 w-12 rounded-full border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all"
                            onClick={(e) => initiateReject(job.id, e)}
                          >
                            <X className="w-6 h-6" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-12 w-12 rounded-full border-green-500/20 text-green-500 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all"
                            onClick={(e) => handleApprove(job.id, e)}
                          >
                            <Check className="w-6 h-6" />
                          </Button>
                        </>
                      )}
                      
                      {isApproved && (
                         <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 border border-green-500/50">
                           <Check className="w-6 h-6" />
                         </div>
                      )}

                      {isRejected && (
                         <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center text-red-500 border border-red-500/50">
                           <X className="w-6 h-6" />
                         </div>
                      )}
                    </div>
                  </div>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {expandedJobId === job.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-white/10 bg-white/5"
                      >
                        <div className="p-6 space-y-6">
                          <div>
                            <h4 className="font-semibold text-white mb-2">Job Description</h4>
                            <p className="text-sm text-gray-400 leading-relaxed">{job.description}</p>
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-white mb-3">Requirements Analysis</h4>
                            <div className="grid grid-cols-1 gap-3">
                              {job.requirements.map((req, idx) => (
                                <div key={idx} className="flex items-center gap-3 text-sm bg-black/20 p-3 rounded border border-white/5">
                                  {req.met ? (
                                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                                  ) : (
                                    <AlertCircle className="w-5 h-5 text-yellow-500 shrink-0" />
                                  )}
                                  <span className={req.met ? "text-white" : "text-gray-400"}>{req.text}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Submit Button - Fixed Bottom */}
      <AnimatePresence>
        {allReviewed && !isSubmitting && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none"
          >
            <div className="pointer-events-auto">
              <Button 
                size="lg" 
                onClick={handleSubmit}
                className="bg-purple-600 hover:bg-purple-700 text-white px-12 py-6 text-lg font-bold rounded-full shadow-2xl shadow-purple-500/20 transform hover:scale-105 transition-all"
              >
                Submit Criteria
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject Comment Dialog */}
      <Dialog open={!!rejectingJobId} onOpenChange={(open) => !open && setRejectingJobId(null)}>
        <DialogContent className="bg-[#111] border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Why is this not a fit?</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <Textarea 
              placeholder="E.g., Seniority too high, tech stack irrelevant, location..."
              value={rejectionComment}
              onChange={(e) => setRejectionComment(e.target.value.slice(0, 140))}
              className="bg-black/50 border-white/10 min-h-[100px]"
            />
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Maximum 140 characters</span>
                <span className={rejectionComment.length >= 140 ? "text-red-500" : ""}>
                    {rejectionComment.length}/140
                </span>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setRejectingJobId(null)}>Cancel</Button>
              <Button onClick={confirmReject} disabled={!rejectionComment.trim()}>Submit Feedback</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
