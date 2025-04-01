import { useLocation } from "wouter";
import { AlertTriangle } from "lucide-react";

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
              <span 
                className="text-primary hover:text-primary/90 cursor-pointer text-sm" 
                onClick={() => handleNavigate('/auth')}
              >
                Login
              </span>
              <span 
                className="text-primary hover:text-primary/90 cursor-pointer text-sm" 
                onClick={() => handleNavigate('/auth?tab=register')}
              >
                Cadastro
              </span>
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
