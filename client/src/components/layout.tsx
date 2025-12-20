import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Briefcase, Send, Trophy, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CURRENT_USER } from "@/lib/mockData";
import logoUrl from "@assets/Jumpseat_(17)_1766203547189.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  // Don't show layout on login page
  if (location === "/login") {
    return <div className="min-h-screen bg-black">{children}</div>;
  }

  const navItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Briefcase, label: "Job Queue", href: "/queue" },
    { icon: Send, label: "Applied", href: "/applied" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
    { icon: User, label: "Profile", href: "/profile" },
  ];

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#050505] border-r border-white/5 hidden md:flex flex-col z-20 shadow-xl">
        <div className="p-6 h-[88px] flex items-center justify-center border-b border-white/5">
          <img 
            src={logoUrl} 
            alt="Jumpseat" 
            className="h-12 w-auto object-contain" 
          />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link key={item.href} href={item.href}>
                <a
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-5 h-5 transition-colors",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-white"
                    )}
                  />
                  {item.label}
                </a>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={CURRENT_USER.avatar} />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate text-white">{CURRENT_USER.name}</p>
              <p className="text-xs text-muted-foreground truncate">{CURRENT_USER.email}</p>
            </div>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border-white/10 bg-transparent">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-black">
        <div className="flex-1 overflow-y-auto scroll-smooth">
          <div className="container max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}