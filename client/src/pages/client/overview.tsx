import { MOCK_CLIENT_STATS, MOCK_CLIENT_WEEKLY_PROGRESS, MOCK_CLIENT_ACTIVITY_FEED, MOCK_CLIENT_PIPELINE, MOCK_CLIENT_INTERVIEWS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, XCircle, Calendar, ChevronDown, ChevronUp, TrendingUp, Clock, CheckCircle2, ArrowRight, Flame } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/userContext";
import { format } from "date-fns";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function ClientOverviewPage() {
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);
  const { currentUser } = useUser();
  
  const nextInterview = MOCK_CLIENT_INTERVIEWS.find(i => new Date(i.date) > new Date()) || MOCK_CLIENT_INTERVIEWS[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Welcome back, {currentUser.name.split(' ')[0]}</h1>
        <p className="text-muted-foreground mt-1 text-lg">Interviews are rolling in - keep the momentum!</p>
      </div>

      {/* 3 Metric Pills */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Applications Sent Pill */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAppsExpanded(true)}
          onMouseLeave={() => setIsAppsExpanded(false)}
        >
          <Card 
            className={cn(
              "bg-[#111] border-white/10 cursor-pointer transition-all duration-300 hover:border-primary/50 relative z-20",
              isAppsExpanded ? "shadow-lg shadow-primary/10" : ""
            )}
            onClick={() => setIsAppsExpanded(!isAppsExpanded)}
          >
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Applications Sent</p>
                <div className="text-3xl font-bold text-white mt-1">{MOCK_CLIENT_STATS.totalApps}</div>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Send className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          <AnimatePresence>
            {isAppsExpanded && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="absolute top-full left-0 right-0 bg-[#111] border-x border-b border-white/10 rounded-b-lg overflow-hidden z-10 shadow-xl -mt-2 pt-4"
              >
                <div className="p-4 space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm text-muted-foreground">Weekly</span>
                    <span className="font-mono font-bold text-white">{MOCK_CLIENT_STATS.weeklyApps}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Today</span>
                    <span className="font-mono font-bold text-white">{MOCK_CLIENT_STATS.dailyApps}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Rejections Pill */}
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Rejections</p>
              <div className="text-3xl font-bold text-white mt-1">{MOCK_CLIENT_STATS.rejections}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
              <XCircle className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Interviews Pill */}
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Interviews</p>
              <div className="text-3xl font-bold text-white mt-1">{MOCK_CLIENT_STATS.interviews}</div>
            </div>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
              <Calendar className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Grid: Week Progress & Next Interview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Week Progress Card */}
        <Card className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="w-5 h-5 text-primary" />
              This Week's Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <span className="text-muted-foreground">Applications Sent</span>
               <span className="text-xl font-bold text-white">{MOCK_CLIENT_WEEKLY_PROGRESS.appsSent}</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <span className="text-muted-foreground">Response Rate</span>
               <span className="text-xl font-bold text-green-400">{MOCK_CLIENT_WEEKLY_PROGRESS.responseRate}%</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
               <span className="text-muted-foreground">Interviews Booked</span>
               <span className="text-xl font-bold text-white">{MOCK_CLIENT_WEEKLY_PROGRESS.interviewsBooked}</span>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Flame className="w-5 h-5 text-orange-500 animate-pulse" />
              <span className="font-bold text-orange-500">Weekly Streak: {MOCK_CLIENT_WEEKLY_PROGRESS.weeklyStreak} weeks</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Interview Card */}
        <Card className="bg-[#111] border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock className="w-32 h-32" />
          </div>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="w-5 h-5 text-purple-400" />
              Next Interview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 relative z-10">
            <div>
              <h3 className="text-2xl font-bold text-white">{nextInterview.company}</h3>
              <p className="text-lg text-primary">{nextInterview.role}</p>
            </div>
            
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(new Date(nextInterview.date), "MMM d 'at' h:mm a")}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded text-xs text-white ml-2">In 3 days</span>
            </div>

            <Link href="/client/interviews">
              <Button className="w-full mt-2 bg-white/5 hover:bg-white/10 text-white border border-white/10">
                View Prep Doc <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Grid: Activity Feed & Pipeline */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Activity Feed */}
        <Card className="bg-[#111] border-white/10">
          <CardHeader>
             <CardTitle className="text-lg">📌 Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {MOCK_CLIENT_ACTIVITY_FEED.map((activity, i) => (
                <div key={activity.id} className="relative pl-6 border-l border-white/10 last:border-0">
                  <div className={cn(
                    "absolute left-[-5px] top-1.5 w-2.5 h-2.5 rounded-full ring-4 ring-[#111]",
                    activity.type === 'applied' ? "bg-primary" :
                    activity.type === 'interview' ? "bg-purple-500" :
                    activity.type === 'rejection' ? "bg-red-500" : "bg-blue-400"
                  )} />
                  <p className="text-sm font-medium text-white">{activity.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              ))}
            </div>
            <Button variant="link" className="w-full text-muted-foreground hover:text-white mt-4 h-auto p-0 text-sm">
              View All Activity →
            </Button>
          </CardContent>
        </Card>

        {/* Pipeline Visual */}
        <Card className="bg-[#111] border-white/10">
          <CardHeader>
            <CardTitle className="text-lg">📈 Your Pipeline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Applied</span>
                <span className="font-bold text-white">{MOCK_CLIENT_PIPELINE.applied}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-primary w-[70%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Reviewing</span>
                <span className="font-bold text-white">{MOCK_CLIENT_PIPELINE.reviewing}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-[45%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Interviewing</span>
                <span className="font-bold text-white">{MOCK_CLIENT_PIPELINE.interviewing}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 w-[30%]" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Offers</span>
                <span className="font-bold text-white">{MOCK_CLIENT_PIPELINE.offers}</span>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 w-[10%]" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}