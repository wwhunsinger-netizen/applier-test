import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Briefcase,
  Send,
  Trophy,
  User,
  LogOut,
  List,
  AlertTriangle,
  Users,
  FileText,
  Calendar,
  ClipboardCheck,
  UserCheck,
  GraduationCap,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useUser } from "@/lib/userContext";
import { usePresence } from "@/hooks/usePresence";
import logoUrl from "@assets/Jumpseat_(17)_1766203547189.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { currentUser, logout } = useUser();

  // Track applier presence via WebSocket
  usePresence({
    applierId: currentUser?.role === "Applier" ? currentUser.id : null,
    enabled: currentUser?.role === "Applier",
  });

  // Don't show layout on login page
  if (location === "/login") {
    return <div className="min-h-screen bg-black">{children}</div>;
  }

  const applierNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Briefcase, label: "Review Queue", href: "/queue" },
    { icon: Send, label: "Applied", href: "/applied" },
    { icon: Trophy, label: "Leaderboard", href: "/leaderboard" },
  ];

  const adminNavItems = [
    { icon: LayoutDashboard, label: "Dashboard", href: "/" },
    { icon: Users, label: "Clients", href: "/admin/clients" },
    { icon: UserCheck, label: "Appliers", href: "/admin/appliers" },
    { icon: Calendar, label: "Interviews", href: "/admin/interviews" },
    { icon: List, label: "All Applications", href: "/admin/applications" },
    { icon: AlertTriangle, label: "Review Issues", href: "/admin/review" },
    { icon: GraduationCap, label: "Test Results", href: "/admin/test-results" },
  ];

  const clientNavItems = [
    { icon: LayoutDashboard, label: "Overview", href: "/" },
    {
      icon: ClipboardCheck,
      label: "Job Criteria",
      href: "/client/job-criteria",
    },
    { icon: FileText, label: "Documents", href: "/client/documents" },
    { icon: Calendar, label: "Interviews", href: "/client/interviews" },
    { icon: Send, label: "Applications", href: "/client/applications" },
  ];

  const navItems =
    currentUser?.role === "Admin"
      ? adminNavItems
      : currentUser?.role === "Client"
        ? clientNavItems
        : applierNavItems;

  return (
    <div className="flex h-screen bg-black overflow-hidden font-sans relative">
      {/* Premium Background Glow */}
      <div className="absolute -bottom-[20%] -right-[10%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full opacity-40 pointer-events-none z-0" />

      {/* Sidebar */}
      <aside className="w-64 bg-[#050505] border-r border-white/5 hidden md:flex flex-col z-20 shadow-xl">
        <div className="p-6 h-[88px] flex items-center justify-center border-b border-white/5">
          <img
            src={logoUrl}
            alt="Jumpseat"
            className="h-12 w-auto object-contain"
            style={{
              filter:
                currentUser?.role === "Client" ? "hue-rotate(0deg)" : "none",
            }}
          />
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-primary/10 text-primary shadow-sm"
                    : "text-muted-foreground hover:bg-white/5 hover:text-white",
                )}
              >
                <item.icon
                  className={cn(
                    "w-5 h-5 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground group-hover:text-white",
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/5 bg-white/5">
          <div className="flex items-center gap-3 mb-4">
            <Avatar className="h-9 w-9 border border-white/10">
              <AvatarImage src={undefined} />
              <AvatarFallback>
                {currentUser?.name?.substring(0, 2).toUpperCase() || "??"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium truncate text-white">
                  {currentUser?.name}
                </p>
                <span
                  className={cn(
                    "text-[10px] px-1.5 py-0.5 rounded uppercase font-bold tracking-wider",
                    currentUser?.role === "Applier"
                      ? "bg-primary/20 text-primary"
                      : currentUser?.role === "Admin"
                        ? "bg-red-500 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        : currentUser?.role === "Client"
                          ? "bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                          : "bg-white/10 text-muted-foreground",
                  )}
                >
                  {currentUser?.role}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {currentUser?.email}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={logout}
            className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/20 border-white/10 bg-transparent"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
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
