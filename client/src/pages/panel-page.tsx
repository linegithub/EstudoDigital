import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Report } from "@shared/schema";
import LeafletMap from "@/components/ui/leaflet-map";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function PanelPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user reports
  const { 
    data: reports, 
    isLoading: isLoadingReports,
    error: reportsError 
  } = useQuery<Report[]>({
    queryKey: ["/api/user/reports"],
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    retry: 3,
  });
  
  // Log dos relatórios para debug
  console.log("Reports:", reports);

  // Map markers from reports
  const markers = reports?.map(report => ({
    position: [report.latitude, report.longitude] as [number, number],
    popup: report.title,
    id: report.id
  })) || [];

  // Status badge color mapper
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'em_andamento':
        return 'secondary';
      case 'resolvido':
        return 'success';
      case 'cancelado':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  // Format status label
  const formatStatus = (status: string) => {
    switch(status) {
      case 'em_andamento':
        return 'Em Andamento';
      case 'resolvido':
        return 'Resolvido';
      case 'cancelado':
        return 'Cancelado';
      default:
        return 'Recebido'; // Default status quando não houver status definido
    }
  };
  
  // Format date helper
  const formatDate = (date: any) => {
    if (!date) return '-';
    try {
      return new Date(date).toLocaleDateString('pt-BR');
    } catch (error) {
      return '-';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card shadow-sm dark:shadow-slate-800/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-foreground font-semibold text-lg"
                onClick={() => navigate("/")}
              >
                Aedes Monitoramento
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-muted-foreground">
                Olá, {user?.firstName}!
              </span>
              <ThemeToggle />
              <Button 
                variant="ghost" 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => navigate("/report")}
              >
                Denúncia
              </Button>
              <Button 
                variant="ghost" 
                className="text-sm text-muted-foreground hover:text-foreground"
                onClick={() => {
                  logoutMutation.mutate();
                  navigate("/");
                }}
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-2xl font-semibold text-foreground mb-2">Bem-vindo ao Painel</h1>
            <p className="text-muted-foreground mb-6">Aqui você pode visualizar e gerenciar suas denúncias.</p>
            
            {/* Map Component */}
            <div className="bg-card p-4 rounded-lg shadow-sm dark:shadow-slate-800/10 mb-6">
              <LeafletMap 
                height="400px"
                markers={markers}
              />
            </div>
            
            {/* Reports List */}
            <div className="bg-card rounded-lg shadow-sm dark:shadow-slate-800/10 overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-border">
                <h2 className="text-lg font-medium text-foreground">Suas Denúncias</h2>
              </div>
              
              {isLoadingReports ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reportsError ? (
                <div className="px-4 py-6 text-center text-red-500">
                  <p>Erro ao carregar as denúncias. Por favor, tente novamente mais tarde.</p>
                  <p className="text-xs mt-2">{(reportsError as Error).message}</p>
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="p-2">
                  {reports.map((report) => (
                    <div key={report.id} className="p-4 hover:bg-muted/50 bg-blue-50 dark:bg-slate-800/50 rounded-md my-3 mx-2 border border-blue-100 dark:border-slate-700 shadow-sm">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-base font-medium text-blue-700 dark:text-blue-400">{report.title}</h3>
                        <Badge variant="outline" className="ml-1 bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400">
                          {formatStatus(report.status)}
                        </Badge>
                      </div>
                      
                      <p className="text-sm mb-4 text-slate-600 dark:text-slate-300">
                        {report.description}
                      </p>
                      
                      <div className="text-sm space-y-1.5 text-slate-500 dark:text-slate-400">
                        <div className="flex">
                          <span className="inline-block w-24 font-medium">Criado em:</span> 
                          <span>{formatDate(report.createdAt)}</span>
                        </div>
                        
                        <div className="flex">
                          <span className="inline-block w-24 font-medium">Endereço:</span> 
                          <span>{report.street || '-'}{report.number ? `, ${report.number}` : ''}</span>
                        </div>
                        
                        <div className="flex">
                          <span className="inline-block w-24 font-medium">Bairro:</span> 
                          <span>{report.neighborhood || '-'}</span>
                        </div>
                        
                        <div className="flex">
                          <span className="inline-block w-24 font-medium">Cidade/UF:</span> 
                          <span>{report.city || '-'} / {report.state || '-'}</span>
                        </div>
                        
                        <div className="flex">
                          <span className="inline-block w-24 font-medium">CEP:</span> 
                          <span>{report.zip || '-'}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-muted-foreground">
                  <p>Você ainda não possui denúncias registradas.</p>
                </div>
              )}
              
              <div className="px-4 py-4 sm:px-6 border-t border-border">
                <Button
                  variant="link"
                  className="text-sm font-medium text-primary hover:text-primary/90 p-0"
                  onClick={() => navigate("/report")}
                >
                  Registrar nova denúncia
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Aedes Monitoramento. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
