import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Research from "./pages/Research";
import Tools from "./pages/Tools";
import Registry from "./pages/Registry";
import Waitlist from "./pages/Waitlist";
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
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/research" element={<Research />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/registry" element={<Registry />} />
          <Route path="/waitlist" element={<Waitlist />} />
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
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/auth" element={<Auth />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
