import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TestSubmission } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Loader2,
  AlertCircle,
  GraduationCap,
  ArrowUpDown,
  Mail,
  Users,
  Trophy,
  XCircle,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InviteEmailDialog } from "@/components/admin/invite-email-dialog";

type SortField = "overall_score" | "typing_wpm" | "review_score" | "app_score" | "created_at";
type SortDir = "asc" | "desc";

export default function AdminTestResults() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sortField, setSortField] = useState<SortField>("overall_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [emailTarget, setEmailTarget] = useState<TestSubmission | null>(null);

  const { data: submissions = [], isLoading, error } = useQuery<TestSubmission[]>({
    queryKey: ["test-submissions"],
    queryFn: async () => {
      const res = await fetch("/api/test-submissions", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch");
      return res.json();
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/test-submissions/${id}/invite`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to invite");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["test-submissions"] });
      setEmailTarget(null);
      toast({ title: "Marked as invited" });
    },
    onError: () => {
      toast({ title: "Failed to mark as invited", variant: "destructive" });
    },
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const handleInviteSend = () => {
    if (emailTarget) {
      inviteMutation.mutate(emailTarget.id);
    }
  };

  // Filter and sort
  const filtered = submissions
    .filter((s) => {
      const term = search.toLowerCase();
      return (
        s.candidate_name.toLowerCase().includes(term) ||
        s.candidate_email.toLowerCase().includes(term)
      );
    })
    .sort((a, b) => {
      const av = a[sortField] ?? 0;
      const bv = b[sortField] ?? 0;
      if (sortField === "created_at") {
        return sortDir === "desc"
          ? new Date(bv as string).getTime() - new Date(av as string).getTime()
          : new Date(av as string).getTime() - new Date(bv as string).getTime();
      }
      return sortDir === "desc" ? (bv as number) - (av as number) : (av as number) - (bv as number);
    });

  const totalSubmissions = submissions.length;
  const passedCount = submissions.filter((s) => s.passed).length;
  const invitedCount = submissions.filter((s) => s.invited_at).length;

  const SortButton = ({ field, label }: { field: SortField; label: string }) => (
    <button
      onClick={() => handleSort(field)}
      className={`text-xs flex items-center gap-1 transition-colors ${
        sortField === field ? "text-white font-semibold" : "text-muted-foreground hover:text-white"
      }`}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const formatDate = (d?: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Test Results</h1>
        <p className="text-muted-foreground mt-1">
          Applier assessment submissions sorted by performance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{totalSubmissions}</p>
              <p className="text-sm text-muted-foreground">Total Submissions</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{passedCount}</p>
              <p className="text-sm text-muted-foreground">Passed</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{invitedCount}</p>
              <p className="text-sm text-muted-foreground">Invited</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="pl-9 bg-[#111] border-white/10 text-white"
        />
      </div>

      {/* Sort bar */}
      <div className="flex items-center gap-6 px-2">
        <span className="text-xs text-muted-foreground">Sort by:</span>
        <SortButton field="overall_score" label="Overall" />
        <SortButton field="typing_wpm" label="Typing" />
        <SortButton field="review_score" label="Reviews" />
        <SortButton field="app_score" label="Application" />
        <SortButton field="created_at" label="Date" />
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Loading submissions...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-12 text-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          Failed to load submissions.
        </div>
      )}

      {/* Empty */}
      {!isLoading && !error && filtered.length === 0 && (
        <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
          <GraduationCap className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-semibold mb-2">No submissions yet</p>
          <p className="text-sm">Test results will appear here as candidates complete the assessment.</p>
        </div>
      )}

      {/* Submissions list */}
      <div className="grid gap-3">
        {filtered.map((sub) => (
          <Card
            key={sub.id}
            className={`bg-[#111] border-white/10 transition-colors ${
              sub.invited_at ? "border-purple-500/20" : ""
            }`}
          >
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-5">
                {/* Left: Name + scores */}
                <div className="flex items-center gap-4 min-w-0">
                  <div className={`h-12 w-12 rounded-full flex items-center justify-center shrink-0 ${
                    sub.passed ? "bg-green-500/10" : "bg-red-500/10"
                  }`}>
                    <span className="text-lg font-bold text-white">{sub.overall_score}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-bold text-white truncate">
                        {sub.candidate_name}
                      </h3>
                      <Badge
                        variant="outline"
                        className={`h-5 text-[10px] px-1.5 ${
                          sub.passed
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-red-500/10 text-red-400 border-red-500/20"
                        }`}
                      >
                        {sub.passed ? "PASSED" : "FAILED"}
                      </Badge>
                      {sub.invited_at && (
                        <Badge
                          variant="outline"
                          className="h-5 text-[10px] px-1.5 bg-purple-500/10 text-purple-400 border-purple-500/20"
                        >
                          INVITED
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{sub.candidate_email}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                      <span>Typing: <span className="text-white">{sub.typing_wpm} WPM</span> / <span className="text-white">{sub.typing_accuracy}%</span></span>
                      <span className="text-white/20">·</span>
                      <span>Reviews: <span className="text-white">{sub.review_score}%</span></span>
                      <span className="text-white/20">·</span>
                      <span>App: <span className="text-white">{sub.app_correct_count}/{sub.app_total_scored}</span></span>
                      <span className="hidden md:inline text-white/20">·</span>
                      <span className="hidden md:inline">{formatDate(sub.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0 ml-4">
                  {sub.passed && !sub.invited_at && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => setEmailTarget(sub)}
                      className="gap-1"
                    >
                      <Mail className="h-3.5 w-3.5" />
                      Invite
                    </Button>
                  )}
                  {sub.invited_at && (
                    <span className="text-xs text-muted-foreground">
                      Invited {formatDate(sub.invited_at)}
                    </span>
                  )}
                  {!sub.passed && (
                    <XCircle className="h-4 w-4 text-red-500/50" />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Invite email dialog */}
      <InviteEmailDialog
        isOpen={!!emailTarget}
        onClose={() => setEmailTarget(null)}
        onSend={handleInviteSend}
        submission={emailTarget}
        isSending={inviteMutation.isPending}
      />
    </div>
  );
}
