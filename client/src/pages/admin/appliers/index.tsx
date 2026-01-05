import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Applier, InsertApplier, Client } from "@shared/schema";
import { getApplierFullName } from "@shared/schema";
import { fetchAppliers, createApplier, fetchClients } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Plus,
  User,
  AlertCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  Loader2,
  TrendingUp,
  Clock,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function AdminAppliersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearch] = useState("");
  const [isAddApplierOpen, setIsAddApplierOpen] = useState(false);

  const {
    data: appliers = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["appliers"],
    queryFn: fetchAppliers,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["clients"],
    queryFn: fetchClients,
  });

  const [newApplierFirstName, setNewApplierFirstName] = useState("");
  const [newApplierLastName, setNewApplierLastName] = useState("");
  const [newApplierEmail, setNewApplierEmail] = useState("");
  const [assignedClientIds, setAssignedClientIds] = useState<string[]>([]);
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCreated, setIsCreated] = useState(false);

  const createApplierMutation = useMutation({
    mutationFn: createApplier,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["appliers"] });
      if (data.generatedPassword) {
        setGeneratedPassword(data.generatedPassword);
      }
      setIsCreated(true);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create applier. Please try again.",
        variant: "destructive",
      });
    },
  });

  const filteredAppliers = appliers.filter((applier) => {
    const fullName = getApplierFullName(applier).toLowerCase();
    return (
      fullName.includes(searchTerm.toLowerCase()) ||
      applier.email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const handleGenerateCredentials = () => {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let pwd = "";
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setGeneratedPassword(pwd);
  };

  const handleCreateApplier = () => {
    if (!newApplierFirstName || !newApplierLastName || !newApplierEmail) return;

    const newApplier: InsertApplier = {
      first_name: newApplierFirstName,
      last_name: newApplierLastName,
      email: newApplierEmail,
      role: "applier",
      status: "offline", // New appliers start offline, presence system updates when they log in
      is_active: true, // Account is enabled by default
      assigned_client_ids:
        assignedClientIds.length > 0 ? assignedClientIds : undefined,
    };

    createApplierMutation.mutate(newApplier);
  };

  const handleCopyInvite = () => {
    const inviteText = `Welcome to the Jumpseat Team!\n\nHere are your login details:\nEmail: ${newApplierEmail}\nPassword: ${generatedPassword}\n\nLog in at: ${window.location.origin}/login`;
    navigator.clipboard.writeText(inviteText);
    toast({
      title: "Invite Copied",
      description: "Login credentials copied to clipboard.",
    });
  };

  const resetForm = () => {
    setIsAddApplierOpen(false);
    setIsCreated(false);
    setNewApplierFirstName("");
    setNewApplierLastName("");
    setNewApplierEmail("");
    setAssignedClientIds([]);
    setGeneratedPassword("");
    setShowPassword(false);
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500/10 text-green-400 border-green-500/20";
      case "idle":
        return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "offline":
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
      case "inactive":
        return "bg-red-500/10 text-red-400 border-red-500/20";
      default:
        return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  const getAssignedClientNames = (clientIds?: string[]) => {
    if (!clientIds || clientIds.length === 0) return null;
    return clientIds
      .map((id) => {
        const client = clients.find((c) => c.id === id);
        return client ? `${client.first_name} ${client.last_name}` : "Unknown";
      })
      .join(", ");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">
            Appliers
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage team members who review and apply to jobs.
          </p>
        </div>
        <Button
          onClick={() => setIsAddApplierOpen(true)}
          className="bg-primary hover:bg-primary/90 text-white font-bold"
          data-testid="button-add-applier"
        >
          <Plus className="w-4 h-4 mr-2" /> Add New Applier
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
              <User className="w-6 h-6 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {appliers.filter((a) => a.status === "active").length}
              </p>
              <p className="text-sm text-muted-foreground">Active Appliers</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {
                  appliers.filter(
                    (a) =>
                      a.assigned_client_ids && a.assigned_client_ids.length > 0,
                  ).length
                }
              </p>
              <p className="text-sm text-muted-foreground">
                Assigned to Clients
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#111] border-white/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-yellow-500/10 flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {appliers.filter((a) => a.status === "idle").length}
              </p>
              <p className="text-sm text-muted-foreground">Idle</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search appliers..."
          className="pl-9 bg-[#111] border-white/10 text-white"
          value={searchTerm}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="input-search-appliers"
        />
      </div>

      <div className="grid gap-4">
        {isLoading && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5">
            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
            Loading appliers...
          </div>
        )}

        {error && (
          <div className="p-12 text-center text-red-400 bg-red-500/10 rounded-lg border border-red-500/20">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" />
            Failed to load appliers. Please try again.
          </div>
        )}

        {!isLoading &&
          !error &&
          filteredAppliers.map((applier) => (
            <Card
              key={applier.id}
              className="bg-[#111] border-white/10 hover:border-white/20 transition-colors group"
              data-testid={`card-applier-${applier.id}`}
            >
              <CardContent className="p-0">
                <div className="flex items-center justify-between p-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-white/10 flex items-center justify-center text-muted-foreground">
                      <User className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3
                          className="text-lg font-bold text-white"
                          data-testid={`text-applier-name-${applier.id}`}
                        >
                          {getApplierFullName(applier)}
                        </h3>
                        <Badge
                          variant="outline"
                          className={`h-5 text-[10px] px-1.5 ${getStatusStyles(applier.status)}`}
                          data-testid={`badge-status-${applier.id}`}
                        >
                          {applier.status.charAt(0).toUpperCase() +
                            applier.status.slice(1)}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground flex flex-col md:flex-row md:items-center gap-1 md:gap-3 mt-1">
                        <span data-testid={`text-email-${applier.id}`}>
                          {applier.email}
                        </span>
                        {applier.assigned_client_ids &&
                          applier.assigned_client_ids.length > 0 && (
                            <>
                              <span className="hidden md:inline text-white/20">
                                •
                              </span>
                              <span className="text-primary">
                                Assigned:{" "}
                                {getAssignedClientNames(
                                  applier.assigned_client_ids,
                                )}
                              </span>
                            </>
                          )}
                        {(!applier.assigned_client_ids ||
                          applier.assigned_client_ids.length === 0) && (
                          <>
                            <span className="hidden md:inline text-white/20">
                              •
                            </span>
                            <span className="text-yellow-500">Unassigned</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right mr-4 hidden md:block">
                      <p className="text-sm text-muted-foreground">Joined</p>
                      <p className="text-white">
                        {applier.created_at
                          ? new Date(applier.created_at).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )
                          : "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

        {!isLoading &&
          !error &&
          filteredAppliers.length === 0 &&
          appliers.length > 0 && (
            <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
              No appliers found matching "{searchTerm}"
            </div>
          )}

        {!isLoading && !error && appliers.length === 0 && (
          <div className="p-12 text-center text-muted-foreground bg-[#111] rounded-lg border border-white/5 border-dashed">
            <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-semibold mb-2">No appliers yet</p>
            <p className="text-sm">
              Click "Add New Applier" to add your first team member.
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={isAddApplierOpen}
        onOpenChange={(open) => !open && resetForm()}
      >
        <DialogContent className="bg-[#0a0a0a] border-white/10 text-white sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add New Applier</DialogTitle>
          </DialogHeader>

          {!isCreated ? (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    data-testid="input-applier-first-name"
                    value={newApplierFirstName}
                    onChange={(e) => setNewApplierFirstName(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="e.g. John"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    data-testid="input-applier-last-name"
                    value={newApplierLastName}
                    onChange={(e) => setNewApplierLastName(e.target.value)}
                    className="bg-white/5 border-white/10"
                    placeholder="e.g. Smith"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  data-testid="input-applier-email"
                  type="email"
                  value={newApplierEmail}
                  onChange={(e) => setNewApplierEmail(e.target.value)}
                  className="bg-white/5 border-white/10"
                  placeholder="e.g. john@company.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Assign to Clients (Optional)</Label>
                <div
                  className="max-h-32 overflow-y-auto bg-white/5 border border-white/10 rounded-lg p-2 space-y-1"
                  data-testid="checkbox-clients"
                >
                  {clients.length === 0 && (
                    <p className="text-sm text-muted-foreground py-2 text-center">
                      No clients available
                    </p>
                  )}
                  {clients.map((client) => (
                    <label
                      key={client.id}
                      className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/5"
                        checked={assignedClientIds.includes(client.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setAssignedClientIds([
                              ...assignedClientIds,
                              client.id,
                            ]);
                          } else {
                            setAssignedClientIds(
                              assignedClientIds.filter(
                                (id) => id !== client.id,
                              ),
                            );
                          }
                        }}
                      />
                      <span className="text-sm text-white">
                        {client.first_name} {client.last_name}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can assign clients later if needed.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 py-4">
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-bold text-green-500">Applier Created!</p>
                  <p className="text-xs text-green-400/80">
                    Copy these credentials to share.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Email</Label>
                  <div className="p-3 bg-white/5 rounded-lg border border-white/10 font-mono text-sm">
                    {newApplierEmail}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">
                    Temporary Password
                  </Label>
                  <div className="relative">
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10 font-mono text-sm pr-10">
                      {showPassword ? generatedPassword : "••••••••••••"}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground hover:text-white"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {!isCreated ? (
              <Button
                onClick={handleCreateApplier}
                className="w-full bg-primary hover:bg-primary/90"
                disabled={
                  !newApplierFirstName ||
                  !newApplierLastName ||
                  !newApplierEmail ||
                  createApplierMutation.isPending
                }
                data-testid="button-create-applier"
              >
                {createApplierMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Applier Account"
                )}
              </Button>
            ) : (
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  onClick={handleCopyInvite}
                  className="flex-1 border-white/10 hover:bg-white/5"
                  data-testid="button-copy-invite"
                >
                  <Copy className="w-4 h-4 mr-2" /> Copy Invite
                </Button>
                <Button
                  onClick={resetForm}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  data-testid="button-done"
                >
                  Done
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
