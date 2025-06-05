import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Warehouse,
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  LogOut,
  UserCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const [location] = useLocation();
  const { user, clearAuth } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Logout realizado",
        description: "Você foi desconectado com sucesso.",
      });
      clearAuth();
    },
    onError: () => {
      // Even if the logout request fails, clear the client cache
      queryClient.clear();
      clearAuth();
    },
  });

  const isAdmin = user?.role === "administrador";

  const navItems = [
    {
      href: "/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      show: true,
    },
    {
      href: "/users",
      label: "Usuários",
      icon: Users,
      show: isAdmin,
    },
    {
      href: "/products",
      label: "Paletizados",
      icon: Package,
      show: isAdmin,
    },
    {
      href: "/inventory",
      label: "Estoque",
      icon: ClipboardList,
      show: true,
    },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return location === "/" || location === "/dashboard";
    }
    return location === href;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 md:w-48 bg-card shadow-lg z-40 border-r">
      <div className="p-6 border-b">
        <div className="flex items-center">
          <Warehouse className="h-8 w-8 text-primary mr-3" />
          <div>
            <h1 className="font-bold text-foreground">PalletFlow</h1>
            <p className="text-sm text-muted-foreground">
              {user?.role === "administrador" ? "Administrador" : "Armazenista"}
            </p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {navItems
          .filter((item) => item.show)
          .map((item) => (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center px-6 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors",
                isActive(item.href) && "bg-accent text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </Link>
          ))}
      </nav>
      
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t">
        <div className="flex items-center text-sm text-muted-foreground mb-3">
          <UserCircle className="h-5 w-5 mr-2" />
          <span>{user?.name}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {logoutMutation.isPending ? "Saindo..." : "Sair"}
        </Button>
      </div>
    </div>
  );
}
