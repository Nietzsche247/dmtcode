import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Helmet } from "react-helmet";
import { Breadcrumb } from "@/components/Breadcrumb";
import EventsTimeline from "@/components/events/EventsTimeline";
import TrialsTimeline from "@/components/events/TrialsTimeline";
import RetreatGrid from "@/components/events/RetreatGrid";
import EventSubmissionModal from "@/components/events/EventSubmissionModal";
import TrialSubmissionModal from "@/components/events/TrialSubmissionModal";
import RetreatSubmissionModal from "@/components/events/RetreatSubmissionModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const Events = () => {
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [trialModalOpen, setTrialModalOpen] = useState(false);
  const [retreatModalOpen, setRetreatModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Helmet>
        <title>Research Events & Clinical Trials | DMT Code</title>
        <meta 
          name="description" 
          content="Timeline of psychedelic research events, clinical trials, and verified retreats. Community-sourced scholarly reference for DMT research milestones." 
        />
      </Helmet>

      <Navigation />

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Sticky Scholarly Disclaimer Banner */}
        <Alert className="mb-8 sticky top-20 z-40 border-[hsl(var(--gold))] bg-background/95 backdrop-blur">
          <AlertDescription className="text-sm">
            <strong>Scholarly Reference Only:</strong> This timeline aggregates community-reported events and publicly available clinical trial data. 
            Inclusion does not constitute endorsement. Verify all information independently before participation. For retreat trust scores, 
            see individual rating breakdowns and community notes.
          </AlertDescription>
        </Alert>

        <Breadcrumb items={[{ label: "Events & Trials" }]} />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Research Events & Clinical Trials Timeline
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Scholarly reference of psychedelic research milestones, community gatherings, and ongoing clinical studies. 
            Community-sourced, moderator-reviewed, with transparent trust metrics.
          </p>
        </div>

        {/* Submission Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <Button
            onClick={() => setEventModalOpen(true)}
            className="bg-[#C41E3A] hover:bg-[#C41E3A]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Event
          </Button>
          <Button
            onClick={() => setTrialModalOpen(true)}
            className="bg-[#2E5C8A] hover:bg-[#2E5C8A]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Clinical Trial
          </Button>
          <Button
            onClick={() => setRetreatModalOpen(true)}
            className="bg-[#28A745] hover:bg-[#28A745]/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Retreat
          </Button>
        </div>

        {/* Dual Timeline Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Events Timeline</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Top: Public & private events (dark red) • Bottom: Clinical trials (color-coded by status)
          </p>
          <div className="space-y-6">
            <EventsTimeline />
            <TrialsTimeline />
          </div>
        </section>

        {/* Retreat Grid Section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Verified Retreats & Centers</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Community-rated retreat centers with transparent trust metrics. Ratings are independently verified and moderated.
          </p>
          <RetreatGrid />
        </section>

        {/* Footer Disclaimer */}
        <Alert className="mt-12 border-muted">
          <AlertDescription className="text-xs text-muted-foreground">
            <strong>Medical & Legal Disclaimer:</strong> This page is for educational and research reference purposes only. 
            It does not constitute medical advice, treatment recommendation, or legal counsel. Psychedelic substances remain 
            controlled in most jurisdictions. Consult licensed professionals before participation in any therapeutic or ceremonial context. 
            Trust ratings reflect community perception only and do not guarantee safety or quality. The DMT Code Project assumes no liability 
            for outcomes related to information presented here. Always verify retreat credentials, legal status, and medical contraindications independently.
          </AlertDescription>
        </Alert>
      </main>

      <Footer />

      {/* Submission Modals */}
      <EventSubmissionModal open={eventModalOpen} onOpenChange={setEventModalOpen} />
      <TrialSubmissionModal open={trialModalOpen} onOpenChange={setTrialModalOpen} />
      <RetreatSubmissionModal open={retreatModalOpen} onOpenChange={setRetreatModalOpen} />
    </div>
  );
};

export default Events;
