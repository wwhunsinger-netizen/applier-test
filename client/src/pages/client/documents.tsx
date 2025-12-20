import { useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Linkedin, Check, Lightbulb, RotateCw, CheckCircle2, Sparkles, MessageSquare, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export default function ClientDocumentsPage() {
  const [activeTab, setActiveTab] = useState("resume");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isApproved, setIsApproved] = useState(false);
  const [activeVersion, setActiveVersion] = useState("A");
  const [comments, setComments] = useState<{id: number, text: string, top: string}[]>([]);
  const [isRevealing, setIsRevealing] = useState(false);
  const [revisionStatus, setRevisionStatus] = useState<"idle" | "requested">("idle");
  
  // Mock highlight logic
  const handleTextClick = (e: React.MouseEvent, top: string) => {
    if (!isFlipped || isApproved || revisionStatus === 'requested') return;
    // In a real app, this would get selection coordinates
    const comment = prompt("Add a comment for this section:");
    if (comment) {
      setComments([...comments, { id: Date.now(), text: comment, top }]);
    }
  };

  const handleImprove = () => {
    setIsRevealing(true);
    // Sequence: 
    // 1. Overlay appears (0s)
    // 2. Old resume floats up (0.5s)
    // 3. Transformation/Morph (1.5s)
    // 4. Reveal (2.5s)
    // 5. Settle (3.5s)
    
    setTimeout(() => {
      setIsFlipped(true);
      setIsRevealing(false);
    }, 3500);
  };

  const handleApprove = () => {
    setIsApproved(true);
    setComments([]); // Clear comments on approval
  };

  const handleRequestRevisions = () => {
    if (confirm("Request revisions based on your comments?")) {
      setRevisionStatus("requested");
    }
  };

  const tabs = [
    { id: "resume", label: "Resume", icon: FileText },
    { id: "cover-letter", label: "Cover Letters", icon: FileText },
    { id: "linkedin", label: "LinkedIn", icon: Linkedin },
  ];

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col relative">
      {/* Evolution Animation Overlay */}
      <AnimatePresence>
        {isRevealing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
          >
            <div className="relative w-full max-w-4xl h-[80vh] flex items-center justify-center">
              {/* Particle Effects Background */}
              <motion.div 
                className="absolute inset-0 z-0"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute bg-primary rounded-full blur-xl opacity-20"
                    initial={{ 
                      x: Math.random() * 1000 - 500, 
                      y: Math.random() * 1000 - 500,
                      scale: 0 
                    }}
                    animate={{ 
                      x: 0, 
                      y: 0,
                      scale: [0, 2, 0],
                      opacity: [0, 0.5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      delay: Math.random() * 1,
                      ease: "easeInOut"
                    }}
                    style={{
                      width: Math.random() * 100 + 50,
                      height: Math.random() * 100 + 50,
                    }}
                  />
                ))}
              </motion.div>

              {/* Glowing Orb / Core */}
              <motion.div
                className="absolute z-10 w-64 h-64 rounded-full bg-white shadow-[0_0_100px_rgba(255,255,255,0.8)]"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ 
                  scale: [0, 1.2, 0.8, 5], // Explode at the end
                  opacity: [0, 1, 1, 0]
                }}
                transition={{ duration: 3, times: [0, 0.3, 0.8, 1] }}
              />
              
              {/* Text Hint */}
              <motion.h2
                className="absolute z-20 text-4xl font-bold text-white tracking-[1em] uppercase"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0, 1, 0], scale: 1.2 }}
                transition={{ duration: 2.5, times: [0, 0.5, 1] }}
              >
                Upgrading
              </motion.h2>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Document Review</h1>
        <p className="text-muted-foreground mt-1">Approve your tailored application materials.</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="bg-white/5 border border-white/10 p-1 w-fit mb-4">
            {tabs.map(tab => (
              <TabsTrigger 
                key={tab.id} 
                value={tab.id}
                className="data-[state=active]:bg-primary data-[state=active]:text-white gap-2"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {tabs.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="flex-1 mt-0 relative">
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
                           <h3 className="text-xl font-bold mb-8 border-b pb-2 text-gray-400">Old {tab.label}</h3>
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
                          initial={{ opacity: 0, scale: 1.1, y: 50 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          transition={{ type: "spring", damping: 20 }}
                          className="w-full h-full bg-white text-black shadow-2xl rounded-lg overflow-hidden border-4 border-primary/20 relative flex flex-col"
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
                               <h3 className="text-xl font-bold text-primary flex items-center gap-2">
                                 ✨ Improved {tab.label}
                               </h3>
                               {tab.id !== 'linkedin' && (
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
                             {isApproved && <Badge className="bg-green-500 gap-1"><CheckCircle2 className="w-3 h-3" /> Approved</Badge>}
                             {revisionStatus === 'requested' && <Badge className="bg-yellow-500 gap-1"><RotateCw className="w-3 h-3 animate-spin" /> Revisions Requested</Badge>}
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
                            <div className="p-4 bg-primary/10 rounded-full text-primary mb-2 animate-pulse">
                              <Sparkles className="w-8 h-8" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-white">Your New {tab.label} Is Ready</h3>
                              <p className="text-sm text-muted-foreground mt-2">
                                {tab.id === 'resume' ? "We've crafted a high-impact resume optimized for ATS." : 
                                 tab.id === 'cover-letter' ? "Three versions tailored for different role types." : 
                                 "An optimized LinkedIn profile to attract recruiters."}
                              </p>
                            </div>
                            <Button size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90" onClick={handleImprove}>
                              ✨ Show Me
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
                        )}
                     </CardContent>
                   </Card>
                 </div>
               </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
}