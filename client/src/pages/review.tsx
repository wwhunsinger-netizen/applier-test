import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { RESUME_COMPARISON, MOCK_JOBS } from "@/lib/mockData";
import { ChevronLeft, ChevronRight, Clock, Check, Save, Flag, Zap, Edit2, MessageSquare, Send, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useUser } from "@/lib/userContext";
import { apiFetch } from "@/lib/api";

export default function ReviewPage() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("resume");
  const [timer, setTimer] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [resumeText, setResumeText] = useState(RESUME_COMPARISON.ai_tailored);
  
  // ClientGPT state
  const { currentUser } = useUser();
  const [showClientGPT, setShowClientGPT] = useState(false);
  const [gptQuestion, setGptQuestion] = useState("");
  const [gptAnswer, setGptAnswer] = useState("");
  const [gptLoading, setGptLoading] = useState(false);
  const [gptError, setGptError] = useState("");

  // Job ID derived from URL or prop in a real app, assuming job[0] for now
  const jobId = MOCK_JOBS[0].id;

  // Timer logic with simple persistence
  useEffect(() => {
    // Key for local storage
    const storageKey = `jumpseat_timer_${jobId}`;
    
    // Check if we have a stored start time
    const storedStart = localStorage.getItem(storageKey);
    let startTime = storedStart ? parseInt(storedStart, 10) : Date.now();

    // If no stored start time, set it now
    if (!storedStart) {
      localStorage.setItem(storageKey, startTime.toString());
    }

    // Update timer every second
    const updateTimer = () => {
      const now = Date.now();
      const elapsedSeconds = Math.floor((now - startTime) / 1000);
      setTimer(elapsedSeconds);
    };

    // Initial update
    updateTimer();

    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [jobId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleApprove = () => {
    if (activeTab === "resume") {
      setActiveTab("cover-letter");
    } else {
      // Clear timer on finish
      localStorage.removeItem(`jumpseat_timer_${jobId}`);
      // Finish
      setLocation("/queue");
    }
  };

  const handleAskClientGPT = async () => {
    if (!gptQuestion.trim() || !currentUser?.id) return;
    
    setGptLoading(true);
    setGptError("");
    setGptAnswer("");
    
    try {
      const response = await apiFetch("/api/client-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applier_id: currentUser.id,
          question: gptQuestion.trim(),
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to get answer");
      }
      
      const data = await response.json();
      setGptAnswer(data.answer || "No answer received");
    } catch (error) {
      setGptError("Failed to get answer. Please try again.");
    } finally {
      setGptLoading(false);
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
          <Button
            variant="default"
            size="sm"
            className="h-8 gap-1.5 bg-primary hover:bg-primary/90"
            onClick={() => {
              setShowClientGPT(!showClientGPT);
              if (showClientGPT) {
                setGptQuestion("");
                setGptAnswer("");
                setGptError("");
              }
            }}
            data-testid="button-client-gpt"
          >
            <MessageSquare className="w-4 h-4" />
            ClientGPT
          </Button>
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

      {/* ClientGPT Floating Panel */}
      <AnimatePresence>
        {showClientGPT && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-4 w-96 bg-card border border-border rounded-lg shadow-lg z-50"
          >
            <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30 rounded-t-lg">
              <span className="font-medium text-sm flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
                Ask about the client
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setShowClientGPT(false);
                  setGptQuestion("");
                  setGptAnswer("");
                  setGptError("");
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about their experience, skills, projects..."
                  value={gptQuestion}
                  onChange={(e) => setGptQuestion(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !gptLoading && handleAskClientGPT()}
                  className="flex-1 text-sm bg-muted/50"
                  data-testid="input-client-gpt-question"
                />
                <Button
                  size="sm"
                  onClick={handleAskClientGPT}
                  disabled={gptLoading || !gptQuestion.trim()}
                  data-testid="button-client-gpt-ask"
                >
                  {gptLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              
              {gptLoading && (
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Thinking...
                </div>
              )}
              
              {gptError && (
                <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
                  {gptError}
                </div>
              )}
              
              {gptAnswer && (
                <div className="text-sm bg-muted/30 p-3 rounded-lg max-h-64 overflow-y-auto" data-testid="text-client-gpt-answer">
                  <p className="whitespace-pre-wrap">{gptAnswer}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Review Area */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Left: AI Context & Job Info */}
        <Card className="w-1/3 flex flex-col overflow-hidden border-border/60">
          <div className="bg-muted/30 p-3 border-b border-border text-sm font-medium">
            <span>Job Details & AI Insights</span>
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