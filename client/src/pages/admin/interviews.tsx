import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar,
  Briefcase,
  ExternalLink,
  Loader2,
  FileText,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
} from "lucide-react";
import { fetchClients, apiFetch } from "@/lib/api";
import type { Client, Application } from "@shared/schema";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export default function AdminInterviewsPage() {
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [expandedAppId, setExpandedAppId] = useState<string | null>(null);
  const [prepDocModalOpen, setPrepDocModalOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [prepDocContent, setPrepDocContent] = useState("");
  const [jdText, setJdText] = useState("");

  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Save prep doc mutation
  const savePrepDocMutation = useMutation({
    mutationFn: async ({
      appId,
      prepDoc,
    }: {
      appId: string;
      prepDoc: string;
    }) => {
      const response = await apiFetch(`/api/applications/${appId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prep_doc: prepDoc }),
      });
      if (!response.ok) throw new Error("Failed to save prep doc");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["interview-applications", selectedClientId],
      });
      toast({ title: "Prep doc saved!" });
      setPrepDocModalOpen(false);
    },
    onError: () => {
      toast({ title: "Failed to save prep doc", variant: "destructive" });
    },
  });

  // Generate prep doc mutation
  const generatePrepMutation = useMutation({
    mutationFn: async ({
      appId,
      jdText,
    }: {
      appId: string;
      jdText: string;
    }) => {
      const response = await apiFetch(
        `/api/applications/${appId}/generate-prep`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jd_text: jdText }),
        },
      );
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate prep doc");
      }
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["interview-applications", selectedClientId],
      });
      toast({ title: "Prep doc generated!" });
      setGenerateModalOpen(false);
      setJdText("");
      // Open the view/edit modal with the generated content
      if (selectedApp) {
        setPrepDocContent(data.prep_doc);
        setPrepDocModalOpen(true);
      }
    },
    onError: (error: Error) => {
      toast({ title: error.message, variant: "destructive" });
    },
  });

  // Filter active clients (active or placed)
  const activeClients = clients.filter(
    (c: Client) => c.status === "active" || c.status === "placed",
  );

  // Open prep doc modal for viewing/editing
  const openPrepDoc = (app: Application) => {
    setSelectedApp(app);
    setPrepDocContent((app as any).prep_doc || "");
    setPrepDocModalOpen(true);
  };

  // Open generate modal
  const openGenerateModal = (app: Application) => {
    setSelectedApp(app);
    setJdText("");
    setGenerateModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Interviews
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage client interviews and prep docs.
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
                      {/* Main row */}
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
                          {/* Prep doc indicator */}
                          {(app as any).prep_doc ? (
                            <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                              Prep Ready
                            </Badge>
                          ) : (
                            <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Needs Prep
                            </Badge>
                          )}

                          {/* Generate Prep button */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openGenerateModal(app)}
                            className="gap-2"
                          >
                            {(app as any).prep_doc ? (
                              <>
                                <RefreshCw className="w-4 h-4" />
                                Regenerate
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                Generate Prep
                              </>
                            )}
                          </Button>

                          {/* View/Edit Prep Doc button (only if exists) */}
                          {(app as any).prep_doc && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPrepDoc(app)}
                              className="gap-2"
                            >
                              <FileText className="w-4 h-4" />
                              View Prep
                            </Button>
                          )}

                          {/* View Job button */}
                          {app.job_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(app.job_url, "_blank")}
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Expand/Collapse */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setExpandedAppId(
                                expandedAppId === app.id ? null : app.id,
                              )
                            }
                          >
                            {expandedAppId === app.id ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded content - show prep doc preview */}
                      {expandedAppId === app.id && (
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <h4 className="text-sm font-medium text-white mb-2">
                            Prep Doc Preview
                          </h4>
                          {(app as any).prep_doc ? (
                            <div className="bg-black/50 rounded-lg p-4 text-sm text-muted-foreground whitespace-pre-wrap max-h-96 overflow-y-auto">
                              {(app as any).prep_doc}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">
                              No prep doc yet. Click "Generate Prep" to create
                              one.
                            </p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Generate Prep Modal */}
      <Dialog open={generateModalOpen} onOpenChange={setGenerateModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              Generate Prep Doc: {selectedApp?.company_name}
            </DialogTitle>
            <DialogDescription>
              Paste the job description below. Claude will research the company
              and generate a comprehensive interview prep document.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-2 block">
                Job Description
              </label>
              <Textarea
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
                placeholder="Paste the full job description here..."
                className="min-h-[300px] bg-black border-white/10"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                This will call Claude with web search to research the company.
                Takes ~30-60 seconds.
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setGenerateModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (selectedApp && jdText.trim()) {
                      generatePrepMutation.mutate({
                        appId: selectedApp.id,
                        jdText: jdText.trim(),
                      });
                    }
                  }}
                  disabled={generatePrepMutation.isPending || !jdText.trim()}
                >
                  {generatePrepMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Prep Doc
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View/Edit Prep Doc Modal */}
      <Dialog open={prepDocModalOpen} onOpenChange={setPrepDocModalOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Prep Doc: {selectedApp?.company_name} - {selectedApp?.job_title}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={prepDocContent}
              onChange={(e) => setPrepDocContent(e.target.value)}
              placeholder="Prep doc content..."
              className="min-h-[500px] bg-black border-white/10 font-mono text-sm"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setPrepDocModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (selectedApp) {
                    savePrepDocMutation.mutate({
                      appId: selectedApp.id,
                      prepDoc: prepDocContent,
                    });
                  }
                }}
                disabled={savePrepDocMutation.isPending}
              >
                {savePrepDocMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
