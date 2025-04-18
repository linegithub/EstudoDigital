import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import PanelPage from "@/pages/panel-page";
import ReportPage from "@/pages/report-page";
import { ProtectedRoute } from "./lib/protected-route";
import { AuthProvider } from "./hooks/use-auth";
import { ThemeProvider } from "./hooks/use-theme";

function Router() {
  return (
    <Switch>
      <Route path="/" component={HomePage} />
      <Route path="/auth" component={AuthPage} />
      <ProtectedRoute path="/panel" component={PanelPage} />
      <ProtectedRoute path="/report" component={ReportPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="aedes-theme">
      <AuthProvider>
        <WouterRouter base="">
          <Router />
          <Toaster />
        </WouterRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
