import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Methodology } from "@/lib/forecasts-api";

interface MethodologyAccordionProps {
  methodology: Methodology[];
}

// Map section names to readable titles
const sectionTitles: Record<string, string> = {
  'confidence_tiers': 'Confidence Tiers',
  'mechanism_codes': 'Mechanism Codes',
  'conditional_probability_rules': 'Conditional Rules',
  'update_protocol': 'Update Protocol',
  'data_sources': 'Data Sources',
  'cascade_effects_full_document': 'Cascade Effects'
};

export function MethodologyAccordion({ methodology }: MethodologyAccordionProps) {
  if (methodology.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Methodology documentation loading...</p>
      </div>
    );
  }

  return (
    <Accordion type="single" collapsible className="space-y-2">
      {methodology.map((section) => (
        <AccordionItem 
          key={section.id} 
          value={section.section_name}
          className="border border-border/50 rounded-lg bg-card/30 backdrop-blur-sm px-4"
        >
          <AccordionTrigger className="text-left hover:no-underline py-4">
            <div className="flex items-center gap-3">
              <span className="font-bold text-foreground">
                {sectionTitles[section.section_name] || section.section_name}
              </span>
              <span className="text-xs text-muted-foreground">
                v{section.version}
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="pb-4">
            <div className="prose prose-invert prose-sm max-w-none">
              <div 
                className="text-foreground/80 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

// Simple markdown-like formatting
function formatContent(content: string): string {
  return content
    // Headers
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-foreground mt-4 mb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-foreground text-lg mt-4 mb-2">$1</h3>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground">$1</strong>')
    // Lists
    .replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>')
    // Line breaks
    .replace(/\n\n/g, '</p><p class="mt-2">')
    .replace(/\n/g, '<br />');
}
