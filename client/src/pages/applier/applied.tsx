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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApplications, apiFetch } from "@/lib/api";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import type { Application } from "@shared/schema";

export default function AppliedPage() {
  const { currentUser } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Applier") return;

    setIsLoading(true);

    fetchApplications({ applier_id: currentUser.id })
      .then((apps) => {
        setApplications(apps);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  // Filter for follow-up jobs (applied more than 2 days ago, not yet followed up)
  const followUpJobs = applications.filter((app) => {
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
            ? ({
                ...app,
                followup_method: method,
                followed_up: true,
              } as Application)
            : app,
        ),
      );

      const methodLabels: Record<string, string> = {
        inmail: "InMail",
        li_connection: "LI Connection",
        email: "Email",
        none: "No follow-up",
      };
      toast.success(`Marked as: ${methodLabels[method] || method}`);
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

  const isLinkedInUrl = (url: string | null | undefined): boolean => {
    if (!url) return false;
    return url.toLowerCase().includes("linkedin.com");
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Applied Jobs
          </h1>
          <p className="text-muted-foreground mt-1">
            Your completed applications
          </p>
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
      </div>
    );
  }

  const renderJobCard = (app: Application, showFollowUp: boolean) => {
    const jobTitle = app.job_title || "Unknown Position";
    const companyName = app.company_name || "Unknown Company";
    const jobUrl = app.job_url;
    const isLinkedIn = isLinkedInUrl(jobUrl);
    const isUpdating = updatingIds.has(app.id);

    return (
      <Card
        key={app.id}
        className="border-l-4 border-l-green-500 bg-green-500/5"
        data-testid={`card-application-${app.id}`}
      >
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1 space-y-2">
              <div>
                <h3
                  className="text-xl font-bold font-heading"
                  data-testid={`text-job-title-${app.id}`}
                >
                  {jobTitle}
                </h3>
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

              <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Application Submitted
              </div>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {showFollowUp ? (
                <>
                  {/* LinkedIn Button - only show if URL is LinkedIn */}
                  {isLinkedIn && jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(jobUrl, "_blank")}
                      className="border-blue-500/30 text-blue-500 hover:bg-blue-500/10"
                      data-testid={`button-linkedin-${app.id}`}
                    >
                      <Linkedin className="w-4 h-4 mr-2" />
                      LinkedIn
                    </Button>
                  )}

                  {/* Job Post Button - always show */}
                  {jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(jobUrl, "_blank")}
                      data-testid={`button-view-job-${app.id}`}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Job Post
                    </Button>
                  )}

                  {/* Follow-up Dropdown Button */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="sm"
                        disabled={isUpdating}
                        className="bg-primary hover:bg-primary/90"
                        data-testid={`button-followup-${app.id}`}
                      >
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
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
                        <Send className="w-4 h-4 mr-2" />
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
                        <Mail className="w-4 h-4 mr-2" />
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
                </>
              ) : (
                <>
                  <Badge
                    variant="outline"
                    className="bg-green-500/10 text-green-500 border-green-500/20"
                  >
                    {app.status}
                  </Badge>

                  {jobUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(jobUrl, "_blank")}
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Applied Jobs
        </h1>
        <p className="text-muted-foreground mt-1">
          {applications.length} application
          {applications.length !== 1 ? "s" : ""} completed
        </p>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-[#111] border border-white/10">
          <TabsTrigger value="all">
            All Applied ({applications.length})
          </TabsTrigger>
          <TabsTrigger value="followup">
            <MessageSquare className="w-4 h-4 mr-2" />
            Follow-up ({followUpJobs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {applications.map((app) => renderJobCard(app, false))}
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
    </div>
  );
}
