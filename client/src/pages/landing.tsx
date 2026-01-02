import { Button } from "@/components/ui/button";
import { Rocket, Users, BarChart3, Shield } from "lucide-react";

export default function LandingPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="border-b border-white/10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Rocket className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">Jumpseat</span>
          </div>
          <Button 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90"
            data-testid="button-login"
          >
            Sign In
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20">
        <div className="max-w-3xl text-center space-y-8">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Your Job Search,{" "}
            <span className="text-primary">Supercharged</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Jumpseat connects job seekers with expert appliers who submit tailored applications on your behalf. Track progress, review documents, and land interviews faster.
          </p>

          <Button 
            size="lg" 
            onClick={handleLogin}
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 h-auto"
            data-testid="button-get-started"
          >
            Get Started
          </Button>
        </div>

        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl w-full">
          <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Expert Appliers</h3>
            <p className="text-muted-foreground">
              Our team reviews and submits applications tailored to each job, maximizing your chances.
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Real-Time Tracking</h3>
            <p className="text-muted-foreground">
              Monitor your application pipeline, interviews, and progress in one dashboard.
            </p>
          </div>

          <div className="bg-card border border-white/10 rounded-xl p-6 space-y-4">
            <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your data is encrypted and secure. We never share your information.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-white/10 px-6 py-6">
        <div className="max-w-7xl mx-auto text-center text-muted-foreground text-sm">
          Jumpseat Hub - Accelerating careers, one application at a time.
        </div>
      </footer>
    </div>
  );
}
