import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { BookOpen, FlaskConical, AlertTriangle, ListChecks, BookMarked } from "lucide-react";
import type { Methodology } from "@/lib/forecasts-api";

interface MethodologyAccordionProps {
  methodology: Methodology[];
}

// Section configuration with icons and display order
const sectionConfig: Record<string, { title: string; icon: React.ReactNode; order: number; alwaysOpen?: boolean }> = {
  'methodology_abstract_v3': { 
    title: 'Abstract: The Fundamental Problem', 
    icon: <BookOpen className="h-4 w-4" />, 
    order: 0,
    alwaysOpen: true 
  },
  'problem_part_i': { 
    title: 'Part I: Reference Class Breakdown', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    order: 1 
  },
  'existing_approaches': { 
    title: 'Part II: Existing Approaches & Limits', 
    icon: <FlaskConical className="h-4 w-4" />, 
    order: 2 
  },
  'our_synthesis': { 
    title: 'Part III: Dependency-Propagating Model', 
    icon: <ListChecks className="h-4 w-4" />, 
    order: 3 
  },
  'limitations': { 
    title: 'Part IV: What This Model Is & Is Not', 
    icon: <AlertTriangle className="h-4 w-4" />, 
    order: 4 
  },
  'references': { 
    title: 'References', 
    icon: <BookMarked className="h-4 w-4" />, 
    order: 5 
  },
  'confidence_tiers': { 
    title: 'Confidence Tiers', 
    icon: <ListChecks className="h-4 w-4" />, 
    order: 6 
  },
  'mechanism_codes': { 
    title: 'Mechanism Codes', 
    icon: <FlaskConical className="h-4 w-4" />, 
    order: 7 
  },
  'conditional_probability_rules': { 
    title: 'Conditional Rules', 
    icon: <ListChecks className="h-4 w-4" />, 
    order: 8 
  },
  'update_protocol': { 
    title: 'Update Protocol', 
    icon: <BookOpen className="h-4 w-4" />, 
    order: 9 
  },
  'data_sources': { 
    title: 'Data Sources', 
    icon: <BookMarked className="h-4 w-4" />, 
    order: 10 
  },
  'cascade_effects_full_document': { 
    title: 'Cascade Effects Documentation', 
    icon: <FlaskConical className="h-4 w-4" />, 
    order: 11 
  }
};

export function MethodologyAccordion({ methodology }: MethodologyAccordionProps) {
  if (methodology.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Methodology documentation loading...</p>
      </div>
    );
  }

  // Sort methodology by order
  const sortedMethodology = [...methodology].sort((a, b) => {
    const orderA = sectionConfig[a.section_name]?.order ?? 99;
    const orderB = sectionConfig[b.section_name]?.order ?? 99;
    return orderA - orderB;
  });

  // Find the abstract section for special rendering
  const abstractSection = sortedMethodology.find(s => s.section_name === 'methodology_abstract_v3');
  const otherSections = sortedMethodology.filter(s => s.section_name !== 'methodology_abstract_v3');

  return (
    <div className="space-y-6">
      {/* Abstract - Always visible with special styling */}
      {abstractSection && (
        <div className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <BookOpen className="h-5 w-5" />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              The Fundamental Problem with Forecasting Technological Singularity
            </h3>
          </div>
          <div className="prose prose-invert prose-sm max-w-none">
            <div 
              className="text-foreground/90 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: formatContent(abstractSection.content) }}
            />
          </div>
        </div>
      )}

      {/* Other sections as accordion */}
      <Accordion type="multiple" className="space-y-2">
        {otherSections.map((section) => {
          const config = sectionConfig[section.section_name] || { 
            title: section.section_name.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 
            icon: <BookOpen className="h-4 w-4" />,
            order: 99 
          };

          return (
            <AccordionItem 
              key={section.id} 
              value={section.section_name}
              className="border border-border/50 rounded-lg bg-card/30 backdrop-blur-sm px-4 overflow-hidden"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4">
                <div className="flex items-center gap-3">
                  <div className="p-1.5 rounded bg-muted/50 text-muted-foreground">
                    {config.icon}
                  </div>
                  <span className="font-semibold text-foreground">
                    {config.title}
                  </span>
                  <span className="text-xs text-muted-foreground ml-auto mr-4">
                    v{section.version}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pb-6">
                <div className="prose prose-invert prose-sm max-w-none border-t border-border/30 pt-4">
                  <div 
                    className="text-foreground/80 leading-relaxed methodology-content"
                    dangerouslySetInnerHTML={{ __html: formatContent(section.content) }}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      {/* Footer note */}
      <div className="text-center pt-4 border-t border-border/30">
        <p className="text-xs text-muted-foreground">
          Model by Aaron Baker · Last validated December 8, 2025 · 
          <span className="italic ml-1">
            This model represents probabilistic estimates under radical uncertainty. All events subject to revision.
          </span>
        </p>
      </div>
    </div>
  );
}

// Enhanced markdown-like formatting with academic styling
function formatContent(content: string): string {
  return content
    // Code blocks (triple backtick)
    .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted/30 p-4 rounded-lg overflow-x-auto font-mono text-xs my-4"><code>$1</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-muted/30 px-1.5 py-0.5 rounded font-mono text-xs">$1</code>')
    // Headers
    .replace(/^#### (.+)$/gm, '<h5 class="font-semibold text-foreground mt-4 mb-2 text-sm">$1</h5>')
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-foreground mt-6 mb-3">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-foreground text-lg mt-6 mb-3">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-foreground text-xl mt-8 mb-4">$1</h2>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-foreground/80 bg-primary/5 rounded-r">$1</blockquote>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Horizontal rules
    .replace(/^---$/gm, '<hr class="border-border/50 my-6" />')
    // Tables (simplified)
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split('|').filter(c => c.trim());
      const isHeader = match.includes('---');
      if (isHeader) return '';
      return `<div class="grid grid-cols-${cells.length} gap-2 py-1 text-sm border-b border-border/20">${cells.map(c => `<span>${c.trim()}</span>`).join('')}</div>`;
    })
    // Numbered lists
    .replace(/^(\d+)\. (.+)$/gm, '<div class="flex gap-3 ml-2 my-1"><span class="text-primary font-mono">$1.</span><span>$2</span></div>')
    // Bullet lists
    .replace(/^- (.+)$/gm, '<div class="flex gap-3 ml-2 my-1"><span class="text-primary">•</span><span>$1</span></div>')
    // Sub-bullets
    .replace(/^  - (.+)$/gm, '<div class="flex gap-3 ml-6 my-1"><span class="text-muted-foreground">◦</span><span class="text-foreground/70">$1</span></div>')
    // Links (DOI format)
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // DOI references
    .replace(/(doi:\s*)(10\.\d+\/[^\s]+)/gi, '$1<a href="https://doi.org/$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline font-mono text-xs">$2</a>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="mt-3">')
    // Single line breaks
    .replace(/\n/g, '<br />');
}
