import { useState } from "react";
import { MOCK_CLIENT_INTERVIEWS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, Clock, Video, Users, CheckCircle, ExternalLink, MapPin, Download, FileText } from "lucide-react";
import { format } from "date-fns";

export default function ClientInterviewsPage() {
  const [selectedInterview, setSelectedInterview] = useState<typeof MOCK_CLIENT_INTERVIEWS[0] | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Interviews</h1>
          <p className="text-muted-foreground mt-1">Upcoming schedule and preparation.</p>
        </div>
      </div>

      {/* Calendar Grid View - Simplified for Mock */}
      <div className="grid gap-4">
        {MOCK_CLIENT_INTERVIEWS.map(interview => (
          <Card 
            key={interview.id} 
            className="bg-[#111] border-white/10 hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => setSelectedInterview(interview)}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div className="flex flex-col items-center justify-center w-16 h-16 bg-white/5 rounded-lg border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                  <span className="text-xs text-muted-foreground uppercase font-bold">{format(new Date(interview.date), "MMM")}</span>
                  <span className="text-2xl font-bold text-white">{format(new Date(interview.date), "d")}</span>
                </div>
                
                <div>
                  <h3 className="text-xl font-bold text-white">{interview.company}</h3>
                  <div className="text-muted-foreground flex items-center gap-2 mt-1">
                    <span className="font-medium text-white/80">{interview.role}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {format(new Date(interview.date), "h:mm a")}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="flex items-center justify-end gap-1.5 text-sm mb-1">
                    {interview.format === "Video" ? <Video className="w-3.5 h-3.5 text-blue-400" /> : <Users className="w-3.5 h-3.5 text-purple-400" />}
                    <span className="text-white/90">{interview.format}</span>
                  </div>
                  {interview.prepDocComplete ? (
                    <div className="text-xs text-green-500 flex items-center gap-1 justify-end">
                      <CheckCircle className="w-3 h-3" /> Prep Doc Ready
                    </div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Prep Doc Pending</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Prep Doc Modal */}
      <Dialog open={!!selectedInterview} onOpenChange={(open) => !open && setSelectedInterview(null)}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white max-w-5xl h-[90vh] flex flex-col p-0 overflow-hidden">
          <div className="p-6 border-b border-white/10 bg-[#111] flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                Prep: {selectedInterview?.role} @ {selectedInterview?.company}
              </DialogTitle>
              <div className="text-sm text-muted-foreground flex items-center gap-4 pt-1">
                <span className="flex items-center gap-1"><CalendarIcon className="w-4 h-4" /> {selectedInterview && format(new Date(selectedInterview.date), "MMMM d, yyyy")}</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {selectedInterview && format(new Date(selectedInterview.date), "h:mm a")}</span>
                <span className="flex items-center gap-1"><Video className="w-4 h-4" /> {selectedInterview?.format}</span>
              </div>
            </div>
            <div className="flex gap-2">
               <Button variant="outline" className="gap-2 border-white/10 hover:bg-white/5">
                 <Download className="w-4 h-4" /> Download PDF
               </Button>
            </div>
          </div>

          <div className="flex-1 bg-[#222] p-8 overflow-y-auto flex justify-center">
            {/* Mock PDF View */}
            <div className="bg-white text-black w-full max-w-[800px] shadow-2xl min-h-[1000px] p-12">
               <div className="border-b-2 border-primary pb-6 mb-8 flex justify-between items-start">
                 <div>
                   <h1 className="text-3xl font-bold text-gray-900">Interview Prep Guide</h1>
                   <p className="text-gray-500 mt-2 text-lg">{selectedInterview?.company} - {selectedInterview?.role}</p>
                 </div>
                 <div className="text-right text-sm text-gray-500">
                   <p>Generated for {format(new Date(), "MMM d, yyyy")}</p>
                   <p className="font-bold text-primary mt-1">CONFIDENTIAL</p>
                 </div>
               </div>

               <div className="space-y-8 font-serif">
                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-wider border-b border-gray-200 pb-1">1. Company Overview</h3>
                  <p className="text-gray-800 leading-relaxed">
                    {selectedInterview?.company} is a leading technology company focused on digital transformation.
                    They recently announced a new initiative to expand their AI capabilities.
                    <br /><br />
                    <strong>Culture Vibe:</strong> Fast-paced, innovative, collaborative.
                  </p>
                </section>

                <section className="space-y-3">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-wider border-b border-gray-200 pb-1">2. Role Responsibilities</h3>
                  <ul className="list-disc list-inside text-gray-800 space-y-2">
                    <li>Lead design initiatives for core products</li>
                    <li>Collaborate with PMs and Engineers</li>
                    <li>Mentor junior designers and establish design systems</li>
                  </ul>
                </section>

                 <section className="space-y-3">
                  <h3 className="text-lg font-bold text-primary uppercase tracking-wider border-b border-gray-200 pb-1">3. Strategic Questions</h3>
                  <ul className="list-disc list-inside text-gray-800 space-y-2">
                    <li>"I saw you recently launched X feature. How has user adoption been compared to expectations?"</li>
                    <li>"How does the design team balance speed vs quality in the current roadmap?"</li>
                    <li>"What is the biggest challenge the team is facing right now?"</li>
                  </ul>
                </section>
                
                <section className="mt-12 p-6 bg-gray-50 border border-gray-200 rounded-lg">
                   <h4 className="font-bold text-gray-900 mb-2">Interviewer Profile</h4>
                   <p className="text-gray-600 italic">"Sarah (VP of Design) values concise answers and data-driven design decisions. Be prepared to explain your 'why'."</p>
                </section>
               </div>
            </div>
          </div>

          <div className="bg-[#111] p-4 border-t border-white/10 flex justify-between items-center shrink-0">
            <span className="text-sm italic text-muted-foreground hidden md:block">We'll send a tailored thank-you email on your behalf after the interview.</span>
            <div className="flex gap-3 w-full md:w-auto">
               <Button variant="ghost" onClick={() => setSelectedInterview(null)}>Close</Button>
               <Button className="gap-2 bg-primary hover:bg-primary/90 text-white" onClick={() => window.open('https://calendly.com/wyedoyoudothis/mock-interview', '_blank')}>
                 <CalendarIcon className="w-4 h-4" /> Schedule Mock Interview
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}