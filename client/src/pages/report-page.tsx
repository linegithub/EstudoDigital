import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertReportSchema } from "@shared/schema";
import { z } from "zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import LeafletMap from "@/components/ui/leaflet-map";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Search, MapPin } from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { geocode } from 'nominatim-browser';

export default function ReportPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mapCenter, setMapCenter] = useState<[number, number]>([-23.9666, -46.3833]); // Default center
  const [markers, setMarkers] = useState<{ position: [number, number]; popup?: string }[]>([]);

  // Extended schema for report form with validation
  const reportSchema = insertReportSchema
    .omit({ userId: true, status: true })
    .extend({
      latitude: z.string().min(1, "Latitude é obrigatória"),
      longitude: z.string().min(1, "Longitude é obrigatória"),
    });

  type ReportFormValues = z.infer<typeof reportSchema>;

  // Form setup
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      latitude: "",
      longitude: "",
    },
  });

  // Create report mutation
  const createReportMutation = useMutation({
    mutationFn: async (data: ReportFormValues) => {
      // Convert latitude and longitude to numbers
      const reportData = {
        ...data,
        latitude: parseFloat(data.latitude),
        longitude: parseFloat(data.longitude),
        userId: user?.id,
        status: "recebido", // Novo status padrão
      };
      
      const res = await apiRequest("POST", "/api/reports", reportData);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Denúncia enviada",
        description: "Sua denúncia foi registrada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/reports"] });
      // Redirecionar para o painel após sucesso
      navigate("/panel");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao enviar denúncia",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle map click to update coordinates
  const handleMapClick = (latlng: { lat: number; lng: number }) => {
    form.setValue("latitude", latlng.lat.toString(), { shouldValidate: true });
    form.setValue("longitude", latlng.lng.toString(), { shouldValidate: true });
    
    // Update marker on map click
    setMarkers([{
      position: [latlng.lat, latlng.lng],
      popup: form.getValues("address") || "Local selecionado"
    }]);
  };

  // Handle address lookup usando OpenStreetMap Nominatim API
  const handleAddressLookup = async () => {
    const address = form.getValues("address");
    if (!address) {
      toast({
        title: "Endereço vazio",
        description: "Por favor, digite um endereço para localizar no mapa.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Adicionar "Brasil" ao final do endereço para melhorar a precisão
      const searchAddress = `${address}, Brasil`;
      
      // Indicar que está processando
      toast({
        title: "Localizando endereço...",
        description: "Aguarde enquanto buscamos o endereço no mapa.",
      });
      
      // Realizar a geocodificação - usando tipos mais simples para compatibilidade
      const results = await geocode({
        q: searchAddress,
        limit: 1
      });
      
      if (results && results.length > 0) {
        const location = results[0];
        const lat = parseFloat(location.lat);
        const lng = parseFloat(location.lon);
        
        // Definir o centro do mapa
        setMapCenter([lat, lng]);
        
        // Atualizar os valores do formulário
        form.setValue("latitude", lat.toString(), { shouldValidate: true });
        form.setValue("longitude", lng.toString(), { shouldValidate: true });
        
        // Adicionar marcador ao mapa
        setMarkers([{
          position: [lat, lng],
          popup: address
        }]);
        
        toast({
          title: "Endereço localizado",
          description: "Localização precisa encontrada no mapa.",
        });
      } else {
        // Caso não encontre o endereço
        toast({
          title: "Endereço não encontrado",
          description: "Não foi possível localizar o endereço. Tente ser mais específico ou marque diretamente no mapa.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao geocodificar:", error);
      toast({
        title: "Erro ao localizar endereço",
        description: "Ocorreu um erro ao buscar o endereço. Tente novamente ou marque diretamente no mapa.",
        variant: "destructive",
      });
    }
  };

  // Form submit handler
  const onSubmit = (data: ReportFormValues) => {
    createReportMutation.mutate(data);
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
                onClick={() => navigate("/panel")}
              >
                Painel
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
            <h1 className="text-2xl font-semibold text-foreground mb-6">Faça uma Denúncia</h1>
            
            {/* Report Form */}
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-card shadow-sm dark:shadow-slate-800/10 rounded-lg overflow-hidden">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="p-6 space-y-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input placeholder="Exemplo: Água parada em terreno baldio" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Descreva o foco do mosquito em detalhes" 
                              rows={4} 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Endereço</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="Rua, número, bairro, cidade" {...field} />
                            </FormControl>
                            <Button 
                              type="button" 
                              onClick={handleAddressLookup}
                              variant="outline"
                              className="flex-shrink-0"
                            >
                              <Search className="h-4 w-4 mr-2" />
                              Localizar
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="latitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Latitude</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Automático" 
                                {...field} 
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="longitude"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Longitude</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Automático" 
                                {...field} 
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                      disabled={createReportMutation.isPending}
                    >
                      {createReportMutation.isPending ? "Enviando..." : "Enviar Denúncia"}
                    </Button>
                  </form>
                </Form>
              </div>
              
              {/* Map Section */}
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-medium text-foreground mb-2">Selecione o local no mapa</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Clique no mapa para definir a localização precisa da denúncia ou use o botão "Localizar" após digitar o endereço.
                  </p>
                </div>
                <div className="bg-card p-4 rounded-lg shadow-sm dark:shadow-slate-800/10 h-[400px]">
                  <LeafletMap 
                    center={mapCenter}
                    height="100%"
                    onClick={handleMapClick}
                    markers={markers}
                  />
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Sua localização será usada apenas para fins de registro e monitoramento de focos do Aedes Aegypti.
                </div>
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
