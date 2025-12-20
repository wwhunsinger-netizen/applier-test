import { MOCK_CLIENT_STATS } from "@/lib/mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Send, XCircle, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export default function ClientOverviewPage() {
  const [isAppsExpanded, setIsAppsExpanded] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white">Overview</h1>
        <p className="text-muted-foreground mt-1">Track your job search progress.</p>
      </div>

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
    </div>
  );
}