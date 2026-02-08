import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import PageTransition from "@/components/PageTransition";
import logoUrl from "@assets/Jumpseat_(18)_1766204186693.png";

export default function Welcome() {
  const [, navigate] = useLocation();
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 2000;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      const easeOutProgress = (1 - Math.pow(1 - t, 3)) * 100;

      setProgress(easeOutProgress);

      if (t >= 1) {
        clearInterval(timer);
        setTimeout(() => navigate("/test/start"), 400);
      }
    }, 10);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center w-full max-w-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="mb-8"
          >
            <img
              src={logoUrl}
              alt="Jumpseat"
              className="w-24 h-auto object-contain"
            />
          </motion.div>

          <div className="w-full space-y-4">
            <Progress
              value={progress}
              className="h-[2px] bg-white/10"
              indicatorClassName="bg-primary shadow-[0_0_10px_2px_rgba(220,38,38,0.5)]"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-muted-foreground tracking-wide"
            >
              Preparing your session...
            </motion.p>
          </div>
        </motion.div>
      </div>
    </PageTransition>
  );
}
