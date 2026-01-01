import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchApplications } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ExternalLink, Send, Loader2 } from "lucide-react";
import { useUser } from "@/lib/userContext";

export default function ClientApplicationsPage() {
  const { currentUser } = useUser();
  const [search, setSearch] = useState("");
  
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['applications', 'client', currentUser.id],
    queryFn: () => fetchApplications({ client_id: currentUser.id }),
    enabled: !!currentUser.id
  });

  const filteredApps = applications.filter(app => {
    const searchLower = search.toLowerCase();
    return (
      app.company_name?.toLowerCase().includes(searchLower) ||
      app.job_title?.toLowerCase().includes(searchLower)
    );
  });

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "offer": return "bg-green-500/10 text-green-500 border-green-500/20";
      case "interview": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "rejected": return "bg-red-500/10 text-red-500 border-red-500/20";
      case "applied": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Recently';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
            data-testid="input-search-applications"
          />
        </div>
      </div>

      {/* Stats Summary */}
      {applications.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-white">{applications.length}</div>
              <p className="text-sm text-muted-foreground">Total Apps</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {applications.filter(a => a.status?.toLowerCase() === 'applied').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-500">
                {applications.filter(a => a.status?.toLowerCase() === 'interview').length}
              </div>
              <p className="text-sm text-muted-foreground">Interviews</p>
            </CardContent>
          </Card>
          <Card className="bg-[#111] border-white/10">
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-500">
                {applications.filter(a => a.status?.toLowerCase() === 'offer').length}
              </div>
              <p className="text-sm text-muted-foreground">Offers</p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredApps.length > 0 ? (
          filteredApps.map(app => (
            <Card 
              key={app.id} 
              className="bg-[#111] border-white/10 hover:bg-white/5 transition-colors group"
              data-testid={`application-card-${app.id}`}
            >
              <CardContent className="p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded bg-white/10 flex items-center justify-center font-bold text-xl text-muted-foreground">
                    {app.company_name?.substring(0, 1) || '?'}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg group-hover:text-primary transition-colors flex items-center gap-2">
                      {app.job_title || 'Unknown Role'}
                      {app.job_url && (
                        <a 
                          href={app.job_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </h3>
                    <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                      <span className="font-medium text-white/80">{app.company_name || 'Unknown Company'}</span>
                      <span>•</span>
                      <span>Applied {formatDate(app.applied_date || app.created_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Badge variant="outline" className={getStatusColor(app.status)}>
                    {app.status || 'Pending'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-lg bg-white/5">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
              <Send className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-bold text-white mb-1">No applications sent yet</h3>
            <p className="text-muted-foreground text-center max-w-sm">
              {search 
                ? "No applications match your search."
                : "Once we finish onboarding and setting your criteria, we'll start applying to jobs on your behalf."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
