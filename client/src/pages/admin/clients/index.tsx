import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { MOCK_CLIENTS_LIST, Client } from "@/lib/mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, AlertCircle, ArrowRight, Eye, EyeOff, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";

export default function AdminClientsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearch] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Persistent Client State
  const [clients, setClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem("admin_clients");
    return saved ? JSON.parse(saved) : [];
  });

  // Save to localStorage whenever clients change
  useEffect(() => {
    localStorage.setItem("admin_clients", JSON.stringify(clients));
  }, [clients]);
  
  // New Client Form State
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateCredentials = () => {
    // Mock password generation
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
  };

  const handleCreateClient = () => {
    if (!newClientName || !newClientEmail) return;
    
    handleGenerateCredentials();
    
    const newClient: Client = {
      id: `client-${Date.now()}`,
      name: newClientName,
      email: newClientEmail,
      username: newClientEmail.split('@')[0], // Mock username
      created: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      status: "active",
      applicationsSent: 0,
      interviewsScheduled: 0
    };

    setClients(prev => [...prev, newClient]);
    setIsCreated(true);
  };

  const handleCopyInvite = () => {
    const inviteText = `Welcome to Jumpseat!\n\nHere are your login details:\nUsername: ${newClientEmail.split('@')[0]}\nPassword: ${generatedPassword}\n\nLog in at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(inviteText);
    toast({
      title: "Invite Copied",
      description: "Login credentials copied to clipboard.",
    });
  };

  const resetForm = () => {
    setIsAddClientOpen(false);
    setIsCreated(false);
    setNewClientName("");
    setNewClientEmail("");
    setGeneratedPassword("");
    setShowPassword(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Clients</h1>
          <p className="text-muted-foreground mt-1">Manage client accounts and documents.</p>
        </div>
        <Button onClick={() => setIsAddClientOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold">
          <Plus className="w-4 h-4 mr-2" /> Add New Client
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search clients..." 
          className="pl-9 bg-[#111] border-white/10 text-white"
          value={searchTerm}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Client List */}
      <div className="grid gap-4">
        {filteredClients.map((client) => (
          <Card key={client.id} className="bg-[#111] border-white/10 hover:border-white/20 transition-colors group">
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground">
                      <User className="w-6 h-6" />
                    </div>
                    {client.status === "action_needed" && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-[#111] flex items-center justify-center">
                        <span className="sr-only">Action needed</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white">{client.name}</h3>
                      {client.status === "action_needed" && (
                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
                          {client.commentsCount} Comments
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
                      <span>{client.email}</span>
                      <span className="hidden md:inline text-white/20">•</span>
                      <span>Created: {client.created}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/admin/clients/${client.id}`}>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white group-hover:border-primary/50 transition-colors">
                    Manage Client <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredClients.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
            No clients found matching "{searchTerm}"
          </div>
        )}
      </div>

      {/* Add Client Modal */}
      <Dialog open={isAddClientOpen} onOpenChange={(open) => !open && resetForm()}>
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
          </DialogHeader>

          {!isCreated ? (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  value={newClientName} 
                  onChange={(e) => setNewClientName(e.target.value)} 
                  className="bg-white/5 border-white/10"
                  placeholder="e.g. Jane Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  type="email" 
                  value={newClientEmail} 
                  onChange={(e) => setNewClientEmail(e.target.value)} 
                  className="bg-white/5 border-white/10"
                  placeholder="e.g. jane@company.com"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-green-500">Client Created!</p>
                  <p className="text-xs text-green-400/80">Copy these credentials to share.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Username</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={newClientEmail.split('@')[0]} className="bg-white/5 border-white/10 font-mono" />
                    <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(newClientEmail.split('@')[0])}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase text-muted-foreground">Password</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        readOnly 
                        type={showPassword ? "text" : "password"} 
                        value={generatedPassword} 
                        className="bg-white/5 border-white/10 font-mono pr-10" 
                      />
                      <button 
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(generatedPassword)}>
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!isCreated ? (
              <div className="flex gap-2 w-full justify-end">
                <Button variant="ghost" onClick={resetForm}>Cancel</Button>
                <Button onClick={handleCreateClient} className="bg-primary text-white">Create Client</Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={handleCopyInvite}>
                  <Copy className="w-4 h-4 mr-2" /> Copy Invite
                </Button>
                <Button onClick={resetForm} className="flex-1">Done</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}