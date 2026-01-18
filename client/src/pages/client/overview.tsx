import { Card, CardContent } from "@/components/ui/card";
import { Send, Calendar, FileText, Loader2, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { useUser } from "@/lib/userContext";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { fetchClient, fetchApplications } from "@/lib/api";
import type { Application } from "@shared/schema";

export default function ClientOverviewPage() {
  const { currentUser } = useUser();

  const isRealClientId = Boolean(
    currentUser?.id &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        currentUser?.id,
      ),
  );

  const { data: clientData, isLoading: isClientLoading } = useQuery({
    queryKey: ["client", currentUser?.id],
    queryFn: () => fetchClient(currentUser?.id!),
    enabled: isRealClientId,
  });

  const { data: applications = [], isLoading: isAppsLoading } = useQuery({
    queryKey: ["applications", "client", currentUser?.id],
    queryFn: () => fetchApplications({ client_id: currentUser?.id }),
    enabled: isRealClientId,
  });

  const stats = useMemo(() => {
    const totalApps = applications.length;
    const interviews = applications.filter(
      (a: Application) => a.status === "Interview",
    ).length;
    return { totalApps, interviews };
  }, [applications]);

  const isLoading = isClientLoading || isAppsLoading;

  if (isRealClientId && isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const firstName = currentUser?.name?.split(" ")[0] || "there";

  return (
    <div className="space-y-8 pb-10 min-h-[60vh] flex flex-col">
      {/* Header with app count */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-2"
      >
        <h1 className="text-4xl font-bold text-white">
          Welcome back, {firstName}!
        </h1>
        <div className="flex items-center justify-center gap-2 text-muted-foreground">
          <Send className="w-4 h-4" />
          <span className="text-lg">
            <span className="text-white font-bold">{stats.totalApps}</span>{" "}
            applications sent
          </span>
        </div>
      </motion.div>

      {/* Two big buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex-1 flex items-center justify-center"
      >
        <div className="grid gap-6 md:grid-cols-2 w-full max-w-3xl">
          <Link href="/client/documents">
            <Card className="bg-[#111] border-white/10 hover:border-primary/50 cursor-pointer group transition-all h-full">
              <CardContent className="p-10 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <FileText className="w-10 h-10" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-bold text-white">
                    Application Documents
                  </h3>
                  <p className="text-muted-foreground">
                    View your resume and cover letter
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary group-hover:gap-3 transition-all">
                  <span className="font-medium">View Documents</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href="/client/interviews">
            <Card className="bg-[#111] border-white/10 hover:border-green-500/50 cursor-pointer group transition-all h-full relative overflow-hidden">
              {stats.interviews > 0 && (
                <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">
                  {stats.interviews} active
                </div>
              )}
              <CardContent className="p-10 flex flex-col items-center gap-6">
                <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                  <Calendar className="w-10 h-10" />
                </div>
                <div className="space-y-2 text-center">
                  <h3 className="text-2xl font-bold text-white">Interviews</h3>
                  <p className="text-muted-foreground">
                    View prep docs and upcoming interviews
                  </p>
                </div>
                <div className="flex items-center gap-2 text-green-500 group-hover:gap-3 transition-all">
                  <span className="font-medium">View Interviews</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </CardContent>
            </Card>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
