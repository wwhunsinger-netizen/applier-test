import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, XCircle, Calendar, ChevronDown, TrendingUp, Clock, CheckCircle2, ArrowRight, FileText, Loader2, ClipboardCheck } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/userContext";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { fetchClient, fetchApplications, fetchInterviews } from "@/lib/api";
import type { Client, Application, Interview } from "@shared/schema";

export default function ClientOverviewPage() {
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);
  const { currentUser } = useUser();
  const [greeting, setGreeting] = useState<{text: string, style: string, icon: React.ReactNode | null} | null>(null);

  const isRealClientId = Boolean(currentUser.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(currentUser.id));
  
  const { data: clientData, isLoading: isClientLoading } = useQuery({
    queryKey: ['client', currentUser.id],
    queryFn: () => fetchClient(currentUser.id),
    enabled: isRealClientId,
  });

  const { data: applications = [], isLoading: isAppsLoading } = useQuery({
    queryKey: ['applications', 'client', currentUser.id],
    queryFn: () => fetchApplications({ client_id: currentUser.id }),
    enabled: isRealClientId,
  });

  const { data: interviews = [], isLoading: isInterviewsLoading } = useQuery({
    queryKey: ['interviews', 'client', currentUser.id],
    queryFn: () => fetchInterviews({ client_id: currentUser.id }),
    enabled: isRealClientId,
  });

  useEffect(() => {
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    
    if (minutes >= 0 && minutes < 4 * 60) {
      setGreeting({ text: "Hello, night owl", style: "text-3xl font-bold tracking-tight", icon: null });
    } else if (minutes >= 4 * 60 && minutes <= 7 * 60 + 30) {
      setGreeting({ text: "Early Bird gets the worm", style: "text-3xl font-bold tracking-tight", icon: null });
    } else {
      setGreeting({ text: `Welcome back, ${currentUser.name.split(' ')[0]}`, style: "text-3xl font-bold tracking-tight", icon: null });
    }
  }, [currentUser]);
  
  const getLocalStorageApproval = (key: string): boolean => {
    if (isRealClientId) return false;
    try {
      const saved = localStorage.getItem(`client_approvals_${currentUser.id}`);
      if (saved) {
        const approvals = JSON.parse(saved);
        return approvals[key] ?? false;
      }
    } catch {}
    return false;
  };
  
  const resumeApproved = clientData?.resume_approved ?? getLocalStorageApproval('resume');
  const coverLetterApproved = clientData?.cover_letter_approved ?? getLocalStorageApproval('cover-letter');
  const jobCriteriaSignoff = clientData?.job_criteria_signoff ?? getLocalStorageApproval('job-criteria');
  
  // Onboarding is complete if all steps are done OR if applications have already been sent
  const hasApplications = applications.length > 0;
  const isOnboardingComplete = hasApplications || (resumeApproved && coverLetterApproved && jobCriteriaSignoff);
  const documentsApproved = resumeApproved && coverLetterApproved;

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const dayOfWeek = now.getDay();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    startOfWeek.setHours(0, 0, 0, 0);

    const totalApps = applications.length;
    const rejections = applications.filter(a => a.status?.toLowerCase() === 'rejected').length;
    const interviewCount = interviews.length;
    const offers = applications.filter(a => a.status?.toLowerCase() === 'offer').length;

    const todayApps = applications.filter(a => {
      const appDate = new Date(a.applied_date || a.created_at || '').toISOString().split('T')[0];
      return appDate === today;
    }).length;

    const weeklyApps = applications.filter(a => {
      const appDate = new Date(a.applied_date || a.created_at || '');
      return appDate >= startOfWeek;
    }).length;

    const applied = applications.filter(a => a.status?.toLowerCase() === 'applied').length;
    const reviewing = applications.filter(a => a.status?.toLowerCase() === 'reviewing').length;
    const interviewing = applications.filter(a => a.status?.toLowerCase() === 'interview').length;

    return { totalApps, rejections, interviews: interviewCount, offers, todayApps, weeklyApps, applied, reviewing, interviewing };
  }, [applications, interviews]);

  const nextInterview = useMemo(() => {
    const now = new Date();
    const upcoming = interviews
      .filter(i => i.date && new Date(i.date) > now)
      .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime());
    return upcoming[0] || null;
  }, [interviews]);

  const recentActivity = useMemo(() => {
    const activities: { id: string; title: string; time: string; type: string }[] = [];
    
    const sortedApps = [...applications].sort((a, b) => 
      new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()
    ).slice(0, 5);

    sortedApps.forEach(app => {
      const timeStr = app.applied_date || app.created_at 
        ? format(new Date(app.applied_date || app.created_at!), "MMM d, h:mm a")
        : 'Recently';
      
      if (app.status?.toLowerCase() === 'rejected') {
        activities.push({ id: app.id, title: `Rejected from ${app.company_name}`, time: timeStr, type: 'rejection' });
      } else if (app.status?.toLowerCase() === 'interview') {
        activities.push({ id: app.id, title: `Interview scheduled at ${app.company_name}`, time: timeStr, type: 'interview' });
      } else if (app.status?.toLowerCase() === 'offer') {
        activities.push({ id: app.id, title: `Offer received from ${app.company_name}!`, time: timeStr, type: 'offer' });
      } else {
        activities.push({ id: app.id, title: `Applied to ${app.job_title} at ${app.company_name}`, time: timeStr, type: 'applied' });
      }
    });

    return activities;
  }, [applications]);

  const isLoading = isClientLoading || isAppsLoading || isInterviewsLoading;

  if (isRealClientId && isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isOnboardingComplete) {
    return (
      <div className="space-y-8 pb-10 min-h-[60vh] flex flex-col items-center justify-center text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2" data-testid="text-welcome-title">Welcome, {currentUser.name.split(' ')[0]}!</h1>
            <p className="text-muted-foreground text-lg">Finish the following onboarding steps so we can start applying.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Link href="/client/documents">
              <Card className={cn("bg-[#111] border-white/10 transition-all h-full relative overflow-hidden", documentsApproved ? "opacity-80" : "hover:border-primary/50 cursor-pointer group")} data-testid="card-review-documents">
                {documentsApproved && (
                  <div className="absolute inset-0 bg-green-500/10 z-0 flex items-center justify-center">
                    <div className="bg-green-500/20 p-4 rounded-full backdrop-blur-sm border border-green-500/30">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                  </div>
                )}
                <CardContent className={cn("p-8 flex flex-col items-center gap-4 relative z-10", documentsApproved && "opacity-40")}>
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                    <FileText className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Review Documents</h3>
                    <p className="text-sm text-muted-foreground">Approve your resume and cover letter templates.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href={jobCriteriaSignoff ? "#" : "/client/job-criteria"}>
              <Card className={cn("bg-[#111] border-white/10 transition-all h-full relative overflow-hidden", jobCriteriaSignoff ? "opacity-80" : "hover:border-primary/50 cursor-pointer group")} data-testid="card-review-job-criteria">
                {jobCriteriaSignoff && (
                  <div className="absolute inset-0 bg-green-500/10 z-0 flex items-center justify-center">
                    <div className="bg-green-500/20 p-4 rounded-full backdrop-blur-sm border border-green-500/30">
                      <CheckCircle2 className="w-12 h-12 text-green-500" />
                    </div>
                  </div>
                )}
                <CardContent className={cn("p-8 flex flex-col items-center gap-4 relative z-10", jobCriteriaSignoff && "opacity-40")}>
                  <div className="w-16 h-16 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 group-hover:scale-110 transition-transform">
                    <ClipboardCheck className="w-8 h-8" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-white">Review Job Criteria</h3>
                    <p className="text-sm text-muted-foreground">Confirm the types of jobs we should apply to.</p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className={cn("text-white flex items-center", greeting?.style)}>
          {greeting?.icon}
          {greeting?.text}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {stats.totalApps > 0 
            ? stats.interviews > 0 
              ? "Interviews are rolling in - keep the momentum!" 
              : "Applications are going out - stay tuned for responses!"
            : "We're getting started - applications will begin soon!"}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative" onMouseEnter={() => setIsAppsExpanded(true)} onMouseLeave={() => setIsAppsExpanded(false)}>
          <Card className={cn("bg-[#111] border-white/10 cursor-pointer transition-all duration-300 hover:border-primary/50 relative z-20", isAppsExpanded ? "shadow-lg shadow-primary/10" : "")} onClick={() => setIsAppsExpanded(!isAppsExpanded)}>
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications Sent</p>
                <div className="text-3xl font-bold text-white mt-1">{stats.totalApps}</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Send className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {isAppsExpanded && (
              <motion.div initial={{ opacity: 0, y: -20, height: 0 }} animate={{ opacity: 1, y: 0, height: "auto" }} exit={{ opacity: 0, y: -20, height: 0 }} className="absolute top-full left-0 right-0 bg-[#111] border-x border-b border-white/10 rounded-b-lg overflow-hidden z-10 shadow-xl -mt-2 pt-4">
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <span className="font-mono font-bold text-white">{stats.weeklyApps}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="font-mono font-bold text-white">{stats.todayApps}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejections</p>
              <div className="text-3xl font-bold text-white mt-1">{stats.rejections}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interviews</p>
              <div className="text-3xl font-bold text-white mt-1">{stats.interviews}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#111] border-white/10">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="w-4 h-4 text-primary" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm text-muted-foreground">Applications Sent</span>
              <span className="text-lg font-bold text-white">{stats.weeklyApps}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <span className="text-sm text-muted-foreground">Response Rate</span>
              <span className="text-lg font-bold text-green-400">
                {stats.totalApps > 0 ? Math.round(((stats.interviews + stats.rejections) / stats.totalApps) * 100) : 0}%
              </span>
            </div>
            <div className="flex justify-between items-center pb-1">
              <span className="text-sm text-muted-foreground">Interviews Booked</span>
              <span className="text-lg font-bold text-white">{stats.interviews}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-24 h-24" />
          </div>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock className="w-4 h-4 text-purple-400" />
              Next Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3 relative z-10">
            {nextInterview ? (
              <>
                <div>
                  <h3 className="text-lg font-bold text-white">{nextInterview.company}</h3>
                  <p className="text-base text-primary">{nextInterview.role}</p>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{format(new Date(nextInterview.date!), "MMM d 'at' h:mm a")}</span>
                </div>
                <Link href="/client/interviews">
                  <Button size="sm" className="w-full mt-1 bg-white/5 hover:bg-white/10 text-white border border-white/10 h-8 text-xs">
                    View Details <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                </Link>
              </>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No upcoming interviews yet</p>
                <p className="text-sm text-muted-foreground/70 mt-1">We'll notify you when one is scheduled</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-6">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative pl-6 border-l border-white/10 last:border-0">
                    <div className={cn(
                      "absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#111]",
                      activity.type === 'applied' ? "bg-primary" :
                      activity.type === 'interview' ? "bg-purple-500" :
                      activity.type === 'rejection' ? "bg-red-500" : 
                      activity.type === 'offer' ? "bg-green-500" : "bg-blue-400"
                    )} />
                    <p className="text-sm font-medium text-white">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No activity yet</p>
                <p className="text-sm mt-1">Activity will appear here as applications are sent</p>
              </div>
            )}
            {recentActivity.length > 0 && (
              <Link href="/client/applications">
                <Button variant="link" className="w-full text-muted-foreground hover:text-white mt-4 h-auto p-0 text-sm">
                  View All Activity →
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>

        <Card className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">Your Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applied</span>
                <span className="font-bold text-white">{stats.applied}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: `${stats.totalApps > 0 ? (stats.applied / stats.totalApps) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interviewing</span>
                <span className="font-bold text-white">{stats.interviewing}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500" style={{ width: `${stats.totalApps > 0 ? (stats.interviewing / stats.totalApps) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offers</span>
                <span className="font-bold text-white">{stats.offers}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500" style={{ width: `${stats.totalApps > 0 ? (stats.offers / stats.totalApps) * 100 : 0}%` }} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rejections</span>
                <span className="font-bold text-white">{stats.rejections}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-red-500" style={{ width: `${stats.totalApps > 0 ? (stats.rejections / stats.totalApps) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
