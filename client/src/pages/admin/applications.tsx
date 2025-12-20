import { useState } from "react";
import { useApplications } from "@/lib/applicationsContext";
import { useUser } from "@/lib/userContext";
import { MOCK_USERS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, CheckCircle2, Trophy, Clock, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function AdminApplicationsPage() {
  const { applications, updateApplicationStatus, getJobDetails } = useApplications();
  const [search, setSearch] = useState("");
  const [selectedApplier, setSelectedApplier] = useState<string | "all">("all");

  // Get only Appliers and Reviewers
  const appliers = MOCK_USERS.filter(u => u.role !== "Admin");

  const filteredApps = applications.filter(app => {
    const job = getJobDetails(app.jobId);
    const matchesSearch = job?.company.toLowerCase().includes(search.toLowerCase()) || 
                          job?.role.toLowerCase().includes(search.toLowerCase());
    const matchesApplier = selectedApplier === "all" || app.applierId === selectedApplier;
    
    return matchesSearch && matchesApplier;
  });

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
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-white">Applications Overview</h1>
        <p className="text-muted-foreground">Monitor and action all submitted applications.</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#111] p-4 rounded-lg border border-white/5">
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={selectedApplier === "all" ? "default" : "outline"} 
            size="sm"
            onClick={() => setSelectedApplier("all")}
            className="rounded-full"
          >
            All Appliers
          </Button>
          {appliers.map(user => (
            <Button
              key={user.id}
              variant={selectedApplier === user.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedApplier(user.id)}
              className="rounded-full flex items-center gap-2"
            >
              <img src={user.avatar} className="w-4 h-4 rounded-full" />
              {user.name}
            </Button>
          ))}
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

      {/* List */}
      <Card className="bg-[#111] border-white/10">
        <CardContent className="p-0">
          <div className="divide-y divide-white/5">
            {filteredApps.map(app => {
              const job = getJobDetails(app.jobId);
              const applier = MOCK_USERS.find(u => u.id === app.applierId);
              if (!job || !applier) return null;

              return (
                <div key={app.id} className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row gap-4 justify-between items-center group">
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-muted-foreground">
                      {job.company.substring(0, 1)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white truncate">{job.role}</h3>
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="font-medium text-white">{job.company}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Applied by <img src={applier.avatar} className="w-4 h-4 rounded-full ml-1" /> {applier.name}
                        </span>
                        <span>•</span>
                        <span>{app.appliedDate}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
                       onClick={() => updateApplicationStatus(app.id, "Interview")}
                       disabled={app.status === "Interview" || app.status === "Offer"}
                     >
                       <CheckCircle2 className="w-4 h-4 mr-2" />
                       Mark Interview
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline"
                       className="border-yellow-500/20 hover:bg-yellow-500/10 hover:text-yellow-500"
                       onClick={() => updateApplicationStatus(app.id, "Offer")}
                       disabled={app.status === "Offer"}
                     >
                       <Trophy className="w-4 h-4 mr-2" />
                       Mark Offer
                     </Button>
                  </div>
                </div>
              );
            })}
            
            {filteredApps.length === 0 && (
              <div className="p-12 text-center text-muted-foreground">
                No applications found matching your criteria.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}