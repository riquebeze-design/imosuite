import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import PropertiesPage from "./pages/Properties";
import PropertyDetailsPage from "./pages/PropertyDetails";
import FavoritesPage from "./pages/Favorites";
import ComparePage from "./pages/Compare";
import { AppStoreProvider } from "@/state/AppStore";

import CRMIndex from "@/pages/crm/CRMIndex";
import CRMPipelinePage from "@/pages/crm/CRMPipeline";
import CRMLeadsPage from "@/pages/crm/CRMLeads";
import CRMLeadDetailPage from "@/pages/crm/CRMLeadDetail";
import CRMAutomationsPage from "@/pages/crm/CRMAutomations";
import CRMEmailPage from "@/pages/crm/CRMEmail";
import CRMSettingsPage from "@/pages/crm/CRMSettings";
import { BrandStyleProvider } from "@/components/BrandStyleProvider";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AppStoreProvider>
        <BrandStyleProvider />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/imoveis" element={<PropertiesPage />} />
            <Route path="/imovel/:slug" element={<PropertyDetailsPage />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/comparar" element={<ComparePage />} />

            {/* CRM (área interna) */}
            <Route path="/crm" element={<CRMIndex />} />
            <Route path="/crm/pipeline" element={<CRMPipelinePage />} />
            <Route path="/crm/leads" element={<CRMLeadsPage />} />
            <Route path="/crm/leads/:leadId" element={<CRMLeadDetailPage />} />
            <Route path="/crm/automacoes" element={<CRMAutomationsPage />} />
            <Route path="/crm/email" element={<CRMEmailPage />} />
            <Route path="/crm/definicoes" element={<CRMSettingsPage />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AppStoreProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;