import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Linkedin, Check, Lightbulb, RotateCw, CheckCircle2, Sparkles, MessageSquare, X, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type DocType = "resume" | "cover-letter" | "linkedin";

const DOC_CONFIG = {
  resume: { color: "red", label: "Resume", bg: "bg-red-500", text: "text-red-500", border: "border-red-500" },
  "cover-letter": { color: "purple", label: "Cover Letter", bg: "bg-purple-500", text: "text-purple-500", border: "border-purple-500" },
  linkedin: { color: "blue", label: "LinkedIn Profile", bg: "bg-blue-500", text: "text-blue-500", border: "border-blue-500" },
};

export default function ClientDocumentsPage() {
  const [activeTab, setActiveTab] = useState<DocType>("resume");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [activeVersion, setActiveVersion] = useState("A");
  const [comments, setComments] = useState<{id: number, text: string, top: string}[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revealPhase, setRevealPhase] = useState<"intro" | "float" | "distort" | "explode" | "reveal" | "settle">("intro");
  const [showLargeReview, setShowLargeReview] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState<"idle" | "requested">("idle");
  
  // Reset states when changing tabs
  useEffect(() => {
    setIsFlipped(false);
    setShowLargeReview(false);
    setIsRevealing(false);
    setRevealPhase("intro");
  }, [activeTab]);

  const config = DOC_CONFIG[activeTab];

  // Mock highlight logic
  const handleTextClick = (e: React.MouseEvent, top: string) => {
    if (!isFlipped || isApproved || revisionStatus === 'requested') return;
    const comment = prompt("Add a comment for this section:");
    if (comment) {
      setComments([...comments, { id: Date.now(), text: comment, top }]);
    }
  };

  const handleImprove = () => {
    setIsRevealing(true);
    setRevealPhase("intro");
    
    // Animation Sequence
    setTimeout(() => setRevealPhase("float"), 2000);   // Text moves up, doc floats
    setTimeout(() => setRevealPhase("distort"), 4000); // Doc stretches
    // Skip explode to avoid blank screen, go straight to reveal with confetti
    setTimeout(() => setRevealPhase("reveal"), 7000);  // New doc appears with confetti
    
    setTimeout(() => {
      setIsRevealing(false);
      setShowLargeReview(true); // Stay in large blurred mode
      setIsFlipped(true); // Ready for flip state behind scene
    }, 9000);
  };

  const handleReviewClick = () => {
    setShowLargeReview(false);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setComments([]); 
  };

  const handleRequestRevisions = () => {
    if (confirm("Request revisions based on your comments?")) {
      setRevisionStatus("requested");
    }
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col relative">
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
              
              {/* Phase 1 & 2: Text */}
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
                {["float", "distort", "reveal"].includes(revealPhase) && (
                  <motion.div
                    className="w-[300px] h-[400px] bg-white rounded shadow-2xl z-10 relative flex items-center justify-center"
                    initial={{ y: 0, scale: 1, filter: "brightness(1)" }}
                    animate={
                      revealPhase === "float" ? { y: -50, scale: 1.1, filter: "brightness(1.5)" } :
                      revealPhase === "distort" ? { 
                        scaleY: [1, 1.5, 0.5, 1.2, 0.8, 1.5], 
                        scaleX: [1, 0.6, 1.4, 0.8, 1.2, 0.6],
                        rotate: [0, 5, -5, 10, -10, 0],
                        filter: ["brightness(2) hue-rotate(0deg)", "brightness(4) hue-rotate(90deg)"]
                      } :
                      revealPhase === "reveal" ? { scale: 1.2, filter: "brightness(1)", rotate: 0 } : {}
                    }
                    transition={
                      revealPhase === "float" ? { duration: 2, ease: "easeInOut" } :
                      revealPhase === "distort" ? { duration: 3, ease: "linear", repeat: Infinity } :
                      { duration: 0.5 }
                    }
                  >
                    {/* Content Placeholder - Different for Old vs New */}
                    {revealPhase === "reveal" ? (
                      <div className="space-y-4 w-3/4 opacity-80">
                         <h3 className={cn("text-xl font-bold text-center mb-4", config.text)}>New {config.label}</h3>
                         <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
                         <div className="h-2 bg-gray-100 rounded w-full" />
                         <div className="h-2 bg-gray-100 rounded w-full" />
                         <div className="h-2 bg-gray-100 rounded w-3/4" />
                         <div className="h-2 bg-gray-100 rounded w-full mt-4" />
                         <div className="h-2 bg-gray-100 rounded w-5/6" />
                      </div>
                    ) : (
                      <div className="space-y-4 w-3/4 opacity-20">
                        <div className="h-4 bg-black rounded w-1/2" />
                        <div className="h-2 bg-black rounded w-full" />
                        <div className="h-2 bg-black rounded w-full" />
                        <div className="h-2 bg-black rounded w-3/4" />
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

              {/* Phase 3: Particles / Explosion - Celebrate the New Doc */}
              {["reveal"].includes(revealPhase) && (
                 <div className="absolute inset-0 pointer-events-none z-20">
                    {[...Array(50)].map((_, i) => (
                      <motion.div
                        key={i}
                        className={cn("absolute rounded-full", i % 2 === 0 ? config.bg : "bg-white")}
                        initial={{ 
                          left: "50%", 
                          top: "50%", 
                          width: Math.random() * 12, 
                          height: Math.random() * 12,
                          opacity: 1
                        }}
                        animate={{ 
                          x: (Math.random() - 0.5) * 1500, 
                          y: (Math.random() - 0.5) * 1500,
                          opacity: 0,
                          scale: 0,
                          rotate: Math.random() * 360
                        }}
                        transition={{ duration: 2.5, ease: "easeOut", delay: Math.random() * 0.2 }}
                      />
                    ))}
                 </div>
              )}

              {/* Phase 4: Reveal Text */}
              {revealPhase === "reveal" && (
                <motion.div
                  className="z-30 text-center"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.2, opacity: 1 }}
                  transition={{ type: "spring", bounce: 0.5 }}
                >
                   <h1 className={cn("text-6xl font-bold mb-4 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]", config.text)}>
                     It's a new {config.label}!
                   </h1>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Large Review Mode (Post-Evolution) */}
      <AnimatePresence>
        {showLargeReview && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[40] flex flex-col items-center justify-center bg-black/80 backdrop-blur-xl p-8"
          >
             <motion.div
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="mb-6 flex flex-col items-center relative w-full max-w-4xl"
             >
                <h2 className={cn("text-4xl font-bold flex items-center gap-2 mb-4 drop-shadow-lg text-white font-sans tracking-wide uppercase")}>
                  <Sparkles className="w-8 h-8 fill-yellow-300 text-yellow-300" /> 
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
               initial={{ scale: 0.8, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               className="relative w-full max-w-4xl h-[70vh] bg-white rounded-lg shadow-2xl overflow-hidden flex flex-col"
             >
                <div className="flex-1 p-12 overflow-y-auto">
                    {/* Simplified Content Preview */}
                    <div className="max-w-2xl mx-auto space-y-8 blur-[0.5px]">
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
                    </div>
                </div>
             </motion.div>
             
             <motion.div 
               initial={{ y: 50, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               transition={{ delay: 0.5 }}
               className="mt-8"
             >
               <Button 
                 size="lg" 
                 className={cn("h-16 px-12 text-2xl font-bold shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 transition-transform", config.bg, "text-white")}
                 onClick={handleReviewClick}
               >
                 Review {config.label}
               </Button>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Document Review</h1>
        <p className="text-muted-foreground mt-1">Approve your tailored application materials.</p>
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
               <div className="flex-1 relative h-full">
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div 
                        key="old-doc"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="w-full h-full bg-white text-black p-12 shadow-xl rounded-lg overflow-y-auto"
                      >
                         <h3 className="text-xl font-bold mb-8 border-b pb-2 text-gray-400">Old {config.label}</h3>
                         <div className="space-y-6 font-serif text-gray-500 blur-[0.5px]">
                           <p>John Doe <br/> Software Developer</p>
                           <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                           <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                           <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                           <p>[Old content placeholder...]</p>
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="new-doc"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className={cn("w-full h-full bg-white text-black shadow-2xl rounded-lg overflow-hidden border-4 relative flex flex-col", config.border)}
                      >
                         {/* Comments Overlay */}
                         {comments.map(comment => (
                           <div 
                             key={comment.id} 
                             className="absolute right-4 z-10 bg-yellow-100 border border-yellow-300 p-2 rounded shadow-lg max-w-[200px]"
                             style={{ top: comment.top }}
                           >
                             <div className="flex items-start gap-2">
                               <MessageSquare className="w-4 h-4 text-yellow-600 mt-1 shrink-0" />
                               <p className="text-xs text-yellow-900">{comment.text}</p>
                             </div>
                           </div>
                         ))}

                         <div className="bg-gray-50 border-b p-4 flex justify-between items-center shrink-0">
                           <div className="flex items-center gap-4">
                             <h3 className={cn("text-xl font-bold flex items-center gap-2", config.text)}>
                               ✨ Improved {config.label}
                             </h3>
                             {activeTab !== 'linkedin' && (
                               <div className="flex bg-white border rounded-lg p-1">
                                 {["A", "B", "C"].map(ver => (
                                   <button
                                     key={ver}
                                     onClick={() => setActiveVersion(ver)}
                                     className={cn(
                                       "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                                       activeVersion === ver ? "bg-primary text-white" : "text-gray-500 hover:bg-gray-100"
                                     )}
                                   >
                                     Ver {ver}
                                   </button>
                                 ))}
                               </div>
                             )}
                           </div>
                           <div className="flex items-center gap-2">
                              {isApproved && <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>}
                              {revisionStatus === 'requested' && <Badge className="bg-yellow-500 gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Revisions Requested</Badge>}
                           </div>
                         </div>
                         
                         <div className="flex-1 overflow-y-auto p-12 relative cursor-text">
                           {/* Hint Overlay for Comments */}
                           {!isApproved && revisionStatus !== 'requested' && comments.length === 0 && (
                             <div className="absolute top-4 right-4 bg-blue-50 text-blue-600 px-3 py-2 rounded text-xs border border-blue-200 animate-pulse">
                               <Lightbulb className="w-3 h-3 inline mr-1" />
                               Click any section to add a comment
                             </div>
                           )}

                           <div className="space-y-8 font-serif text-sm leading-relaxed max-w-[800px] mx-auto">
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
                             
                             <div 
                               className="hover:bg-yellow-50/50 transition-colors rounded p-2 relative group"
                               onClick={(e) => handleTextClick(e, "30%")}
                             >
                               <h4 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-4 border-b border-gray-200 pb-1">Professional Experience</h4>
                               <div className="mb-6">
                                 <div className="flex justify-between font-bold text-gray-800">
                                   <span>Senior Developer</span>
                                   <span>2020 - Present</span>
                                 </div>
                                 <div className="italic text-gray-600 mb-2">TechCorp Inc.</div>
                                 <ul className="list-disc list-inside space-y-2 text-gray-800">
                                   <li>Architected scalable microservices using React and Node.js, improving system latency by 40%.</li>
                                   <li>Led a team of 5 developers in modernizing the legacy codebase, resulting in a 20% reduction in technical debt.</li>
                                   <li>Implemented CI/CD pipelines reducing deployment time from 1 hour to 10 minutes.</li>
                                 </ul>
                               </div>
                               <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
                                 <MessageSquare className="w-4 h-4" />
                               </div>
                             </div>

                             <div 
                               className="hover:bg-yellow-50/50 transition-colors rounded p-2 relative group"
                               onClick={(e) => handleTextClick(e, "60%")}
                             >
                               <div className="mb-6">
                                 <div className="flex justify-between font-bold text-gray-800">
                                   <span>Software Engineer</span>
                                   <span>2018 - 2020</span>
                                 </div>
                                 <div className="italic text-gray-600 mb-2">StartUp Flow</div>
                                 <ul className="list-disc list-inside space-y-2 text-gray-800">
                                   <li>Developed responsive frontend features using React and Redux.</li>
                                   <li>Collaborated with UX designers to implement pixel-perfect interfaces.</li>
                                 </ul>
                               </div>
                               <div className="hidden group-hover:block absolute right-2 top-2 text-gray-400">
                                 <MessageSquare className="w-4 h-4" />
                               </div>
                             </div>
                           </div>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>

               {/* Sidebar Actions */}
               <div className="w-80 flex flex-col gap-4">
                 <Card className="bg-[#111] border-white/10 flex-1">
                   <CardContent className="p-6 h-full flex flex-col justify-center items-center text-center space-y-6">
                      {!isFlipped ? (
                        <>
                          <div className={cn("p-4 rounded-full mb-2 animate-pulse bg-white/10", config.text)}>
                            <Sparkles className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Your New {config.label} Is Ready</h3>
                            <p className="text-sm text-muted-foreground mt-2">
                              {activeTab === 'resume' ? "We've crafted a high-impact resume optimized for ATS." : 
                               activeTab === 'cover-letter' ? "Three versions tailored for different role types." : 
                               "An optimized LinkedIn profile to attract recruiters."}
                            </p>
                          </div>
                          <Button size="lg" className={cn("w-full font-bold text-lg h-12 shadow-lg hover:scale-105 transition-transform", config.bg, "text-white")} onClick={handleImprove}>
                            ✨ Show Me
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
                                 <p className="text-sm text-muted-foreground mt-2">Click any text section to leave a comment for revisions.</p>
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
                                 <Button variant="outline" className="w-full border-white/10 hover:bg-white/5" onClick={handleRequestRevisions}>
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
                                 <p className="text-sm text-muted-foreground mt-2">This document is locked and ready for applications.</p>
                               </div>
                               <Button variant="outline" className="w-full border-white/10 opacity-50 cursor-not-allowed">
                                 Locked
                               </Button>
                            </>
                          )
                        )
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