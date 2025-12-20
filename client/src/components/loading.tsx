import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from "react";
import logoUrl from "@assets/Jumpseat_(18)_1766204186693.png";

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((oldProgress) => {
        if (oldProgress === 100) {
          clearInterval(timer);
          return 100;
        }
        const diff = Math.random() * 10;
        return Math.min(oldProgress + diff, 100);
      });
    }, 100);

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      {/* Background Gradient - Bottom Right Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
         <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm">
        {/* Logo J */}
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
        
        {/* Progress Bar */}
        <div className="w-full space-y-4">
          <Progress value={progress} className="h-[2px] bg-white/10" indicatorClassName="bg-primary shadow-[0_0_10px_2px_rgba(220,38,38,0.5)]" />
          
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center text-xs text-muted-foreground tracking-wide"
          >
            Preparing your session...
          </motion.p>
        </div>
      </div>
    </div>
  );
}