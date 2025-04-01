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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LeafletMap from "@/components/ui/leaflet-map";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function ReportPage() {
  const { user, logoutMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [mapCenter] = useState<[number, number]>([-23.9666, -46.3833]); // Default center

  // Extended schema for report form with validation
  const reportSchema = insertReportSchema
    .omit({ userId: true })
    .extend({
      latitude: z.string().min(1, "Latitude is required"),
      longitude: z.string().min(1, "Longitude is required"),
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
      status: "pendente",
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
  };

  // Form submit handler
  const onSubmit = (data: ReportFormValues) => {
    createReportMutation.mutate(data);
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
                onClick={() => navigate("/panel")}
              >
                Painel
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
            <h1 className="text-2xl font-semibold text-neutral-800 mb-6">Faça uma Denúncia</h1>
            
            {/* Report Form */}
            <div className="bg-white shadow-sm rounded-lg overflow-hidden mb-8">
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
                        <FormControl>
                          <Input placeholder="Rua, número, bairro, cidade" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Clique no mapa para definir" 
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
                              placeholder="Clique no mapa para definir" 
                              {...field} 
                              readOnly
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um status" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="pendente">Pendente</SelectItem>
                            <SelectItem value="em_andamento">Em Andamento</SelectItem>
                            <SelectItem value="resolvido">Resolvido</SelectItem>
                            <SelectItem value="cancelado">Cancelado</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="bg-primary-600 hover:bg-primary-700 text-white"
                    disabled={createReportMutation.isPending}
                  >
                    {createReportMutation.isPending ? "Enviando..." : "Enviar Denúncia"}
                  </Button>
                </form>
              </Form>
            </div>
            
            {/* Map Section */}
            <div>
              <h2 className="text-lg font-medium text-neutral-800 mb-4">Selecione o local no mapa</h2>
              <div className="bg-white p-4 rounded-lg shadow-sm">
                <LeafletMap 
                  center={mapCenter}
                  height="400px"
                  onClick={handleMapClick}
                />
              </div>
              <p className="mt-2 text-sm text-neutral-500">
                Clique no mapa para definir a localização precisa da denúncia.
              </p>
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
