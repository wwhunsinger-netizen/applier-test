import { useLocation } from "wouter";

const STEPS = [
  { path: "/test/welcome", label: "Welcome" },
  { path: "/test/start", label: "Entry" },
  { path: "/test/screening", label: "Screening" },
  { path: "/test/typing", label: "Typing" },
  { path: "/test/review/1", label: "Review 1" },
  { path: "/test/review/2", label: "Review 2" },
  { path: "/test/review/3", label: "Review 3" },
  { path: "/test/application", label: "Fill-out" },
  { path: "/test/results", label: "Results" },
];

export default function DevNav() {
  const [location, navigate] = useLocation();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a1a] border-t border-white/10 px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
      <span className="text-[10px] text-yellow-500 font-mono shrink-0 mr-1">DEV</span>
      {STEPS.map((step, i) => {
        const isActive =
          location === step.path ||
          (step.path.includes("/application/") && location === step.path);
        const isCurrent = location === step.path;

        return (
          <button
            key={step.path}
            onClick={() => navigate(step.path)}
            className={`
              shrink-0 px-2.5 py-1 rounded text-[11px] font-mono transition-colors
              ${isCurrent
                ? "bg-primary text-white"
                : "bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/90"
              }
            `}
          >
            {i + 1}. {step.label}
          </button>
        );
      })}
    </div>
  );
}
