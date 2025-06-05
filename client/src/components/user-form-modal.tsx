import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, InsertUser } from "@shared/schema";

interface UserFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

export default function UserFormModal({
  isOpen,
  onClose,
  user,
}: UserFormModalProps) {
  const [formData, setFormData] = useState<InsertUser>({
    name: "",
    nickname: "",
    username: "",
    password: "",
    role: "armazenista",
    isFirstLogin: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        nickname: user.nickname,
        username: user.username,
        password: "", // Don't populate password for editing
        role: user.role,
        isFirstLogin: user.isFirstLogin,
      });
    } else {
      setFormData({
        name: "",
        nickname: "",
        username: "",
        password: "",
        role: "armazenista",
        isFirstLogin: true,
      });
    }
  }, [user, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/users", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado",
        description: "O usuário foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertUser>) => {
      const response = await apiRequest("PUT", `/api/users/${user!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado",
        description: "O usuário foi atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.username || !formData.nickname) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (!user && !formData.password) {
      toast({
        title: "Senha obrigatória",
        description: "A senha é obrigatória para novos usuários.",
        variant: "destructive",
      });
      return;
    }

    if (user) {
      // Update existing user
      const updates: Partial<InsertUser> = {
        name: formData.name,
        nickname: formData.nickname,
        username: formData.username,
        role: formData.role,
      };
      
      // Only include password if it's provided
      if (formData.password) {
        updates.password = formData.password;
      }

      updateMutation.mutate(updates);
    } else {
      // Create new user
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? "Editar Usuário" : "Novo Usuário"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              placeholder="Nome completo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nickname">Apelido *</Label>
            <Input
              id="nickname"
              value={formData.nickname}
              onChange={(e) =>
                setFormData({ ...formData, nickname: e.target.value })
              }
              placeholder="Apelido"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">Usuário *</Label>
            <Input
              id="username"
              value={formData.username}
              onChange={(e) =>
                setFormData({ ...formData, username: e.target.value })
              }
              placeholder="Nome de usuário"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              Senha {user ? "(deixe em branco para manter atual)" : "*"}
            </Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              placeholder={user ? "Nova senha (opcional)" : "Senha"}
              required={!user}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="role">Nível *</Label>
            <Select
              value={formData.role}
              onValueChange={(value: "administrador" | "armazenista") =>
                setFormData({ ...formData, role: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o nível" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="administrador">Administrador</SelectItem>
                <SelectItem value="armazenista">Armazenista</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : user
                ? "Atualizar"
                : "Criar"}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
