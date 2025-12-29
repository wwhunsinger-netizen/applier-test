import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Client, InsertClient } from "@shared/schema";
import { getClientFullName, calculateClientStatus } from "@shared/schema";
import { fetchClients, createClient } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, User, AlertCircle, ArrowRight, Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

import { useToast } from "@/hooks/use-toast";

export default function AdminClientsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearch] = useState("");
  const [isAddClientOpen, setIsAddClientOpen] = useState(false);
  
  // Fetch clients from API
  const { data: clients = [], isLoading, error } = useQuery({
    queryKey: ['clients'],
    queryFn: fetchClients
  });
  
  // New Client Form State
  const [newClientFirstName, setNewClientFirstName] = useState("");
  const [newClientLastName, setNewClientLastName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      setIsCreated(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create client. Please try again.",
        variant: "destructive",
      });
    }
  });

  const filteredClients = clients.filter(client => {
    const fullName = getClientFullName(client).toLowerCase();
    return fullName.includes(searchTerm.toLowerCase()) || 
      client.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

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
    if (!newClientFirstName || !newClientLastName || !newClientEmail) return;
    
    handleGenerateCredentials();
    
    const newClient: InsertClient = {
      first_name: newClientFirstName,
      last_name: newClientLastName,
      email: newClientEmail,
    };

    createClientMutation.mutate(newClient);
  };

  const handleCopyInvite = () => {
    const inviteText = `Welcome to Jumpseat!\n\nHere are your login details:\nEmail: ${newClientEmail}\nPassword: ${generatedPassword}\n\nLog in at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(inviteText);
    toast({
      title: "Invite Copied",
      description: "Login credentials copied to clipboard.",
    });
  };

  const resetForm = () => {
    setIsAddClientOpen(false);
    setIsCreated(false);
    setNewClientFirstName("");
    setNewClientLastName("");
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
        {isLoading && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading clients...
          </div>
        )}
        
        {error && (
          <div className="p-12 text-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            Failed to load clients. Please try again.
          </div>
        )}
        
        {!isLoading && !error && filteredClients.map((client) => (
          <Card key={client.id} className="bg-[#111] border-white/10 hover:border-white/20 transition-colors group" data-testid={`card-client-${client.id}`}>
            <CardContent className="p-0">
              <div className="flex items-center justify-between p-6">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground">
                      <User className="w-6 h-6" />
                    </div>
                    {calculateClientStatus(client) === "onboarding_not_started" && (
                      <span className="absolute -top-1 -right-1 h-4 w-4 bg-yellow-500 rounded-full border-2 border-[#111] flex items-center justify-center">
                        <span className="sr-only">Onboarding needed</span>
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-bold text-white" data-testid={`text-client-name-${client.id}`}>{getClientFullName(client)}</h3>
                      {(() => {
                        const status = calculateClientStatus(client);
                        const statusStyles: Record<string, string> = {
                          'onboarding_not_started': 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
                          'onboarding_in_progress': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
                          'active': 'bg-green-500/10 text-green-400 border-green-500/20',
                          'paused': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
                          'placed': 'bg-primary/10 text-primary border-primary/20'
                        };
                        const statusLabels: Record<string, string> = {
                          'onboarding_not_started': 'Not Started',
                          'onboarding_in_progress': 'Onboarding',
                          'active': 'Active',
                          'paused': 'Paused',
                          'placed': 'Placed'
                        };
                        return (
                          <Badge variant="outline" className={`h-5 text-[10px] px-1.5 ${statusStyles[status]}`} data-testid={`badge-status-${client.id}`}>
                            {statusLabels[status]}
                          </Badge>
                        );
                      })()}
                      {client.comments_count && client.comments_count > 0 && (
                        <Badge variant="destructive" className="h-5 text-[10px] px-1.5" data-testid={`badge-comments-${client.id}`}>
                          {client.comments_count} Comments
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
                      <span data-testid={`text-email-${client.id}`}>{client.email}</span>
                      <span className="hidden md:inline text-white/20">•</span>
                      <span>Created: {client.created_at ? new Date(client.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}</span>
                    </div>
                  </div>
                </div>

                <Link href={`/admin/clients/${client.id}`}>
                  <Button variant="outline" className="border-white/10 hover:bg-white/5 text-white group-hover:border-primary/50 transition-colors" data-testid={`button-manage-${client.id}`}>
                    Manage Client <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}

        {!isLoading && !error && filteredClients.length === 0 && clients.length > 0 && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
            No clients found matching "{searchTerm}"
          </div>
        )}
        
        {!isLoading && !error && clients.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No clients yet</p>
            <p className="text-sm">Click "Add New Client" to create your first client account.</p>
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
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    data-testid="input-client-first-name"
                    value={newClientFirstName} 
                    onChange={(e) => setNewClientFirstName(e.target.value)} 
                    className="bg-white/5 border-white/10"
                    placeholder="e.g. Jane"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    data-testid="input-client-last-name"
                    value={newClientLastName} 
                    onChange={(e) => setNewClientLastName(e.target.value)} 
                    className="bg-white/5 border-white/10"
                    placeholder="e.g. Doe"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input 
                  id="email" 
                  data-testid="input-client-email"
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
                  <Label className="text-xs uppercase text-muted-foreground">Email</Label>
                  <div className="flex gap-2">
                    <Input readOnly value={newClientEmail} className="bg-white/5 border-white/10 font-mono" />
                    <Button size="icon" variant="outline" onClick={() => navigator.clipboard.writeText(newClientEmail)}>
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
                <Button variant="ghost" onClick={resetForm} data-testid="button-cancel-client">Cancel</Button>
                <Button 
                  onClick={handleCreateClient} 
                  className="bg-primary text-white" 
                  disabled={createClientMutation.isPending}
                  data-testid="button-create-client"
                >
                  {createClientMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create Client"
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2 w-full">
                <Button variant="outline" className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 text-white" onClick={handleCopyInvite} data-testid="button-copy-invite">
                  <Copy className="w-4 h-4 mr-2" /> Copy Invite
                </Button>
                <Button onClick={resetForm} className="flex-1" data-testid="button-done">Done</Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}