import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Mail, Lock, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminAuth } from "../AdminAuthContext";
import { useToast } from "@/hooks/use-toast";

const AdminLogin = () => {
  const navigate = useNavigate();
  const { isAuthenticated, login } = useAdminAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("quickeatsfoodadmin@gmail.com");
  const [password, setPassword] = useState("quickeatsfoodadmin");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/admin/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const result = await login(email, password);

    if (result.success) {
      toast({
        title: "Welcome back",
        description: "Admin access granted",
      });
      navigate("/admin/dashboard", { replace: true });
    } else {
      toast({
        title: "Access denied",
        description: result.error || "Invalid credentials",
        variant: "destructive",
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center px-4">
      <Card className="w-full max-w-md shadow-lg border-border">
        <CardHeader className="text-center">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white mb-3">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle>Admin Console</CardTitle>
          <p className="text-sm text-muted-foreground">Use the fixed credentials to sign in</p>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Signing in
                </>
              ) : (
                "Login"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Access is restricted. Do not share these credentials.
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLogin;
