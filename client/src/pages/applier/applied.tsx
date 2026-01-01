import { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building, Clock, CheckCircle, ExternalLink, Timer, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchApplications, fetchJobs } from "@/lib/api";
import { useUser } from "@/lib/userContext";
import type { Application, Job } from "@shared/schema";

export default function AppliedPage() {
  const { currentUser } = useUser();
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Record<string, Job>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || currentUser.role !== "Applier") return;

    setIsLoading(true);
    
    fetchApplications({ applier_id: currentUser.id })
      .then(async (apps) => {
        setApplications(apps);
        
        // Fetch job details for all applications
        const allJobs = await fetchJobs();
        const jobMap: Record<string, Job> = {};
        allJobs.forEach(job => {
          jobMap[job.id] = job;
        });
        setJobs(jobMap);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading applications...
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Applied Jobs</h1>
          <p className="text-muted-foreground mt-1">Your completed applications</p>
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Applied Jobs</h1>
        <p className="text-muted-foreground mt-1">
          {applications.length} application{applications.length !== 1 ? 's' : ''} completed
        </p>
      </div>

      <div className="space-y-4">
        {applications.map((app) => {
          const job = jobs[app.job_id];
          const jobTitle = (job as any)?.job_title || job?.role || 'Unknown Position';
          const companyName = (job as any)?.company_name || job?.company || 'Unknown Company';
          const jobUrl = (job as any)?.job_url;

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
                      <h3 className="text-xl font-bold font-heading" data-testid={`text-job-title-${app.id}`}>
                        {jobTitle}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <Building className="w-3 h-3" /> {companyName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" /> 
                          Applied {app.applied_date ? formatDistanceToNow(new Date(app.applied_date), { addSuffix: true }) : 'recently'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-green-600 text-sm font-medium">
                      <CheckCircle className="w-4 h-4" />
                      Application Submitted
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">
                      {app.status}
                    </Badge>
                    
                    {jobUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(jobUrl, '_blank')}
                        data-testid={`button-view-job-${app.id}`}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        View Job
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
