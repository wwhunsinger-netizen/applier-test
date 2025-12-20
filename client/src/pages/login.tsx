import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import logoUrl from "@assets/Jumpseat_(17)_1766203547189.png";
import LoadingScreen from "@/components/loading";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [showAppLoader, setShowAppLoader] = useState(false);
  const [email, setEmail] = useState("applier1@test.com");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Show full screen app loader
    setIsLoading(false);
    setShowAppLoader(true);
    
    // Wait for "loading" animation
    setTimeout(() => {
      setLocation("/");
    }, 2000);
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
          
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Protected by Jumpseat Secure Auth</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}