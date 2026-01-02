import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import logoUrl from "@assets/Jumpseat_(17)_1766203547189.png";

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = "/api/login";
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/50 to-transparent opacity-20" />

      <Card className="w-full max-w-md mx-4 bg-[#0a0a0a] border-white/10 shadow-2xl z-10">
        <CardHeader className="space-y-4 text-center pb-8">
          <div className="flex justify-center mb-2">
            <img src={logoUrl} alt="Jumpseat" className="h-12 w-auto object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-white">Welcome back</CardTitle>
          <CardDescription>
            Sign in to access the Jumpseat portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleLogin}
            className="w-full font-bold shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-white h-11"
            data-testid="button-login"
          >
            Sign In with Replit
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
