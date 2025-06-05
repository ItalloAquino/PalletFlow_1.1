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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";
import { isUnauthorizedError, handleUnauthorizedError } from "@/lib/auth";
import ProductAutocomplete from "./product-autocomplete";
import type { PaletizadoStockWithProduct, Product } from "@shared/schema";
import { toast } from "sonner";

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

  const handleError = (error: unknown) => {
    if (isUnauthorizedError(error)) {
      handleUnauthorizedError();
      return;
    }
    if (error instanceof Error) {
      toast.error(error.message);
    } else {
      toast.error("Ocorreu um erro ao processar sua solicitação");
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: { productCode: string; quantity: number }) => {
      return apiRequest<{ message?: string }>("POST", "/api/paletizado-stock", data);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast.success(response.message || "Estoque criado com sucesso");
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao criar estoque");
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; quantity: number }) => {
      return apiRequest<{ message?: string }>("PUT", `/api/paletizado-stock/${data.id}`, {
        quantity: data.quantity,
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast.success(response.message || "Estoque atualizado com sucesso");
      onClose();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Erro ao atualizar estoque");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("DELETE", `/api/paletizado-stock/${stock!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast.success("Estoque eliminado com sucesso");
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        handleUnauthorizedError();
        return;
      }
      toast.error(error instanceof Error ? error.message : "Erro ao eliminar estoque");
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

    if (!selectedProduct) {
      toast.error("Selecione um produto");
      return;
    }

    const quantity = Number(formData.quantity);
    if (isNaN(quantity) || quantity < 0) {
      toast.error("Quantidade inválida");
      return;
    }

    if (stock) {
      updateMutation.mutate({
        id: stock.id,
        quantity,
      });
    } else {
      createMutation.mutate({
        productCode: selectedProduct.code,
        quantity,
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
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantidade *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="flex justify-end gap-2">
            {stock && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleEliminate}
              >
                Eliminar
              </Button>
            )}
            <Button type="submit">
              {stock ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
