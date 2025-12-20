import { useApplications } from "@/lib/applicationsContext";
import { MOCK_USERS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ShieldCheck, RefreshCw } from "lucide-react";

export default function AdminQAPage() {
  const { applications, updateQAStatus, getJobDetails } = useApplications();

  // Simple "1/10" simulation: Just grab applications where qaStatus is 'None' and take every 2nd one for demo purposes
  // In a real app this would be random sampling logic
  const qaQueue = applications.filter((app, index) => app.qaStatus === "None" && index % 2 === 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Quality Assurance</h1>
        <p className="text-muted-foreground">Random sampling of applier submissions for quality control.</p>
      </div>

      <div className="grid gap-6">
        {qaQueue.map(app => {
          const job = getJobDetails(app.jobId);
          const applier = MOCK_USERS.find(u => u.id === app.applierId);
          if (!job || !applier) return null;

          return (
            <Card key={app.id} className="bg-[#111] border-white/10 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* Left: App Info */}
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ShieldCheck className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground uppercase tracking-wider font-bold">QA Sample</div>
                        <div className="text-white font-medium flex items-center gap-2">
                          Applier: <img src={applier.avatar} className="w-5 h-5 rounded-full" /> {applier.name}
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4 space-y-2 border border-white/5">
                      <h3 className="font-bold text-lg text-white">{job.role}</h3>
                      <p className="text-muted-foreground">{job.company}</p>
                      <div className="pt-2 text-sm text-white/70 italic border-l-2 border-white/10 pl-3">
                        "Application submitted successfully with tailored resume..."
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-col justify-center gap-3 border-l border-white/5 pl-6">
                    <Button 
                      className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 h-12"
                      onClick={() => updateQAStatus(app.id, "Approved")}
                    >
                      <Check className="w-5 h-5 mr-2" />
                      Approve Quality
                    </Button>
                    <Button 
                      className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 h-12"
                      onClick={() => updateQAStatus(app.id, "Rejected")}
                    >
                      <X className="w-5 h-5 mr-2" />
                      Reject (Fail)
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {qaQueue.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5">
            <Check className="w-12 h-12 mx-auto mb-4 text-green-500/20" />
            <p>QA Queue is clear! Great job.</p>
            <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" /> Refresh Samples
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}