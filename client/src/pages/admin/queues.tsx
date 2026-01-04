import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client, Job } from "@shared/schema";
import { fetchClients, fetchJobs, apiFetch } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, RefreshCw, Briefcase, Building2, MapPin, Loader2, Rss } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

async function deleteJob(jobId: string): Promise<void> {
  const res = await apiFetch(`/api/jobs/${jobId}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete job");
}

async function syncJobsFromFeed(clientId: string): Promise<{ success: boolean; message: string; added: number; skipped: number }> {
  const res = await apiFetch(`/api/jobs/sync/${clientId}`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to sync jobs");
  return res.json();
}

export default function AdminQueuesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  const { data: clients = [], isLoading: clientsLoading } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const activeClients = clients.filter(
    (c) => c.status === "active" || c.status === "placed"
  );

  const { data: jobs = [], isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ["jobs", selectedClientId],
    queryFn: () => fetchJobs({ client_id: selectedClientId }),
    enabled: !!selectedClientId,
  });

  const deleteJobMutation = useMutation({
    mutationFn: deleteJob,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobs", selectedClientId] });
      toast({ title: "Job deleted", description: "The job has been removed from the queue." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete job.", variant: "destructive" });
    },
  });

  const syncJobsMutation = useMutation({
    mutationFn: () => syncJobsFromFeed(selectedClientId),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["jobs", selectedClientId] });
      toast({ title: "Sync complete", description: `Added ${data.added} jobs, skipped ${data.skipped}.` });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to sync jobs from feed.", variant: "destructive" });
    },
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Queue Manager</h1>
          <p className="text-muted-foreground mt-1">View and prune job queues for clients.</p>
        </div>
      </div>

      <Card className="bg-[#111] border-white/10">
        <CardHeader className="pb-4">
          <CardTitle className="text-white text-lg">Select Client</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col md:flex-row gap-4">
          <Select value={selectedClientId} onValueChange={setSelectedClientId}>
            <SelectTrigger className="w-full md:w-80 bg-black/50 border-white/10 text-white" data-testid="select-client">
              <SelectValue placeholder="Select a client..." />
            </SelectTrigger>
            <SelectContent className="bg-[#111] border-white/10">
              {clientsLoading ? (
                <SelectItem value="loading" disabled>Loading clients...</SelectItem>
              ) : activeClients.length === 0 ? (
                <SelectItem value="none" disabled>No active clients</SelectItem>
              ) : (
                activeClients.map((client) => (
                  <SelectItem key={client.id} value={client.id} className="text-white hover:bg-white/10">
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>

          {selectedClientId && (
            <Button
              onClick={() => syncJobsMutation.mutate()}
              disabled={syncJobsMutation.isPending}
              className="bg-primary hover:bg-primary/90"
              data-testid="button-sync-jobs"
            >
              {syncJobsMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Sync Jobs from Feed
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedClientId && (
        <Card className="bg-[#111] border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-white text-lg">
                Jobs for {selectedClient?.first_name} {selectedClient?.last_name}
              </CardTitle>
              <Badge variant="outline" className="border-white/20 text-white">
                {jobs.length} jobs
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {jobsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No jobs in queue for this client.
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-4 bg-black/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
                    data-testid={`job-card-${job.id}`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Briefcase className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-medium text-white truncate" data-testid={`text-job-title-${job.id}`}>
                          {job.job_title}
                        </span>
                        {job.feed_source === "feed" && (
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs" data-testid={`badge-feed-${job.id}`}>
                            <Rss className="w-3 h-3 mr-1" />
                            Feed
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {job.company_name}
                        </span>
                        {job.job_location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {job.job_location}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-red-400 hover:bg-red-500/10"
                      onClick={() => deleteJobMutation.mutate(job.id)}
                      disabled={deleteJobMutation.isPending}
                      data-testid={`button-delete-job-${job.id}`}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
