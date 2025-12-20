import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RESUME_COMPARISON, MOCK_JOBS } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Clock, Check, Save, Flag, Zap, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("resume");
  const [timer, setTimer] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [resumeText, setResumeText] = useState(RESUME_COMPARISON.ai_tailored);

  // Simple timer
  useEffect(() => {
    const interval = setInterval(() => {
      setTimer(t => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApprove = () => {
    if (activeTab === "resume") {
      setActiveTab("cover-letter");
    } else {
      // Finish
      setLocation("/queue");
    }
  };

  const job = MOCK_JOBS[0]; // Just use first job for mock

  return (
    <div className="h-[calc(100vh-2rem)] flex flex-col gap-4">
      {/* Top Bar */}
      <header className="bg-card border border-border rounded-lg p-3 px-4 flex items-center justify-between shadow-sm flex-shrink-0">
        <div className="flex items-center gap-4">
          <Link href="/queue">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <ChevronLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h2 className="font-bold text-sm leading-none flex items-center gap-2">
              {job.role} @ {job.company}
              <Badge variant="outline" className="text-[10px] h-4 px-1">#47/100</Badge>
            </h2>
            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
              <span>Remote (US)</span>
              <span className="text-border">|</span>
              <span className="flex items-center gap-1 font-mono text-primary font-medium">
                <Clock className="w-3 h-3" /> {formatTime(timer)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="text-muted-foreground h-8">
            <Save className="w-4 h-4 mr-2" /> Save Draft
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive h-8">
            <Flag className="w-4 h-4 mr-2" /> Flag Issue
          </Button>
          <Button variant="outline" size="sm" className="h-8">
            Skip
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </header>

      {/* Main Review Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: AI Context & Job Info */}
        <Card className="w-1/3 flex flex-col overflow-hidden border-border/60">
          <div className="bg-muted/30 p-3 border-b border-border text-sm font-medium">
            Job Details & AI Insights
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm font-medium">
                <span>AI Confidence</span>
                <span className="text-success">94%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-success w-[94%]" />
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">AI Changes Made</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary text-lg">✏️</span>
                  <span>Job title matched: "Developer" → "Software Engineer"</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary text-lg">✏️</span>
                  <span>Added relevant skills: React, Node.js, AWS based on experience</span>
                </li>
              </ul>
            </div>

            <div className="space-y-3 pt-4 border-t border-border">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">Job Description</h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {job.description}
                {/* Mock long text */}
                {"\n\n"}
                We are looking for a passionate Senior Engineer to join our core team. You will be responsible for building high-scale applications.
                {"\n\n"}
                Requirements:
                - 5+ years of experience
                - Strong React & Node.js skills
                - Excellent communication
              </p>
            </div>
          </div>
        </Card>

        {/* Right: Work Area */}
        <Card className="flex-1 flex flex-col overflow-hidden border-border/60 shadow-lg">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <div className="px-4 pt-3 border-b border-border bg-muted/10 flex justify-between items-center">
              <TabsList className="bg-transparent p-0 h-auto gap-4">
                <TabsTrigger 
                  value="resume" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground transition-all"
                >
                  1. Resume Review
                </TabsTrigger>
                <TabsTrigger 
                  value="cover-letter" 
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-2 pb-3 pt-2 text-muted-foreground data-[state=active]:text-foreground transition-all"
                >
                  2. Cover Letter
                </TabsTrigger>
              </TabsList>
              
              <div className="pb-2">
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   className={cn("text-xs gap-1", isEditing ? "text-primary bg-primary/10" : "text-muted-foreground")}
                   onClick={() => setIsEditing(!isEditing)}
                 >
                   <Edit2 className="w-3 h-3" />
                   {isEditing ? "Editing Mode" : "View Mode"}
                 </Button>
              </div>
            </div>

            <TabsContent value="resume" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
              <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-black/20">
                <div className="max-w-3xl mx-auto shadow-sm border border-border bg-card min-h-[800px] p-8 font-serif text-sm relative">
                  {/* Mock Resume Paper Look */}
                  {isEditing ? (
                    <Textarea 
                      className="w-full h-full min-h-[700px] border-none focus-visible:ring-0 p-0 resize-none font-serif text-sm leading-relaxed bg-transparent"
                      value={resumeText}
                      onChange={(e) => setResumeText(e.target.value)}
                    />
                  ) : (
                    <div className="whitespace-pre-wrap leading-relaxed">
                      {resumeText}
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="cover-letter" className="flex-1 p-0 m-0 overflow-hidden flex flex-col">
               <div className="flex-1 overflow-y-auto p-6 bg-white dark:bg-black/20">
                <div className="max-w-3xl mx-auto shadow-sm border border-border bg-card min-h-[600px] p-8 font-serif text-sm">
                   <p className="mb-4">Dear Hiring Manager,</p>
                   <p className="mb-4">I am writing to express my strong interest in the Senior React Engineer position at TechCorp Inc...</p>
                   <p className="text-muted-foreground italic">[Mock Cover Letter Content...]</p>
                </div>
              </div>
            </TabsContent>

            {/* Bottom Action Bar */}
            <div className="p-4 border-t border-border bg-card flex justify-between items-center z-10">
               <div className="text-xs text-muted-foreground">
                  <span className="font-bold text-warning">⚠ Check for:</span> Skills match • Proper Job Titles • No hallucinations
               </div>
               
               <div className="flex gap-3">
                 <Button variant="outline" onClick={() => setIsEditing(!isEditing)}>
                    Edit Document
                 </Button>
                 <Button 
                   size="lg" 
                   className="bg-green-600 hover:bg-green-700 text-white font-bold shadow-lg shadow-green-900/20 w-48 transition-all active:scale-95"
                   onClick={handleApprove}
                 >
                   {activeTab === 'resume' ? (
                     <>
                       Approve Resume <Check className="ml-2 w-4 h-4" />
                     </>
                   ) : (
                     <>
                       Submit Application <Zap className="ml-2 w-4 h-4" />
                     </>
                   )}
                 </Button>
               </div>
            </div>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}