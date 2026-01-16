import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Calendar,
  Building,
  Briefcase,
  FileText,
  ExternalLink,
  Loader2,
  Edit,
  Save,
  X,
} from "lucide-react";
import { fetchClients, apiFetch } from "@/lib/api";
import type { Client, Application, Interview } from "@shared/schema";
import { toast } from "sonner";
import { format } from "date-fns";

export default function AdminInterviewsPage() {
  const queryClient = useQueryClient();
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [editingInterview, setEditingInterview] = useState<Interview | null>(
    null,
  );
  const [prepDocContent, setPrepDocContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all clients
  const { data: clients = [], isLoading: isLoadingClients } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  // Fetch applications with interview status for selected client
  const { data: interviewApps = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ["interview-applications", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiFetch(
        `/api/applications?client_id=${selectedClientId}&status=interview`,
      );
      if (!response.ok) throw new Error("Failed to fetch applications");
      return response.json();
    },
    enabled: !!selectedClientId,
  });

  // Fetch interviews for selected client
  const { data: interviews = [], isLoading: isLoadingInterviews } = useQuery({
    queryKey: ["interviews", selectedClientId],
    queryFn: async () => {
      if (!selectedClientId) return [];
      const response = await apiFetch(
        `/api/interviews?client_id=${selectedClientId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch interviews");
      return response.json();
    },
    enabled: !!selectedClientId,
  });

  // Get client name helper
  const getClientName = (clientId: string) => {
    const client = clients.find((c: Client) => c.id === clientId);
    return client ? `${client.first_name} ${client.last_name}` : "Unknown";
  };

  // Save prep doc
  const handleSavePrepDoc = async () => {
    if (!editingInterview) return;

    setIsSaving(true);
    try {
      const response = await apiFetch(
        `/api/interviews/${editingInterview.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prep_doc_url: prepDocContent,
            prep_doc_status: "complete",
          }),
        },
      );

      if (!response.ok) throw new Error("Failed to save prep doc");

      toast.success("Prep doc saved successfully");
      queryClient.invalidateQueries({
        queryKey: ["interviews", selectedClientId],
      });
      setEditingInterview(null);
    } catch (error) {
      console.error("Error saving prep doc:", error);
      toast.error("Failed to save prep doc");
    } finally {
      setIsSaving(false);
    }
  };

  // Open prep doc editor
  const handleEditPrepDoc = (interview: Interview) => {
    setEditingInterview(interview);
    setPrepDocContent(interview.prep_doc_url || "");
  };

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
            Manage client interviews and prep documents.
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
                Choose a client from the dropdown above to view their interviews
                and applications marked for interviews.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : isLoadingApps || isLoadingInterviews ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Scheduled Interviews */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">
              Scheduled Interviews ({interviews.length})
            </h2>
            {interviews.length === 0 ? (
              <Card className="bg-[#111] border-white/10">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No scheduled interviews for this client.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {interviews.map((interview: Interview) => (
                  <Card
                    key={interview.id}
                    className="bg-[#111] border-white/10 hover:border-white/20 transition-colors"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                            <Building className="w-6 h-6 text-green-500" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-white">
                              {interview.company_name}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                              {interview.job_title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <span className="text-xs text-muted-foreground">
                                {interview.interview_datetime
                                  ? format(
                                      new Date(interview.interview_datetime),
                                      "MMM d, yyyy 'at' h:mm a",
                                    )
                                  : "No date set"}
                              </span>
                              {interview.interview_type && (
                                <Badge variant="outline" className="text-xs">
                                  {interview.interview_type}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {interview.prep_doc_status === "complete" ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Prep Doc Complete
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Needs Prep Doc
                            </Badge>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditPrepDoc(interview)}
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            {interview.prep_doc_url ? "Edit" : "Create"} Prep
                            Doc
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Applications Marked as Interview */}
          <div>
            <h2 className="text-xl font-bold text-white mb-4">
              Applications with Interview Status ({interviewApps.length})
            </h2>
            {interviewApps.length === 0 ? (
              <Card className="bg-[#111] border-white/10">
                <CardContent className="py-8 text-center text-muted-foreground">
                  No applications marked as "interview" for this client.
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

      {/* Prep Doc Editor Dialog */}
      <Dialog
        open={!!editingInterview}
        onOpenChange={(open) => !open && setEditingInterview(null)}
      >
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prep Doc - {editingInterview?.company_name} (
              {editingInterview?.job_title})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={prepDocContent}
              onChange={(e) => setPrepDocContent(e.target.value)}
              placeholder="Enter interview prep notes, questions to expect, company research, etc..."
              className="min-h-[400px] font-mono text-sm"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditingInterview(null)}
              disabled={isSaving}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSavePrepDoc} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Prep Doc
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
