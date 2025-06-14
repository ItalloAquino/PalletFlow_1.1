import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Printer, Edit, Trash2 } from "lucide-react";
import PicoFormModal from "@/components/pico-form-modal";
import PaletizadoFormModal from "@/components/paletizado-form-modal";
import type { PicoWithProduct, PaletizadoStockWithProduct } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { apiRequest } from "@/lib/api";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { isUnauthorizedError, handleUnauthorizedError } from "@/lib/auth";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isPicoModalOpen, setIsPicoModalOpen] = useState(false);
  const [isPaletizadoModalOpen, setIsPaletizadoModalOpen] = useState(false);
  const [editingPico, setEditingPico] = useState<PicoWithProduct | null>(null);
  const [editingPaletizado, setEditingPaletizado] = useState<PaletizadoStockWithProduct | null>(null);

  const queryClient = useQueryClient();

  const { data: picos, isLoading: picosLoading } = useQuery<PicoWithProduct[]>({
    queryKey: ["/api/picos"],
  });

  const { data: paletizadoStock, isLoading: stockLoading } = useQuery<PaletizadoStockWithProduct[]>({
    queryKey: ["/api/paletizado-stock"],
  });

  // Filter picos based on search term and category
  const filteredPicos = picos?.filter((pico) => {
    const matchesSearch = pico.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pico.product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || 
      (categoryFilter === "alta_rotacao" && pico.product.category === "alta_rotacao") ||
      (categoryFilter === "baixa_rotacao" && pico.product.category === "baixa_rotacao");

    return matchesSearch && matchesCategory;
  });

  // Filter paletizado stock based on search term
  const filteredPaletizadoStock = paletizadoStock?.filter((stock) =>
    stock.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const deletePicoMutation = useMutation({
    mutationFn: async (picoId: number) => {
      return apiRequest("DELETE", `/api/picos/${picoId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast.success("Pico eliminado com sucesso");
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        handleUnauthorizedError();
        return;
      }
      // Se o erro for sobre o log de atividade, ainda consideramos como sucesso
      if (error instanceof Error && error.message.includes("log de atividade")) {
        queryClient.invalidateQueries({ queryKey: ["/api/picos"] });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        toast.success("Pico eliminado com sucesso");
        return;
      }
      handleError(error);
    },
  });

  const deletePaletizadoMutation = useMutation({
    mutationFn: async (stockId: number) => {
      await apiRequest("DELETE", `/api/paletizado-stock/${stockId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/paletizado-stock"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast.success("Estoque eliminado com sucesso");
    },
    onError: (error) => {
      handleError(error);
    },
  });

  const handleDeletePico = (pico: PicoWithProduct) => {
    if (confirm(`Tem certeza que deseja eliminar o pico ${pico.product.code}? Esta ação não pode ser desfeita.`)) {
      deletePicoMutation.mutate(pico.id);
    }
  };

  const handleDeletePaletizado = (stock: PaletizadoStockWithProduct) => {
    if (confirm(`Tem certeza que deseja eliminar o estoque ${stock.product.code}? Esta ação não pode ser desfeita.`)) {
      deletePaletizadoMutation.mutate(stock.id);
    }
  };

  const handlePrintPicos = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const categoryLabel = categoryFilter === "all" 
      ? "Todas as categorias" 
      : categoryFilter === "alta_rotacao" 
        ? "Alta Rotação" 
        : "Baixa Rotação";

    const html = `
      <html>
        <head>
          <title>Relatório de Picos</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .print-table th { background-color: #f0f0f0; font-weight: bold; }
            .extra-lines { height: 200px; border-bottom: 1px solid #ccc; }
            .filter-info { margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PalletFlow - Relatório de Picos</h1>
            <p>Data: ${new Date().toLocaleDateString("pt-BR")}</p>
            <div class="filter-info">
              <p><strong>Categoria:</strong> ${categoryLabel}</p>
              ${searchTerm ? `<p><strong>Busca:</strong> ${searchTerm}</p>` : ""}
            </div>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Bases</th>
                <th>Unid. Soltas</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPicos?.map(pico => `
                <tr>
                  <td>${pico.product.code}</td>
                  <td>${pico.product.description}</td>
                  <td>${pico.product.category === "alta_rotacao" ? "Alta Rotação" : "Baixa Rotação"}</td>
                  <td>${pico.bases}</td>
                  <td>${pico.looseUnits}</td>
                  <td>${pico.totalUnits}</td>
                </tr>
              `).join("") || ""}
            </tbody>
          </table>
          <div class="extra-lines"></div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

  const handlePrintPaletizados = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const html = `
      <html>
        <head>
          <title>Relatório de Paletizados</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .print-table { width: 100%; border-collapse: collapse; margin-bottom: 50px; }
            .print-table th, .print-table td { border: 1px solid #000; padding: 8px; text-align: left; }
            .print-table th { background-color: #f0f0f0; font-weight: bold; }
            .extra-lines { height: 200px; border-bottom: 1px solid #ccc; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PalletFlow - Relatório de Paletizados</h1>
            <p>Data: ${new Date().toLocaleDateString("pt-BR")}</p>
          </div>
          <table class="print-table">
            <thead>
              <tr>
                <th>Código</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Quantidade</th>
              </tr>
            </thead>
            <tbody>
              ${filteredPaletizadoStock?.map(stock => `
                <tr>
                  <td>${stock.product.code}</td>
                  <td>${stock.product.description}</td>
                  <td>${stock.product.category === "alta_rotacao" ? "Alta Rotação" : "Baixa Rotação"}</td>
                  <td>${stock.quantity}</td>
                </tr>
              `).join("") || ""}
            </tbody>
          </table>
          <div class="extra-lines"></div>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.print();
  };

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

  return (
    <>
      <Toaster />
      <div className="p-8 md:p-[1.8rem]">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-foreground">Controle de Estoque</h2>
          <p className="text-muted-foreground">Gestão de Picos e Paletizados</p>
        </div>

        <Tabs defaultValue="picos" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="picos">Picos</TabsTrigger>
            <TabsTrigger value="paletizados">Paletizados</TabsTrigger>
          </TabsList>

          {/* Picos Tab */}
          <TabsContent value="picos">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Estoque de Picos</h3>
              <Button onClick={() => setIsPicoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Pico
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Search and actions bar */}
                <div className="p-4 border-b border-border">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filtrar por categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas as categorias</SelectItem>
                        <SelectItem value="alta_rotacao">Alta Rotação</SelectItem>
                        <SelectItem value="baixa_rotacao">Baixa Rotação</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={handlePrintPicos} variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>

                {/* Picos table */}
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Torre</th>
                        <th>Bases</th>
                        <th>Unid. Soltas</th>
                        <th>Total</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {picosLoading ? (
                        <tr>
                          <td colSpan={8} className="text-center py-8">
                            Carregando...
                          </td>
                        </tr>
                      ) : filteredPicos && filteredPicos.length > 0 ? (
                        filteredPicos.map((pico) => (
                          <tr key={pico.id}>
                            <td className="font-medium">{pico.product.code}</td>
                            <td>{pico.product.description}</td>
                            <td>
                              <Badge
                                className={
                                  pico.product.category === "alta_rotacao"
                                    ? "badge-alta-rotacao"
                                    : "badge-baixa-rotacao"
                                }
                              >
                                {pico.product.category === "alta_rotacao"
                                  ? "Alta Rotação"
                                  : "Baixa Rotação"}
                              </Badge>
                            </td>
                            <td className="font-medium">
                              {pico.towerLocation ? `Torre${pico.towerLocation.padStart(2, '0')}` : '-'}
                            </td>
                            <td>{pico.bases}</td>
                            <td>{pico.looseUnits}</td>
                            <td className="font-medium">{pico.totalUnits}</td>
                            <td>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingPico(pico);
                                    setIsPicoModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePico(pico)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={8} className="text-center py-8 text-muted-foreground">
                            {searchTerm
                              ? "Nenhum pico encontrado"
                              : "Nenhum pico em estoque"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Paletizados Tab */}
          <TabsContent value="paletizados">
            <div className="mb-6 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-foreground">Estoque de Paletizados</h3>
              <Button onClick={() => setIsPaletizadoModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Estoque
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                {/* Search and actions bar */}
                <div className="p-4 border-b border-border">
                  <div className="flex gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Button onClick={handlePrintPaletizados} variant="outline">
                      <Printer className="h-4 w-4 mr-2" />
                      Imprimir
                    </Button>
                  </div>
                </div>

                {/* Paletizados table */}
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Código</th>
                        <th>Descrição</th>
                        <th>Categoria</th>
                        <th>Quantidade</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockLoading ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8">
                            Carregando...
                          </td>
                        </tr>
                      ) : filteredPaletizadoStock && filteredPaletizadoStock.length > 0 ? (
                        filteredPaletizadoStock.map((stock) => (
                          <tr key={stock.id}>
                            <td className="font-medium">{stock.product.code}</td>
                            <td>{stock.product.description}</td>
                            <td>
                              <Badge
                                className={
                                  stock.product.category === "alta_rotacao"
                                    ? "badge-alta-rotacao"
                                    : "badge-baixa-rotacao"
                                }
                              >
                                {stock.product.category === "alta_rotacao"
                                  ? "Alta Rotação"
                                  : "Baixa Rotação"}
                              </Badge>
                            </td>
                            <td>{stock.quantity}</td>
                            <td>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingPaletizado(stock);
                                    setIsPaletizadoModalOpen(true);
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeletePaletizado(stock)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-muted-foreground">
                            {searchTerm
                              ? "Nenhum paletizado encontrado"
                              : "Nenhum paletizado em estoque"}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <PicoFormModal
          isOpen={isPicoModalOpen}
          onClose={() => {
            setIsPicoModalOpen(false);
            setEditingPico(null);
          }}
          pico={editingPico}
        />

        <PaletizadoFormModal
          isOpen={isPaletizadoModalOpen}
          onClose={() => {
            setIsPaletizadoModalOpen(false);
            setEditingPaletizado(null);
          }}
          stock={editingPaletizado}
        />
      </div>
    </>
  );
}
