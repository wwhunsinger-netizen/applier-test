import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { useTest } from "@/context/TestContext";

export default function TestTimer() {
  const { testStartTime, getTestSecondsRemaining } = useTest();
  const [remaining, setRemaining] = useState(() => getTestSecondsRemaining());

  useEffect(() => {
    if (!testStartTime) return;
    const iv = setInterval(() => {
      setRemaining(getTestSecondsRemaining());
    }, 1000);
    return () => clearInterval(iv);
  }, [testStartTime, getTestSecondsRemaining]);

  // Don't show until timer has started
  if (!testStartTime) return null;

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const isLow = remaining <= 120;
  const isCritical = remaining <= 60;

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center py-1.5 text-sm font-mono
      ${isCritical ? "bg-red-600/90" : isLow ? "bg-yellow-600/90" : "bg-white/5 border-b border-white/10"}
    `}>
      <Clock className="h-3.5 w-3.5 mr-1.5" />
      {mins}:{secs.toString().padStart(2, "0")} remaining
    </div>
  );
}
