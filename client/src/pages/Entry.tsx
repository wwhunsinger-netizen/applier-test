import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, XCircle } from "lucide-react";
import { useTest } from "@/context/TestContext";
import PageTransition from "@/components/PageTransition";

type Step = "name" | "email" | "blocked";

export default function Entry() {
  const [, navigate] = useLocation();
  const { setCandidate, setProgress, completeStep } = useTest();
  const [step, setStep] = useState<Step>("name");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setProgress(step === "name" ? 5 : 10);
  }, [step, setProgress]);

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep("email");
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || checking) return;

    setChecking(true);
    try {
      const res = await fetch(`/api/test-submissions/check-email?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      if (data.taken) {
        setStep("blocked");
        return;
      }
    } catch {
      // If check fails, let them proceed (backend will still block duplicate submission)
    } finally {
      setChecking(false);
    }

    setCandidate(name.trim(), email.trim().toLowerCase());
    completeStep("entry");
    navigate("/test/screening");
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6">
          <AnimatePresence mode="wait">
            {step === "name" && (
              <motion.form
                key="name"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onSubmit={handleNameSubmit}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold">What's your first name?</h1>
                <Input
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="First name"
                  className="text-center text-lg h-12"
                  required
                />
                <Button type="submit" size="lg" className="w-full" disabled={!name.trim()}>
                  Continue
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.form>
            )}

            {step === "email" && (
              <motion.form
                key="email"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                onSubmit={handleEmailSubmit}
                className="space-y-6"
              >
                <h1 className="text-3xl font-bold">Hey, {name}</h1>
                <p className="text-muted-foreground">What's your email?</p>
                <Input
                  autoFocus
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="text-center text-lg h-12"
                  required
                />
                <Button type="submit" size="lg" className="w-full" disabled={!email.trim() || checking}>
                  {checking ? "Checking..." : "Continue"}
                  {!checking && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
              </motion.form>
            )}

            {step === "blocked" && (
              <motion.div
                key="blocked"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="space-y-6"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <h1 className="text-3xl font-bold">Already Taken</h1>
                <p className="text-muted-foreground">
                  This assessment can only be taken once. A submission for <strong>{email}</strong> already exists.
                </p>
                <p className="text-sm text-muted-foreground">
                  You may close this window.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PageTransition>
  );
}
