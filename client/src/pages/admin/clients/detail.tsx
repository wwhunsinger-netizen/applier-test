import { useState, useEffect } from "react";
import { Link, useRoute } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client, UpdateClient, ClientDocument } from "@shared/schema";
import { getClientFullName, calculateClientStatus } from "@shared/schema";
import {
  fetchClient,
  updateClient,
  requestUploadUrl,
  uploadToPresignedUrl,
  saveClientDocument,
  fetchClientDocuments,
  deleteClientDocument,
  fetchJobSamples,
  createJobSamplesBulk,
  deleteJobSample,
  scrapeJobSample,
} from "@/lib/api";
import type { JobCriteriaSample } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { deleteClient } from "@/lib/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  ArrowLeft,
  Upload,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calendar,
  Clock,
  Video,
  Users,
  Link as LinkIcon,
  Linkedin,
  Loader2,
  ChevronDown,
  X,
  Target,
  Briefcase,
  ExternalLink,
  Trash2,
  RefreshCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { useUser } from "@/lib/userContext";

export default function AdminClientDetailPage() {
  const [, params] = useRoute("/admin/clients/:id");
  const clientId = params?.id;
  const queryClient = useQueryClient();
  const { currentUser } = useUser();
  const isAdmin = currentUser?.role === "Admin";

  // All useState hooks must be declared before any early returns
  const [activeTab, setActiveTab] = useState("resume");
  const [isCommentsOpen, setIsCommentsOpen] = useState(false);
  const [isJobCriteriaOpen, setIsJobCriteriaOpen] = useState(true);
  const [isCredentialsOpen, setIsCredentialsOpen] = useState(false);

  // Job Criteria State (local editing before save)
  const [targetJobTitles, setTargetJobTitles] = useState<string[]>([]);
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [niceToHaveSkills, setNiceToHaveSkills] = useState<string[]>([]);
  const [excludeKeywords, setExcludeKeywords] = useState<string[]>([]);
  const [yearsOfExperience, setYearsOfExperience] = useState<number>(0);
  const [seniorityLevels, setSeniorityLevels] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState<string>("");
  const [activeTagField, setActiveTagField] = useState<string | null>(null);

  // File Persistence - must be before early returns
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, string>>(
    {},
  );
  const [isUploading, setIsUploading] = useState<Record<string, boolean>>({});

  // Job Samples State
  const [isJobSamplesOpen, setIsJobSamplesOpen] = useState(false);
  const [jobUrlInput, setJobUrlInput] = useState("");
  const [isAddingJobUrls, setIsAddingJobUrls] = useState(false);
  const [isScrapingAll, setIsScrapingAll] = useState(false);
  const [scrapeProgress, setScrapeProgress] = useState({
    current: 0,
    total: 0,
  });

  // Fetch client documents from database
  const { data: clientDocuments, refetch: refetchDocuments } = useQuery({
    queryKey: ["client-documents", clientId],
    queryFn: () => fetchClientDocuments(clientId!),
    enabled: !!clientId,
  });

  // Fetch job samples for this client
  const { data: jobSamples, refetch: refetchJobSamples } = useQuery({
    queryKey: ["job-samples", clientId],
    queryFn: () => fetchJobSamples(clientId!),
    enabled: !!clientId,
  });

  // Fetch client from API
  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: () => fetchClient(clientId!),
    enabled: !!clientId,
  });

  // Sync local state with fetched client data and load localStorage
  useEffect(() => {
    if (client) {
      setTargetJobTitles(client.target_job_titles || []);
      setRequiredSkills(client.required_skills || []);
      setNiceToHaveSkills(client.nice_to_have_skills || []);
      setExcludeKeywords(client.exclude_keywords || []);
      setYearsOfExperience(client.years_of_experience || 0);
      setSeniorityLevels(client.seniority_levels || []);
    }
  }, [client]);

  // Mutation to update client fields
  const updateClientMutation = useMutation({
    mutationFn: (updates: UpdateClient) => updateClient(clientId!, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      toast.success("Client updated");
    },
    onError: (error) => {
      console.error("Failed to update client:", error);
      toast.error("Failed to update client");
    },
  });

  // Sync clientDocuments to uploadedFiles for UI display (must be before early returns)
  useEffect(() => {
    if (clientDocuments) {
      const files: Record<string, string> = {};
      clientDocuments.forEach((doc) => {
        // Store the object path for rendering (files are served from /objects/...)
        files[doc.document_type] = doc.object_path;
      });
      setUploadedFiles(files);
    }
  }, [clientDocuments]);

  const handleDeleteClient = async () => {
    if (
      confirm(
        "Are you sure you want to delete this client? This action cannot be undone and will remove all associated documents and data.",
      )
    ) {
      try {
        await deleteClient(clientId!);
        toast.success("Client deleted successfully");
        window.location.href = "/admin/clients";
      } catch (error) {
        console.error("Error deleting client:", error);
        toast.error("Failed to delete client");
      }
    }
  };

  // Add tag to array
  const addTag = (
    field:
      | "targetJobTitles"
      | "requiredSkills"
      | "niceToHaveSkills"
      | "excludeKeywords",
    value: string,
  ) => {
    if (!value.trim()) return;
    const setters = {
      targetJobTitles: setTargetJobTitles,
      requiredSkills: setRequiredSkills,
      niceToHaveSkills: setNiceToHaveSkills,
      excludeKeywords: setExcludeKeywords,
    };
    const getters = {
      targetJobTitles,
      requiredSkills,
      niceToHaveSkills,
      excludeKeywords,
    };
    if (!getters[field].includes(value.trim())) {
      setters[field]([...getters[field], value.trim()]);
    }
    setNewTagInput("");
  };

  // Remove tag from array
  const removeTag = (
    field:
      | "targetJobTitles"
      | "requiredSkills"
      | "niceToHaveSkills"
      | "excludeKeywords",
    value: string,
  ) => {
    const setters = {
      targetJobTitles: setTargetJobTitles,
      requiredSkills: setRequiredSkills,
      niceToHaveSkills: setNiceToHaveSkills,
      excludeKeywords: setExcludeKeywords,
    };
    const getters = {
      targetJobTitles,
      requiredSkills,
      niceToHaveSkills,
      excludeKeywords,
    };
    setters[field](getters[field].filter((t) => t !== value));
  };

  // Check if job criteria has changed from saved values
  const isJobCriteriaDirty = () => {
    if (!client) return false;
    const arraysEqual = (a: string[] | null | undefined, b: string[]) => {
      const arr1 = a || [];
      const arr2 = b || [];
      if (arr1.length !== arr2.length) return false;
      return arr1.every((val, i) => val === arr2[i]);
    };
    return (
      !arraysEqual(client.target_job_titles, targetJobTitles) ||
      !arraysEqual(client.required_skills, requiredSkills) ||
      !arraysEqual(client.nice_to_have_skills, niceToHaveSkills) ||
      !arraysEqual(client.exclude_keywords, excludeKeywords) ||
      (client.years_of_experience || 0) !== yearsOfExperience ||
      !arraysEqual(client.seniority_levels, seniorityLevels)
    );
  };

  // Save job criteria
  const handleSaveJobCriteria = () => {
    updateClientMutation.mutate(
      {
        target_job_titles: targetJobTitles,
        required_skills: requiredSkills,
        nice_to_have_skills: niceToHaveSkills,
        exclude_keywords: excludeKeywords,
        years_of_experience: yearsOfExperience,
        seniority_levels: seniorityLevels,
      },
      {
        onSuccess: () => {
          toast.success("Job criteria saved successfully!");
        },
      },
    );
  };

  const handleFileUpload = async (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || !e.target.files[0] || !clientId) return;

    const file = e.target.files[0];
    setIsUploading((prev) => ({ ...prev, [key]: true }));

    try {
      // Step 1: Request presigned URL
      const { uploadURL, objectPath } = await requestUploadUrl({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Step 2: Upload file directly to cloud storage
      await uploadToPresignedUrl(file, uploadURL);

      // Step 3: Save document metadata to database
      await saveClientDocument(clientId, {
        document_type: key as any,
        object_path: objectPath,
        file_name: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // Step 4: Refresh documents list
      refetchDocuments();
      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error("Upload failed:", error);
      toast.error("Failed to upload file. Please try again.");
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleDownload = (fileKey: string, fileName: string) => {
    const objectPath = uploadedFiles[fileKey];
    if (!objectPath) return;

    // Open the object storage file in a new tab
    window.open(objectPath, "_blank");
  };

  const handleDeleteDocument = async (documentType: string) => {
    if (!clientId) return;

    try {
      await deleteClientDocument(clientId, documentType);
      refetchDocuments();
      toast.success("Document removed");
    } catch (error) {
      console.error("Failed to delete document:", error);
      toast.error("Failed to remove document");
    }
  };

  const handleRevisionUpload = async (
    key: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (!e.target.files || !e.target.files[0] || !clientId) return;

    const file = e.target.files[0];
    setIsUploading((prev) => ({ ...prev, [key]: true }));

    try {
      // Step 1: Request presigned URL
      const { uploadURL, objectPath } = await requestUploadUrl({
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // Step 2: Upload file directly to cloud storage
      await uploadToPresignedUrl(file, uploadURL);

      // Step 3: Save document metadata to database
      await saveClientDocument(clientId, {
        document_type: key as any,
        object_path: objectPath,
        file_name: file.name,
        content_type: file.type,
        file_size: file.size,
      });

      // Step 4: Refresh documents list
      refetchDocuments();

      // Step 5: Clear feedback and reset approval status when new document uploaded
      const feedbackKey =
        activeTab === "cover-letters" ? "cover-letter" : activeTab;
      const defaultFeedback = {
        text: "",
        status: null as "requested" | "completed" | null,
      };
      const currentFeedback = client?.document_feedback || {
        resume: { ...defaultFeedback },
        "cover-letter": { ...defaultFeedback },
        linkedin: { ...defaultFeedback },
      };
      const updatedFeedback = {
        ...currentFeedback,
        [feedbackKey]: {
          text: "",
          status: null as "requested" | "completed" | null,
        },
      };

      if (activeTab === "resume") {
        updateClientMutation.mutate({
          resume_approved: false,
          document_feedback: updatedFeedback,
        });
      } else if (activeTab === "cover-letters") {
        updateClientMutation.mutate({
          cover_letter_approved: false,
          document_feedback: updatedFeedback,
        });
      } else {
        updateClientMutation.mutate({ document_feedback: updatedFeedback });
      }

      toast.success(`${file.name} uploaded successfully`);
    } catch (error) {
      console.error("Revision upload failed:", error);
      toast.error("Failed to upload revision. Please try again.");
    } finally {
      setIsUploading((prev) => ({ ...prev, [key]: false }));
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
          <Button variant="outline">Back to Clients</Button>
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <Link href="/admin/clients">
          <Button
            variant="ghost"
            className="w-fit pl-0 hover:bg-transparent hover:text-white text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
          </Button>
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight text-white">
                {getClientFullName(client)}
              </h1>
              {(() => {
                const status = calculateClientStatus(client);
                const statusStyles: Record<string, string> = {
                  onboarding_not_started:
                    "bg-gray-500/20 text-gray-400 border-gray-500/30",
                  onboarding_in_progress:
                    "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                  active: "bg-green-500/20 text-green-400 border-green-500/30",
                  paused:
                    "bg-orange-500/20 text-orange-400 border-orange-500/30",
                  placed: "bg-primary/20 text-primary border-primary/30",
                };
                const statusLabels: Record<string, string> = {
                  onboarding_not_started: "Not Started",
                  onboarding_in_progress: "In Progress",
                  active: "Active",
                  paused: "Paused",
                  placed: "Placed",
                };
                return (
                  <Badge
                    variant="outline"
                    className={statusStyles[status]}
                    data-testid="badge-client-status"
                  >
                    {statusLabels[status]}
                  </Badge>
                );
              })()}
            </div>
            <p className="text-muted-foreground">{client.email}</p>
          </div>
          <Button variant="destructive" size="sm" onClick={handleDeleteClient}>
            Delete Client
          </Button>
        </div>
      </div>

      {/* Onboarding Status (Read-only - controlled by client approvals) */}
      <Card className="bg-[#111] border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Onboarding Status
            <span className="text-xs font-normal text-muted-foreground ml-2">
              (Updated by client)
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div
              className={`flex items-center justify-between p-3 rounded-lg border ${client.resume_approved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}
            >
              <div>
                <Label className="text-sm font-medium text-white">
                  Resume Approved
                </Label>
                <p className="text-xs text-muted-foreground">
                  Client has approved their resume
                </p>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${client.resume_approved ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted-foreground"}`}
                data-testid="status-resume-approved"
              >
                {client.resume_approved ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg border ${client.cover_letter_approved ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}
            >
              <div>
                <Label className="text-sm font-medium text-white">
                  Cover Letter Approved
                </Label>
                <p className="text-xs text-muted-foreground">
                  Client has approved cover letter
                </p>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${client.cover_letter_approved ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted-foreground"}`}
                data-testid="status-cover-letter-approved"
              >
                {client.cover_letter_approved ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
            </div>

            <div
              className={`flex items-center justify-between p-3 rounded-lg border ${client.job_criteria_signoff ? "bg-green-500/10 border-green-500/30" : "bg-white/5 border-white/10"}`}
            >
              <div>
                <Label className="text-sm font-medium text-white">
                  Job Criteria Signoff
                </Label>
                <p className="text-xs text-muted-foreground">
                  Client has approved job criteria
                </p>
              </div>
              <div
                className={`h-8 w-8 rounded-full flex items-center justify-center ${client.job_criteria_signoff ? "bg-green-500/20 text-green-400" : "bg-white/10 text-muted-foreground"}`}
                data-testid="status-job-criteria-signoff"
              >
                {client.job_criteria_signoff ? (
                  <CheckCircle2 className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
              </div>
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
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isJobCriteriaOpen ? "rotate-180" : ""}`}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Target Job Titles */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Target Job Titles
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {targetJobTitles.map((title, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-primary/20 text-primary border-primary/30 pl-2 pr-1 py-1"
                    >
                      {title}
                      <button
                        onClick={() => removeTag("targetJobTitles", title)}
                        className="ml-1 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Senior Software Engineer"
                    className="bg-white/5 border-white/10"
                    value={
                      activeTagField === "targetJobTitles" ? newTagInput : ""
                    }
                    onChange={(e) => {
                      setActiveTagField("targetJobTitles");
                      setNewTagInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("targetJobTitles", newTagInput);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTag("targetJobTitles", newTagInput)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Required Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Required Skills
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {requiredSkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-green-500/20 text-green-400 border-green-500/30 pl-2 pr-1 py-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeTag("requiredSkills", skill)}
                        className="ml-1 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. React, TypeScript"
                    className="bg-white/5 border-white/10"
                    value={
                      activeTagField === "requiredSkills" ? newTagInput : ""
                    }
                    onChange={(e) => {
                      setActiveTagField("requiredSkills");
                      setNewTagInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("requiredSkills", newTagInput);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTag("requiredSkills", newTagInput)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Nice to Have Skills */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Nice-to-Have Skills
                </Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {niceToHaveSkills.map((skill, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-blue-500/20 text-blue-400 border-blue-500/30 pl-2 pr-1 py-1"
                    >
                      {skill}
                      <button
                        onClick={() => removeTag("niceToHaveSkills", skill)}
                        className="ml-1 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. AWS, Docker"
                    className="bg-white/5 border-white/10"
                    value={
                      activeTagField === "niceToHaveSkills" ? newTagInput : ""
                    }
                    onChange={(e) => {
                      setActiveTagField("niceToHaveSkills");
                      setNewTagInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("niceToHaveSkills", newTagInput);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTag("niceToHaveSkills", newTagInput)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Exclude Keywords */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-white">
                  Exclude Keywords
                </Label>
                <p className="text-xs text-muted-foreground">
                  Jobs with these keywords will be skipped
                </p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {excludeKeywords.map((keyword, idx) => (
                    <Badge
                      key={idx}
                      variant="secondary"
                      className="bg-red-500/20 text-red-400 border-red-500/30 pl-2 pr-1 py-1"
                    >
                      {keyword}
                      <button
                        onClick={() => removeTag("excludeKeywords", keyword)}
                        className="ml-1 hover:text-white"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g. Junior, Intern"
                    className="bg-white/5 border-white/10"
                    value={
                      activeTagField === "excludeKeywords" ? newTagInput : ""
                    }
                    onChange={(e) => {
                      setActiveTagField("excludeKeywords");
                      setNewTagInput(e.target.value);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addTag("excludeKeywords", newTagInput);
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addTag("excludeKeywords", newTagInput)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Experience & Seniority */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">
                    Years of Experience
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    value={yearsOfExperience}
                    onChange={(e) =>
                      setYearsOfExperience(parseInt(e.target.value) || 0)
                    }
                    className="bg-white/5 border-white/10"
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-sm font-medium text-white">
                    Seniority Levels (select multiple)
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { value: "entry", label: "Entry Level" },
                      { value: "mid", label: "Mid Level" },
                      { value: "senior", label: "Senior" },
                      { value: "lead", label: "Lead / Principal" },
                      { value: "director", label: "Director" },
                      { value: "executive", label: "Executive" },
                    ].map((level) => (
                      <Badge
                        key={level.value}
                        variant={
                          seniorityLevels.includes(level.value)
                            ? "default"
                            : "outline"
                        }
                        className={`cursor-pointer transition-all ${
                          seniorityLevels.includes(level.value)
                            ? "bg-primary text-primary-foreground hover:bg-primary/80"
                            : "bg-white/5 border-white/20 hover:bg-white/10"
                        }`}
                        onClick={() => {
                          if (seniorityLevels.includes(level.value)) {
                            setSeniorityLevels(
                              seniorityLevels.filter((l) => l !== level.value),
                            );
                          } else {
                            setSeniorityLevels([
                              ...seniorityLevels,
                              level.value,
                            ]);
                          }
                        }}
                      >
                        {seniorityLevels.includes(level.value) && (
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                        )}
                        {level.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4 border-t border-white/10">
                <Button
                  onClick={handleSaveJobCriteria}
                  disabled={
                    updateClientMutation.isPending || !isJobCriteriaDirty()
                  }
                  className={`${isJobCriteriaDirty() ? "bg-primary hover:bg-primary/90" : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                >
                  {updateClientMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : isJobCriteriaDirty() ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Save Job Criteria
                    </>
                  ) : (
                    "No Changes"
                  )}
                </Button>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Job Samples Section */}
      <Collapsible open={isJobSamplesOpen} onOpenChange={setIsJobSamplesOpen}>
        <Card className="bg-[#111] border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="pb-4 cursor-pointer hover:bg-white/5 transition-colors rounded-t-lg">
              <CardTitle className="text-lg flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Briefcase className="w-5 h-5 text-primary" />
                  Job Samples
                  {jobSamples && jobSamples.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {jobSamples.length}
                    </Badge>
                  )}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-muted-foreground transition-transform ${isJobSamplesOpen ? "rotate-180" : ""}`}
                />
              </CardTitle>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-6">
              {/* Add Job URLs */}
              <div className="space-y-3">
                <Label className="text-sm font-medium text-white">
                  Add Job URLs
                </Label>
                <p className="text-xs text-muted-foreground">
                  Paste job posting URLs (one per line) to add them for client
                  calibration.
                </p>
                <Textarea
                  placeholder="https://example.com/job/123&#10;https://example.com/job/456&#10;https://example.com/job/789"
                  value={jobUrlInput}
                  onChange={(e) => setJobUrlInput(e.target.value)}
                  className="bg-white/5 border-white/10 min-h-[120px] font-mono text-sm"
                />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    {jobUrlInput.trim()
                      ? jobUrlInput
                          .trim()
                          .split("\n")
                          .filter((u) => u.trim()).length
                      : 0}{" "}
                    URLs
                  </span>
                  <Button
                    onClick={async () => {
                      const urls = jobUrlInput
                        .trim()
                        .split("\n")
                        .filter((u) => u.trim());
                      if (urls.length === 0) {
                        toast.error("Please enter at least one URL");
                        return;
                      }
                      setIsAddingJobUrls(true);
                      try {
                        await createJobSamplesBulk(clientId!, urls);
                        toast.success(`Added ${urls.length} job samples`);
                        setJobUrlInput("");
                        refetchJobSamples();
                      } catch (error) {
                        console.error("Failed to add job samples:", error);
                        toast.error("Failed to add job samples");
                      } finally {
                        setIsAddingJobUrls(false);
                      }
                    }}
                    disabled={isAddingJobUrls || !jobUrlInput.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isAddingJobUrls ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add URLs
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Job Samples List */}
              {jobSamples && jobSamples.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium text-white">
                      Added Job Samples ({jobSamples.length})
                    </Label>
                    {jobSamples.some(
                      (s: JobCriteriaSample) => s.scrape_status === "pending",
                    ) && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-500 border-blue-500/30 hover:bg-blue-500/10"
                        data-testid="button-scrape-all"
                        disabled={isScrapingAll}
                        onClick={async () => {
                          const pendingSamples = jobSamples.filter(
                            (s: JobCriteriaSample) =>
                              s.scrape_status === "pending",
                          );
                          setIsScrapingAll(true);
                          setScrapeProgress({
                            current: 0,
                            total: pendingSamples.length,
                          });
                          let completed = 0;
                          let failed = 0;
                          for (const sample of pendingSamples) {
                            try {
                              await scrapeJobSample(sample.id);
                              completed++;
                              setScrapeProgress({
                                current: completed + failed,
                                total: pendingSamples.length,
                              });
                              refetchJobSamples();
                            } catch (error) {
                              console.error(
                                `Failed to scrape ${sample.id}:`,
                                error,
                              );
                              failed++;
                              setScrapeProgress({
                                current: completed + failed,
                                total: pendingSamples.length,
                              });
                            }
                          }
                          setIsScrapingAll(false);
                          if (failed === 0) {
                            toast.success(
                              `Scraped ${completed} jobs successfully`,
                            );
                          } else {
                            toast.warning(
                              `Scraped ${completed} jobs, ${failed} failed`,
                            );
                          }
                        }}
                      >
                        {isScrapingAll ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scraping {scrapeProgress.current}/
                            {scrapeProgress.total}...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Scrape All Pending
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2 max-h-[400px] overflow-y-auto">
                    {jobSamples.map((sample: JobCriteriaSample) => (
                      <div
                        key={sample.id}
                        className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10 group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-white truncate">
                              {!sample.title ? (
                                <span className="text-muted-foreground italic">
                                  Pending...
                                </span>
                              ) : (
                                sample.title
                              )}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                sample.scrape_status === "complete"
                                  ? "bg-green-500/10 text-green-500 border-green-500/20"
                                  : sample.scrape_status === "failed"
                                    ? "bg-red-500/10 text-red-500 border-red-500/20"
                                    : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                              }
                            >
                              {sample.scrape_status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                              {sample.company_name &&
                                `${sample.company_name} • `}
                              {sample.source_url}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {sample.scrape_status === "pending" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-blue-500 hover:text-blue-400 hover:bg-blue-500/10"
                              data-testid={`button-scrape-${sample.id}`}
                              onClick={async () => {
                                try {
                                  toast.info("Scraping job details...");
                                  await scrapeJobSample(sample.id);
                                  toast.success("Job details scraped");
                                  refetchJobSamples();
                                } catch (error) {
                                  console.error(
                                    "Failed to scrape job sample:",
                                    error,
                                  );
                                  toast.error("Failed to scrape job details");
                                }
                              }}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            onClick={() =>
                              window.open(sample.source_url, "_blank")
                            }
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                            onClick={async () => {
                              try {
                                await deleteJobSample(sample.id);
                                toast.success("Job sample deleted");
                                refetchJobSamples();
                              } catch (error) {
                                console.error(
                                  "Failed to delete job sample:",
                                  error,
                                );
                                toast.error("Failed to delete job sample");
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(!jobSamples || jobSamples.length === 0) && (
                <div className="text-center py-8 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No job samples added yet</p>
                  <p className="text-xs mt-1">
                    Add job URLs above to create samples for client calibration
                  </p>
                </div>
              )}
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>

      {/* Main Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="bg-[#111] border border-white/10 p-1 w-full justify-start overflow-x-auto">
          <TabsTrigger value="resume">Resume</TabsTrigger>
          <TabsTrigger value="cover-letters">Cover Letters</TabsTrigger>
          <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
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
                {isUploading["resume_original"] ? (
                  <div className="p-8 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center text-center bg-primary/5">
                    <Loader2 className="w-8 h-8 text-primary mb-2 animate-spin" />
                    <p className="text-sm font-medium text-primary">
                      Uploading...
                    </p>
                    <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                ) : !uploadedFiles["resume_original"] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload File</p>
                    <p className="text-xs text-muted-foreground">
                      PDF, DOC, DOCX
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("resume_original", e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles["resume_original"]?.startsWith("data:")
                          ? "Resume (Original).pdf"
                          : uploadedFiles["resume_original"]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteDocument("resume_original")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handleDownload(
                            "resume_original",
                            "Resume (Original).pdf",
                          )
                        }
                      >
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
                {uploadedFiles["resume_improved"] ? (
                  client.resume_approved ? (
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-500 border-green-500/20"
                    >
                      Approved
                    </Badge>
                  ) : client?.document_feedback?.resume?.status ===
                    "requested" ? (
                    <Badge
                      variant="destructive"
                      className="bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20"
                    >
                      Changes Requested
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                    >
                      Uploaded - Pending Client Review
                    </Badge>
                  )
                ) : (
                  <Badge
                    variant="outline"
                    className="bg-white/5 text-muted-foreground border-white/10"
                  >
                    Not Uploaded
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {isUploading["resume_improved"] ? (
                  <div className="p-8 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center text-center bg-primary/5">
                    <Loader2 className="w-8 h-8 text-primary mb-2 animate-spin" />
                    <p className="text-sm font-medium text-primary">
                      Uploading...
                    </p>
                    <div className="w-full max-w-[200px] h-1.5 bg-white/10 rounded-full mt-3 overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full animate-pulse"
                        style={{ width: "60%" }}
                      />
                    </div>
                  </div>
                ) : !uploadedFiles["resume_improved"] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Upload Improved Version
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("resume_improved", e)}
                    />
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-green-400" />
                        <span className="text-sm truncate max-w-[150px]">
                          {uploadedFiles["resume_improved"]?.startsWith("data:")
                            ? "Resume (Improved).pdf"
                            : uploadedFiles["resume_improved"]}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleDeleteDocument("resume_improved")
                          }
                          data-testid="button-delete-resume-improved"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0"
                          onClick={() =>
                            handleDownload(
                              "resume_improved",
                              "Resume (Improved).pdf",
                            )
                          }
                          data-testid="button-download-resume-improved"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Replace Resume Section */}
                    <div className="relative border-2 border-dashed border-white/10 rounded bg-[#0a0a0a] hover:bg-white/5 transition-colors cursor-pointer p-3 flex items-center justify-center gap-2">
                      <Upload className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Replace with new version
                      </span>
                      <input
                        type="file"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => handleFileUpload("resume_improved", e)}
                        data-testid="input-replace-resume-improved"
                      />
                    </div>
                  </div>
                )}

                {/* Client Feedback Section */}
                {client?.document_feedback?.resume?.text && (
                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-400" />
                        Client Feedback
                      </h3>
                      {client?.document_feedback?.resume?.status ===
                        "requested" && (
                        <Badge
                          variant="outline"
                          className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
                        >
                          Revisions Requested
                        </Badge>
                      )}
                    </div>

                    <div className="p-3 bg-red-500/5 border border-red-500/20 rounded-lg text-sm mb-6">
                      <p className="text-white/90 whitespace-pre-wrap">
                        {client.document_feedback.resume.text}
                      </p>
                    </div>

                    {/* Upload Revised Version Section */}
                    <div className="bg-white/5 rounded-lg border border-white/10 p-4">
                      <h4 className="text-sm font-bold text-white mb-2">
                        Upload Revised Version
                      </h4>
                      <p className="text-xs text-muted-foreground mb-3">
                        Uploading a new version will resolve all feedback and
                        reset the status to 'Pending Review'.
                      </p>

                      <div className="relative border-2 border-dashed border-white/10 rounded bg-[#0a0a0a] hover:bg-white/5 transition-colors cursor-pointer p-4 flex items-center justify-center gap-3">
                        <Upload className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">
                          Select PDF File
                        </span>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            handleRevisionUpload("resume_improved", e)
                          }
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
          <div className="grid md:grid-cols-2 gap-6">
            {/* Narrative Cover Letter (A) */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Narrative
                  <Badge variant="outline" className="text-xs font-normal">
                    cover_letter_A
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isUploading["cover_letter_A"] ? (
                  <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center text-center bg-primary/5 h-32">
                    <Loader2 className="w-5 h-5 text-primary mb-2 animate-spin" />
                    <p className="text-xs font-medium text-primary">
                      Uploading...
                    </p>
                  </div>
                ) : !uploadedFiles["cover_letter_A"] ? (
                  <div className="relative p-4 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer h-32">
                    <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                    <p className="text-xs">Upload Narrative Cover Letter</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("cover_letter_A", e)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-400" />
                        <p className="text-xs text-white truncate max-w-[150px]">
                          Narrative.pdf
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() =>
                              handleDeleteDocument("cover_letter_A")
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleDownload(
                              "cover_letter_A",
                              "Cover Letter (Narrative).pdf",
                            )
                          }
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="relative p-2 border-2 border-dashed border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">
                        <Upload className="w-3 h-3 text-muted-foreground mr-1" />
                        <p className="text-[10px] text-muted-foreground">
                          Replace
                        </p>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            handleFileUpload("cover_letter_A", e)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status:</span>
                  <span
                    className={
                      uploadedFiles["cover_letter_A"]
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {uploadedFiles["cover_letter_A"]
                      ? "Uploaded"
                      : "Not Uploaded"}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Exact Match Cover Letter (B) */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  Exact Match
                  <Badge variant="outline" className="text-xs font-normal">
                    cover_letter_B
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isUploading["cover_letter_B"] ? (
                  <div className="p-4 border-2 border-dashed border-primary/50 rounded-lg flex flex-col items-center justify-center text-center bg-primary/5 h-32">
                    <Loader2 className="w-5 h-5 text-primary mb-2 animate-spin" />
                    <p className="text-xs font-medium text-primary">
                      Uploading...
                    </p>
                  </div>
                ) : !uploadedFiles["cover_letter_B"] ? (
                  <div className="relative p-4 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer h-32">
                    <Upload className="w-5 h-5 text-muted-foreground mb-2" />
                    <p className="text-xs">Upload Exact Match Cover Letter</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("cover_letter_B", e)}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-400" />
                        <p className="text-xs text-white truncate max-w-[150px]">
                          Exact Match.pdf
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {isAdmin && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() =>
                              handleDeleteDocument("cover_letter_B")
                            }
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() =>
                            handleDownload(
                              "cover_letter_B",
                              "Cover Letter (Exact Match).pdf",
                            )
                          }
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                    {isAdmin && (
                      <div className="relative p-2 border-2 border-dashed border-white/10 rounded flex items-center justify-center hover:bg-white/5 transition-colors cursor-pointer">
                        <Upload className="w-3 h-3 text-muted-foreground mr-1" />
                        <p className="text-[10px] text-muted-foreground">
                          Replace
                        </p>
                        <input
                          type="file"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={(e) =>
                            handleFileUpload("cover_letter_B", e)
                          }
                        />
                      </div>
                    )}
                  </div>
                )}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Status:</span>
                  <span
                    className={
                      uploadedFiles["cover_letter_B"]
                        ? "text-green-400"
                        : "text-white"
                    }
                  >
                    {uploadedFiles["cover_letter_B"]
                      ? "Uploaded"
                      : "Not Uploaded"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* LinkedIn Tab */}
        <TabsContent value="linkedin" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Original LinkedIn */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">
                  Original LinkedIn Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFiles["linkedin_original"] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">Upload PDF</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("linkedin_original", e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-blue-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles["linkedin_original"]?.startsWith("data:")
                          ? "LinkedIn (Original).pdf"
                          : uploadedFiles["linkedin_original"]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() =>
                          handleDeleteDocument("linkedin_original")
                        }
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Optimized LinkedIn (Version A) */}
            <Card className="bg-[#111] border-white/10">
              <CardHeader>
                <CardTitle className="text-lg">
                  Optimized Profile (PDF)
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {!uploadedFiles["linkedin_A"] ? (
                  <div className="relative p-8 border-2 border-dashed border-white/10 rounded-lg flex flex-col items-center justify-center text-center hover:bg-white/5 transition-colors cursor-pointer group">
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium">
                      Upload Optimized Version
                    </p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => handleFileUpload("linkedin_A", e)}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded border border-white/10">
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-5 h-5 text-green-400" />
                      <span className="text-sm truncate max-w-[150px]">
                        {uploadedFiles["linkedin_A"]?.startsWith("data:")
                          ? "LinkedIn (Optimized).pdf"
                          : uploadedFiles["linkedin_A"]}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleDeleteDocument("linkedin_A")}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Comments Modal */}
      <Dialog open={isCommentsOpen} onOpenChange={setIsCommentsOpen}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Client Comments - {getClientFullName(client)}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-primary">
                  Resume - Page 1
                </span>
                <span className="text-xs text-muted-foreground">
                  Dec 16, 2:30 PM
                </span>
              </div>
              <p className="text-sm text-white/90">
                "The summary section feels a bit too long. Can we condense the
                second paragraph?"
              </p>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-muted-foreground hover:text-white"
                >
                  Mark Resolved
                </Button>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-lg border border-white/10">
              <div className="flex justify-between items-start mb-2">
                <span className="font-bold text-sm text-primary">
                  Resume - Skills
                </span>
                <span className="text-xs text-muted-foreground">
                  Dec 16, 2:45 PM
                </span>
              </div>
              <p className="text-sm text-white/90">
                "Please add 'Next.js' to the frontend skills list. It's
                missing."
              </p>
              <div className="mt-3 flex justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 text-xs text-muted-foreground hover:text-white"
                >
                  Mark Resolved
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsCommentsOpen(false)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Eye({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
