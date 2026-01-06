import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Loader2,
  Target,
  AlertTriangle,
  Zap,
} from "lucide-react";
import { fetchApplier, fetchClients, getResumeSuggestions } from "@/lib/api";
import { useUser } from "@/lib/userContext";
import { toast } from "sonner";
import type { Client } from "@shared/schema";

export default function ResumeTailorPage() {
  const { currentUser } = useUser();
  const [assignedClients, setAssignedClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [jobDescription, setJobDescription] = useState<string>("");
  const [suggestions, setSuggestions] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string>("");

  // Fetch assigned clients based on logged-in applier
  useEffect(() => {
    if (!currentUser || currentUser.role !== "Applier") return;

    fetchApplier(currentUser.id)
      .then((applier) => {
        const assignedIds = applier.assigned_client_ids || [];
        if (assignedIds.length === 0) {
          return;
        }

        return fetchClients().then((allClients) => {
          const assigned = allClients.filter((c) => assignedIds.includes(c.id));
          setAssignedClients(assigned);
          if (assigned.length === 1) {
            setSelectedClientId(assigned[0].id);
          }
        });
      })
      .catch(console.error);
  }, [currentUser]);

  // Admin fallback - show all clients
  useEffect(() => {
    if (currentUser?.role === "Admin") {
      fetchClients().then(setAssignedClients).catch(console.error);
    }
  }, [currentUser]);

  const handleSubmit = async () => {
    if (!selectedClientId || !jobDescription.trim()) return;

    setIsLoading(true);
    setError("");
    setSuggestions("");

    try {
      const result = await getResumeSuggestions(
        selectedClientId,
        jobDescription.trim(),
      );
      setSuggestions(result.suggestions);
      setClientName(result.client_name);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to get suggestions";
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (suggestions) {
      await navigator.clipboard.writeText(suggestions);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const extractCoverage = (text: string): string | null => {
    const match = text.match(/Keyword Coverage[:\s]*~?(\d+)%/i);
    return match ? match[1] : null;
  };

  const coverage = suggestions ? extractCoverage(suggestions) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading flex items-center gap-3">
          <Target className="h-8 w-8 text-primary" />
          Resume Tailor
        </h1>
        <p className="text-muted-foreground mt-1">
          Analyze keyword gaps and get targeted suggestions rate
        </p>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 flex items-start gap-3">
          <Zap className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
          <div className="text-sm">
            <span className="font-medium text-primary">
              Research-backed approach:
            </span>
            <span className="text-muted-foreground ml-1">
              Target 60-80% keyword coverage. We dont need to add ALL the
              keywords, as that would look fishy. But we want to get most of
              them. ATS also use semantic matching meaningvthe exact phrasing
              doesn't matter(e.g. "Leader" vs "Leadership")
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle className="text-lg">Job Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Select Client
              </label>
              <Select
                value={selectedClientId}
                onValueChange={setSelectedClientId}
              >
                <SelectTrigger className="bg-black/50 border-white/10">
                  <SelectValue placeholder="Choose a client..." />
                </SelectTrigger>
                <SelectContent>
                  {assignedClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.first_name} {client.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {assignedClients.length === 0 && (
                <p className="text-sm text-amber-500">
                  No clients assigned to you yet.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Job Description
              </label>
              <Textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job description here..."
                rows={14}
                className="bg-black/50 border-white/10 resize-none"
              />
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                !selectedClientId || !jobDescription.trim() || isLoading
              }
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Analyzing keywords...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5 mr-2" />
                  Analyze & Get Suggestions
                </>
              )}
            </Button>

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                {error}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-muted-foreground" />
                Analysis
              </CardTitle>
              {coverage && (
                <div
                  className={`px-2 py-1 rounded text-xs font-bold ${
                    parseInt(coverage) >= 60
                      ? "bg-green-500/20 text-green-400"
                      : parseInt(coverage) >= 40
                        ? "bg-yellow-500/20 text-yellow-400"
                        : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {coverage}% coverage
                </div>
              )}
            </div>
            {suggestions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
                className="text-muted-foreground hover:text-white"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-1 text-green-500" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin mb-3" />
                <p>Extracting keywords & analyzing gaps...</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  This takes a few seconds
                </p>
              </div>
            ) : suggestions ? (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  For:{" "}
                  <span className="text-white font-medium">{clientName}</span>
                </div>
                <div className="whitespace-pre-wrap text-sm leading-relaxed bg-black/30 p-4 rounded-lg border border-white/5 max-h-[500px] overflow-y-auto">
                  {suggestions}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Target className="h-12 w-12 mb-3 opacity-30" />
                <p>Keyword analysis will appear here</p>
                <p className="text-sm mt-1">
                  Select a client and paste a job description
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-white/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-amber-500">
                Beware of Formatting:
              </span>
              <span className="ml-1">
                Pay attention to the spacing of the resume. Dont add too many
                characters so that it is creating a new page or ruining
                formatting.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
