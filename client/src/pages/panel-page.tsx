import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { Report } from "@shared/schema";
import LeafletMap from "@/components/ui/leaflet-map";
import { Badge } from "@/components/ui/badge";

export default function PanelPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();

  // Fetch user reports
  const { 
    data: reports, 
    isLoading: isLoadingReports 
  } = useQuery<Report[]>({
    queryKey: ["/api/user/reports"],
  });

  // Map markers from reports
  const markers = reports?.map(report => ({
    position: [report.latitude, report.longitude] as [number, number],
    popup: report.title,
    id: report.id
  })) || [];

  // Status badge color mapper
  const getStatusBadgeVariant = (status: string) => {
    switch(status) {
      case 'pendente':
        return 'warning';
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
      case 'pendente':
        return 'Pendente';
      case 'em_andamento':
        return 'Em Andamento';
      case 'resolvido':
        return 'Resolvido';
      case 'cancelado':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <Button
                variant="ghost"
                className="text-neutral-800 font-semibold text-lg"
                onClick={() => navigate("/")}
              >
                Aedes Monitoramento
              </Button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-neutral-600">
                Olá, {user?.firstName}!
              </span>
              <Button 
                variant="ghost" 
                className="text-sm text-neutral-600 hover:text-neutral-900"
                onClick={() => navigate("/report")}
              >
                Denúncia
              </Button>
              <Button 
                variant="ghost" 
                className="text-sm text-neutral-600 hover:text-neutral-900"
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
            <h1 className="text-2xl font-semibold text-neutral-800 mb-2">Bem-vindo ao Painel</h1>
            <p className="text-neutral-600 mb-6">Aqui você pode visualizar e gerenciar suas denúncias.</p>
            
            {/* Map Component */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <LeafletMap 
                height="400px"
                markers={markers}
              />
            </div>
            
            {/* Reports List */}
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="px-4 py-5 sm:px-6 border-b border-neutral-200">
                <h2 className="text-lg font-medium text-neutral-800">Suas Denúncias</h2>
              </div>
              
              {isLoadingReports ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : reports && reports.length > 0 ? (
                <div className="divide-y divide-neutral-200">
                  {reports.map((report) => (
                    <div key={report.id} className="px-4 py-4 sm:px-6 hover:bg-neutral-50">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-medium text-primary-600">{report.title}</h3>
                          <p className="text-sm text-neutral-500 mt-1">{report.address}</p>
                        </div>
                        <div>
                          <Badge variant={getStatusBadgeVariant(report.status)}>
                            {formatStatus(report.status)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-6 text-center text-neutral-500">
                  <p>Você ainda não possui denúncias registradas.</p>
                </div>
              )}
              
              <div className="px-4 py-4 sm:px-6 border-t border-neutral-200">
                <Button
                  variant="link"
                  className="text-sm font-medium text-primary-600 hover:text-primary-500 p-0"
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
      <footer className="bg-white border-t border-neutral-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-neutral-500">
            © {new Date().getFullYear()} Aedes Monitoramento. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
