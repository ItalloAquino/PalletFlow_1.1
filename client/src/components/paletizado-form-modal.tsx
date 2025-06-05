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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError, handleUnauthorizedError } from "@/lib/auth-utils";
import ProductAutocomplete from "./product-autocomplete";
import type { PaletizadoStockWithProduct, Product } from "@shared/schema";

interface PaletizadoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock?: PaletizadoStockWithProduct | null;
}

interface PaletizadoFormData {
  productCode: string;
  description: string;
  quantity: number;
  category: string;
}

export default function PaletizadoFormModal({
  isOpen,
  onClose,
  stock,
}: PaletizadoFormModalProps) {
  const [formData, setFormData] = useState<PaletizadoFormData>({
    productCode: "",
    description: "",
    quantity: 0,
    category: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (stock) {
      setFormData({
        productCode: stock.product.code,
        description: stock.product.description,
        quantity: stock.quantity,
        category: stock.product.category === "alta_rotacao" ? "Alta Rotação" : "Baixa Rotação",
      });
      setSelectedProduct(stock.product);
    } else {
      setFormData({
        productCode: "",
        description: "",
        quantity: 0,
        category: "",
      });
      setSelectedProduct(null);
    }
  }, [stock, isOpen]);

  const createMutation = useMutation({
    mutationFn: async (data: { productCode: string; quantity: number }) => {
      const response = await apiRequest("POST", "/api/paletizado-stock", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Estoque criado",
        description: "O estoque foi criado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          handleUnauthorizedError();
        }, 500);
        return;
      }
      toast({
        title: "Erro ao criar estoque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { quantity: number }) => {
      const response = await apiRequest("PUT", `/api/paletizado-stock/${stock!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Estoque atualizado",
        description: "O estoque foi atualizado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          handleUnauthorizedError();
        }, 500);
        return;
      }
      toast({
        title: "Erro ao atualizar estoque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/paletizado-stock/${stock!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Estoque eliminado",
        description: "O estoque foi eliminado com sucesso.",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          handleUnauthorizedError();
        }, 500);
        return;
      }
      toast({
        title: "Erro ao eliminar estoque",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleProductSelect = (code: string, product?: Product) => {
    setFormData(prev => ({ ...prev, productCode: code }));
    
    if (product) {
      setSelectedProduct(product);
      setFormData(prev => ({
        ...prev,
        description: product.description,
        category: product.category === "alta_rotacao" ? "Alta Rotação" : "Baixa Rotação",
      }));
    } else {
      setSelectedProduct(null);
      setFormData(prev => ({
        ...prev,
        description: "",
        category: "",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.productCode || !selectedProduct) {
      toast({
        title: "Produto obrigatório",
        description: "Selecione um produto válido.",
        variant: "destructive",
      });
      return;
    }

    if (formData.quantity <= 0) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive",
      });
      return;
    }

    if (stock) {
      updateMutation.mutate({
        quantity: formData.quantity,
      });
    } else {
      createMutation.mutate({
        productCode: formData.productCode,
        quantity: formData.quantity,
      });
    }
  };

  const handleEliminate = () => {
    if (confirm("Tem certeza que deseja eliminar este estoque? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {stock ? "Editar Estoque" : "Novo Estoque"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Produto *</Label>
            <ProductAutocomplete
              value={formData.description}
              onChange={handleProductSelect}
              placeholder="Digite a descrição do produto"
              disabled={!!stock} // Disable for editing
              searchByDescription={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="productCode">Código</Label>
            <Input
              id="productCode"
              value={formData.productCode}
              placeholder="Preenchido automaticamente"
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              placeholder="Preenchido automaticamente"
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade de Paletizados *</Label>
            <Input
              id="quantity"
              type="number"
              value={formData.quantity}
              onChange={(e) =>
                setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })
              }
              placeholder="0"
              min="1"
              required
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {createMutation.isPending || updateMutation.isPending
                ? "Salvando..."
                : stock
                ? "Atualizar"
                : "Salvar"}
            </Button>
            {stock && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleEliminate}
                disabled={deleteMutation.isPending}
                className="flex-1"
              >
                {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
