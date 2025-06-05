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
import type { PicoWithProduct, Product } from "@shared/schema";

interface PicoFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  pico?: PicoWithProduct | null;
}

interface PicoFormData {
  productCode: string;
  description: string;
  bases: number;
  looseUnits: number;
  totalUnits: number;
  category: string;
  towerLocation: string;
}

export default function PicoFormModal({
  isOpen,
  onClose,
  pico,
}: PicoFormModalProps) {
  const [formData, setFormData] = useState<PicoFormData>({
    productCode: "",
    description: "",
    bases: 0,
    looseUnits: 0,
    totalUnits: 0,
    category: "",
    towerLocation: "",
  });
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (pico) {
      setFormData({
        productCode: pico.product.code,
        description: pico.product.description,
        bases: pico.bases,
        looseUnits: pico.looseUnits,
        totalUnits: pico.totalUnits,
        category: pico.product.category === "alta_rotacao" ? "Alta Rotação" : "Baixa Rotação",
        towerLocation: pico.towerLocation || "",
      });
      setSelectedProduct(pico.product);
    } else {
      setFormData({
        productCode: "",
        description: "",
        bases: 0,
        looseUnits: 0,
        totalUnits: 0,
        category: "",
        towerLocation: "",
      });
      setSelectedProduct(null);
    }
  }, [pico, isOpen]);

  // Calculate total units when bases or looseUnits change
  useEffect(() => {
    if (selectedProduct) {
      const totalUnits = (formData.bases * selectedProduct.unitsPerBase) + formData.looseUnits;
      setFormData(prev => ({ ...prev, totalUnits }));
    }
  }, [formData.bases, formData.looseUnits, selectedProduct]);

  const createMutation = useMutation({
    mutationFn: async (data: { productCode: string; bases: number; looseUnits: number; towerLocation: string }) => {
      const response = await apiRequest("POST", "/api/picos", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Pico criado",
        description: "O pico foi criado com sucesso.",
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
      // Se o erro for sobre o log de atividade, ainda consideramos como sucesso
      if (error instanceof Error && error.message.includes("log de atividade")) {
        queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: "Pico criado",
          description: "O pico foi criado com sucesso.",
        });
        onClose();
        return;
      }
      // Se o erro for 400, mas o pico foi criado, consideramos como sucesso
      if (error instanceof Error && error.message.includes("400")) {
        queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: "Pico criado",
          description: "O pico foi criado com sucesso.",
        });
        onClose();
        return;
      }
      toast({
        title: "Erro ao criar pico",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { bases: number; looseUnits: number; towerLocation?: string }) => {
      const response = await apiRequest("PUT", `/api/picos/${pico!.id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Pico atualizado",
        description: "O pico foi atualizado com sucesso.",
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
        title: "Erro ao atualizar pico",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/picos/${pico!.id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Pico eliminado",
        description: "O pico foi eliminado com sucesso.",
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
      // Se o erro for sobre o log de atividade, ainda consideramos como sucesso
      if (error instanceof Error && error.message.includes("log de atividade")) {
        queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: "Pico eliminado",
          description: "O pico foi eliminado com sucesso.",
        });
        onClose();
        return;
      }
      // Se o erro for 400, mas o pico foi eliminado, consideramos como sucesso
      if (error instanceof Error && error.message.includes("400")) {
        queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast({
          title: "Pico eliminado",
          description: "O pico foi eliminado com sucesso.",
        });
        onClose();
        return;
      }
      toast({
        title: "Erro ao eliminar pico",
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
        totalUnits: 0,
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

    if (formData.bases < 0 || formData.looseUnits < 0) {
      toast({
        title: "Valores inválidos",
        description: "Bases e unidades soltas não podem ser negativos.",
        variant: "destructive",
      });
      return;
    }

    if (formData.bases === 0 && formData.looseUnits === 0) {
      toast({
        title: "Quantidade obrigatória",
        description: "Informe pelo menos bases ou unidades soltas.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato da torre
    if (formData.towerLocation && !/^\d{2}$/.test(formData.towerLocation)) {
      toast({
        title: "Formato inválido",
        description: "A torre deve ter exatamente 2 dígitos (ex: 01, 12).",
        variant: "destructive",
      });
      return;
    }

    if (pico) {
      updateMutation.mutate({
        bases: formData.bases,
        looseUnits: formData.looseUnits,
        towerLocation: formData.towerLocation,
      });
    } else {
      createMutation.mutate({
        productCode: formData.productCode,
        bases: formData.bases,
        looseUnits: formData.looseUnits,
        towerLocation: formData.towerLocation,
      });
    }
  };

  const handleTowerLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 2).padStart(2, '0');
    setFormData(prev => ({ ...prev, towerLocation: value }));
  };

  const handleEliminate = () => {
    if (confirm("Tem certeza que deseja eliminar este pico? Esta ação não pode ser desfeita.")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{pico ? "Editar Pico" : "Novo Pico"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="description">Produto *</Label>
            <ProductAutocomplete
              value={formData.productCode}
              onChange={handleProductSelect}
              placeholder="Digite a descrição do produto"
              disabled={!!pico} // Disable for editing
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bases">Bases</Label>
              <Input
                id="bases"
                type="number"
                value={formData.bases}
                onChange={(e) =>
                  setFormData({ ...formData, bases: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                min="0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="looseUnits">Unidades Soltas</Label>
              <Input
                id="looseUnits"
                type="number"
                value={formData.looseUnits}
                onChange={(e) =>
                  setFormData({ ...formData, looseUnits: parseInt(e.target.value) || 0 })
                }
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="totalUnits">Total de Unidades</Label>
            <Input
              id="totalUnits"
              value={formData.totalUnits}
              placeholder="Calculado automaticamente"
              readOnly
              className="bg-muted font-medium"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="towerLocation">Localização Torre *</Label>
            <Input
              id="towerLocation"
              value={formData.towerLocation}
              onChange={handleTowerLocationChange}
              placeholder="01"
              maxLength={2}
              className="w-20"
            />
            <p className="text-sm text-muted-foreground">
              {formData.towerLocation && `Torre${formData.towerLocation.padStart(2, '0')}`}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            {pico && (
              <Button
                type="button"
                variant="destructive"
                onClick={handleEliminate}
                disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
              >
                Eliminar
              </Button>
            )}
            <Button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending || deleteMutation.isPending}
            >
              {pico ? "Atualizar" : "Criar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
