import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";

export function IntroductionAccordion() {
  const [isExpanded, setIsExpanded] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const handleToggle = useCallback(() => {
    const willExpand = !isExpanded;
    setIsExpanded(willExpand);
    
    if (willExpand) {
      // Smooth scroll to show expanded content after animation starts
      setTimeout(() => {
        contentRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 100);
    }
  }, [isExpanded]);

  return (
    <section 
      className="w-full relative overflow-hidden"
      style={{ 
        background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' 
      }}
    >
      {/* Subtle animated background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white/5"
            style={{
              width: 2 + (i % 3),
              height: 2 + (i % 3),
              left: `${(i * 8.3) % 100}%`,
              top: `${(i * 7.7) % 100}%`,
              animation: `float-particle ${20 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>
      
      {/* Bottom fade divider */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-white/10" />
      
      <div className="container mx-auto px-4 relative z-10">
        <div 
          className={cn(
            "max-w-[800px] mx-auto text-center transition-all duration-400 ease-out",
            isExpanded ? "py-16 md:py-20" : "py-14 md:py-20"
          )}
        >
          {/* Accent line above quote */}
          <div className="w-16 h-px bg-[#C41E3A] mx-auto mb-8" />
          
          {/* Pull Quote */}
          <h2 
            className="text-2xl md:text-[32px] font-bold text-white leading-[1.3] max-w-[800px] mx-auto"
            style={{ textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}
          >
            The decade containing the most transformative events in history may also be the most forecastable.
          </h2>
          
          {/* Accent line below quote */}
          <div className="w-16 h-px bg-[#C41E3A] mx-auto mt-8" />
          
          {/* Toggle link */}
          <button
            onClick={handleToggle}
            className={cn(
              "mt-8 inline-flex items-center gap-2 text-base font-medium transition-all duration-300",
              "py-3 px-6 rounded-full",
              "text-[#C41E3A] hover:text-white",
              "border border-[#C41E3A]/50 hover:border-[#C41E3A]",
              "hover:bg-[#C41E3A]/10",
              "hover:shadow-[0_0_20px_rgba(196,30,58,0.3)]"
            )}
          >
            {isExpanded ? (
              <span>← Collapse</span>
            ) : (
              <span>Why this matters →</span>
            )}
          </button>

          {/* Accordion Content */}
          <div 
            ref={contentRef}
            className={cn(
              "overflow-hidden transition-all duration-[400ms] ease-out",
              isExpanded ? "max-h-[1000px] opacity-100 mt-10" : "max-h-0 opacity-0 mt-0"
            )}
          >
            <div className="space-y-6 text-[17px] text-white/85 font-light leading-[1.7] max-w-[680px] mx-auto text-left">
              <p>
                <span className="font-normal text-white">Consider how hard it has been to forecast the past.</span>{' '}
                In 1985, almost no one predicted the Soviet Union would collapse within six years. In 2006, the world&apos;s best economists missed the approaching financial crisis. These were not failures of intelligence. The variables that mattered were hidden, distributed across too many domains, or simply unknowable until they happened.
              </p>
              <p>
                <span className="font-normal text-white">Now consider what we can see in 2025.</span>{' '}
                The capability curve of artificial intelligence is published quarterly in benchmark scores, demonstrated in products millions use daily, and powered by trillion-dollar infrastructure investments visible in satellite imagery. The scaling laws predicting performance gains were written up years ago and have held steady. For perhaps the first time in modern history, the single variable most likely to reshape human civilization is measurable, trackable, and moving on a curve we can observe in real-time.
              </p>
              <p>
                This creates a strange situation. Not because we have certainty, but because the causal chain is short and visible. AI capability leads to AGI, AGI enables recursive improvement, recursive improvement leads to ASI. Each step depends on the prior in obvious ways. The pieces are on the board. The trajectory is measurable. If you have ever wished you could see a major shift coming before it arrived, this may be your chance.
              </p>
            </div>

            {/* Collapse link at bottom */}
            <button
              onClick={() => setIsExpanded(false)}
              className="mt-10 inline-flex items-center gap-2 text-base font-medium text-[#C41E3A] hover:text-white transition-colors"
            >
              <span>← Collapse</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* CSS for particle animation */}
      <style>{`
        @keyframes float-particle {
          0%, 100% { transform: translate(0, 0); opacity: 0.3; }
          25% { transform: translate(10px, -15px); opacity: 0.6; }
          50% { transform: translate(-5px, -25px); opacity: 0.4; }
          75% { transform: translate(15px, -10px); opacity: 0.5; }
        }
      `}</style>
    </section>
  );
}
