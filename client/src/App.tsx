import { Switch, Route, useLocation, useParams, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { useState, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { TestProvider, useTest } from "@/context/TestContext";
import WelcomePage from "@/pages/Welcome";
import EntryPage from "@/pages/Entry";
import TypingTestPage from "@/pages/TypingTest";
import ApplicationReviewPage from "@/pages/ApplicationReview";
import JobApplicationPage from "@/pages/JobApplication";
import ScreeningPage from "@/pages/Screening";
import ResultsPage from "@/pages/Results";

function MobileWarning() {
  const [dismissed, setDismissed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  if (!isMobile || dismissed) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-card border border-border rounded-xl p-6 space-y-4 text-center shadow-lg">
        <div className="w-12 h-12 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
        </div>
        <h3 className="text-lg font-semibold">Best on a larger screen</h3>
        <p className="text-sm text-muted-foreground">
          This assessment involves typing tests and filling out forms. For the best experience, use a laptop or desktop computer.
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="w-full py-2.5 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          Continue Anyway
        </button>
      </div>
    </div>
  );
}

function TestProgressBar() {
  const { progress } = useTest();
  if (progress <= 0 || progress >= 100) return null;
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-muted">
      <div
        className="h-full bg-primary transition-all duration-500 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function TestRouteGuard() {
  const [location, navigate] = useLocation();
  const { completedSteps, screeningPassed } = useTest();

  useEffect(() => {
    const normalizedPath = location.split("?")[0].replace(/\/+$/, "");

    const guards: Record<string, string> = {
      "/test/screening": "entry",
      "/test/typing": "screening",
      "/test/review/1": "typing",
      "/test/review/2": "review-1",
      "/test/review/3": "review-2",
      "/test/application": "review-3",
      "/test/results": "application",
    };
    const required = guards[normalizedPath];
    if (required && !completedSteps.includes(required)) {
      navigate("/test/welcome");
    }

    if (normalizedPath === "/test/screening" && screeningPassed === false) {
      navigate("/test/welcome");
    }
  }, [location, completedSteps, screeningPassed, navigate]);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (completedSteps.length > 0 && !completedSteps.includes("results")) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [completedSteps]);

  return null;
}

function ReviewRouteWrapper() {
  const params = useParams<{ id: string }>();
  return <ApplicationReviewPage key={params.id} />;
}

function TestRouter() {
  const [testLocation] = useLocation();

  return (
    <TestProvider>
      <TestRouteGuard />
      <MobileWarning />
      <TestProgressBar />
      <div className="relative pb-12 pt-8">
        <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full opacity-40 pointer-events-none z-0" />
        <div className="relative z-10">
          <AnimatePresence mode="wait">
            <Switch key={testLocation}>
              <Route path="/test/welcome" component={WelcomePage} />
              <Route path="/test/start" component={EntryPage} />
              <Route path="/test/screening" component={ScreeningPage} />
              <Route path="/test/typing" component={TypingTestPage} />
              <Route path="/test/review/:id" component={ReviewRouteWrapper} />
              <Route path="/test/application" component={JobApplicationPage} />
              <Route path="/test/results" component={ResultsPage} />
            </Switch>
          </AnimatePresence>
        </div>
      </div>
    </TestProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Switch>
          <Route path="/test/:rest*" component={TestRouter} />
          <Route>
            <Redirect to="/test/welcome" />
          </Route>
        </Switch>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
