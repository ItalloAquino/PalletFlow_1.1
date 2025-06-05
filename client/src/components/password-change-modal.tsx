import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { PasswordChangeData } from "@shared/schema";

interface PasswordChangeModalProps {
  isOpen: boolean;
  onSuccess: () => void;
}

export default function PasswordChangeModal({
  isOpen,
  onSuccess,
}: PasswordChangeModalProps) {
  const [formData, setFormData] = useState<PasswordChangeData>({
    newPassword: "",
    confirmPassword: "",
  });
  const { toast } = useToast();

  const passwordChangeMutation = useMutation({
    mutationFn: async (data: PasswordChangeData) => {
      const response = await apiRequest("POST", "/api/auth/change-password", data);
      return response.json();
    },
    onSuccess: () => {
      onSuccess();
      setFormData({ newPassword: "", confirmPassword: "" });
    },
    onError: (error) => {
      toast({
        title: "Erro ao alterar senha",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Erro",
        description: "Senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      toast({
        title: "Erro",
        description: "Senha deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    passwordChangeMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Alterar Senha</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Primeiro acesso detectado. É obrigatório alterar sua senha.
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="newPassword">Nova Senha</Label>
            <Input
              id="newPassword"
              type="password"
              placeholder="Digite sua nova senha"
              value={formData.newPassword}
              onChange={(e) =>
                setFormData({ ...formData, newPassword: e.target.value })
              }
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirme sua nova senha"
              value={formData.confirmPassword}
              onChange={(e) =>
                setFormData({ ...formData, confirmPassword: e.target.value })
              }
              required
            />
          </div>
          
          <Button
            type="submit"
            className="w-full"
            disabled={passwordChangeMutation.isPending}
          >
            {passwordChangeMutation.isPending ? "Alterando..." : "Alterar Senha"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
