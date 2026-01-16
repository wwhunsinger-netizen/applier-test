import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  RefreshCw,
  Briefcase,
  Rss,
  AlertTriangle,
  Users,
  Building2,
  DollarSign,
  CheckCircle,
  Info,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export default function AdminQueuesPage() {
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Queue Manager
          </h1>
          <p className="text-muted-foreground mt-1">
            Job queues are now managed automatically by the Feed API system.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <Card className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border-blue-500/20">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <RefreshCw className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">
                Automatic Queue Sync Active
              </h2>
              <p className="text-muted-foreground mt-1">
                Job queues are automatically managed by the centralized feed
                system. No manual sync required.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* How It Works */}
      <Card className="bg-[#111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg flex items-center gap-2">
            <Info className="w-5 h-5 text-blue-400" />
            How the New System Works
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm">
                1
              </div>
              <div>
                <h4 className="font-medium text-white">Job Feed Aggregation</h4>
                <p className="text-sm text-muted-foreground">
                  Jobs are collected from multiple sources (LinkedIn, Indeed,
                  etc.) and stored in the centralized feed database.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm">
                2
              </div>
              <div>
                <h4 className="font-medium text-white">AI Filtering</h4>
                <p className="text-sm text-muted-foreground">
                  Jobs are filtered based on client preferences, location,
                  salary requirements, and role matching.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-blue-500/20 text-blue-400 rounded-full flex items-center justify-center font-semibold text-sm">
                3
              </div>
              <div>
                <h4 className="font-medium text-white">Queue Assignment</h4>
                <p className="text-sm text-muted-foreground">
                  Filtered jobs are assigned to appliers based on client
                  assignments and workload balancing.
                </p>
              </div>
            </div>

            <div className="flex gap-4 items-start">
              <div className="flex-shrink-0 w-8 h-8 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center font-semibold text-sm">
                4
              </div>
              <div>
                <h4 className="font-medium text-white">Application Flow</h4>
                <p className="text-sm text-muted-foreground">
                  Appliers see their queue, apply to jobs, and the system tracks
                  everything automatically.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-[#111] border-white/10">
        <CardHeader>
          <CardTitle className="text-white text-lg">Admin Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/admin/review"
              className="flex items-center gap-4 p-4 bg-black/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 bg-red-500/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Review Flagged Jobs</h4>
                <p className="text-sm text-muted-foreground">
                  Review and resolve jobs flagged by appliers
                </p>
              </div>
            </a>

            <a
              href="/admin/appliers"
              className="flex items-center gap-4 p-4 bg-black/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Manage Appliers</h4>
                <p className="text-sm text-muted-foreground">
                  View applier performance and assignments
                </p>
              </div>
            </a>

            <a
              href="/admin/clients"
              className="flex items-center gap-4 p-4 bg-black/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Building2 className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">Manage Clients</h4>
                <p className="text-sm text-muted-foreground">
                  View client preferences and application stats
                </p>
              </div>
            </a>

            <a
              href="/admin/applications"
              className="flex items-center gap-4 p-4 bg-black/50 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
            >
              <div className="p-2 bg-green-500/20 rounded-lg">
                <Briefcase className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <h4 className="font-medium text-white">All Applications</h4>
                <p className="text-sm text-muted-foreground">
                  View all submitted applications
                </p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Technical Details (collapsible) */}
      <Collapsible
        open={showTechnicalDetails}
        onOpenChange={setShowTechnicalDetails}
      >
        <Card className="bg-[#111] border-white/10">
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-white/5 transition-colors">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">
                  Technical Details
                </CardTitle>
                <Badge
                  variant="outline"
                  className="border-white/20 text-muted-foreground"
                >
                  {showTechnicalDetails ? "Hide" : "Show"}
                </Badge>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <CardContent className="space-y-4 pt-0">
              <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                <h4 className="font-medium text-white mb-2">
                  Feed API Base URL
                </h4>
                <code className="text-xs text-muted-foreground break-all bg-black/50 px-2 py-1 rounded">
                  https://p01--jobindex-postgrest--54lkjbzvq5q4.code.run/rpc
                </code>
              </div>

              <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                <h4 className="font-medium text-white mb-2">
                  Available Endpoints
                </h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <code>applier_jobs_queue</code> - Get queue for applier
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <code>set_application_status</code> - Mark job applied
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <code>set_job_flag</code> - Flag a job
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <code>set_job_flag_resolved</code> - Resolve flag
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-green-400" />
                    <code>admin_flagged_jobs</code> - Get all flags
                  </li>
                </ul>
              </div>

              <div className="p-4 bg-black/50 rounded-lg border border-white/10">
                <h4 className="font-medium text-white mb-2">Local Storage</h4>
                <p className="text-sm text-muted-foreground">
                  Applications are still stored locally in Supabase for earnings
                  tracking, interview management, and reporting.
                </p>
              </div>

              <div className="p-4 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <h4 className="font-medium text-yellow-400 mb-2">
                  Migration Note
                </h4>
                <p className="text-sm text-yellow-200/70">
                  The local{" "}
                  <code className="bg-black/30 px-1 rounded">jobs</code>,{" "}
                  <code className="bg-black/30 px-1 rounded">
                    applier_job_sessions
                  </code>
                  , and{" "}
                  <code className="bg-black/30 px-1 rounded">
                    flagged_applications
                  </code>{" "}
                  tables are deprecated and will be removed after the migration
                  is verified.
                </p>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
    </div>
  );
}
