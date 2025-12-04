import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import Home from "./pages/Home";
import Research from "./pages/Research";
import Woo from "./pages/Woo";
import Registry from "./pages/Registry";
import Correlations from "./pages/Correlations";
import Waitlist from "./pages/Waitlist";
import Events from "./pages/Events";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import FAQ from "./pages/FAQ";
import Bibliography from "./pages/Bibliography";
import Glossary from "./pages/Glossary";
import ProtocolGuide from "./pages/ProtocolGuide";
import EvidenceMap from "./pages/EvidenceMap";
import Methods from "./pages/Methods";
import Critiques from "./pages/Critiques";
import About from "./pages/About";
import OpenQuestions from "./pages/OpenQuestions";
import Profile from "./pages/Profile";
import MySymbols from "./pages/MySymbols";
import Leaderboard from "./pages/Leaderboard";
import NullReports from "./pages/NullReports";
import NotFound from "./pages/NotFound";
import ProductDetail from "./pages/ProductDetail";
import SubmitProduct from "./pages/SubmitProduct";
import Bundles from "./pages/Bundles";
import { ProtectedRoute } from "./components/ProtectedRoute";

// Lazy load Tools page to isolate potential crashes
const Tools = lazy(() => import("./pages/Tools"));

const queryClient = new QueryClient();

// Loading fallback for Tools page
const ToolsLoading = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
      <p className="text-muted-foreground">Loading products...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <GrainOverlay />
      <BrowserRouter>
        <PWAInstallPrompt />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/tools" element={
            <ErrorBoundary>
              <Suspense fallback={<ToolsLoading />}>
                <Tools />
              </Suspense>
            </ErrorBoundary>
          } />
          {/* /woo redirects to /community/woo */}
          <Route path="/woo" element={<Navigate to="/community/woo" replace />} />
          <Route path="/community/woo" element={<Woo />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/correlations" element={<Correlations />} />
          <Route path="/waitlist" element={<Waitlist />} />
          <Route path="/events" element={<Events />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/bibliography" element={<Bibliography />} />
          <Route path="/glossary" element={<Glossary />} />
          <Route path="/protocol-guide" element={<ProtocolGuide />} />
          <Route path="/evidence-map" element={<EvidenceMap />} />
          <Route path="/methods" element={<Methods />} />
          <Route path="/critiques" element={<Critiques />} />
          <Route path="/about" element={<About />} />
          <Route path="/open-questions" element={<OpenQuestions />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/my-symbols" element={<MySymbols />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/null-reports" element={<NullReports />} />
          <Route path="/products/:id" element={<ProductDetail />} />
          <Route path="/submit-product" element={<SubmitProduct />} />
          <Route path="/bundles" element={<Bundles />} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
