import { useState, useEffect } from "react";
import { formatDistanceToNow, differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building,
  Clock,
  CheckCircle,
  ExternalLink,
  Briefcase,
  Linkedin,
  MessageSquare,
  Loader2,
  ChevronDown,
  Mail,
  UserPlus,
  Send,
  X,
  Plus,
  Search,
  Sparkles,
  CalendarCheck,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApplications, apiFetch } from "@/lib/api";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import type { Application } from "@shared/schema";

export default function AppliedPage() {
  const { currentUser } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Manual LinkedIn entry state
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    job_title: "",
    company_name: "",
    job_url: "",
  });

  // Get assigned client from applier's assignments
  const [assignedClientId, setAssignedClientId] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Applier") return;

    // Fetch assigned client
    apiFetch(`/api/appliers/${currentUser.id}`)
      .then((res) => res.json())
      .then((applier) => {
        if (applier.assigned_client_ids?.length > 0) {
          setAssignedClientId(applier.assigned_client_ids[0]);
        }
      })
      .catch(console.error);

    setIsLoading(true);

    fetchApplications({ applier_id: currentUser.id })
      .then((apps) => {
        setApplications(apps);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  // Filter applications by search and sort newest first
  const filteredApplications = applications
    .filter((app) => {
      if (!search.trim()) return true;
      const searchLower = search.toLowerCase();
      return (
        app.company_name?.toLowerCase().includes(searchLower) ||
        app.job_title?.toLowerCase().includes(searchLower)
      );
    })
    .sort((a, b) => {
      const dateA = new Date(
        a.applied_date || (a as any).created_at || 0,
      ).getTime();
      const dateB = new Date(
        b.applied_date || (b as any).created_at || 0,
      ).getTime();
      return dateB - dateA; // Newest first
    });

  // Filter for follow-up jobs (applied more than 2 days ago, not yet followed up)
  // Already sorted since filteredApplications is sorted
  const followUpJobs = filteredApplications.filter((app) => {
    const appliedDate = (app as any).created_at
      ? new Date((app as any).created_at)
      : null;
    if (!appliedDate) return false;
    const daysSinceApplied = differenceInDays(new Date(), appliedDate);
    return daysSinceApplied >= 2 && !(app as any).followed_up;
  });

  const handleFollowupChange = async (appId: string, method: string) => {
    setUpdatingIds((prev) => new Set(prev).add(appId));

    try {
      const response = await apiFetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          followup_method: method,
          followed_up: true, // Always true - any selection marks it as processed
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId
            ? ({ ...app, followed_up: true, followup_method: method } as any)
            : app,
        ),
      );

      toast.success(
        method === "none"
          ? "Marked as no follow-up needed"
          : `Follow-up method: ${method}`,
      );
    } catch (error) {
      toast.error("Failed to update follow-up status");
      console.error(error);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  // Handle status change (Interview/Rejected)
  const handleStatusChange = async (appId: string, status: string) => {
    setUpdatingIds((prev) => new Set(prev).add(appId));

    try {
      const response = await apiFetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error("Failed to update");
      }

      // Update local state
      setApplications((prev) =>
        prev.map((app) => (app.id === appId ? { ...app, status } : app)),
      );

      if (status === "Interview") {
        triggerInterviewConfetti();
        toast.success("🎉 Interview! Great work!");
      } else if (status === "Rejected") {
        toast.info("Application marked as rejected");
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(appId);
        return newSet;
      });
    }
  };

  // Interview confetti - celebratory burst
  const triggerInterviewConfetti = () => {
    // First burst
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#16a34a", "#4ade80", "#ffffff", "#fbbf24"], // Green and gold
    });
    // Second burst after slight delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7, x: 0.3 },
        colors: ["#22c55e", "#16a34a", "#4ade80"],
      });
      confetti({
        particleCount: 50,
        spread: 100,
        origin: { y: 0.7, x: 0.7 },
        colors: ["#22c55e", "#16a34a", "#4ade80"],
      });
    }, 150);
  };

  // Small confetti burst
  const triggerConfetti = () => {
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
      colors: ["#0077B5", "#00A0DC", "#ffffff"], // LinkedIn blue colors
    });
  };

  const handleManualSubmit = async () => {
    if (
      !manualEntry.job_title.trim() ||
      !manualEntry.company_name.trim() ||
      !manualEntry.job_url.trim()
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    if (!assignedClientId) {
      toast.error("No client assigned. Contact admin.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await apiFetch("/api/applications/manual-linkedin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          applier_id: currentUser?.id,
          client_id: assignedClientId,
          job_title: manualEntry.job_title.trim(),
          company_name: manualEntry.company_name.trim(),
          job_url: manualEntry.job_url.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to add application");
      }

      const newApp = await response.json();

      // Add to local state
      setApplications((prev) => [newApp.application, ...prev]);

      // Reset form and close modal
      setManualEntry({ job_title: "", company_name: "", job_url: "" });
      setShowAddModal(false);

      // Trigger confetti
      triggerConfetti();

      toast.success("LinkedIn application added! +$0.28");
    } catch (error) {
      toast.error("Failed to add application");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
        Loading applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              Applied Jobs
            </h1>
            <p className="text-muted-foreground mt-1">
              Your completed applications
            </p>
          </div>
          <Button
            onClick={() => setShowAddModal(true)}
            className="bg-[#0077B5] hover:bg-[#006097] text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add LinkedIn App
          </Button>
        </div>

        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <div className="text-muted-foreground space-y-2">
              <Briefcase className="w-12 h-12 mx-auto opacity-30" />
              <h3 className="text-lg font-medium">No applications yet</h3>
              <p className="text-sm">Jobs you apply to will appear here.</p>
            </div>
          </CardContent>
        </Card>

        {/* Add LinkedIn Modal */}
        <ManualLinkedInModal
          open={showAddModal}
          onOpenChange={setShowAddModal}
          manualEntry={manualEntry}
          setManualEntry={setManualEntry}
          onSubmit={handleManualSubmit}
          isSubmitting={isSubmitting}
        />
      </div>
    );
  }

  const renderJobCard = (app: Application, showFollowUp: boolean) => {
    const jobTitle = app.job_title || "Unknown Position";
    const companyName = app.company_name || "Unknown Company";
    const jobUrl = app.job_url;
    const linkedinUrl = (app as any).linkedin_url;
    const isUpdating = updatingIds.has(app.id);
    const isManualLinkedIn = (app as any).feed_job_id < 0;
    const matchStrength = (app as any).match_strength;
    const isStrongMatch = matchStrength === "strong";

    // Determine card styling based on type
    const getCardStyle = () => {
      if (isManualLinkedIn) {
        return "border-l-[#0077B5] bg-[#0077B5]/5";
      }
      if (isStrongMatch) {
        return "border-l-amber-400 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-400/30";
      }
      return "border-l-green-500 bg-green-500/5";
    };

    return (
      <Card
        key={app.id}
        className={`border-l-4 ${getCardStyle()}`}
        data-testid={`card-application-${app.id}`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 space-y-2">
              <div>
                <div className="flex items-center gap-2">
                  <h3
                    className={`text-xl font-bold font-heading ${isStrongMatch ? "text-amber-200" : ""}`}
                    data-testid={`text-job-title-${app.id}`}
                  >
                    {jobTitle}
                  </h3>
                  {isManualLinkedIn && (
                    <Linkedin className="w-4 h-4 text-[#0077B5]" />
                  )}
                  {isStrongMatch && (
                    <Sparkles className="w-5 h-5 text-amber-400 animate-pulse" />
                  )}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Building className="w-3 h-3" /> {companyName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Applied{" "}
                    {(app as any).created_at
                      ? formatDistanceToNow(new Date((app as any).created_at), {
                          addSuffix: true,
                        })
                      : "recently"}
                  </span>
                </div>
              </div>

              <div
                className={`flex items-center gap-2 text-sm font-medium ${
                  isManualLinkedIn
                    ? "text-[#0077B5]"
                    : isStrongMatch
                      ? "text-amber-400"
                      : "text-green-600"
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                {isStrongMatch
                  ? "Exact Match Applied"
                  : "Application Submitted"}
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap w-full">
              {showFollowUp ? (
                <>
                  {/* Interview button in follow-up view */}
                  {app.status?.toLowerCase() !== "interview" &&
                    app.status?.toLowerCase() !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, "Interview")}
                        disabled={isUpdating}
                        className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                        data-testid={`button-interview-followup-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CalendarCheck className="w-4 h-4 mr-2" />
                        )}
                        Interview
                      </Button>
                    )}

                  {/* Rejected button in follow-up view */}
                  {app.status?.toLowerCase() !== "rejected" &&
                    app.status?.toLowerCase() !== "interview" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, "Rejected")}
                        disabled={isUpdating}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        data-testid={`button-rejected-followup-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Rejected
                      </Button>
                    )}

                  {/* LinkedIn Button - only show if we have a LinkedIn URL */}
                  {linkedinUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(linkedinUrl, "_blank")}
                      className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                      data-testid={`button-linkedin-${app.id}`}
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                  )}

                  {/* Follow-up Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isUpdating}
                        data-testid={`button-followup-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <MessageSquare className="w-4 h-4 mr-2" />
                        )}
                        Follow-up
                        <ChevronDown className="w-4 h-4 ml-2" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleFollowupChange(app.id, "inmail")}
                        className="cursor-pointer"
                      >
                        <Mail className="w-4 h-4 mr-2" />
                        InMail
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() =>
                          handleFollowupChange(app.id, "li_connection")
                        }
                        className="cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 mr-2" />
                        LI Connection
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleFollowupChange(app.id, "email")}
                        className="cursor-pointer"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Email
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleFollowupChange(app.id, "none")}
                        className="cursor-pointer text-muted-foreground"
                      >
                        <X className="w-4 h-4 mr-2" />
                        No follow-up
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Job Post Button - pushed to the right */}
                  {jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(jobUrl, "_blank")}
                      className="ml-auto"
                      data-testid={`button-view-job-${app.id}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Job Post
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className={
                      app.status?.toLowerCase() === "interview"
                        ? "bg-blue-500/10 text-blue-500 border-blue-500/20"
                        : app.status?.toLowerCase() === "rejected"
                          ? "bg-red-500/10 text-red-500 border-red-500/20"
                          : isManualLinkedIn
                            ? "bg-[#0077B5]/10 text-[#0077B5] border-[#0077B5]/20"
                            : "bg-green-500/10 text-green-500 border-green-500/20"
                    }
                  >
                    {app.status}
                  </Badge>

                  {/* Interview button - only show if not already Interview or Rejected */}
                  {app.status?.toLowerCase() !== "interview" &&
                    app.status?.toLowerCase() !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, "Interview")}
                        disabled={isUpdating}
                        className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                        data-testid={`button-interview-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CalendarCheck className="w-4 h-4 mr-2" />
                        )}
                        Interview
                      </Button>
                    )}

                  {/* Rejected button - only show if not already Rejected */}
                  {app.status?.toLowerCase() !== "rejected" &&
                    app.status?.toLowerCase() !== "interview" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(app.id, "Rejected")}
                        disabled={isUpdating}
                        className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                        data-testid={`button-rejected-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="w-4 h-4 mr-2" />
                        )}
                        Rejected
                      </Button>
                    )}

                  {jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(jobUrl, "_blank")}
                      className="ml-auto"
                      data-testid={`button-view-job-${app.id}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Job
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Applied Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            {applications.length} application
            {applications.length !== 1 ? "s" : ""} completed
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          className="bg-[#0077B5] hover:bg-[#006097] text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add LinkedIn App
        </Button>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList className="bg-[#111] border border-white/10">
            <TabsTrigger value="all">
              All Applied ({filteredApplications.length})
            </TabsTrigger>
            <TabsTrigger value="followup">
              <MessageSquare className="w-4 h-4 mr-2" />
              Follow-up ({followUpJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Search */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search company or role..."
              className="pl-9 bg-[#111] border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search-applications"
            />
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground space-y-2">
                  <Search className="w-12 h-12 mx-auto opacity-30" />
                  <h3 className="text-lg font-medium">No results found</h3>
                  <p className="text-sm">Try a different search term.</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            filteredApplications.map((app) => renderJobCard(app, false))
          )}
        </TabsContent>

        <TabsContent value="followup" className="space-y-4">
          {followUpJobs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-12 text-center">
                <div className="text-muted-foreground space-y-2">
                  <CheckCircle className="w-12 h-12 mx-auto opacity-30" />
                  <h3 className="text-lg font-medium">All caught up!</h3>
                  <p className="text-sm">
                    No follow-ups needed right now. Jobs applied more than 2
                    days ago will appear here.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            followUpJobs.map((app) => renderJobCard(app, true))
          )}
        </TabsContent>
      </Tabs>

      {/* Add LinkedIn Modal */}
      <ManualLinkedInModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        manualEntry={manualEntry}
        setManualEntry={setManualEntry}
        onSubmit={handleManualSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// Manual LinkedIn Entry Modal Component
function ManualLinkedInModal({
  open,
  onOpenChange,
  manualEntry,
  setManualEntry,
  onSubmit,
  isSubmitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manualEntry: { job_title: string; company_name: string; job_url: string };
  setManualEntry: React.Dispatch<
    React.SetStateAction<{
      job_title: string;
      company_name: string;
      job_url: string;
    }>
  >;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="w-5 h-5 text-[#0077B5]" />
            Add LinkedIn Application
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="job_title">Job Title</Label>
            <Input
              id="job_title"
              placeholder="e.g. Senior Data Engineer"
              value={manualEntry.job_title}
              onChange={(e) =>
                setManualEntry((prev) => ({
                  ...prev,
                  job_title: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company_name">Company Name</Label>
            <Input
              id="company_name"
              placeholder="e.g. Google"
              value={manualEntry.company_name}
              onChange={(e) =>
                setManualEntry((prev) => ({
                  ...prev,
                  company_name: e.target.value,
                }))
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="job_url">LinkedIn Job URL</Label>
            <Input
              id="job_url"
              placeholder="https://linkedin.com/jobs/view/..."
              value={manualEntry.job_url}
              onChange={(e) =>
                setManualEntry((prev) => ({ ...prev, job_url: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={onSubmit}
            disabled={isSubmitting}
            className="bg-[#0077B5] hover:bg-[#006097] text-white"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4 mr-2" />
                Add Application
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
