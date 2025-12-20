import { useApplications } from "@/lib/applicationsContext";
import { MOCK_USERS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Check, X, Eye } from "lucide-react";

export default function AdminReviewPage() {
  const { applications, updateApplicationStatus, getJobDetails } = useApplications();

  // Filter for applications that have issues (flaggedIssue is populated)
  const flaggedApps = applications.filter(app => app.flaggedIssue);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Issue Review</h1>
        <p className="text-muted-foreground">Address flagged issues from appliers.</p>
      </div>

      <Card className="bg-[#111] border-white/10">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-white flex items-center gap-2">
            <AlertTriangle className="text-destructive w-5 h-5" />
            Flagged Items ({flaggedApps.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {flaggedApps.map(app => {
              const job = getJobDetails(app.jobId);
              const applier = MOCK_USERS.find(u => u.id === app.applierId);
              if (!job || !applier) return null;

              return (
                <div key={app.id} className="p-6 flex flex-col md:flex-row gap-6 items-start">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                        {app.flaggedIssue}
                      </Badge>
                      <span className="text-sm text-muted-foreground">Reported by {applier.name}</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">{job.role} @ {job.company}</h3>
                    <p className="text-sm text-muted-foreground">
                      Application ID: <span className="font-mono text-white/50">{app.id}</span>
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </Button>
                    <Button size="sm" className="bg-white text-black hover:bg-white/90">
                      Resolve Issue
                    </Button>
                  </div>
                </div>
              );
            })}

            {flaggedApps.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                <Check className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
                <p>No flagged issues pending.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}