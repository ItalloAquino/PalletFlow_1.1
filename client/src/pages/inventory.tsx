import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Printer, Edit, Trash2 } from "lucide-react";
import PicoFormModal from "@/components/pico-form-modal";
import PaletizadoFormModal from "@/components/paletizado-form-modal";
import type { PicoWithProduct, PaletizadoStockWithProduct } from "@shared/schema";

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isPicoModalOpen, setIsPicoModalOpen] = useState(false);
  const [isPaletizadoModalOpen, setIsPaletizadoModalOpen] = useState(false);
  const [editingPico, setEditingPico] = useState<PicoWithProduct | null>(null);
  const [editingPaletizado, setEditingPaletizado] = useState<PaletizadoStockWithProduct | null>(null);

  const { data: picos, isLoading: picosLoading } = useQuery<PicoWithProduct[]>({
    queryKey: ["/api/picos"],
  });

  const { data: paletizadoStock, isLoading: stockLoading } = useQuery<PaletizadoStockWithProduct[]>({
    queryKey: ["/api/paletizado-stock"],
  });

  // Filter picos based on search term
  const filteredPicos = picos?.filter((pico) =>
    pico.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pico.product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter paletizado stock based on search term
  const filteredPaletizadoStock = paletizadoStock?.filter((stock) =>
    stock.product.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stock.product.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrintPicos = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

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
          </style>
        </head>
        <body>
          <div class="header">
            <h1>PalletFlow - Relatório de Picos</h1>
            <p>Data: ${new Date().toLocaleDateString("pt-BR")}</p>
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

  return (
    <div className="p-8">
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
                              <Button variant="ghost" size="sm">
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
                              <Button variant="ghost" size="sm">
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
  );
}
