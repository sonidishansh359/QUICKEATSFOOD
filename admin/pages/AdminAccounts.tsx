import React, { useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, Mail, Phone, ShieldAlert, User2, Undo2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fetchAdminUsers, setUserBan, AdminUser } from "../lib/adminApi";
import { useToast } from "@/hooks/use-toast";

const roleLabel: Record<string, string> = {
  user: "Customer",
  owner: "Owner",
  delivery_boy: "Delivery",
};

const AdminAccounts = () => {
  const { data, isFetching } = useQuery({
    queryKey: ["admin-users"],
    queryFn: fetchAdminUsers,
    staleTime: 60000,
  });

  const { toast } = useToast();
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, banned }: { id: string; banned: boolean }) => setUserBan(id, banned),
    onSuccess: (res) => {
      toast({ title: res.message, description: res.user.email });
      qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (err: any) => {
      toast({ title: "Update failed", description: err?.message || "Unable to update", variant: "destructive" });
    },
  });

  const users = useMemo(() => data || [], [data]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <p className="text-sm text-muted-foreground">Manage account bans</p>
          <h1 className="text-xl font-semibold text-foreground">Account Control</h1>
        </div>
        <Badge variant="secondary">{users.length} accounts</Badge>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Users, Owners, Delivery</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
          {isFetching && <p className="text-sm text-muted-foreground">Loading accounts...</p>}
          {!isFetching && users.length === 0 && <p className="text-sm text-muted-foreground">No accounts found.</p>}

          {users.map((user) => (
            <div key={user._id} className="border border-border rounded-lg p-3 bg-background/60">
              <div className="flex items-center justify-between gap-2">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <User2 className="h-4 w-4 text-primary" />
                    <span>{user.name}</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{user.email}</span>
                    {user.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{user.phone}</span>}
                    <Badge variant="outline">{roleLabel[user.role] || user.role}</Badge>
                    {user.deleted && <Badge variant="destructive">Deleted</Badge>}
                    {user.banned && <Badge variant="destructive">Banned</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.banned ? (
                    <Button variant="outline" size="sm" onClick={() => mutation.mutate({ id: user._id, banned: false })} disabled={mutation.isPending}>
                      <Undo2 className="h-4 w-4 mr-1" /> Unban
                    </Button>
                  ) : (
                    <Button variant="destructive" size="sm" onClick={() => mutation.mutate({ id: user._id, banned: true })} disabled={mutation.isPending}>
                      <Ban className="h-4 w-4 mr-1" /> Ban
                    </Button>
                  )}
                  <ShieldAlert className="h-4 w-4 text-primary" />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAccounts;
