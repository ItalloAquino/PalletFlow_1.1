import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Warehouse } from "lucide-react";
import PasswordChangeModal from "@/components/password-change-modal";
import type { LoginData } from "@shared/schema";

export default function LoginPage() {
  const [formData, setFormData] = useState<LoginData>({
    username: "admin",
    password: "admin",
  });
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isFirstLogin) {
        setShowPasswordChange(true);
      } else {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo ao PalletFlow!",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Erro no login",
        description: error.message || "Credenciais inválidas",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  const handlePasswordChangeSuccess = () => {
    setShowPasswordChange(false);
    setFormData({ username: "", password: "" });
    toast({
      title: "Senha alterada com sucesso",
      description: "Faça login novamente com sua nova senha.",
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Warehouse className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">PalletFlow</CardTitle>
          <p className="text-muted-foreground">Sistema de Gestão de Armazém</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Usuário</Label>
              <Input
                id="username"
                type="text"
                placeholder="Digite seu usuário"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="Digite sua senha"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-6 text-xs text-muted-foreground text-center">
            Credenciais padrão: admin / admin
          </div>
        </CardContent>
      </Card>

      <PasswordChangeModal
        isOpen={showPasswordChange}
        onSuccess={handlePasswordChangeSuccess}
      />
    </div>
  );
}
