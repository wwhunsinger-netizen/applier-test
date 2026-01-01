import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Linkedin, Check, Lightbulb, RotateCw, CheckCircle2, Sparkles, MessageSquare, X, ArrowLeft, ArrowRight, Upload, Trash2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Document, Page, pdfjs } from 'react-pdf';
import { toast } from "sonner";
import noCoverLetterImg from "@assets/No_cover_letter_1766359371139.png";
import { useUser } from "@/lib/userContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchClient, updateClient, fetchClientDocuments, fetchApplications } from "@/lib/api";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString();

type DocType = "resume" | "cover-letter" | "linkedin";

const DOC_CONFIG = {
  resume: { 
    color: "red", 
    label: "Resume", 
    bg: "bg-red-500", 
    text: "text-red-500", 
    border: "border-red-500",
    placeholder: "e.g. Can you emphasize my leadership experience more? Also fix the typo in the first paragraph..."
  },
  "cover-letter": { 
    color: "purple", 
    label: "Cover Letter", 
    bg: "bg-purple-500", 
    text: "text-purple-500", 
    border: "border-purple-500",
    placeholder: "e.g. Can you adjust the opening paragraph to mention my passion for fintech? Make the closing stronger..."
  },
  linkedin: { 
    color: "blue", 
    label: "LinkedIn Profile", 
    bg: "bg-blue-500", 
    text: "text-blue-500", 
    border: "border-blue-500",
    placeholder: "e.g. Can you make the headline more catchy? Add more keywords to the skills section for SEO..."
  },
};

const PDFViewer = ({ url, scale = 0.65 }: { url: string, scale?: number }) => {
  const [numPages, setNumPages] = useState<number>(0);
  
  return (
    <Document 
      file={url} 
      className="flex flex-col gap-8 items-center"
      loading={<div className="text-gray-500 animate-pulse">Loading PDF...</div>}
      error={<div className="text-red-500">Failed to load PDF. Please try again.</div>}
      onLoadSuccess={({ numPages }) => setNumPages(numPages)}
    >
      {Array.from(new Array(numPages || 2), (_, index) => (
        <Page 
          key={`page_${index + 1}`}
          pageNumber={index + 1} 
          scale={scale} 
          renderTextLayer={false} 
          renderAnnotationLayer={false} 
          className="shadow-xl" 
          width={816} 
        />
      ))}
    </Document>
  );
};

export default function ClientDocumentsPage() {
  const { currentUser } = useUser();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<DocType>("resume");
  const [isFlipped, setIsFlipped] = useState(false);
  
  // Check if this is a real Supabase UUID vs mock ID
  const isRealClientId = Boolean(currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id));
  
  // Fetch client data from API to get current approval status
  const { data: clientData } = useQuery({
    queryKey: ['client', currentUser.id],
    queryFn: () => fetchClient(currentUser.id),
    enabled: isRealClientId,
  });
  
  // Mutation to update client onboarding fields
  const updateClientMutation = useMutation({
    mutationFn: (updates: Parameters<typeof updateClient>[1]) => 
      updateClient(currentUser.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', currentUser.id] });
    },
    onError: (error) => {
      console.error('Failed to update client:', error);
      toast.error("Failed to save approval");
    }
  });
  
  // Load uploaded files from the database
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  
  // Fetch client documents from database
  const { data: clientDocuments } = useQuery({
    queryKey: ['client-documents', currentUser.id],
    queryFn: () => fetchClientDocuments(currentUser.id),
    enabled: isRealClientId,
  });
  
  // Fetch applications to determine if client is in active applying phase
  const { data: applications = [] } = useQuery({
    queryKey: ['applications', 'client', currentUser.id],
    queryFn: () => fetchApplications({ client_id: currentUser.id }),
    enabled: isRealClientId,
  });
  
  // If applications exist, show only enhanced versions (skip before/after comparison)
  const hasApplications = applications.length > 0;

  // Sync clientDocuments to uploadedFiles for UI display
  useEffect(() => {
    if (clientDocuments) {
      const files: Record<string, string> = {};
      clientDocuments.forEach(doc => {
        // Store the object path for rendering (files are served from /objects/...)
        files[doc.document_type] = doc.object_path;
      });
      setUploadedFiles(files);
    }
  }, [clientDocuments]);

  const [approvedDocs, setApprovedDocs] = useState<Record<DocType, boolean>>({
    resume: false,
    "cover-letter": false,
    linkedin: false
  });
  
  // Sync approval state from API data when available
  useEffect(() => {
    if (clientData) {
      setApprovedDocs({
        resume: clientData.resume_approved ?? false,
        "cover-letter": clientData.cover_letter_approved ?? false,
        linkedin: false, // No linkedin approval field in API yet
      });
    } else if (!isRealClientId) {
      // Fallback to localStorage for mock users
      try {
        const saved = localStorage.getItem(`client_approvals_${currentUser.id}`);
        if (saved) {
          setApprovedDocs(JSON.parse(saved));
        }
      } catch {
        // Ignore errors
      }
    }
  }, [clientData, isRealClientId, currentUser.id]);
  const [activeVersion, setActiveVersion] = useState("A");
  
  // Document feedback from database (text + revision status per doc type)
  const [documentFeedback, setDocumentFeedback] = useState<Record<DocType, { text: string; status: "requested" | "completed" | null }>>({
    resume: { text: "", status: null },
    "cover-letter": { text: "", status: null },
    linkedin: { text: "", status: null }
  });
  
  // Sync feedback from database when clientData loads
  useEffect(() => {
    if (clientData?.document_feedback) {
      setDocumentFeedback(clientData.document_feedback);
    }
  }, [clientData]);
  
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"intro" | "float" | "distort" | "explode" | "reveal" | "settle">("intro");
  const [showLargeReview, setShowLargeReview] = useState(false);
  const [unlockedDocs, setUnlockedDocs] = useState<Record<DocType, boolean>>(() => {
    // Persist unlocked state so animation only shows once
    try {
      const saved = localStorage.getItem(`client_unlocked_${currentUser.id}`);
      return saved ? JSON.parse(saved) : {
        resume: false,
        "cover-letter": false,
        linkedin: false
      };
    } catch {
      return {
        resume: false,
        "cover-letter": false,
        linkedin: false
      };
    }
  });
  
  // New State for Revision Request
  const [isRequestingRevisions, setIsRequestingRevisions] = useState(false);
  const [revisionRequestText, setRevisionRequestText] = useState("");

  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Dev State for PDF Uploads
  // Now linked to the uploadedFiles from localStorage
  const [beforePdfUrl, setBeforePdfUrl] = useState<string | null>(null);
  const [afterPdfUrl, setAfterPdfUrl] = useState<string | null>(null);

  // Sync loaded files to PDF viewer states
  useEffect(() => {
    if (activeTab === "resume") {
      setBeforePdfUrl(uploadedFiles['resume_original'] || null);
      setAfterPdfUrl(uploadedFiles['resume_improved'] || null);
    } else if (activeTab === "cover-letter") {
      setBeforePdfUrl(uploadedFiles['cover_letter_original'] || null);
      setAfterPdfUrl(uploadedFiles['cover_letter_A'] || null);
    } else if (activeTab === "linkedin") {
      setBeforePdfUrl(uploadedFiles['linkedin_original'] || null);
      setAfterPdfUrl(uploadedFiles['linkedin_A'] || null);
    }
  }, [uploadedFiles, activeTab]);

  const config = DOC_CONFIG[activeTab];
  const isApproved = approvedDocs[activeTab];
  
  // Check if improved document exists for current tab
  const hasImprovedDocument = activeTab === 'resume' 
    ? !!uploadedFiles['resume_improved']
    : activeTab === 'cover-letter'
    ? !!uploadedFiles['cover_letter_A']
    : !!uploadedFiles['linkedin_A'];

  const handleStartRevisionRequest = () => {
    setIsRequestingRevisions(true);
  };

  const handleCancelRevisionRequest = () => {
    setIsRequestingRevisions(false);
    setRevisionRequestText("");
  };

  const handleSubmitRevisions = () => {
    if (!revisionRequestText.trim()) {
      toast.error("No feedback provided", {
        description: "Please describe what changes you'd like to see."
      });
      return;
    }
    
    // Update local state
    const updatedFeedback = {
      ...documentFeedback,
      [activeTab]: { text: revisionRequestText, status: "requested" as const }
    };
    setDocumentFeedback(updatedFeedback);
    setIsRequestingRevisions(false);
    setRevisionRequestText("");
    
    // Save to database
    if (isRealClientId) {
      updateClientMutation.mutate({ document_feedback: updatedFeedback });
    }
    
    toast.success("Revisions Requested", {
      description: "Your team has been notified and will update your documents."
    });
  };

  const handleImprove = () => {
    // For non-resume tabs, skip the long animation
    // Only proceed if we have an improved version uploaded
    const fileKey = activeTab === 'resume' ? 'resume_improved' : 
                    activeTab === 'cover-letter' ? 'cover_letter_A' : // Defaulting to A for now
                    'linkedin_A'; // Defaulting to A for now
                    
    // Note: The logic below is a bit simplified for the demo. 
    // In a real app we'd check specific versions. 
    // For this prototype, if ANY improved resume exists, we treat it as valid.
    const hasImproved = uploadedFiles['resume_improved'] || uploadedFiles['cover_letter_A'] || uploadedFiles['linkedin_A'];
    
    if (activeTab === "resume" && !uploadedFiles['resume_improved']) {
      toast.error("No improved resume available yet.");
      return;
    }

    if (activeTab !== "resume") {
      setIsFlipped(true);
      setShowLargeReview(true);
      setIsRevealing(false);
      setRevealPhase("intro");
      return;
    }

    setIsRevealing(true);
    setRevealPhase("intro");
    
    // Clear any existing timeouts just in case
    animationTimeouts.current.forEach(clearTimeout);
    animationTimeouts.current = [];
    
    // Animation Sequence
    const t1 = setTimeout(() => setRevealPhase("float"), 2000);   // Text moves up, doc floats
    const t2 = setTimeout(() => setRevealPhase("distort"), 4000); // Doc stretches
    const t3 = setTimeout(() => setRevealPhase("explode"), 6500); // New Phase: Explosion/Flash
    
    // Smooth transition to reveal
    const t4 = setTimeout(() => {
      // Direct jump to end state logic
      setIsFlipped(true); 
      setShowLargeReview(true);
      
      // Close animation overlay
      setIsRevealing(false);
    }, 8000); // Increased total time slightly to accommodate explode
    
    // Store timeouts to clear later
    animationTimeouts.current.push(t1, t2, t3, t4);
  };

  const handleSkipAnimation = () => {
    // Clear all pending animation timeouts
    animationTimeouts.current.forEach(clearTimeout);
    animationTimeouts.current = [];

    // Immediate state set
    setIsFlipped(true);
    // Don't unlock yet, let them unlock via the large review modal like normal flow
    // But wait, if we skip, we usually want to jump straight to the review.
    // The large review modal "Review" button sets unlockedDocs to true.
    // So we just show the large review.
    setShowLargeReview(true);
    
    // Clear animation state
    setIsRevealing(false);
    setRevealPhase("intro"); 
  };

  const handleReviewClick = () => {
    setShowLargeReview(false);
    // Mark as unlocked ONLY when they close the review modal
    const newUnlockedDocs = { ...unlockedDocs, [activeTab]: true };
    setUnlockedDocs(newUnlockedDocs);
    // Persist to localStorage so animation only shows once
    try {
      localStorage.setItem(`client_unlocked_${currentUser.id}`, JSON.stringify(newUnlockedDocs));
    } catch (e) {
      console.error("Failed to save unlocked state", e);
    }
  };

  const handleApprove = () => {
    setApprovedDocs(prev => ({ ...prev, [activeTab]: true }));
    
    // Clear feedback and mark as approved
    const updatedFeedback = {
      ...documentFeedback,
      [activeTab]: { text: '', status: 'completed' as const }
    };
    setDocumentFeedback(updatedFeedback);
    
    // Save approval status to API (for real clients) or localStorage (for mock clients)
    if (isRealClientId) {
      // Map document type to API field
      if (activeTab === "resume") {
        updateClientMutation.mutate({ resume_approved: true, document_feedback: updatedFeedback });
      } else if (activeTab === "cover-letter") {
        updateClientMutation.mutate({ cover_letter_approved: true, document_feedback: updatedFeedback });
      }
      toast.success(`${DOC_CONFIG[activeTab].label} approved!`);
    } else {
      // Fallback to localStorage for mock users
      try {
        const existingApprovalsStr = localStorage.getItem(`client_approvals_${currentUser.id}`);
        const existingApprovals = existingApprovalsStr ? JSON.parse(existingApprovalsStr) : {};
        const newApprovals = { ...existingApprovals, [activeTab]: true };
        localStorage.setItem(`client_approvals_${currentUser.id}`, JSON.stringify(newApprovals));
      } catch (e) {
        console.error("Failed to save approval status", e);
      }
    }
  };

  // Render original document - shows PDF if available, otherwise "Coming Soon"
  const OLD_RESUME_CONTENT = (
    <div className="w-full min-h-full flex flex-col items-center gap-8 pb-20 origin-top">
      {beforePdfUrl ? (
         <PDFViewer url={beforePdfUrl} scale={0.65} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] w-full text-gray-400">
          <Clock className="w-16 h-16 mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2 text-gray-800">Documents Coming Soon</h2>
          <p className="text-center max-w-md text-gray-500">
            Your original {config.label.toLowerCase()} will appear here once uploaded by your team.
          </p>
        </div>
      )}
    </div>
  );

// ... existing code ...

  // Render the improved document content - shows PDF if available, otherwise "Coming Soon"
  const renderImprovedDocument = () => (
    <div className="w-full min-h-full flex flex-col items-center gap-8 pb-20 origin-top">
      {afterPdfUrl ? (
        <PDFViewer url={afterPdfUrl} scale={0.65} />
      ) : (
        <div className="flex flex-col items-center justify-center h-full min-h-[600px] w-full text-gray-400">
          <Clock className="w-16 h-16 mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2 text-white">Coming Soon</h2>
          <p className="text-center max-w-md text-gray-400">
            Your improved {config.label.toLowerCase()} is being prepared by your team.
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6 h-[calc(100vh-6rem)] flex flex-col relative overflow-hidden">
      {/* Evolution Animation Overlay */}
      <AnimatePresence>
        {isRevealing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md"
          >
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
              
              {/* Skip Animation Button */}
              <div className="absolute top-8 right-8 z-[60]">
                <Button 
                  variant="outline" 
                  className="text-white border-white/20 hover:bg-white/10"
                  onClick={handleSkipAnimation}
                >
                  Skip Animation
                </Button>
              </div>

              {/* Phase 1: Intro Text - "What? Your {label} is evolving!" */}
              <AnimatePresence>
                {["intro", "float", "distort"].includes(revealPhase) && (
                  <motion.h2
                    className={cn("text-4xl md:text-6xl font-bold text-white tracking-widest uppercase z-20 absolute", config.text)}
                    initial={{ y: 0, scale: 0.8, opacity: 0 }}
                    animate={
                      revealPhase === "intro" ? { y: 0, scale: 1, opacity: 1 } :
                      { y: -300, scale: 0.8, opacity: 0.8 }
                    }
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                  >
                    What? Your {config.label} is evolving!
                  </motion.h2>
                )}
              </AnimatePresence>

              {/* Document Evolution */}
              <AnimatePresence>
                {["float", "distort", "explode"].includes(revealPhase) && (
                  <motion.div
                    className="w-[300px] h-[400px] bg-white rounded shadow-2xl z-10 relative flex items-center justify-center"
                    initial={{ y: 500, scale: 0.5, filter: "brightness(1)", opacity: 0 }}
                    animate={
                      revealPhase === "float" ? { y: 0, scale: 1.1, filter: "brightness(1.5)", opacity: 1 } :
                      revealPhase === "distort" ? { 
                        y: 0,
                        scaleY: [1, 1.5, 0.5, 1.2, 0.8, 1.5], 
                        scaleX: [1, 0.6, 1.4, 0.8, 1.2, 0.6],
                        rotate: [0, 5, -5, 10, -10, 0],
                        filter: ["brightness(2) hue-rotate(0deg)", "brightness(4) hue-rotate(90deg)"],
                        opacity: 1
                      } : 
                      revealPhase === "explode" ? {
                        y: 0,
                        scale: [1.5, 0, 10], // Implode then Explode
                        opacity: [1, 0.5, 0],
                        filter: "brightness(10)"
                      } : {}
                    }
                    transition={
                      revealPhase === "float" ? { duration: 2, ease: "easeInOut" } :
                      revealPhase === "distort" ? { duration: 3, ease: "linear", repeat: Infinity } :
                      revealPhase === "explode" ? { duration: 1.5, ease: "circIn" } :
                      { duration: 0.5 }
                    }
                  >
                    {/* Content Placeholder - Different for Old vs New */}
                    {false ? (
                      <div className="space-y-4 w-3/4 opacity-90 scale-95 origin-top pt-4">
                         <h3 className={cn("text-xl font-bold text-center mb-6", config.text)}>New {config.label}</h3>
                         
                         {/* Header Section */}
                         <div className="flex flex-col items-center space-y-2 mb-6">
                           <div className="h-6 bg-gray-800 rounded w-2/3" />
                           <div className="h-3 bg-gray-300 rounded w-1/2" />
                         </div>

                         {/* Experience Blocks */}
                         <div className="space-y-6">
                           <div className="space-y-2">
                             <div className="flex justify-between">
                               <div className="h-4 bg-gray-700 rounded w-1/3" />
                               <div className="h-4 bg-gray-300 rounded w-1/4" />
                             </div>
                             <div className="h-3 bg-gray-200 rounded w-full" />
                             <div className="h-3 bg-gray-200 rounded w-full" />
                             <div className="h-3 bg-gray-200 rounded w-5/6" />
                           </div>

                           <div className="space-y-2">
                             <div className="flex justify-between">
                               <div className="h-4 bg-gray-700 rounded w-1/3" />
                               <div className="h-4 bg-gray-300 rounded w-1/4" />
                             </div>
                             <div className="h-3 bg-gray-200 rounded w-full" />
                             <div className="h-3 bg-gray-200 rounded w-4/5" />
                           </div>

                           <div className="space-y-2">
                             <div className="h-4 bg-gray-700 rounded w-1/4 mb-2" />
                             <div className="h-3 bg-gray-200 rounded w-full" />
                             <div className="h-3 bg-gray-200 rounded w-full" />
                           </div>
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-4 w-3/4 opacity-40 blur-[1px]">
                         <h3 className="text-xl font-bold text-center mb-4 text-gray-500">Old {config.label}</h3>
                        <div className="h-4 bg-gray-300 rounded w-1/2 mx-auto" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                        <div className="h-2 bg-gray-200 rounded w-full mt-4" />
                      </div>
                    )}

                    {/* Glowing Aura */}
                    <motion.div 
                      className={cn("absolute inset-0 rounded blur-xl opacity-50", config.bg)}
                      animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.2, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Phase 3: Explosion - Celebrate the New Doc */}
              {revealPhase === "explode" && (
                 <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
                    {/* Flash */}
                    <motion.div 
                        className="absolute inset-0 bg-white"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ duration: 0.5, delay: 1 }}
                    />
                    
                    {/* Particles */}
                    {[...Array(50)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={cn("absolute rounded-full w-2 h-2", i % 2 === 0 ? config.bg : "bg-white")}
                        initial={{ 
                            x: 0,
                            y: 0,
                            scale: 0
                        }}
                        animate={{ 
                          x: (Math.random() - 0.5) * 2000, 
                          y: (Math.random() - 0.5) * 2000,
                          opacity: [1, 0],
                          scale: [1, 0],
                        }}
                        transition={{ duration: 1, ease: "easeOut", delay: 1 }}
                      />
                    ))}
                 </div>
              )}


            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large Review Mode (Post-Evolution) - Merged into animation flow */}
      <AnimatePresence>
        {showLargeReview && (
          <motion.div 
            initial={{ opacity: 1 }} // Start visible to avoid flicker
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[40] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl p-8"
          >
             <motion.div
               initial={{ opacity: 1 }} // No animation needed as it matches reveal phase
               animate={{ opacity: 1 }}
               className="mb-6 flex flex-col items-center relative w-full max-w-4xl pt-4" // Added padding to match reveal positioning
             >
                <h2 className="text-4xl font-bold flex items-center gap-2 mb-4 drop-shadow-lg text-white font-sans tracking-wide uppercase">
                  It's a new {config.label}!
                </h2>
                
                <Button 
                   variant="secondary" 
                   size="icon" 
                   className="absolute -right-12 top-0 rounded-full w-10 h-10 bg-white/10 hover:bg-white/20 text-white border border-white/20" 
                   onClick={handleReviewClick}
                >
                   <X className="w-5 h-5" />
                </Button>
             </motion.div>

             <motion.div 
               initial={{ scale: 1, opacity: 1 }} // Match the end state of reveal
               animate={{ scale: 1, opacity: 1 }}
               className="relative w-full max-w-[800px] h-[70vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
             >
                <div className="flex-1 overflow-y-auto">
                    {/* Simplified Content Preview */}
                    <div className={cn("mx-auto space-y-8", activeTab === "resume" ? "w-full" : "max-w-2xl blur-[0.5px]")}>
                       <div className="py-8 transform scale-90 origin-top flex justify-center w-full">
                         {renderImprovedDocument()}
                       </div>
                    </div>
                </div>
                
                {/* Fixed Review Button at the bottom of the modal content */}
                <div className="p-6 border-t bg-gray-50 flex justify-center">
                   <Button 
                     size="lg" 
                     className={cn("h-12 px-8 text-lg font-bold shadow-lg hover:scale-105 transition-transform", config.bg, "text-white")}
                     onClick={handleReviewClick}
                   >
                     Review {config.label}
                   </Button>
                </div>
             </motion.div>
             
             {/* Removing the floating bottom button since we moved it inside */}
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <div className="flex justify-between items-start">
           <div>
             <h1 className="text-3xl font-bold tracking-tight text-white">Document Review</h1>
             <p className="text-muted-foreground mt-1">Approve your tailored application materials.</p>
           </div>
           
        </div>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as DocType)} className="flex-1 flex flex-col">
          <TabsList className="bg-white/5 border border-white/10 p-1 w-fit mb-4">
            {(Object.keys(DOC_CONFIG) as DocType[]).map(tabKey => (
              <TabsTrigger 
                key={tabKey} 
                value={tabKey}
                className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2 capitalize"
              >
                {DOC_CONFIG[tabKey].label}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 relative perspective-1000">
             <div className="flex gap-6 h-full">
               {/* Document Viewer Area */}
               <div className="flex-1 relative h-full min-h-0">
                  <AnimatePresence mode="wait">
                    {/* When applications exist, always show enhanced version directly */}
                    {hasApplications ? (
                      <motion.div 
                        key="enhanced-only"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={cn("absolute inset-0 bg-[#111] text-white shadow-2xl rounded-lg overflow-hidden flex flex-col")}
                      >
                         <div className="bg-[#111] border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                           <div className="flex items-center gap-4">
                             <div className={cn("text-white px-4 py-1 rounded font-bold uppercase tracking-wider text-sm flex items-center gap-2", config.bg)}>
                               <Sparkles className="w-4 h-4" />
                               Your {config.label}
                             </div>
                           </div>
                           <div className="flex items-center gap-2">
                              {isApproved && <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>}
                           </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-8 bg-[#111] relative scroll-smooth">
                           {renderImprovedDocument()}
                         </div>
                      </motion.div>
                    ) : !isFlipped ? (
                      <motion.div 
                        key="old-doc"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-white text-black p-12 shadow-xl rounded-lg overflow-y-auto"
                      >
                         {/* Header for Old Resume when unlocked */}
                         {unlockedDocs[activeTab] && (
                           <div className="absolute top-0 left-0 right-0 bg-gray-100 border-b border-gray-200 p-4 flex justify-between items-center z-10">
                              <div className="flex items-center gap-4">
                                <div className="bg-gray-500 text-white px-4 py-1 rounded font-bold uppercase tracking-wider text-sm flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  Original Version
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-600 hover:text-gray-900 hover:bg-gray-200 gap-2"
                                onClick={() => setIsFlipped(true)}
                              >
                                View New Version <ArrowRight className="w-4 h-4" />
                              </Button>
                           </div>
                         )}
                         
                         <div className={cn(unlockedDocs[activeTab] ? "mt-16" : "")}>
                           {/* Show "Awaiting Documents" when no original document uploaded */}
                           {!beforePdfUrl ? (
                              <div className="flex flex-col items-center justify-center h-full min-h-[600px] w-full text-gray-400">
                                <Clock className="w-16 h-16 mb-4 opacity-50" />
                                <h2 className="text-2xl font-bold mb-2">Documents Coming Soon</h2>
                                <p className="text-center max-w-md">
                                  Your {config.label.toLowerCase()} is being prepared by your team. 
                                  You'll be notified when it's ready for review.
                                </p>
                              </div>
                           ) : (
                             /* Show actual PDF when document exists */
                             <div className="w-full min-h-full flex flex-col items-center gap-8 pb-20">
                               <PDFViewer url={beforePdfUrl} scale={0.65} />
                             </div>
                           )}
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="new-doc"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={cn("absolute inset-0 bg-[#111] text-white shadow-2xl rounded-lg overflow-hidden flex flex-col")}
                      >
                         <div className="bg-[#111] border-b border-white/10 p-4 flex justify-between items-center shrink-0">
                           <div className="flex items-center gap-4">
                             <div className={cn("text-white px-4 py-1 rounded font-bold uppercase tracking-wider text-sm flex items-center gap-2", config.bg)}>
                               <Sparkles className="w-4 h-4" />
                               Improved {config.label}
                             </div>
                             {activeTab !== 'cover-letter' && (
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 className="text-gray-400 hover:text-white hover:bg-white/10 gap-2"
                                 onClick={() => setIsFlipped(false)}
                               >
                                 <ArrowLeft className="w-4 h-4" />
                                 Go Back
                               </Button>
                             )}
                           </div>
                           <div className="flex items-center gap-2">
                              {isApproved && <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>}
                              {documentFeedback[activeTab]?.status === 'requested' && <Badge className="bg-yellow-500 gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Revisions Requested</Badge>}
                           </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-8 bg-[#111] relative scroll-smooth">
                           {renderImprovedDocument()}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Sidebar Actions */}
               <div className="w-80 flex flex-col gap-4 h-full min-h-0 relative">
                 <Card className="bg-[#111] border-white/10 flex-1 h-full relative overflow-hidden">
                   <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-6">
                      {/* Simplified sidebar when applications exist */}
                      {hasApplications ? (
                        <>
                          <div className="p-4 bg-green-500/10 rounded-full text-green-500 mb-2">
                            <CheckCircle2 className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Active Documents</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              These are the documents being used for your job applications.
                            </p>
                          </div>
                        </>
                      ) : !isFlipped ? (
                        !hasImprovedDocument ? (
                          // Coming Soon state when no improved document uploaded
                          <>
                            <div className="p-4 rounded-full mb-2 bg-white/5 text-gray-500">
                              <Clock className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-400">Coming Soon</h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                Your {config.label.toLowerCase()} is being prepared by your team.
                              </p>
                            </div>
                            <Button size="lg" disabled className="w-full font-bold text-lg h-12 bg-white/5 text-gray-500 cursor-not-allowed">
                              Not Yet Available
                            </Button>
                          </>
                        ) : (
                          <>
                            <div className={cn("p-4 rounded-full mb-2 animate-pulse bg-white/10", config.text)}>
                              <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">
                                {unlockedDocs[activeTab] ? `This is your old ${config.label.toLowerCase()}` : `Your New ${config.label} Is Ready`}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                {activeTab === 'resume' ? "We've crafted a high-impact resume optimized for ATS." : 
                                 activeTab === 'cover-letter' ? "Three versions tailored for different role types." : 
                                 "An optimized LinkedIn profile to attract recruiters."}
                              </p>
                            </div>
                            <Button size="lg" className={cn("w-full font-bold text-lg h-12 shadow-lg hover:scale-105 transition-transform", config.bg, "text-white")} onClick={unlockedDocs[activeTab] ? () => setIsFlipped(true) : handleImprove}>
                              {unlockedDocs[activeTab] ? "View Improved Version" : "✨ Show Me"}
                            </Button>
                          </>
                        )
                      ) : (
                        documentFeedback[activeTab]?.status === 'requested' ? (
                          <>
                             <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
                               <RotateCw className="w-8 h-8 animate-spin" />
                             </div>
                             <div>
                               <h3 className="text-xl font-bold text-white">Revisions Requested</h3>
                               <p className="text-sm text-muted-foreground mt-2">
                                 We are working on your updates.
                                 You'll be notified when the new version is ready.
                               </p>
                             </div>
                             {documentFeedback[activeTab]?.text && (
                               <div className="w-full bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-left mt-4 opacity-70">
                                 <p className="text-xs font-bold text-yellow-500 mb-1">Your Feedback:</p>
                                 <p className="text-xs text-yellow-200/80">{documentFeedback[activeTab].text}</p>
                               </div>
                             )}
                             <Button variant="outline" className="w-full mt-4 border-white/10 opacity-50 cursor-not-allowed">
                               Awaiting Updates
                             </Button>
                          </>
                        ) : (
                          !isApproved ? (
                            <>
                               <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
                                 <Lightbulb className="w-8 h-8" />
                               </div>
                               <div>
                                 <h3 className="text-xl font-bold text-white">Review & Approve</h3>
                                 <p className="text-sm text-muted-foreground mt-2">Request revisions or approve this version.</p>
                               </div>

                               <div className="w-full space-y-3 pt-4">
                                 <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-bold h-12" onClick={handleApprove}>
                                   <Check className="w-5 h-5 mr-2" /> Approve This Version
                                 </Button>
                                 <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={handleStartRevisionRequest}>
                                   Request Revisions
                                 </Button>
                               </div>
                            </>
                          ) : (
                            <>
                               <div className="p-4 bg-green-500/10 rounded-full text-green-500 mb-2">
                                 <CheckCircle2 className="w-8 h-8" />
                               </div>
                               <div>
                                 <h3 className="text-xl font-bold text-white">Approved!</h3>
                               </div>
                            </>
                          )
                        )
                      )}
                      
                      {/* Revision Request Text Area Mode */}
                      {isRequestingRevisions && !isApproved && documentFeedback[activeTab]?.status !== 'requested' && (
                        <div className="absolute inset-0 z-20 bg-[#111] p-6 flex flex-col animate-in fade-in duration-200">
                          <div className="mb-4">
                            <h3 className="text-xl font-bold text-white mb-1">Request Revisions</h3>
                            <p className="text-sm text-gray-400">Describe what changes you'd like to see.</p>
                          </div>
                          
                          <Textarea 
                            className="flex-1 bg-white/5 border-white/10 text-white resize-none mb-4 focus-visible:ring-offset-0 placeholder:text-gray-600"
                            placeholder={config.placeholder}
                            value={revisionRequestText}
                            onChange={(e) => setRevisionRequestText(e.target.value)}
                            autoFocus
                          />
                          
                          <div className="space-y-3">
                             <Button size="lg" className="w-full bg-blue-600 hover:bg-blue-700 font-bold h-12" onClick={handleSubmitRevisions}>
                               Submit Revisions
                             </Button>
                             <Button variant="ghost" className="w-full text-gray-400 hover:text-white" onClick={handleCancelRevisionRequest}>
                               Cancel
                             </Button>
                          </div>
                        </div>
                      )}
                   </CardContent>
                 </Card>
               </div>
             </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}