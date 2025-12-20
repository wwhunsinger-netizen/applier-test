import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, User } from "lucide-react";
import logoUrl from "@assets/Jumpseat_(17)_1766203547189.png";
import LoadingScreen from "@/components/loading";
import { MOCK_USERS } from "@/lib/mockData";
import { useUser } from "@/lib/userContext";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const { login } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [showAppLoader, setShowAppLoader] = useState(false);
  const [email, setEmail] = useState("admin@jumpseat.com");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Set user context
    login(email);
    
    // Show full screen app loader
    setIsLoading(false);
    setShowAppLoader(true);
    
    // Wait for "loading" animation
    setTimeout(() => {
      setLocation("/");
    }, 2000);
  };

  const fillCredentials = (userEmail: string) => {
    setEmail(userEmail);
  };

  if (showAppLoader) {
    return <LoadingScreen />;
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

      <Card className="w-full max-w-md mx-4 bg-[#0a0a0a] border-white/10 shadow-2xl z-10">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <img src={logoUrl} alt="Jumpseat" className="h-12 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription>
            Enter your credentials to access the portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus-visible:ring-primary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white/80">Password</Label>
              <Input 
                id="password" 
                type="password" 
                defaultValue="password123"
                required 
                className="bg-white/5 border-white/10 text-white focus-visible:ring-primary/50"
              />
            </div>
            <Button className="w-full mt-2 font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white h-11" type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          {/* Demo Accounts */}
          <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
            <p className="text-xs text-muted-foreground text-center mb-2">Demo Accounts (Click to fill)</p>
            <div className="grid gap-2">
              {MOCK_USERS.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => fillCredentials(user.email)}
                  className="flex items-center gap-3 p-2 rounded-md hover:bg-white/5 transition-colors text-left group w-full"
                >
                  <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white group-hover:text-primary transition-colors">{user.name}</span>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 rounded",
                        user.role === "Admin" ? "bg-red-500/20 text-red-500 font-bold tracking-wide" : "bg-white/10 text-muted-foreground"
                      )}>{user.role}</span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}