import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, Briefcase, ExternalLink, Loader2 } from "lucide-react";
import { fetchClients, apiFetch } from "@/lib/api";
import type { Client, Application } from "@shared/schema";
import { format } from "date-fns";

export default function AdminInterviewsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");

  // Fetch all clients
  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  // Fetch applications with interview status for selected client
  const { data: interviewApps = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ["interview-applications", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiFetch(
        `/api/applications?client_id=${selectedClientId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch applications");
      const apps = await response.json();
      return apps.filter((app: Application) => app.status === "Interview");
    },
    enabled: !!selectedClientId,
  });

  // Filter active clients (active or placed)
  const activeClients = clients.filter(
    (c: Client) => c.status === "active" || c.status === "placed",
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Interviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage client interviews.
          </p>
        </div>
      </div>

      {/* Client Selector */}
      <Card className="bg-[#111] border-white/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-muted-foreground">
              Select Client:
            </label>
            <Select
              value={selectedClientId}
              onValueChange={setSelectedClientId}
            >
              <SelectTrigger className="w-[300px] bg-black border-white/10">
                <SelectValue placeholder="Choose a client..." />
              </SelectTrigger>
              <SelectContent>
                {activeClients.map((client: Client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.first_name} {client.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {!selectedClientId ? (
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-0">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                <Calendar className="w-10 h-10 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-400 mb-2">
                Select a Client
              </h3>
              <p className="text-muted-foreground max-w-md">
                Choose a client from the dropdown above to view their
                interviews.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingApps ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Interviews */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">
              Interviews ({interviewApps.length})
            </h2>
            {interviewApps.length === 0 ? (
              <Card className="bg-[#111] border-white/10">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No interviews for this client.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interviewApps.map((app: Application) => (
                  <Card
                    key={app.id}
                    className="bg-[#111] border-white/10 hover:border-white/20 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <Briefcase className="w-6 h-6 text-blue-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {app.company_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {app.job_title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied:{" "}
                              {app.applied_date
                                ? format(
                                    new Date(app.applied_date),
                                    "MMM d, yyyy",
                                  )
                                : "Unknown"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                            Interview
                          </Badge>
                          {app.job_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(app.job_url, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Job
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
