import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client, UpdateClient } from "@shared/schema";
import { getClientFullName, calculateClientStatus } from "@shared/schema";
import { fetchClient, updateClient } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ArrowLeft, Upload, FileText, Download, CheckCircle2, AlertCircle, Plus, Calendar, Clock, Video, Users, Link as LinkIcon, Linkedin, Loader2, ChevronDown, X, Target, Mail, Lock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export default function AdminClientDetailPage() {
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;
  const queryClient = useQueryClient();

  // All useState hooks must be declared before any early returns
  const [activeTab, setActiveTab] = useState("resume");
  const [isAddInterviewOpen, setIsAddInterviewOpen] = useState(false);
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isJobCriteriaOpen, setIsJobCriteriaOpen] = useState(true);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);
  
  // Job Criteria State (local editing before save)
  const [targetJobTitles, setTargetJobTitles] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [seniorityLevel, setSeniorityLevel] = useState<string>("");
  const [dailyApplicationTarget, setDailyApplicationTarget] = useState<number>(10);
  const [onboardingTranscript, setOnboardingTranscript] = useState<string>("");
  const [clientGmail, setClientGmail] = useState<string>("");
  const [clientGmailPassword, setClientGmailPassword] = useState<string>("");
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [activeTagField, setActiveTagField] = useState<string | null>(null);
  
  // File Persistence - must be before early returns
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>({});
  const [clientComments, setClientComments] = useState<Record<string, {id: number, text: string, top: string}[]>>({});

  // Fetch client from API
  const { data: client, isLoading, error } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => fetchClient(clientId!),
    enabled: !!clientId
  });
  
  // Sync local state with fetched client data and load localStorage
  useEffect(() => {
    if (client) {
      setTargetJobTitles(client.target_job_titles || []);
      setRequiredSkills(client.required_skills || []);
      setNiceToHaveSkills(client.nice_to_have_skills || []);
      setExcludeKeywords(client.exclude_keywords || []);
      setYearsOfExperience(client.years_of_experience || 0);
      setSeniorityLevel(client.seniority_level || "");
      setDailyApplicationTarget(client.daily_application_target || 10);
      setOnboardingTranscript(client.onboarding_transcript || "");
      setClientGmail(client.client_gmail || "");
      setClientGmailPassword(client.client_gmail_password || "");
    }
  }, [client]);
  
  // Load localStorage data for files and comments
  useEffect(() => {
    if (clientId) {
      try {
        const savedFiles = localStorage.getItem(`client_files_${clientId}`);
        if (savedFiles) setUploadedFiles(JSON.parse(savedFiles));
        
        const savedComments = localStorage.getItem(`client_comments_${clientId}`);
        if (savedComments) setClientComments(JSON.parse(savedComments));
      } catch (e) {
        console.error('Error loading localStorage data:', e);
      }
    }
  }, [clientId]);
  
  // Mutation to update client fields
  const updateClientMutation = useMutation({
    mutationFn: (updates: UpdateClient) => 
      updateClient(clientId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client', clientId] });
      toast.success("Client updated");
    },
    onError: (error) => {
      console.error('Failed to update client:', error);
      toast.error("Failed to update client");
    }
  });

  const handleDeleteClient = () => {
    if (confirm("Are you sure you want to delete this client? This action cannot be undone and will remove all associated documents and data.")) {
      // TODO: Implement delete API call
      alert("Delete functionality not yet implemented");
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Loading client...</p>
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="p-8 text-center">
        <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold text-white mb-4">Client Not Found</h2>
        <Link href="/admin/clients">
          <Button>Back to Clients</Button>
        </Link>
      </div>
    );
  }

  // Add tag to array
  const addTag = (field: 'targetJobTitles' | 'requiredSkills' | 'niceToHaveSkills' | 'excludeKeywords', value: string) => {
    if (!value.trim()) return;
    const setters = {
      targetJobTitles: setTargetJobTitles,
      requiredSkills: setRequiredSkills,
      niceToHaveSkills: setNiceToHaveSkills,
      excludeKeywords: setExcludeKeywords
    };
    const getters = {
      targetJobTitles,
      requiredSkills,
      niceToHaveSkills,
      excludeKeywords
    };
    if (!getters[field].includes(value.trim())) {
      setters[field]([...getters[field], value.trim()]);
    }
    setNewTagInput("");
  };

  // Remove tag from array
  const removeTag = (field: 'targetJobTitles' | 'requiredSkills' | 'niceToHaveSkills' | 'excludeKeywords', value: string) => {
    const setters = {
      targetJobTitles: setTargetJobTitles,
      requiredSkills: setRequiredSkills,
      niceToHaveSkills: setNiceToHaveSkills,
      excludeKeywords: setExcludeKeywords
    };
    const getters = {
      targetJobTitles,
      requiredSkills,
      niceToHaveSkills,
      excludeKeywords
    };
    setters[field](getters[field].filter(t => t !== value));
  };

  // Save job criteria
  const handleSaveJobCriteria = () => {
    updateClientMutation.mutate({
      target_job_titles: targetJobTitles,
      required_skills: requiredSkills,
      nice_to_have_skills: niceToHaveSkills,
      exclude_keywords: excludeKeywords,
      years_of_experience: yearsOfExperience,
      seniority_level: seniorityLevel,
      daily_application_target: dailyApplicationTarget,
      onboarding_transcript: onboardingTranscript,
      client_gmail: clientGmail,
      client_gmail_password: clientGmailPassword
    });
  };

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

  const handleDownload = (fileKey: string, fileName: string) => {
    const fileData = uploadedFiles[fileKey];
    if (!fileData) return;

    const link = document.createElement('a');
    link.href = fileData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRevisionUpload = (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        
        // 1. Update the file (supersede previous)
        const newFiles = { ...uploadedFiles, [key]: result };
        setUploadedFiles(newFiles);
        localStorage.setItem(`client_files_${clientId}`, JSON.stringify(newFiles));

        // 2. Clear comments (resolve them)
        const newComments = { ...clientComments, [activeTab]: [] };
        setClientComments(newComments);
        localStorage.setItem(`client_comments_${clientId}`, JSON.stringify(newComments));

        // 3. Reset approval status via API - when uploading a new revision, reset the approval
        if (activeTab === 'resume') {
          updateClientMutation.mutate({ resume_approved: false });
        } else if (activeTab === 'cover-letters') {
          updateClientMutation.mutate({ cover_letter_approved: false });
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">{getClientFullName(client)}</h1>
              {(() => {
                const status = calculateClientStatus(client);
                const statusStyles: Record<string, string> = {
                  'onboarding_not_started': 'bg-gray-500/20 text-gray-400 border-gray-500/30',
                  'onboarding_in_progress': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
                  'active': 'bg-green-500/20 text-green-400 border-green-500/30',
                  'paused': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  'placed': 'bg-primary/20 text-primary border-primary/30'
                };
                const statusLabels: Record<string, string> = {
                  'onboarding_not_started': 'Not Started',
                  'onboarding_in_progress': 'In Progress',
                  'active': 'Active',
                  'paused': 'Paused',
                  'placed': 'Placed'
                };
                return (
                  <Badge variant="outline" className={statusStyles[status]} data-testid="badge-client-status">
                    {statusLabels[status]}
                  </Badge>
                );
              })()}
            </div>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDeleteClient}>Delete Client</Button>
        </div>
      </div>

      {/* Onboarding Status Controls */}
      <Card className="bg-[#111] border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Onboarding Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <Label className="text-sm font-medium text-white">Resume Approved</Label>
                <p className="text-xs text-muted-foreground">Client has approved their resume</p>
              </div>
              <Switch
                checked={client.resume_approved ?? false}
                onCheckedChange={(checked) => updateClientMutation.mutate({ resume_approved: checked })}
                disabled={updateClientMutation.isPending}
                data-testid="switch-resume-approved"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <Label className="text-sm font-medium text-white">Cover Letter Approved</Label>
                <p className="text-xs text-muted-foreground">Client has approved cover letter</p>
              </div>
              <Switch
                checked={client.cover_letter_approved ?? false}
                onCheckedChange={(checked) => updateClientMutation.mutate({ cover_letter_approved: checked })}
                disabled={updateClientMutation.isPending}
                data-testid="switch-cover-letter-approved"
              />
            </div>
            
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
              <div>
                <Label className="text-sm font-medium text-white">Job Criteria Signoff</Label>
                <p className="text-xs text-muted-foreground">Client has approved job criteria</p>
              </div>
              <Switch
                checked={client.job_criteria_signoff ?? false}
                onCheckedChange={(checked) => updateClientMutation.mutate({ job_criteria_signoff: checked })}
                disabled={updateClientMutation.isPending}
                data-testid="switch-job-criteria-signoff"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Job Criteria & Settings */}
      <Collapsible open={isJobCriteriaOpen} onOpenChange={setIsJobCriteriaOpen}>
        <Card className="bg-[#111] border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-primary" />
                  Job Criteria & Settings
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${isJobCriteriaOpen ? 'rotate-180' : ''}`} />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Target Job Titles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Target Job Titles</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {targetJobTitles.map((title, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-primary/20 text-primary border-primary/30 pl-2 pr-1 py-1">
                      {title}
                      <button onClick={() => removeTag('targetJobTitles', title)} className="ml-1 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Senior Software Engineer"
                    className="bg-white/5 border-white/10"
                    value={activeTagField === 'targetJobTitles' ? newTagInput : ''}
                    onChange={(e) => { setActiveTagField('targetJobTitles'); setNewTagInput(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('targetJobTitles', newTagInput); } }}
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag('targetJobTitles', newTagInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Required Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {requiredSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30 pl-2 pr-1 py-1">
                      {skill}
                      <button onClick={() => removeTag('requiredSkills', skill)} className="ml-1 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. React, TypeScript"
                    className="bg-white/5 border-white/10"
                    value={activeTagField === 'requiredSkills' ? newTagInput : ''}
                    onChange={(e) => { setActiveTagField('requiredSkills'); setNewTagInput(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('requiredSkills', newTagInput); } }}
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag('requiredSkills', newTagInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Nice to Have Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Nice-to-Have Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {niceToHaveSkills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-blue-500/20 text-blue-400 border-blue-500/30 pl-2 pr-1 py-1">
                      {skill}
                      <button onClick={() => removeTag('niceToHaveSkills', skill)} className="ml-1 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. AWS, Docker"
                    className="bg-white/5 border-white/10"
                    value={activeTagField === 'niceToHaveSkills' ? newTagInput : ''}
                    onChange={(e) => { setActiveTagField('niceToHaveSkills'); setNewTagInput(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('niceToHaveSkills', newTagInput); } }}
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag('niceToHaveSkills', newTagInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Exclude Keywords</Label>
                <p className="text-xs text-muted-foreground">Jobs with these keywords will be skipped</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {excludeKeywords.map((keyword, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-red-500/20 text-red-400 border-red-500/30 pl-2 pr-1 py-1">
                      {keyword}
                      <button onClick={() => removeTag('excludeKeywords', keyword)} className="ml-1 hover:text-white">
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input 
                    placeholder="e.g. Junior, Intern"
                    className="bg-white/5 border-white/10"
                    value={activeTagField === 'excludeKeywords' ? newTagInput : ''}
                    onChange={(e) => { setActiveTagField('excludeKeywords'); setNewTagInput(e.target.value); }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag('excludeKeywords', newTagInput); } }}
                  />
                  <Button variant="outline" size="sm" onClick={() => addTag('excludeKeywords', newTagInput)}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Experience & Seniority */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Years of Experience</Label>
                  <Input 
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    onChange={(e) => setYearsOfExperience(parseInt(e.target.value) || 0)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Seniority Level</Label>
                  <Select value={seniorityLevel} onValueChange={setSeniorityLevel}>
                    <SelectTrigger className="bg-white/5 border-white/10">
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior</SelectItem>
                      <SelectItem value="lead">Lead / Principal</SelectItem>
                      <SelectItem value="director">Director</SelectItem>
                      <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Daily Application Target</Label>
                  <Input 
                    type="number"
                    min="1"
                    value={dailyApplicationTarget}
                    onChange={(e) => setDailyApplicationTarget(parseInt(e.target.value) || 10)}
                    className="bg-white/5 border-white/10"
                  />
                </div>
              </div>

              {/* Onboarding Transcript */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">Onboarding Transcript / Notes</Label>
                <Textarea 
                  placeholder="Notes from onboarding call, preferences, special requirements..."
                  value={onboardingTranscript}
                  onChange={(e) => setOnboardingTranscript(e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[100px]"
                />
              </div>

              {/* Client Gmail Credentials */}
              <div className="border-t border-white/10 pt-6">
                <div className="flex items-center gap-2 mb-4">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <Label className="text-sm font-medium text-white">Client Gmail Credentials</Label>
                  <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                    <Lock className="w-3 h-3 mr-1" /> Sensitive
                  </Badge>
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Gmail Address</Label>
                    <Input 
                      type="email"
                      placeholder="client@gmail.com"
                      value={clientGmail}
                      onChange={(e) => setClientGmail(e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Gmail Password / App Password</Label>
                    <Input 
                      type="password"
                      placeholder="••••••••"
                      value={clientGmailPassword}
                      onChange={(e) => setClientGmailPassword(e.target.value)}
                      className="bg-white/5 border-white/10"
                    />
                    <p className="text-xs text-yellow-500">Note: For production, implement secure credential storage</p>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <Button 
                  onClick={handleSaveJobCriteria}
                  disabled={updateClientMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  {updateClientMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Job Criteria'
                  )}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

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
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownload('resume_original', 'Resume (Original).pdf')}>
                        <Download className="w-4 h-4" />
                      </Button>
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
                  client.resume_approved ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Approved</Badge>
                  ) : clientComments['resume'] && clientComments['resume'].length > 0 ? (
                    <Badge variant="destructive" className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20">Changes Requested</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Uploaded - Pending Client Review</Badge>
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
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => handleDownload('resume_improved', 'Resume (Improved).pdf')}>
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Client Feedback Section */}
                {clientComments['resume'] && clientComments['resume'].length > 0 && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                         <AlertCircle className="w-4 h-4 text-red-400" />
                         Client Feedback ({clientComments['resume'].length})
                      </h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar mb-6">
                      {clientComments['resume'].map(comment => (
                        <div key={comment.id} className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm">
                           <p className="text-white/90">{comment.text}</p>
                           {comment.top !== "0%" && (
                             <p className="text-xs text-red-400 mt-2">Location: {comment.top}</p>
                           )}
                        </div>
                      ))}
                    </div>

                    {/* Upload Revised Version Section */}
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                      <h4 className="text-sm font-bold text-white mb-2">Upload Revised Version</h4>
                      <p className="text-xs text-muted-foreground mb-3">Uploading a new version will resolve all comments and reset the status to 'Pending Review'.</p>
                      
                      <div className="relative border-2 border-dashed border-white/10 rounded bg-[#0a0a0a] hover:bg-white/5 transition-colors cursor-pointer p-4 flex items-center justify-center gap-3">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">Select PDF File</span>
                        <input 
                          type="file" 
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) => handleRevisionUpload('resume_improved', e)}
                        />
                      </div>
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
            <DialogTitle>Client Comments - {getClientFullName(client)}</DialogTitle>
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