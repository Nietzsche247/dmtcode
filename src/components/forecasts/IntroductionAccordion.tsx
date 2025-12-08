import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function IntroductionAccordion() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section 
      className="w-full border-b border-border/20"
      style={{ 
        background: 'linear-gradient(180deg, hsl(var(--background)) 0%, hsl(222 47% 11%) 100%)' 
      }}
    >
      <div className="container mx-auto px-4">
        <div 
          className={cn(
            "max-w-[720px] mx-auto text-center transition-all duration-400 ease-out",
            isExpanded ? "py-16 md:py-20" : "py-12 md:py-16"
          )}
        >
          {/* Pull Quote Card */}
          <div className="relative bg-white/[0.03] border border-white/[0.05] rounded-xl p-8 md:p-10">
            {/* Accent line above */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-px bg-primary" />
            
            {/* Main quote */}
            <p className="text-xl md:text-[28px] font-black text-foreground leading-tight">
              The decade containing the most transformative event in history may also be the most forecastable.
            </p>
            
            {/* Toggle link */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
                  <span>Collapse</span>
                </>
              ) : (
                <>
                  <span>Why this matters</span>
                  <ChevronDown className="h-4 w-4 transition-transform group-hover:translate-y-0.5" />
                </>
              )}
            </button>
          </div>

          {/* Accordion Content */}
          <div 
            className={cn(
              "overflow-hidden transition-all duration-400 ease-out",
              isExpanded ? "max-h-[1000px] opacity-100 mt-8" : "max-h-0 opacity-0 mt-0"
            )}
          >
            <div className="space-y-6 text-base md:text-[17px] text-muted-foreground font-light leading-relaxed md:leading-[1.7] max-w-[680px] mx-auto text-left">
              <p>
                <span className="font-normal text-foreground/90">Consider how hard it has been to forecast the past.</span>{' '}
                In 1985, almost no one predicted the Soviet Union would collapse within six years. In 2006, the world's best economists missed the approaching financial crisis. These were not failures of intelligence. The variables that mattered were hidden, distributed across too many domains, or simply unknowable until they happened.
              </p>
              <p>
                <span className="font-normal text-foreground/90">Now consider what we can see in 2025.</span>{' '}
                The capability curve of artificial intelligence is published quarterly in benchmark scores, demonstrated in products millions use daily, and powered by trillion-dollar infrastructure investments visible in satellite imagery. The scaling laws predicting performance gains were written up years ago and have held steady. For perhaps the first time in modern history, the single variable most likely to reshape human civilization is measurable, trackable, and moving on a curve we can observe in real-time.
              </p>
              <p>
                This creates a strange situation. Not because we have certainty, but because the causal chain is short and visible. AI capability leads to AGI, AGI enables recursive improvement, recursive improvement leads to ASI. Each step depends on the prior in obvious ways. The pieces are on the board. The trajectory is measurable. If you have ever wished you could see a major shift coming before it arrived, this may be your chance.
              </p>
            </div>

            {/* Collapse link at bottom */}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronUp className="h-4 w-4" />
              <span>Collapse</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
