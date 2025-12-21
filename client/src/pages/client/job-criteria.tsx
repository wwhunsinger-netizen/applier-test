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

  return (
    <div className="space-y-8 pb-20 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Confirm Job Criteria</h1>
        <p className="text-muted-foreground mt-1">Review sample jobs to help us calibrate your search.</p>
      </div>

      <div className="space-y-4">
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
                  <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                    <div className="bg-red-500/10 backdrop-blur-sm border border-red-500/50 text-red-500 px-6 py-2 rounded-full font-bold text-lg transform -rotate-2 shadow-xl">
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
      </div>

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
              onChange={(e) => setRejectionComment(e.target.value)}
              className="bg-black/50 border-white/10 min-h-[100px]"
            />
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
