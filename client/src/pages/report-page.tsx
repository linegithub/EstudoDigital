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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
      // Campos adicionais para estruturar melhor o endereço
      street: z.string().min(1, "Nome da rua é obrigatório"),
      number: z.string().optional(),
      neighborhood: z.string().min(1, "Bairro é obrigatório"),
      city: z.string().min(1, "Cidade é obrigatória"),
      state: z.string().min(1, "Estado é obrigatório"),
      zip: z.string().optional(),
    });

  type ReportFormValues = z.infer<typeof reportSchema>;

  // Lista de estados brasileiros
  const brazilianStates = [
    { value: "AC", label: "Acre" },
    { value: "AL", label: "Alagoas" },
    { value: "AP", label: "Amapá" },
    { value: "AM", label: "Amazonas" },
    { value: "BA", label: "Bahia" },
    { value: "CE", label: "Ceará" },
    { value: "DF", label: "Distrito Federal" },
    { value: "ES", label: "Espírito Santo" },
    { value: "GO", label: "Goiás" },
    { value: "MA", label: "Maranhão" },
    { value: "MT", label: "Mato Grosso" },
    { value: "MS", label: "Mato Grosso do Sul" },
    { value: "MG", label: "Minas Gerais" },
    { value: "PA", label: "Pará" },
    { value: "PB", label: "Paraíba" },
    { value: "PR", label: "Paraná" },
    { value: "PE", label: "Pernambuco" },
    { value: "PI", label: "Piauí" },
    { value: "RJ", label: "Rio de Janeiro" },
    { value: "RN", label: "Rio Grande do Norte" },
    { value: "RS", label: "Rio Grande do Sul" },
    { value: "RO", label: "Rondônia" },
    { value: "RR", label: "Roraima" },
    { value: "SC", label: "Santa Catarina" },
    { value: "SP", label: "São Paulo" },
    { value: "SE", label: "Sergipe" },
    { value: "TO", label: "Tocantins" }
  ];

  // Form setup
  const form = useForm<ReportFormValues>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      title: "",
      description: "",
      address: "",
      latitude: "",
      longitude: "",
      street: "",
      number: "",
      neighborhood: "",
      city: "",
      state: "SP", // Padrão para São Paulo
      zip: "",
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

  // Handle address lookup usando OpenStreetMap Nominatim API com campos estruturados
  const handleAddressLookup = async () => {
    // Pegar todos os valores do formulário de endereço
    const street = form.getValues("street");
    const number = form.getValues("number");
    const neighborhood = form.getValues("neighborhood");
    const city = form.getValues("city");
    const state = form.getValues("state");
    const zip = form.getValues("zip");
    
    // Verificar se os campos obrigatórios foram preenchidos
    if (!street || !city || !state) {
      toast({
        title: "Endereço incompleto",
        description: "Por favor, preencha pelo menos rua, cidade e estado para localizar no mapa.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Montar o endereço estruturado para geocodificação
      let formattedAddress = street;
      if (number) formattedAddress += `, ${number}`;
      if (neighborhood) formattedAddress += `, ${neighborhood}`;
      formattedAddress += `, ${city}`;
      
      // Adicionar o nome do estado por extenso (não a sigla)
      const stateFullName = brazilianStates.find(s => s.value === state)?.label || state;
      formattedAddress += `, ${stateFullName}`;
      
      if (zip) formattedAddress += `, ${zip}`;
      formattedAddress += `, Brasil`; // Adicionar o país para maior precisão
      
      // Atualizar o campo de endereço completo
      form.setValue("address", formattedAddress, { shouldValidate: true });
      
      // Indicar que está processando
      toast({
        title: "Localizando endereço...",
        description: "Aguarde enquanto buscamos o endereço no mapa.",
      });
      
      // Apenas usar o parâmetro de consulta (q) com o endereço completo formatado
      // Os parâmetros estruturados estão causando erro com a API do Nominatim
      const params: any = {
        q: formattedAddress,
        limit: 1,
        format: 'json'
      };
      
      // Realizar a geocodificação com formato simplificado
      const results = await geocode(params);
      
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
          popup: formattedAddress
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
                  // O redirecionamento será feito no próprio hook de autenticação
                }}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? "Saindo..." : "Logout"}
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
                    
                    {/* Campos estruturados de endereço - Reorganizados na ordem solicitada */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="zip"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CEP</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 01310-100" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="street"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rua/Avenida</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Av Paulista" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="number"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Número</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 1000" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="neighborhood"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bairro</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Bela Vista" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cidade</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: São Paulo" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estado</FormLabel>
                            <Select 
                              onValueChange={field.onChange} 
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o estado" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {brazilianStates.map((state) => (
                                  <SelectItem key={state.value} value={state.value}>
                                    {state.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem className="hidden">
                          <FormControl>
                            <Input type="hidden" {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="button" 
                      onClick={handleAddressLookup}
                      className="w-full bg-primary/80 hover:bg-primary/90 text-primary-foreground"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      Localizar no Mapa
                    </Button>
                    
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
