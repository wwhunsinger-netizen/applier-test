import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface HoverCardProps {
  children: React.ReactNode;
  className?: string;
  noHover?: boolean;
}

export function HoverCardWrapper({ children, className, noHover = false }: HoverCardProps) {
  if (noHover) return <div className={className}>{children}</div>;

  return (
    <motion.div
      whileHover={{ 
        y: -4,
        scale: 1.01,
        transition: { duration: 0.3, ease: "easeOut" }
      }}
      className={cn("h-full", className)}
    >
      {children}
    </motion.div>
  );
}