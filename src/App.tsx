import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { GrainOverlay } from "@/components/GrainOverlay";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AvatarToastListener } from "./components/AvatarToastListener";
import { BadgeToastListener } from "./components/BadgeToastListener";
import { HighFiveToastListener } from "./components/co-witness/HighFiveToastListener";
import { useGA4PageTracking } from "./hooks/useGA4PageTracking";
import "./i18n";
import { LocaleProvider } from "./i18n/LocaleProvider";
import AppRoutes from "./AppRoutes";

const GA4Tracker = () => {
  useGA4PageTracking();
  return null;
};

const queryClient = new QueryClient();

// Path-based locale mirrors: English is the default at unprefixed paths, with
// /es/* and /de/* mounting the exact same route tree.
const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <GrainOverlay />
        <BrowserRouter>
          <GA4Tracker />
          <AvatarToastListener />
          <BadgeToastListener />
          <HighFiveToastListener />
          <PWAInstallPrompt />
          <Routes>
            <Route
              path="/es/*"
              element={
                <LocaleProvider locale="es">
                  <AppRoutes />
                </LocaleProvider>
              }
            />
            <Route
              path="/de/*"
              element={
                <LocaleProvider locale="de">
                  <AppRoutes />
                </LocaleProvider>
              }
            />
            <Route
              path="/*"
              element={
                <LocaleProvider locale="en">
                  <AppRoutes />
                </LocaleProvider>
              }
            />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
