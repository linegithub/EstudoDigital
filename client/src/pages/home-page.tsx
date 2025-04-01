import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { AlertTriangle, MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export default function HomePage() {
  const [, navigate] = useLocation();

  const handleNavigate = (path: string) => {
    navigate(path);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-card shadow-sm dark:shadow-slate-800/10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-foreground font-semibold text-lg">Aedes Monitoramento</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground" 
                onClick={() => handleNavigate('/auth')}
              >
                Entrar
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        <div className="py-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="h-8 w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
                Monitoramento do Aedes Aegypti
              </h1>
            </div>
            <div className="prose prose-sm sm:prose dark:prose-invert max-w-none">
              <p className="mb-4">
                O sistema de monitoramento do Aedes Aegypti permite que cidadãos registrem 
                denúncias de possíveis focos do mosquito transmissor da dengue, zika e chikungunya.
              </p>
              <p className="mb-4">Através desta plataforma, você pode:</p>
              <ul className="list-disc pl-5 mb-4">
                <li>Registrar denúncias de possíveis focos do mosquito</li>
                <li>Visualizar denúncias registradas no mapa</li>
                <li>Acompanhar o status das suas denúncias</li>
                <li>Contribuir para o combate às doenças transmitidas pelo Aedes Aegypti</li>
              </ul>
              <p className="mb-4">Para começar, cadastre-se gratuitamente na plataforma.</p>
              
              <div className="mt-8 flex flex-col sm:flex-row sm:space-x-4 space-y-4 sm:space-y-0">
                <Button 
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-6 h-auto text-base"
                  onClick={() => handleNavigate('/auth')}
                >
                  <MapPin className="h-5 w-5 mr-2" />
                  Cadastre-se para denunciar
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
