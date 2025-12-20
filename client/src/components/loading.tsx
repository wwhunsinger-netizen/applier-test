import { motion } from "framer-motion";
import logoUrl from "@assets/Its_not_a_career,_its_a_heist._(5)_1766203128601.png";

export default function LoadingScreen() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
      <div className="relative">
        {/* Pulse effect behind logo */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute inset-0 bg-primary/20 blur-3xl rounded-full"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 flex flex-col items-center"
        >
          <img 
            src={logoUrl} 
            alt="Jumpseat" 
            className="w-48 object-contain mb-8"
          />
          
          <div className="flex gap-1.5">
             <motion.div 
               animate={{ scaleY: [1, 1.5, 1] }} 
               transition={{ duration: 1, repeat: Infinity, delay: 0 }}
               className="w-1 h-8 bg-primary rounded-full" 
             />
             <motion.div 
               animate={{ scaleY: [1, 1.5, 1] }} 
               transition={{ duration: 1, repeat: Infinity, delay: 0.1 }}
               className="w-1 h-8 bg-primary rounded-full" 
             />
             <motion.div 
               animate={{ scaleY: [1, 1.5, 1] }} 
               transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
               className="w-1 h-8 bg-primary rounded-full" 
             />
          </div>
        </motion.div>
      </div>
    </div>
  );
}