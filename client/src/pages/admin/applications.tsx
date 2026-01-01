import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApplications, fetchAppliers, updateApplication } from "@/lib/api";
import type { Application, Applier } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, CheckCircle2, Trophy, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminApplicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedApplier, setSelectedApplier] = useState<string | "all">("all");

  const { data: applications = [], isLoading: isLoadingApps } = useQuery({
    queryKey: ['applications'],
    queryFn: () => fetchApplications()
  });

  const { data: appliers = [], isLoading: isLoadingAppliers } = useQuery({
    queryKey: ['appliers'],
    queryFn: fetchAppliers
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      updateApplication(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast({
        title: "Status updated",
        description: "Application status has been updated successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  });

  const getApplierName = (applierId: string) => {
    const applier = appliers.find(a => a.id === applierId);
    return applier ? `${applier.first_name} ${applier.last_name}` : 'Unknown';
  };

  const getApplierInitials = (applierId: string) => {
    const applier = appliers.find(a => a.id === applierId);
    if (!applier) return '?';
    return `${applier.first_name[0]}${applier.last_name[0]}`;
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.company_name?.toLowerCase().includes(search.toLowerCase()) || 
      app.job_title?.toLowerCase().includes(search.toLowerCase());
    const matchesApplier = selectedApplier === "all" || app.applier_id === selectedApplier;
    
    return matchesSearch && matchesApplier;
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
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const isLoading = isLoadingApps || isLoadingAppliers;

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
            data-testid="filter-all-appliers"
          >
            All Appliers
          </Button>
          {appliers.map(applier => (
            <Button
              key={applier.id}
              variant={selectedApplier === applier.id ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedApplier(applier.id)}
              className="rounded-full flex items-center gap-2"
              data-testid={`filter-applier-${applier.id}`}
            >
              <div className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary">
                {applier.first_name[0]}{applier.last_name[0]}
              </div>
              {applier.first_name} {applier.last_name}
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
            data-testid="input-search-applications"
          />
        </div>
      </div>

      {/* Stats Summary */}
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
            <p className="text-sm text-muted-foreground">Applied</p>
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

      {/* List */}
      <Card className="bg-[#111] border-white/10">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filteredApps.map(app => (
                <div 
                  key={app.id} 
                  className="p-4 hover:bg-white/5 transition-colors flex flex-col md:flex-row gap-4 justify-between items-center group"
                  data-testid={`application-row-${app.id}`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0 w-full">
                    <div className="h-10 w-10 rounded-full bg-white/10 flex items-center justify-center font-bold text-lg text-muted-foreground">
                      {app.company_name?.substring(0, 1) || '?'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white truncate">{app.job_title || 'Unknown Role'}</h3>
                        <Badge variant="outline" className={getStatusColor(app.status)}>
                          {app.status || 'Pending'}
                        </Badge>
                        {app.qa_status && (
                          <Badge variant="outline" className={
                            app.qa_status === 'Approved' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                            app.qa_status === 'Rejected' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                            'bg-gray-500/10 text-gray-400 border-gray-500/20'
                          }>
                            QA: {app.qa_status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
                        <span className="font-medium text-white">{app.company_name || 'Unknown Company'}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          Applied by 
                          <span className="inline-flex items-center gap-1 ml-1">
                            <span className="w-4 h-4 rounded-full bg-primary/30 flex items-center justify-center text-[8px] font-bold text-primary">
                              {getApplierInitials(app.applier_id)}
                            </span>
                            {getApplierName(app.applier_id)}
                          </span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(app.applied_date || app.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                     <Button 
                       size="sm" 
                       variant="outline" 
                       className="border-blue-500/20 hover:bg-blue-500/10 hover:text-blue-500"
                       onClick={() => updateStatusMutation.mutate({ id: app.id, status: "Interview" })}
                       disabled={app.status?.toLowerCase() === "interview" || app.status?.toLowerCase() === "offer" || updateStatusMutation.isPending}
                       data-testid={`btn-interview-${app.id}`}
                     >
                       <CheckCircle2 className="w-4 h-4 mr-2" />
                       Interview
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline"
                       className="border-green-500/20 hover:bg-green-500/10 hover:text-green-500"
                       onClick={() => updateStatusMutation.mutate({ id: app.id, status: "Offer" })}
                       disabled={app.status?.toLowerCase() === "offer" || updateStatusMutation.isPending}
                       data-testid={`btn-offer-${app.id}`}
                     >
                       <Trophy className="w-4 h-4 mr-2" />
                       Offer
                     </Button>
                     <Button 
                       size="sm" 
                       variant="outline"
                       className="border-red-500/20 hover:bg-red-500/10 hover:text-red-500"
                       onClick={() => updateStatusMutation.mutate({ id: app.id, status: "Rejected" })}
                       disabled={app.status?.toLowerCase() === "rejected" || updateStatusMutation.isPending}
                       data-testid={`btn-rejected-${app.id}`}
                     >
                       <XCircle className="w-4 h-4 mr-2" />
                       Rejected
                     </Button>
                  </div>
                </div>
              ))}
              
              {filteredApps.length === 0 && !isLoading && (
                <div className="p-12 text-center text-muted-foreground">
                  {search || selectedApplier !== "all" 
                    ? "No applications found matching your criteria."
                    : "No applications have been submitted yet."}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
