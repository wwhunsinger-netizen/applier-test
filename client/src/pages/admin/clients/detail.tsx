import { useState } from "react";
import { Link, useRoute } from "wouter";
import { MOCK_CLIENTS_LIST } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Video, Users, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminClientDetailPage() {
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;
  const client = MOCK_CLIENTS_LIST.find(c => c.id === clientId) || MOCK_CLIENTS_LIST[0]; // Fallback for mock

  const [activeTab, setActiveTab] = useState("resume");
  const [isAddInterviewOpen, setIsAddInterviewOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/admin/clients">
          <Button variant="ghost" className="w-fit pl-0 hover:bg-transparent hover:text-white text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
          <Button variant="destructive" size="sm">Delete Client</Button>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-[#111] border border-white/10 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="cover-letters">Cover Letters</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
          <TabsTrigger value="interviews">Interviews</TabsTrigger>
        </TabsList>

        {/* Resume Tab */}
        <TabsContent value="resume" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Old Resume */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Original Resume</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload File</p>
                  <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                </div>
                {/* Mock Uploaded State */}
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-blue-400" />
                    <span className="text-sm truncate max-w-[150px]">{client.name.split(' ')[0]}_Old_Resume.pdf</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Eye className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Resume */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Improved Resume</CardTitle>
                {client.status === 'action_needed' ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Needs Revision</Badge>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="h-6 text-xs border-red-500/30 text-red-400 hover:text-red-300 hover:bg-red-500/10 hover:border-red-500/50"
                      onClick={() => setIsCommentsOpen(true)}
                    >
                      View {client.commentsCount} Comments
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending Review</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                  <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Upload Improved Version</p>
                </div>
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-green-400" />
                    <span className="text-sm truncate max-w-[150px]">{client.name.split(' ')[0]}_V1_Final.pdf</span>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Cover Letters Tab */}
        <TabsContent value="cover-letters" className="space-y-6">
          <Card className="bg-[#111] border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Original Cover Letter</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm">Upload Base Cover Letter</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {['A', 'B', 'C'].map((version) => (
              <Card key={version} className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Version {version}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer h-32">
                    <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                    <p className="text-xs">Upload Version {version}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Status:</span>
                    <span className="text-white">Not Uploaded</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-6">
          <Card className="bg-[#111] border-white/10">
            <CardHeader>
              <CardTitle className="text-lg">Original LinkedIn Profile (PDF)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-6 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                <p className="text-sm">Upload PDF</p>
              </div>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-3 gap-6">
            {['A', 'B', 'C'].map((version) => (
              <Card key={version} className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Optimized Version {version}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-4 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer h-32">
                    <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                    <p className="text-xs">Upload PDF</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold text-white">Scheduled Interviews</h3>
            <Button onClick={() => setIsAddInterviewOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Interview
            </Button>
          </div>

          <div className="space-y-4">
            {/* Mock Interview Item */}
            <Card className="bg-[#111] border-white/10">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row items-center justify-between p-6 gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded bg-green-500/10 flex items-center justify-center text-green-500">
                      <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-bold text-white">Google</h3>
                        <Badge variant="outline" className="border-green-500/20 text-green-500 bg-green-500/10">Prep Doc Complete</Badge>
                      </div>
                      <p className="text-sm text-white/80">Senior Product Manager</p>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Jan 5, 2025</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> 2:00 PM</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <Button variant="outline" className="flex-1 md:flex-none">Edit Interview</Button>
                    <Button className="flex-1 md:flex-none bg-white text-black hover:bg-white/90">Edit Prep Doc</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Add Interview Modal */}
          <Dialog open={isAddInterviewOpen} onOpenChange={setIsAddInterviewOpen}>
            <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Add New Interview</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Company</Label>
                    <Input className="bg-white/5 border-white/10" placeholder="e.g. Google" />
                  </div>
                  <div className="space-y-2">
                    <Label>Job Title</Label>
                    <Input className="bg-white/5 border-white/10" placeholder="e.g. Product Manager" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" className="bg-white/5 border-white/10" />
                  </div>
                  <div className="space-y-2">
                    <Label>Time</Label>
                    <Input type="time" className="bg-white/5 border-white/10" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Format</Label>
                  <Select>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Phone Screen</SelectItem>
                      <SelectItem value="video">Video Call</SelectItem>
                      <SelectItem value="panel">Panel Interview</SelectItem>
                      <SelectItem value="onsite">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Interviewer(s)</Label>
                  <Input className="bg-white/5 border-white/10" placeholder="Names and titles..." />
                </div>
                <div className="space-y-2">
                  <Label>Job Posting Link</Label>
                  <Input className="bg-white/5 border-white/10" placeholder="https://..." />
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setIsAddInterviewOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsAddInterviewOpen(false)}>Create Interview</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Comments Modal */}
          <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
            <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Client Comments - {client.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-primary">Resume - Page 1</span>
                    <span className="text-xs text-muted-foreground">Dec 16, 2:30 PM</span>
                  </div>
                  <p className="text-sm text-white/90">"The summary section feels a bit too long. Can we condense the second paragraph?"</p>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground hover:text-white">Mark Resolved</Button>
                  </div>
                </div>
                
                <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-sm text-primary">Resume - Skills</span>
                    <span className="text-xs text-muted-foreground">Dec 16, 2:45 PM</span>
                  </div>
                  <p className="text-sm text-white/90">"Please add 'Next.js' to the frontend skills list. It's missing."</p>
                  <div className="mt-3 flex justify-end">
                    <Button size="sm" variant="ghost" className="h-6 text-xs text-muted-foreground hover:text-white">Mark Resolved</Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={() => setIsCommentsOpen(false)} className="w-full">Close</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
}