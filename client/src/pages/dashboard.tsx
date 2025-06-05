import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Layers,
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface DashboardStats {
  totalPicos: number;
  totalPaletizados: number;
  altaRotacao: number;
  baixaRotacao: number;
  recentEntries: Array<{
    id: number;
    type: string;
    productCode: string;
    productDescription: string;
    quantity: number;
    category: string;
    createdAt: string;
  }>;
  recentExits: Array<{
    id: number;
    type: string;
    productCode: string;
    productDescription: string;
    quantity: number;
    category: string;
    createdAt: string;
  }>;
}

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-foreground">Dashboard</h2>
        <p className="text-muted-foreground">
          Visão geral operacional do armazém
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Picos
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalPicos || 0}
                </p>
              </div>
              <Layers className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Paletizados
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.totalPaletizados || 0}
                </p>
              </div>
              <Package className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Alta Rotação
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.altaRotacao || 0}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.altaRotacao && stats?.baixaRotacao
                ? Math.round(
                    (stats.altaRotacao / (stats.altaRotacao + stats.baixaRotacao)) * 100
                  )
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Baixa Rotação
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {stats?.baixaRotacao || 0}
                </p>
              </div>
              <TrendingDown className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats?.altaRotacao && stats?.baixaRotacao
                ? Math.round(
                    (stats.baixaRotacao / (stats.altaRotacao + stats.baixaRotacao)) * 100
                  )
                : 0}
              % do total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowUp className="h-5 w-5 text-green-500 mr-2" />
              Entradas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentEntries && stats.recentEntries.length > 0 ? (
                stats.recentEntries.map((entry) => (
                  <div
                    key={entry.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {entry.productCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {entry.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          entry.category === "alta_rotacao" ? "default" : "secondary"
                        }
                        className="mb-1"
                      >
                        {entry.category === "alta_rotacao" ? "Alta" : "Baixa"}
                      </Badge>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {format(new Date(entry.createdAt), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma entrada recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <ArrowDown className="h-5 w-5 text-red-500 mr-2" />
              Saídas Recentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats?.recentExits && stats.recentExits.length > 0 ? (
                stats.recentExits.map((exit) => (
                  <div
                    key={exit.id}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">
                        {exit.productCode}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {exit.quantity} unidades
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge
                        variant={
                          exit.category === "alta_rotacao" ? "default" : "secondary"
                        }
                        className="mb-1"
                      >
                        {exit.category === "alta_rotacao" ? "Alta" : "Baixa"}
                      </Badge>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        {format(new Date(exit.createdAt), "dd/MM HH:mm", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma saída recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
