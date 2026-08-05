import { Routes, Route, Navigate } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense, lazy } from "react";
import Home from "./pages/Home";
import Research from "./pages/Research";
import Registry from "./pages/Registry";
import Correlations from "./pages/Correlations";
import Waitlist from "./pages/Waitlist";
import Events from "./pages/Events";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import FAQ from "./pages/FAQ";
import Bibliography from "./pages/Bibliography";
import BibliographyDetail from "./pages/BibliographyDetail";
import Glossary from "./pages/Glossary";
import ProtocolGuide from "./pages/ProtocolGuide";
import EvidenceMap from "./pages/EvidenceMap";
import Methods from "./pages/Methods";
import Critiques from "./pages/Critiques";
import People from "./pages/People";
import PersonDannyGoler from "./pages/PersonDannyGoler";
import About from "./pages/About";
import OpenQuestions from "./pages/OpenQuestions";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Disclosure from "./pages/Disclosure";
import Profile from "./pages/Profile";
import MySymbols from "./pages/MySymbols";
import Join from "./pages/Join";
import Prepare from "./pages/Prepare";
const CoWitnesses = lazy(() => import("./pages/CoWitnesses"));
// Lazy load Dashboard
const Dashboard = lazy(() => import("./pages/Dashboard"));
import Leaderboard from "./pages/Leaderboard";
import NullReports from "./pages/NullReports";
import NotFound from "./pages/NotFound";
import SubmitSymbol from "./pages/SubmitSymbol";
import Dataset from "./pages/Dataset";
import Trials from "./pages/Trials";
import TrialDetail from "./pages/TrialDetail";
// Lazy load Analysis page
const Analysis = lazy(() => import("./pages/Analysis"));
// Lazy load API symbols page
const ApiSymbols = lazy(() => import("./pages/ApiSymbols"));
// Lazy load new Consciousness Data Layer pages
const Protocols = lazy(() => import("./pages/Protocols"));
const ProtocolDetail = lazy(() => import("./pages/ProtocolDetail"));
const VoiceLogger = lazy(() => import("./pages/VoiceLogger"));
const VoiceLogAnalysis = lazy(() => import("./pages/VoiceLogAnalysis"));
const AssessmentPage = lazy(() => import("./pages/AssessmentPage"));
const SharedAssessment = lazy(() => import("./pages/SharedAssessment"));
const Forecasts = lazy(() => import("./pages/Forecasts"));
const Theories = lazy(() => import("./pages/Theories"));
const TheoryDetail = lazy(() => import("./pages/TheoryDetail"));
const Timeline = lazy(() => import("./pages/Timeline"));
const TimelineEntry = lazy(() => import("./pages/TimelineEntry"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const RetreatDetail = lazy(() => import("./pages/RetreatDetail"));
const Retreats = lazy(() => import("./pages/Retreats"));
const Articles = lazy(() => import("./pages/Articles"));
const ArticleDetail = lazy(() => import("./pages/ArticleDetail"));
const TagHub = lazy(() => import("./pages/TagHub"));
const Guides = lazy(() => import("./pages/Guides"));
const Capture = lazy(() => import("./pages/Capture"));
const GuideDetail = lazy(() => import("./pages/GuideDetail"));
import { ProtectedRoute } from "./components/ProtectedRoute";

// "Calibrating lasers..." loading fallback
const CalibratingLasersLoader = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="text-center space-y-6 max-w-md px-4">
      {/* Laser calibration animation */}
      <div className="relative w-20 h-20 mx-auto">
        <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-pulse" />
        <div className="absolute inset-2 rounded-full border border-primary/50 animate-ping" style={{ animationDuration: '2s' }} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_12px_hsl(var(--primary))]" />
        </div>
        {/* Laser beams */}
        <div className="absolute top-1/2 left-full w-6 h-[2px] bg-gradient-to-r from-primary to-transparent -translate-y-1/2 animate-pulse" />
        <div className="absolute top-1/2 right-full w-6 h-[2px] bg-gradient-to-l from-primary to-transparent -translate-y-1/2 animate-pulse" />
      </div>
      <div className="space-y-2">
        <p className="text-lg font-black tracking-tight">Calibrating lasers…</p>
        <p className="text-sm text-muted-foreground font-light">Loading research equipment</p>
      </div>
    </div>
  </div>
);

export const AppRoutes = () => (
    <Routes>
    <Route index element={<Home />} />
    <Route path="research" element={<Research />} />
    <Route path="registry" element={<Registry />} />
    <Route path="registry/tag/:tag" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <TagHub />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="registry/:id" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          {(() => { const SymbolDetail = lazy(() => import("./pages/SymbolDetail")); return <SymbolDetail />; })()}
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="correlations" element={<Correlations />} />
    <Route path="waitlist" element={<Waitlist />} />
    <Route path="events" element={<Events />} />
    <Route path="events/:id" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <EventDetail />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="retreats" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Retreats />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="retreats/:id" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <RetreatDetail />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="faq" element={<FAQ />} />
    <Route path="bibliography" element={<Bibliography />} />
    <Route path="bibliography/:id" element={<BibliographyDetail />} />
    <Route path="glossary" element={<Glossary />} />
    <Route path="protocol-guide" element={<ProtocolGuide />} />
    <Route path="evidence-map" element={<EvidenceMap />} />
    <Route path="methods" element={<Methods />} />
    <Route path="Elizabeth_Baker" element={<Navigate to="/about" replace />} />
    <Route path="critiques" element={<Critiques />} />
    <Route path="people" element={<People />} />
    <Route path="people/danny-goler" element={<PersonDannyGoler />} />
    <Route path="about" element={<About />} />
    <Route path="open-questions" element={<OpenQuestions />} />
    <Route path="privacy" element={<Privacy />} />
    <Route path="terms" element={<Terms />} />
    <Route path="disclosure" element={<Disclosure />} />
    <Route path="profile" element={<Profile />} />
    <Route path="co-witnesses" element={<Suspense fallback={<CalibratingLasersLoader />}><CoWitnesses /></Suspense>} />
    <Route path="my-symbols" element={<MySymbols />} />
    <Route path="dashboard" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Dashboard />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="leaderboard" element={<Leaderboard />} />
    <Route path="null-reports" element={<NullReports />} />
    <Route path="submit-symbol" element={<SubmitSymbol />} />
    <Route path="submit" element={<Navigate to="/submit-symbol" replace />} />
    <Route path="dataset" element={<Dataset />} />
    <Route path="trials" element={<Trials />} />
    <Route path="trials/:id" element={<TrialDetail />} />
    <Route path="analysis" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Analysis />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="api/symbols" element={
      <Suspense fallback={<div>Loading...</div>}>
        <ApiSymbols />
      </Suspense>
    } />
    {/* Consciousness Data Layer Routes */}
    <Route path="protocols" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Protocols />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="protocols/:slug" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <ProtocolDetail />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="log" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <VoiceLogger />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="log/analysis/:id" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <VoiceLogAnalysis />
    </Suspense>
      </ErrorBoundary>
    } />
    {/* Assessment Routes */}
    <Route path="assess" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <AssessmentPage />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="assess/shared/:token" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <SharedAssessment />
        </Suspense>
      </ErrorBoundary>
    } />
    {/* Redirect /contribute to /log */}
    <Route path="contribute" element={<Navigate to="/log" replace />} />
    {/* Technology Forecasts Dashboard */}
    <Route path="forecasts" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Forecasts />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="theories" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Theories />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="theories/:slug" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <TheoryDetail />
        </Suspense>
      </ErrorBoundary>
    } />
  
    <Route path="timeline" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Timeline />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="timeline/:id" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <TimelineEntry />
        </Suspense>
      </ErrorBoundary>
    } />
  
  
  
    <Route path="articles" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Articles />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="articles/:slug" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <ArticleDetail />
        </Suspense>
      </ErrorBoundary>
    } />
  
    <Route path="guides" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Guides />
        </Suspense>
      </ErrorBoundary>
    } />
    <Route path="guides/:slug" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <GuideDetail />
        </Suspense>
      </ErrorBoundary>
    } />
  
    <Route path="capture" element={
      <ErrorBoundary>
        <Suspense fallback={<CalibratingLasersLoader />}>
          <Capture />
        </Suspense>
      </ErrorBoundary>
    } />
  
  
    <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
    <Route path="auth" element={<Auth />} />
    <Route path="join" element={<Join />} />
    <Route path="prepare" element={<Prepare />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
