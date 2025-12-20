import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Linkedin, Check, Lightbulb, RotateCw, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ClientDocumentsPage() {
  const [activeTab, setActiveTab] = useState("resume");
  const [isFlipped, setIsFlipped] = useState(false);
  const [isApproved, setIsApproved] = useState(false);

  const handleImprove = () => {
    setIsFlipped(true);
  };

  const handleApprove = () => {
    setIsApproved(true);
  };

  return (
    <div className="space-y-6 h-[calc(100vh-8rem)] flex flex-col">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Document Review</h1>
        <p className="text-muted-foreground mt-1">Approve your tailored application materials.</p>
      </div>

      <div className="flex-1 min-h-0 flex flex-col">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="bg-white/5 border border-white/10 p-1 w-fit mb-4">
            <TabsTrigger value="resume" className="data-[state=active]:bg-primary data-[state=active]:text-white">Resume</TabsTrigger>
            <TabsTrigger value="cover-letter">Cover Letters</TabsTrigger>
            <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          </TabsList>

          <TabsContent value="resume" className="flex-1 mt-0 relative perspective-1000">
             <div className="flex gap-6 h-full">
               {/* Document Viewer Area */}
               <div className="flex-1 relative h-full">
                  <AnimatePresence mode="wait">
                    {!isFlipped ? (
                      <motion.div 
                        key="old-resume"
                        initial={{ rotateY: 0, opacity: 1, scale: 1 }}
                        exit={{ 
                          rotateY: 90, 
                          opacity: 0, 
                          scale: 0.8,
                          transition: { duration: 0.4, ease: "easeIn" } 
                        }}
                        className="w-full h-full bg-white text-black p-8 shadow-xl rounded-lg overflow-y-auto"
                      >
                         <h3 className="text-xl font-bold mb-4 border-b pb-2">Old Resume</h3>
                         <div className="space-y-4 font-serif text-sm opacity-70">
                           <p>John Doe <br/> Software Developer</p>
                           <p>Experience: <br/> - Worked at Company X <br/> - Did coding</p>
                           <p>[Old resume content placeholder...]</p>
                         </div>
                      </motion.div>
                    ) : (
                      <motion.div 
                        key="new-resume"
                        initial={{ rotateY: -180 * 2, opacity: 0, scale: 0.5 }}
                        animate={{ 
                          rotateY: 0, 
                          opacity: 1, 
                          scale: [0.5, 1.1, 1], // Grow effect
                          transition: { 
                            duration: 1.5, // Longer duration for spins
                            ease: "circOut",
                            times: [0, 0.8, 1]
                          } 
                        }}
                        className="w-full h-full bg-white text-black p-8 shadow-xl rounded-lg overflow-y-auto border-4 border-primary/20 relative"
                      >
                         {/* Sparkle Effects */}
                         <motion.div 
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: [0, 1, 0], scale: [0.5, 1.5, 0.5] }}
                           transition={{ delay: 1.2, duration: 0.8 }}
                           className="absolute -top-4 -right-4 text-yellow-400 z-10"
                         >
                           <Sparkles className="w-12 h-12 fill-yellow-400" />
                         </motion.div>
                         <motion.div 
                           initial={{ opacity: 0, scale: 0 }}
                           animate={{ opacity: [0, 1, 0], scale: [0.5, 1.2, 0.5] }}
                           transition={{ delay: 1.4, duration: 0.8 }}
                           className="absolute top-1/2 -left-6 text-yellow-400 z-10"
                         >
                           <Sparkles className="w-8 h-8 fill-yellow-400" />
                         </motion.div>

                         <div className="flex justify-between items-start mb-6 border-b pb-4">
                           <h3 className="text-xl font-bold text-primary">✨ Improved Resume</h3>
                           {isApproved && <Badge className="bg-green-500">Approved</Badge>}
                         </div>
                         <div className="space-y-6 font-serif text-sm leading-relaxed">
                           <div className="text-center border-b pb-4">
                             <h1 className="text-2xl font-bold uppercase tracking-wide">John Doe</h1>
                             <p className="text-gray-600">Senior Software Engineer | Full Stack Specialist</p>
                           </div>
                           
                           <div>
                             <h4 className="font-bold uppercase text-xs tracking-wider text-gray-500 mb-2">Professional Experience</h4>
                             <div className="mb-4">
                               <div className="flex justify-between font-bold">
                                 <span>Senior Developer</span>
                                 <span>2020 - Present</span>
                               </div>
                               <div className="italic text-gray-600 mb-1">TechCorp Inc.</div>
                               <ul className="list-disc list-inside space-y-1 text-gray-800">
                                 <li>Architected scalable microservices using React and Node.js, improving system latency by 40%.</li>
                                 <li>Led a team of 5 developers in modernizing the legacy codebase.</li>
                               </ul>
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
                          <div className="p-4 bg-primary/10 rounded-full text-primary mb-2">
                            <RotateCw className="w-8 h-8" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Ready to Upgrade?</h3>
                            <p className="text-sm text-muted-foreground mt-2">See the professional transformation we've applied to your resume.</p>
                          </div>
                          <Button size="lg" className="w-full font-bold text-lg h-12 shadow-lg shadow-primary/20" onClick={handleImprove}>
                            ✨ Reveal Improved Resume
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
                               <p className="text-sm text-muted-foreground mt-2">Highlight text to add comments if revisions are needed.</p>
                             </div>
                             <div className="w-full space-y-3 pt-4">
                               <Button size="lg" className="w-full bg-green-600 hover:bg-green-700 font-bold h-12" onClick={handleApprove}>
                                 <Check className="w-5 h-5 mr-2" /> Approve This Version
                               </Button>
                               <Button variant="outline" className="w-full">
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
                          </>
                        )
                      )}
                   </CardContent>
                 </Card>
               </div>
             </div>
          </TabsContent>

          <TabsContent value="cover-letter" className="flex-1 flex items-center justify-center text-muted-foreground">
             <div className="text-center">
               <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>Cover Letter review coming soon</p>
             </div>
          </TabsContent>
           <TabsContent value="linkedin" className="flex-1 flex items-center justify-center text-muted-foreground">
             <div className="text-center">
               <Linkedin className="w-12 h-12 mx-auto mb-4 opacity-20" />
               <p>LinkedIn profile review coming soon</p>
             </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}