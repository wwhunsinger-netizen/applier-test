import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertTriangle,
  Check,
  X,
  Eye,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

// NEW: Feed API types (replaces FlaggedApplication)
interface FeedFlaggedJob {
  job_id: number;
  applier_id: string;
  client_id: string;
  flagged_at: string;
  comment: string;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  resolution_note: string | null;
  // Denormalized for display
  job_title: string;
  company_name: string;
  job_url: string;
  applier_name?: string;
  client_name?: string;
}

// NEW: Fetch flagged jobs from Feed API
async function fetchFeedFlaggedJobs(
  status?: "open" | "resolved",
): Promise<FeedFlaggedJob[]> {
  const includeResolved = status === "resolved" || status === undefined;
  const url = `/api/feed-flagged-jobs${includeResolved ? "?include_resolved=true" : ""}`;
  const res = await apiFetch(url);
  if (!res.ok) throw new Error("Failed to fetch flagged jobs");
  const data = await res.json();

  // Filter based on status if specified
  if (status === "open") {
    return data.filter((f: FeedFlaggedJob) => !f.resolved);
  } else if (status === "resolved") {
    return data.filter((f: FeedFlaggedJob) => f.resolved);
  }
  return data;
}

// NEW: Resolve a flagged job via Feed API
async function resolveFlag(data: {
  applier_id: string;
  job_id: number;
  resolved_by: string;
  resolution_note?: string;
}): Promise<void> {
  const res = await apiFetch(`/api/resolve-flag`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to resolve flag");
}

export default function AdminReviewPage() {
  const { currentUser } = useUser();
  const [flaggedApps, setFlaggedApps] = useState<FeedFlaggedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolveDialogOpen, setResolveDialogOpen] = useState(false);
  const [resolvingApp, setResolvingApp] = useState<FeedFlaggedJob | null>(null);
  const [resolutionNote, setResolutionNote] = useState("");
  const [isResolving, setIsResolving] = useState(false);
  const [filter, setFilter] = useState<"open" | "resolved" | "all">("open");

  useEffect(() => {
    loadFlaggedApplications();
  }, [filter]);

  const loadFlaggedApplications = async () => {
    try {
      setLoading(true);
      const status = filter === "all" ? undefined : filter;
      const apps = await fetchFeedFlaggedJobs(status);
      setFlaggedApps(apps);
    } catch (error) {
      console.error("Error loading flagged applications:", error);
      toast.error("Failed to load flagged applications");
    } finally {
      setLoading(false);
    }
  };

  const openResolveDialog = (app: FeedFlaggedJob) => {
    setResolvingApp(app);
    setResolutionNote("");
    setResolveDialogOpen(true);
  };

  const handleResolve = async () => {
    if (!resolvingApp || !currentUser) return;

    setIsResolving(true);
    try {
      // NEW: Use Feed API resolve endpoint
      await resolveFlag({
        applier_id: resolvingApp.applier_id,
        job_id: resolvingApp.job_id,
        resolved_by: currentUser.id,
        resolution_note: resolutionNote || undefined,
      });

      toast.success("Issue resolved successfully");
      setResolveDialogOpen(false);

      // Optimistic update - remove from list or update status locally
      if (filter === "open") {
        // If viewing open issues, remove the resolved item from the list
        setFlaggedApps((prev) =>
          prev.filter(
            (app) =>
              !(
                app.job_id === resolvingApp.job_id &&
                app.applier_id === resolvingApp.applier_id
              ),
          ),
        );
      } else {
        // If viewing "all" or "resolved", update the item's status in place
        setFlaggedApps((prev) =>
          prev.map((app) =>
            app.job_id === resolvingApp.job_id &&
            app.applier_id === resolvingApp.applier_id
              ? {
                  ...app,
                  resolved: true,
                  resolution_note: resolutionNote || undefined,
                  resolved_at: new Date().toISOString(),
                }
              : app,
          ),
        );
      }
    } catch (error) {
      console.error("Error resolving issue:", error);
      toast.error("Failed to resolve issue");
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Issue Review
        </h1>
        <p className="text-muted-foreground">
          Address flagged issues from appliers.
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "open" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("open")}
          data-testid="filter-open"
        >
          Open Issues
        </Button>
        <Button
          variant={filter === "resolved" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("resolved")}
          data-testid="filter-resolved"
        >
          Resolved
        </Button>
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          data-testid="filter-all"
        >
          All
        </Button>
      </div>

      <Card className="bg-[#111] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <AlertTriangle className="text-destructive w-5 h-5" />
            Flagged Items ({flaggedApps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin" />
              <p>Loading flagged applications...</p>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {flaggedApps.map((app) => {
                // NEW: FeedFlaggedJob has flat structure - no nested session/job
                const jobTitle = app.job_title || "Unknown Position";
                const company = app.company_name || "Unknown Company";
                const jobUrl = app.job_url || null;
                const applierName = app.applier_name || app.applier_id;
                const isOpen = !app.resolved;

                return (
                  <div
                    key={`${app.job_id}-${app.applier_id}`}
                    className="p-6 flex flex-col md:flex-row gap-6 items-start"
                    data-testid={`flagged-item-${app.job_id}`}
                  >
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={isOpen ? "destructive" : "secondary"}
                          className={
                            isOpen
                              ? "bg-destructive/10 text-destructive border-destructive/20"
                              : ""
                          }
                        >
                          {isOpen ? "Open" : "Resolved"}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Reported by {applierName}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-white">
                        {jobTitle} @ {company}
                      </h3>
                      <div className="bg-muted/30 rounded-md p-3 text-sm text-white/80">
                        <strong className="text-white">Issue:</strong>{" "}
                        {app.comment}
                      </div>
                      {app.resolution_note && (
                        <div className="bg-green-500/10 rounded-md p-3 text-sm text-green-400">
                          <strong>Resolution:</strong> {app.resolution_note}
                        </div>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Flagged:{" "}
                        {app.flagged_at
                          ? new Date(app.flagged_at).toLocaleString()
                          : "Unknown"}
                      </p>
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      {jobUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(jobUrl, "_blank")}
                          data-testid={`view-job-${app.job_id}`}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Job
                        </Button>
                      )}
                      {isOpen && (
                        <Button
                          size="sm"
                          className="bg-white text-black hover:bg-white/90"
                          onClick={() => openResolveDialog(app)}
                          data-testid={`resolve-${app.job_id}`}
                        >
                          <Check className="w-4 h-4 mr-2" />
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}

              {flaggedApps.length === 0 && (
                <div className="p-12 text-center text-muted-foreground">
                  <Check className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
                  <p>
                    {filter === "open"
                      ? "No open issues pending."
                      : "No flagged items found."}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={resolveDialogOpen} onOpenChange={setResolveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve Issue</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {resolvingApp && (
              <div className="text-sm text-muted-foreground">
                <strong className="text-white">Issue:</strong>{" "}
                {resolvingApp.comment}
              </div>
            )}
            <Textarea
              placeholder="Add a resolution note (optional)..."
              value={resolutionNote}
              onChange={(e) => setResolutionNote(e.target.value)}
              data-testid="resolution-note"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResolveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleResolve}
              disabled={isResolving}
              data-testid="confirm-resolve"
            >
              {isResolving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Mark Resolved
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
