import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import type { Product, InsertProduct } from "@shared/schema";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export default function ProductFormModal({
  isOpen,
  onClose,
  product,
}: ProductFormModalProps) {
  const [formData, setFormData] = useState<InsertProduct>({
    code: "",
    description: "",
    quantityBases: 0,
    unitsPerBase: 0,
    category: "baixa_rotacao",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code,
        description: product.description,
        quantityBases: product.quantityBases,
        unitsPerBase: product.unitsPerBase,
        category: product.category,
      });
    } else {
      setFormData({
        code: "",
        description: "",
        quantityBases: 0,
        unitsPerBase: 0,
        category: "baixa_rotacao",
      });
    }
  }, [product, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: InsertProduct) => {
      const response = await apiRequest("POST", "/api/products", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto criado",
        description: "O produto foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertProduct>) => {
      const response = await apiRequest("PUT", `/api/products/${product!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      toast({
        title: "Produto atualizado",
        description: "O produto foi atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar produto",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.code || !formData.description) {
      toast({
        title: "Campos obrigatórios",
        description: "Código e descrição são obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantityBases <= 0 || formData.unitsPerBase <= 0) {
      toast({
        title: "Valores inválidos",
        description: "Quantidade de bases e unidades por base devem ser maiores que zero.",
        variant: "destructive",
      });
      return;
    }

    if (product) {
      // For editing, category cannot be changed as per requirements
      const updates = {
        code: formData.code,
        description: formData.description,
        quantityBases: formData.quantityBases,
        unitsPerBase: formData.unitsPerBase,
        // category is not included in updates to maintain immutability
      };
      updateMutation.mutate(updates);
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {product ? "Editar Produto" : "Novo Produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código *</Label>
            <Input
              id="code"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value })
              }
              placeholder="Código do produto"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Descrição do produto"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantityBases">Qtd. Bases *</Label>
              <Input
                id="quantityBases"
                type="number"
                value={formData.quantityBases}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    quantityBases: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                min="1"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unitsPerBase">Unidades/Base *</Label>
              <Input
                id="unitsPerBase"
                type="number"
                value={formData.unitsPerBase}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    unitsPerBase: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                min="1"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">
              Categoria * {product && "(não pode ser alterada)"}
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value: "alta_rotacao" | "baixa_rotacao") =>
                setFormData({ ...formData, category: value })
              }
              disabled={!!product} // Disable for editing as per requirements
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="alta_rotacao">Alta Rotação</SelectItem>
                <SelectItem value="baixa_rotacao">Baixa Rotação</SelectItem>
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
                : product
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
