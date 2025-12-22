import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Linkedin, Check, Lightbulb, RotateCw, CheckCircle2, Sparkles, MessageSquare, X, ArrowLeft, ArrowRight, Upload, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Document, Page, pdfjs } from 'react-pdf';
import { toast } from "sonner";
import noCoverLetterImg from "@assets/No_cover_letter_1766359371139.png";

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

export default function ClientDocumentsPage() {
  const [activeTab, setActiveTab] = useState<DocType>("resume");
  const [isFlipped, setIsFlipped] = useState(false);
  const [approvedDocs, setApprovedDocs] = useState<Record<DocType, boolean>>({
    resume: false,
    "cover-letter": false,
    linkedin: false
  });
  const [activeVersion, setActiveVersion] = useState("A");
  const [comments, setComments] = useState<{id: number, text: string, top: string}[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"intro" | "float" | "distort" | "explode" | "reveal" | "settle">("intro");
  const [showLargeReview, setShowLargeReview] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState<"idle" | "requested">("idle");
  const [activeCommentDraft, setActiveCommentDraft] = useState<{top: string, text: string} | null>(null);
  const [unlockedDocs, setUnlockedDocs] = useState<Record<DocType, boolean>>({
    resume: false,
    "cover-letter": false,
    linkedin: false
  });
  
  // New State for Revision Request
  const [isRequestingRevisions, setIsRequestingRevisions] = useState(false);
  const [revisionRequestText, setRevisionRequestText] = useState("");

  const animationTimeouts = useRef<NodeJS.Timeout[]>([]);

  // Dev State for PDF Uploads
  const [beforePdfUrl, setBeforePdfUrl] = useState<string | null>(() => localStorage.getItem("beforePdfUrl"));
  const [afterPdfUrl, setAfterPdfUrl] = useState<string | null>(() => localStorage.getItem("afterPdfUrl"));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        if (type === 'before') {
          setBeforePdfUrl(result);
          try {
            localStorage.setItem("beforePdfUrl", result);
          } catch (e) {
            console.error("Storage quota exceeded", e);
            toast.error("File too large to save for next visit, but loaded for this session.");
          }
        } else {
          setAfterPdfUrl(result);
          try {
            localStorage.setItem("afterPdfUrl", result);
          } catch (e) {
            console.error("Storage quota exceeded", e);
            toast.error("File too large to save for next visit, but loaded for this session.");
          }
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset states when changing tabs, but check if already unlocked
  useEffect(() => {
    // Always reset revision request state when changing tabs
    setIsRequestingRevisions(false);
    setRevisionRequestText("");

    if (unlockedDocs[activeTab]) {
      setIsFlipped(true);
      setShowLargeReview(false);
      setIsRevealing(false);
    } else {
      setIsFlipped(false);
      setShowLargeReview(false);
      setIsRevealing(false);
      setRevealPhase("intro");
    }
  }, [activeTab, unlockedDocs]);

  const config = DOC_CONFIG[activeTab];
  const isApproved = approvedDocs[activeTab];

  // Mock highlight logic
  const handleTextClick = (e: React.MouseEvent, top: string) => {
    if (!isFlipped || isApproved || revisionStatus === 'requested' || isRequestingRevisions) return;
    
    // If we're already editing this one, don't do anything
    if (activeCommentDraft?.top === top) return;

    setActiveCommentDraft({ top, text: "" });
  };

  const handleSaveComment = () => {
    if (activeCommentDraft && activeCommentDraft.text.trim()) {
      setComments([...comments, { 
        id: Date.now(), 
        text: activeCommentDraft.text, 
        top: activeCommentDraft.top 
      }]);
      setActiveCommentDraft(null);
    }
  };

  const handleCancelComment = () => {
    setActiveCommentDraft(null);
  };
  
  const handleStartRevisionRequest = () => {
    setIsRequestingRevisions(true);
  };

  const handleCancelRevisionRequest = () => {
    setIsRequestingRevisions(false);
    setRevisionRequestText("");
  };

  const handleSubmitRevisions = () => {
    if (!revisionRequestText.trim() && comments.length === 0) {
      toast.error("No feedback provided", {
        description: "Please describe what changes you'd like to see."
      });
      return;
    }
    
    setRevisionStatus('requested');
    setIsRequestingRevisions(false);
    
    // Add the general feedback as a "comment" if provided
    if (revisionRequestText.trim()) {
      setComments(prev => [...prev, {
        id: Date.now(),
        top: "0%", // General comment
        text: revisionRequestText
      }]);
    }
    
    toast.success("Revisions Requested", {
      description: "Wilson has been notified and will update your documents."
    });
  };

  const handleImprove = () => {
    // For non-resume tabs, skip the long animation
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
    setUnlockedDocs(prev => ({ ...prev, [activeTab]: true }));
  };

  const handleApprove = () => {
    setApprovedDocs(prev => ({ ...prev, [activeTab]: true }));
    setComments([]); 
  };

  const handleRequestRevisions = () => {
    if (confirm("Request revisions based on your comments?")) {
      setRevisionStatus("requested");
    }
  };

  const handleReset = () => {
    if (confirm("Reset all uploaded PDFs and comments? This will clear the demo state.")) {
      localStorage.removeItem("beforePdfUrl");
      localStorage.removeItem("afterPdfUrl");
      setBeforePdfUrl(null);
      setAfterPdfUrl(null);
      setComments([]);
      setUnlockedDocs({ resume: false, "cover-letter": false, linkedin: false });
      setApprovedDocs({ resume: false, "cover-letter": false, linkedin: false });
      setIsFlipped(false);
      setShowLargeReview(false);
      setRevisionStatus("idle");
      toast.success("Demo state reset successfully");
    }
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

  // Reconstruct OLD_RESUME_CONTENT with HTML and Red Pen Markups
  const OLD_RESUME_CONTENT = (
    <div className="w-full min-h-full flex flex-col items-center gap-8 pb-20 origin-top" style={{ transform: !beforePdfUrl ? "scale(0.65)" : "none" }}>
      {beforePdfUrl ? (
         <PDFViewer url={beforePdfUrl} scale={0.65} />
      ) : (
      <div className="w-[8.5in] min-h-[11in] bg-white shadow-xl p-[1in] text-sm relative font-serif text-gray-800 shrink-0">
        {/* Red Pen Markups Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-90 mix-blend-multiply">
           {/* Circle around Name */}
           <svg className="absolute top-[0.8in] left-[3.5in] w-[300px] h-[60px]" viewBox="0 0 300 60">
             <path d="M10,30 Q150,-10 290,30 Q150,70 10,30" fill="none" stroke="red" strokeWidth="2" strokeDasharray="400" strokeDashoffset="0" style={{filter: 'url(#rough)'}} />
           </svg>
           
           {/* Cross out email */}
           <svg className="absolute top-[1.4in] left-[1in] w-[200px] h-[20px]" viewBox="0 0 200 20">
             <path d="M0,10 L200,10" fill="none" stroke="red" strokeWidth="2" />
           </svg>
           <div className="absolute top-[1.2in] left-[0.5in] text-red-600 font-handwriting transform -rotate-12 text-lg font-bold">Format?</div>

           {/* Big Question Mark on Experience */}
           <div className="absolute top-[3in] right-[1in] text-red-600 font-handwriting text-4xl font-bold">?</div>
           
           {/* Underline Skills */}
           <svg className="absolute bottom-[2in] left-[1in] w-[400px] h-[20px]" viewBox="0 0 400 20">
             <path d="M0,5 Q200,15 400,5" fill="none" stroke="red" strokeWidth="2" />
           </svg>
           <div className="absolute bottom-[2.2in] left-[0.5in] text-red-600 font-handwriting transform -rotate-6">Expand this!</div>
        </div>

        <div className="text-center mb-6">
          <h2 className="text-xl font-bold uppercase">Dimas Gonzales</h2>
          <p>dimas.o.gonzales@gmail.com | +1 (832) 493-3416 | United States</p>
          <p className="mt-4 text-xs text-gray-600 text-left">
            Senior Data Engineer with deep expertise in banking and insurance sectors. Specializes in building scalable cloud data platforms (AWS, Azure, Snowflake) and automating high-volume ELT pipelines. Proven track record of reducing infrastructure costs, minimizing data latency, and enforcing strict governance standards.
          </p>
        </div>

        <div>
          <h3 className="font-bold border-b border-gray-400 mb-2 uppercase text-xs tracking-wider">Education</h3>
          <div className="flex justify-between font-bold">
            <span>Texas A&M University</span>
            <span>Aug 2012 - May 2017</span>
          </div>
          <p>Bachelor of Science in Computer Engineering</p>
        </div>

        <div>
          <h3 className="font-bold border-b border-gray-400 mb-2 mt-4 uppercase text-xs tracking-wider">Experience</h3>
          
          <div className="mb-4">
            <div className="flex justify-between font-bold">
              <span>GEICO - Senior Software Engineer</span>
              <span>Aug 2024 - present</span>
            </div>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600 text-xs">
              <li>Lead engineer for the Billing data warehouse, designing scalable solutions.</li>
              <li>Architected micro-batching ELT pipelines using dbt, Spark, Airflow.</li>
              <li>Implemented Snowflake zero-copy solution with Apache Iceberg.</li>
            </ul>
          </div>

          <div className="mb-4">
            <div className="flex justify-between font-bold">
              <span>Texas Capital Bank - Data Architect</span>
              <span>Feb 2022 - Aug 2024</span>
            </div>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600 text-xs">
              <li>Led strategic design and modernization of enterprise cloud data platform.</li>
              <li>Established RFC process for data modeling standardization.</li>
            </ul>
          </div>

          <div className="mb-4">
            <div className="flex justify-between font-bold">
              <span>Master Engineer</span>
              <span>Feb 2022 - Aug 2023</span>
            </div>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600 text-xs">
              <li>Tech Lead for 8-person team building cloud data lake.</li>
              <li>Architected Terraform IaC solutions reducing setup time by 40%.</li>
            </ul>
          </div>

           <div className="mb-4">
            <div className="flex justify-between font-bold">
              <span>Tiger Analytics - Senior Data Engineer</span>
              <span>Jul 2021 - Feb 2022</span>
            </div>
            <ul className="list-disc list-inside mt-1 space-y-1 text-gray-600 text-xs">
              <li>Migrated 37 manual batch jobs to automated CI/CD pipelines.</li>
              <li>Optimized data models to enhance warehouse performance.</li>
            </ul>
          </div>
        </div>

        <div>
           <h3 className="font-bold border-b border-gray-400 mb-2 mt-4 uppercase text-xs tracking-wider">Technical Skills</h3>
           <ul className="list-disc list-inside text-xs text-gray-600">
             <li>Cloud & Infrastructure: AWS, Azure, Terraform, Docker</li>
             <li>Modern Data Stack: Snowflake, dbt, SQL, Apache Iceberg</li>
             <li>Big Data: Spark, Python, Kafka</li>
           </ul>
        </div>
      </div>
      )}
    </div>
  );

// ... existing code ...

  // Update the NEW_RESUME_CONTENT structure to look like a PDF viewer
  const renderNewResumeContent = () => (
    <div className="w-full min-h-full flex flex-col items-center gap-8 pb-20 origin-top" style={{ transform: !afterPdfUrl ? "scale(0.65)" : "none" }}>
      
      {/* Active Comment Draft Overlay - Rendered INSIDE scaled container so it moves with it */}
      {activeCommentDraft && (
        <div 
          className="absolute right-[-320px] z-50 w-[300px] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in slide-in-from-right-4 duration-200"
          style={{ 
            top: activeCommentDraft.top,
            transform: !afterPdfUrl ? "scale(1.53)" : "none", // Inverse scale to make it look normal size (1 / 0.65 ≈ 1.53)
            transformOrigin: "top left"
          }}
        >
          <div className="bg-gray-50 px-3 py-2 border-b border-gray-100 flex justify-between items-center">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Feedback</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600" onClick={handleCancelComment}>
              <X className="w-3 h-3" />
            </Button>
          </div>
          <div className="p-3">
            <Textarea 
              autoFocus
              placeholder="What would you like to change?" 
              className="min-h-[80px] text-sm bg-transparent border-gray-200 focus-visible:ring-offset-0 text-gray-900 resize-none mb-3"
              value={activeCommentDraft.text}
              onChange={(e) => setActiveCommentDraft({...activeCommentDraft, text: e.target.value})}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveComment();
                }
                if (e.key === 'Escape') {
                  handleCancelComment();
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={handleCancelComment} className="text-gray-500 hover:text-gray-700 h-8">
                Cancel
              </Button>
              <Button size="sm" onClick={handleSaveComment} className="bg-blue-600 hover:bg-blue-700 h-8">
                Post Comment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments Overlay - Rendered INSIDE scaled container */}
      {comments.map(comment => (
        <div 
          key={comment.id} 
          className="absolute right-[-220px] z-10 bg-yellow-100 border border-yellow-300 p-2 rounded shadow-lg max-w-[200px]"
          style={{ 
            top: comment.top,
            transform: !afterPdfUrl ? "scale(1.53)" : "none", 
            transformOrigin: "top left"
          }}
        >
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-yellow-600 mt-1 shrink-0" />
            <p className="text-xs text-yellow-900">{comment.text}</p>
          </div>
        </div>
      ))}

      {afterPdfUrl ? (
        <PDFViewer url={afterPdfUrl} scale={0.65} />
      ) : (
        <>
      {/* Page 1 */}
      <div className="w-[8.5in] min-h-[11in] bg-white shadow-xl p-[1in] text-sm relative shrink-0">
          <div 
            className="text-center border-b pb-6 hover:bg-yellow-50/50 transition-colors rounded p-2 relative group cursor-pointer"
            onClick={(e) => handleTextClick(e, "10%")}
          >
            <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">Dimas Gonzales</h1>
            <p className="text-gray-600 mt-2">Dimas@gmail.com | LinkedIn | Dallas, Texas</p>
            <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          
          <div 
            className="mt-8 hover:bg-yellow-50/50 transition-colors rounded p-2 relative group cursor-pointer"
            onClick={(e) => handleTextClick(e, "25%")}
          >
            <h4 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-1">Work Experience (10+ Years Software Engineer)</h4>
            
            <div className="mb-6">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Senior Software Engineer</span>
                <span>June 2024 – Present</span>
              </div>
              <div className="italic text-gray-600 mb-2">Geico (Remote)</div>
              <ul className="list-disc list-inside space-y-2 text-gray-800">
                <li>Lead Engineer for the Billing Data Warehouse team.</li>
                <li>Enforced data quality and governance using SodaCL and DataHub, integrating automated lineage and RBAC for PII protection with Apache Ranger.</li>
                <li>Architected micro-batching ELT pipelines using dbt, Apache Spark, and Airflow, establishing 30 minute data freshness.</li>
                <li>Implemented a custom Snowflake 'zero-copy' solution with Apache Iceberg on Azure Data Lake.</li>
                <li>Automated testing and deployment via Azure DevOps CI/CD pipelines.</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 font-mono">Tech Stack: Snowflake, Airflow, Apache Spark/Ranger, Azure DevOps, SodaCL, DataHub</p>
            </div>
            <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>

          <div 
            className="mt-6 hover:bg-yellow-50/50 transition-colors rounded p-2 relative group cursor-pointer"
            onClick={(e) => handleTextClick(e, "50%")}
          >
            <div className="mb-6">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Data Architect</span>
                <span>Feb 2022 - June 2024</span>
              </div>
              <div className="italic text-gray-600 mb-2">Texas Capital Bank (Remote)</div>
              <ul className="list-disc list-inside space-y-2 text-gray-800">
                <li>Promoted to Data Architect to lead a larger migration of legacy warehouses to modern cloud architecture.</li>
                <li>Established an RFC process to standardize data modeling and architectural decisions, improving code quality and reducing technical debt.</li>
              </ul>
              <p className="text-xs text-gray-500 mt-2 font-mono">Tech Stack: Terraform IaC, Cloud Architecture</p>
            </div>
            
            <div className="mb-6">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Master Engineer</span>
                <span>Feb 2022 - Aug 2023</span>
              </div>
              <ul className="list-disc list-inside space-y-2 text-gray-800">
                <li>Prior to promotion, served as tech lead for three major migrations to AWS/Snowflake.</li>
                <li>Team won the 'BullDog' CTO award for platform excellence.</li>
                <li>Governance implementations cut monthly compute spend by 16% and reduced environment setup time by 40%+.</li>
              </ul>
            </div>
            <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
      </div>
      
      {/* Page 2 - Capabilities & Education */}
      <div className="w-[8.5in] min-h-[11in] bg-white shadow-xl p-[1in] text-sm relative">
          <div 
            className="hover:bg-yellow-50/50 transition-colors rounded p-2 relative group cursor-pointer"
            onClick={(e) => handleTextClick(e, "75%")}
          >
            <h4 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-1">Capabilities & Curiosities</h4>
            <ul className="list-disc list-inside space-y-1 text-gray-800 mb-8">
              <li><strong>Cloud & Infrastructure:</strong> AWS (EMR, S3, ECS), Azure (Data Lake, DevOps), Terraform, Docker</li>
              <li><strong>Data & Streaming:</strong> Snowflake, SQL, Apache Iceberg, Spark, Python, Kafka, Airflow</li>
              <li><strong>Skills:</strong> Business Agile, Project Management, Public Speaking, Technical Leadership</li>
              <li><strong>For Fun:</strong> Videography, Competitive Ping-pong, Weightlifting, Psychological-Thriller Movies</li>
            </ul>
            
            <h4 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-1">Education</h4>
             <div className="mb-6">
              <div className="flex justify-between font-bold text-gray-800">
                <span>Texas A&M University</span>
                <span>Aug 2012 - May 2017</span>
              </div>
              <div className="text-gray-800">Bachelor of Science in Computer Engineering</div>
              <ul className="list-disc list-inside space-y-1 text-gray-600 mt-2">
                 <li>GPA: 3.62/4.0</li>
                 <li>IM&T Specializations: Project Management and Web Design</li>
              </ul>
            </div>
            
            <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
      </div>
      </>
      )}
    </div>
  );

// ... then inside the return, update the "new-doc" container to remove border and padding
// and ensure it uses full height/width for the viewer


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
                       {activeTab === "resume" ? (
                          <div className="py-8 transform scale-90 origin-top flex justify-center w-full">
                            {renderNewResumeContent()}
                          </div>
                       ) : (
                          <>
                           <div className="text-center pb-8 border-b">
                             <h1 className="text-4xl font-bold text-gray-900">John Doe</h1>
                             <p className="text-xl text-gray-600 mt-2">Senior Software Engineer</p>
                           </div>
                           <div className="space-y-4">
                             <div className="h-6 bg-gray-200 rounded w-1/3" />
                             <div className="h-4 bg-gray-100 rounded w-full" />
                             <div className="h-4 bg-gray-100 rounded w-full" />
                             <div className="h-4 bg-gray-100 rounded w-5/6" />
                           </div>
                          </>
                       )}
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
           
           {/* Dev Tools: File Uploaders */}
           <div className="flex gap-4 items-center">
              <Button 
                variant="ghost" 
                size="icon"
                className="text-gray-400 hover:text-red-400 hover:bg-red-900/20"
                onClick={handleReset}
                title="Reset Demo State"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
              <div className="relative group">
                 <Button variant="outline" className={cn("border-white/10 hover:bg-white/10 gap-2 relative z-10", beforePdfUrl ? "text-green-400 border-green-500/30" : "text-gray-400")}>
                   <Upload className="w-4 h-4" /> {beforePdfUrl ? "Old PDF Loaded" : "Upload Old PDF"}
                 </Button>
                 <input 
                   key={beforePdfUrl ? "loaded" : "empty"} // Key forces re-render when state changes
                   type="file" 
                   accept="application/pdf" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   onChange={(e) => handleFileUpload(e, 'before')}
                   title="Upload Old PDF"
                 />
              </div>
              <div className="relative group">
                 <Button variant="outline" className={cn("border-white/10 hover:bg-white/10 gap-2 relative z-10", afterPdfUrl ? "text-green-400 border-green-500/30" : "text-gray-400")}>
                   <Upload className="w-4 h-4" /> {afterPdfUrl ? "New PDF Loaded" : "Upload New PDF"}
                 </Button>
                 <input 
                   key={afterPdfUrl ? "loaded" : "empty"} // Key forces re-render when state changes
                   type="file" 
                   accept="application/pdf" 
                   className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                   onChange={(e) => handleFileUpload(e, 'after')}
                   title="Upload New PDF"
                 />
              </div>
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
                    {!isFlipped ? (
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
                           {activeTab === 'resume' ? OLD_RESUME_CONTENT : 
                            activeTab === 'cover-letter' ? (
                              <div className="flex flex-col items-center justify-center h-full min-h-[600px] w-full">
                                <img 
                                  src={noCoverLetterImg} 
                                  alt="No cover letter?" 
                                  className="max-w-full max-h-[500px] object-contain opacity-80 hover:opacity-100 transition-opacity"
                                />
                              </div>
                            ) : (
                             <div className="space-y-6 font-serif text-gray-500 blur-[0.5px]">
                               <p>John Doe <br/> Software Developer</p>
                               <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                               <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                               <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                               <p>[Old content placeholder...]</p>
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
                              {revisionStatus === 'requested' && <Badge className="bg-yellow-500 gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Revisions Requested</Badge>}
                           </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-8 bg-[#111] relative cursor-text scroll-smooth">
                           {activeTab === 'resume' ? renderNewResumeContent() : (
                             <div className="space-y-8 font-serif text-sm leading-relaxed max-w-[800px] mx-auto bg-white min-h-[11in] p-[1in] shadow-xl text-gray-800">
                               {/* Default placeholder content for other document types */}
                               <div 
                                 className="text-center border-b pb-6 hover:bg-yellow-50/50 transition-colors rounded p-2 relative group"
                                 onClick={(e) => handleTextClick(e, "10%")}
                               >
                                 <h1 className="text-3xl font-bold uppercase tracking-wide text-gray-900">John Doe</h1>
                                 <p className="text-gray-600 mt-2">Senior Software Engineer | Full Stack Specialist</p>
                                 <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
                                   <MessageSquare className="w-4 h-4" />
                                 </div>
                               </div>
                               {/* ... other default content ... */}
                               <div className="p-4 text-center text-gray-400 italic">
                                 [Content for {config.label} goes here]
                               </div>
                             </div>
                           )}
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Sidebar Actions */}
               <div className="w-80 flex flex-col gap-4 h-full min-h-0 relative">
                 <Card className="bg-[#111] border-white/10 flex-1 h-full relative overflow-hidden">
                   <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-6">
                      {!isFlipped ? (
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
                      ) : (
                        revisionStatus === 'requested' ? (
                          <>
                             <div className="p-4 bg-yellow-500/10 rounded-full text-yellow-500 mb-2">
                               <RotateCw className="w-8 h-8 animate-spin" />
                             </div>
                             <div>
                               <h3 className="text-xl font-bold text-white">Revisions Requested</h3>
                               <p className="text-sm text-muted-foreground mt-2">
                                 Wilson is working on your updates based on {comments.length} comments.
                                 You'll be notified when the new version is ready.
                               </p>
                             </div>
                             <div className="w-full bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-left mt-4 opacity-70">
                               <p className="text-xs font-bold text-yellow-500 mb-1">Your Comments:</p>
                               <ul className="text-xs text-yellow-200/80 list-disc list-inside">
                                 {comments.map(c => (
                                   <li key={c.id} className="truncate">{c.text}</li>
                                 ))}
                               </ul>
                             </div>
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
                               
                               {comments.length > 0 && (
                                 <div className="w-full bg-yellow-500/10 border border-yellow-500/20 p-3 rounded text-left">
                                   <p className="text-xs font-bold text-yellow-500 mb-1">{comments.length} Comments Added:</p>
                                   <ul className="text-xs text-yellow-200/80 list-disc list-inside">
                                     {comments.map(c => (
                                       <li key={c.id} className="truncate">{c.text}</li>
                                     ))}
                                   </ul>
                                 </div>
                               )}

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
                      {isRequestingRevisions && !isApproved && revisionStatus !== 'requested' && (
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