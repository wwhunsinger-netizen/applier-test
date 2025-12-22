import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { MOCK_CLIENTS_LIST, Client } from "@/lib/mockData";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Video, Users, Link as LinkIcon, Linkedin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

export default function AdminClientDetailPage() {
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;

  const [clients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("admin_clients");
    return saved ? JSON.parse(saved) : [];
  });

  const client = clients.find(c => c.id === clientId);

  const handleDeleteClient = () => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone and will remove all associated documents and data.")) {
      // 1. Remove client from list
      const newClients = clients.filter(c => c.id !== clientId);
      localStorage.setItem("admin_clients", JSON.stringify(newClients));

      // 2. Remove associated files
      localStorage.removeItem(`client_files_${clientId}`);
      
      // 3. Navigate back to list
      window.location.href = "/admin/clients";
    }
  };

  if (!client) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-white mb-4">Client Not Found</h2>
        <Link href="/admin/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState("resume");
  const [isAddInterviewOpen, setIsAddInterviewOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  
  // File Persistence
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`client_files_${clientId}`);
    return saved ? JSON.parse(saved) : {};
  });

  // Load approvals
  const [clientApprovals, setClientApprovals] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem(`client_approvals_${clientId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Load comments
  const [clientComments, setClientComments] = useState<Record<string, {id: number, text: string, top: string}[]>>(() => {
    try {
      const saved = localStorage.getItem(`client_comments_${clientId}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Listen for storage updates
  useEffect(() => {
    const loadData = () => {
      try {
        const savedApprovals = localStorage.getItem(`client_approvals_${clientId}`);
        if (savedApprovals) setClientApprovals(JSON.parse(savedApprovals));
        
        const savedComments = localStorage.getItem(`client_comments_${clientId}`);
        if (savedComments) setClientComments(JSON.parse(savedComments));
      } catch (e) {
        console.error(e);
      }
    };
    
    // Check periodically since storage event only works across tabs
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, [clientId]);

  const handleFileUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Save the Data URL instead of just the filename
        const newFiles = { ...uploadedFiles, [key]: result };
        setUploadedFiles(newFiles);
        try {
          localStorage.setItem(`client_files_${clientId}`, JSON.stringify(newFiles));
        } catch (e) {
          console.error("Storage quota exceeded", e);
          // Fallback to just saving the name if too big, but this will break preview
          // Ideally we warn user
        }
      };
      
      reader.readAsDataURL(file);
    }
  };

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
          <Button variant="destructive" size="sm" onClick={handleDeleteClient}>Delete Client</Button>
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
                {!uploadedFiles['resume_original'] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload File</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, DOCX</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleFileUpload('resume_original', e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles['resume_original']?.startsWith('data:') ? 'Resume (Original).pdf' : uploadedFiles['resume_original']}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                        const newFiles = {...uploadedFiles};
                        delete newFiles['resume_original'];
                        setUploadedFiles(newFiles);
                        localStorage.setItem(`client_files_${clientId}`, JSON.stringify(newFiles));
                      }}>
                        <Upload className="w-4 h-4 rotate-45" /> {/* Use as generic remove/reset for now or just re-upload */}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Comments Section - Injected Here */}
                {clientComments['resume'] && clientComments['resume'].length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                       <AlertCircle className="w-4 h-4 text-red-400" />
                       Client Comments ({clientComments['resume'].length})
                    </h3>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                      {clientComments['resume'].map(comment => (
                        <div key={comment.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm">
                           <p className="text-white/90">{comment.text}</p>
                           <p className="text-xs text-red-400 mt-2">Location: {comment.top}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* New Resume */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg">Improved Resume</CardTitle>
                {uploadedFiles['resume_improved'] ? (
                  client.status === 'action_needed' ? (
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
                    clientApprovals['resume'] ? (
                      <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>
                    ) : (
                      <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Uploaded - Pending Client Review</Badge>
                    )
                  )
                ) : (
                  <Badge variant="outline" className="bg-white/5 text-muted-foreground border-white/10">Not Uploaded</Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFiles['resume_improved'] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload Improved Version</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleFileUpload('resume_improved', e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-green-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles['resume_improved']?.startsWith('data:') ? 'Resume (Improved).pdf' : uploadedFiles['resume_improved']}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
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
              {!uploadedFiles['cover_letter_original'] ? (
                <div className="relative p-6 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                  <p className="text-sm">Upload Base Cover Letter</p>
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer" 
                    onChange={(e) => handleFileUpload('cover_letter_original', e)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-purple-400" />
                    <span className="text-sm truncate max-w-[200px]">
                      {uploadedFiles['cover_letter_original']?.startsWith('data:') ? 'Cover Letter (Original).pdf' : uploadedFiles['cover_letter_original']}
                    </span>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0"><Download className="w-4 h-4" /></Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-3 gap-6">
            {['A', 'B', 'C'].map((version) => (
              <Card key={version} className="bg-[#111] border-white/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Version {version}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {!uploadedFiles[`cover_letter_${version}`] ? (
                    <div className="relative p-4 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer h-32">
                      <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                      <p className="text-xs">Upload Version {version}</p>
                      <input 
                        type="file" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={(e) => handleFileUpload(`cover_letter_${version}`, e)}
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10 h-32 flex flex-col items-center justify-center text-center relative group">
                       <FileText className="w-8 h-8 text-purple-400 mb-2" />
                       <p className="text-xs text-white truncate max-w-full px-2">
                         {uploadedFiles[`cover_letter_${version}`]?.startsWith('data:') ? `Version ${version}.pdf` : uploadedFiles[`cover_letter_${version}`]}
                       </p>
                       <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
                          <Button size="sm" variant="secondary"><Download className="w-4 h-4 mr-2" /> Download</Button>
                       </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Status:</span>
                    <span className={uploadedFiles[`cover_letter_${version}`] ? "text-green-400" : "text-white"}>
                      {uploadedFiles[`cover_letter_${version}`] ? "Uploaded" : "Not Uploaded"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original LinkedIn */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Original LinkedIn Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFiles['linkedin_original'] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload PDF</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleFileUpload('linkedin_original', e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-blue-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles['linkedin_original']?.startsWith('data:') ? 'LinkedIn (Original).pdf' : uploadedFiles['linkedin_original']}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                        const newFiles = {...uploadedFiles};
                        delete newFiles['linkedin_original'];
                        setUploadedFiles(newFiles);
                        localStorage.setItem(`client_files_${clientId}`, JSON.stringify(newFiles));
                      }}>
                        <Upload className="w-4 h-4 rotate-45" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optimized LinkedIn (Version A) */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">Optimized Profile (PDF)</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 {!uploadedFiles['linkedin_A'] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload Optimized Version</p>
                    <input 
                      type="file" 
                      className="absolute inset-0 opacity-0 cursor-pointer" 
                      onChange={(e) => handleFileUpload('linkedin_A', e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-green-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles['linkedin_A']?.startsWith('data:') ? 'LinkedIn (Optimized).pdf' : uploadedFiles['linkedin_A']}
                      </span>
                    </div>
                    <div className="flex gap-2">
                       <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => {
                        const newFiles = {...uploadedFiles};
                        delete newFiles['linkedin_A'];
                        setUploadedFiles(newFiles);
                        localStorage.setItem(`client_files_${clientId}`, JSON.stringify(newFiles));
                      }}>
                        <Upload className="w-4 h-4 rotate-45" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Interviews Tab */}
        <TabsContent value="interviews" className="space-y-6">
          <div className="flex justify-between items-center bg-white/5 p-4 rounded-lg border border-white/10">
             <div>
               <h3 className="font-medium text-white flex items-center gap-2">
                 <img src="https://upload.wikimedia.org/wikipedia/commons/a/a5/Google_Calendar_icon_%282020%29.svg" alt="Google Calendar" className="w-5 h-5" />
                 Interview Sync
               </h3>
               <p className="text-sm text-muted-foreground mt-1">Automatically syncing with client's Google Calendar ({client.email})</p>
             </div>
             <div className="flex items-center gap-2 text-sm text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full border border-green-400/20">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
               Connected
             </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">Upcoming Interviews (Synced)</h3>

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
                    <Button className="flex-1 md:flex-none bg-white text-black hover:bg-white/90">
                      <FileText className="w-4 h-4 mr-2" />
                      Edit Prep Doc
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

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
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
}