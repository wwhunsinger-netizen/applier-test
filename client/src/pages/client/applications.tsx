import { useState } from "react";
import { MOCK_APPLICATIONS, Job, MOCK_JOBS } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink } from "lucide-react";
import { format } from "date-fns";

export default function ClientApplicationsPage() {
  const [search, setSearch] = useState("");
  
  // Filter for current user's apps (mocked as user-1 for now for client view)
  // In real app, filter by current user ID
  const myApps = MOCK_APPLICATIONS.filter(app => app.applierId === "user-1");

  const getJob = (jobId: string) => MOCK_JOBS.find(j => j.id === jobId);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Offer": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "Interview": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "Rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "Applied": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Applications Sent</h1>
          <p className="text-muted-foreground mt-1">History of all jobs applied to on your behalf.</p>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="search" 
            placeholder="Search company or role..." 
            className="pl-9 bg-background" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4">
        {myApps.map(app => {
          const job = getJob(app.jobId);
          if (!job) return null;
          
          return (
            <Card key={app.id} className="bg-[#111] border-white/10 hover:bg-white/5 transition-colors group">
              <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center font-bold text-xl text-muted-foreground">
                    {job.company.substring(0, 1)}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                      {job.role}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="font-medium text-white/80">{job.company}</span>
                      <span>•</span>
                      <span>Applied {app.appliedDate}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                   <Badge variant="outline" className={getStatusColor(app.status)}>
                     {app.status}
                   </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}