import { useEffect, useState } from "react";
import { getMethodology, type Methodology } from "@/lib/forecasts-api";
import { ShieldAlert } from "lucide-react";

interface ParadigmDefensePanelProps {
  methodology?: Methodology[];
}

export function ParadigmDefensePanel({ methodology: propMethodology }: ParadigmDefensePanelProps) {
  const [paradigmDefense, setParadigmDefense] = useState<Methodology | null>(null);
  const [loading, setLoading] = useState(!propMethodology);

  useEffect(() => {
    // If methodology is passed as prop, find paradigm_defense section
    if (propMethodology && propMethodology.length > 0) {
      const defense = propMethodology.find(m => m.section_name === 'paradigm_defense');
      if (defense) {
        setParadigmDefense(defense);
        setLoading(false);
        return;
      }
    }

    // Otherwise fetch it
    async function fetchParadigmDefense() {
      try {
        const data = await getMethodology('paradigm_defense');
        if (data.length > 0) {
          setParadigmDefense(data[0]);
        }
      } catch (error) {
        console.error('Error fetching paradigm defense:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchParadigmDefense();
  }, [propMethodology]);

  if (loading) {
    return null;
  }

  if (!paradigmDefense) {
    return null;
  }

  return (
    <div className="bg-[#0f172a] border border-border/50 rounded-xl p-6 md:p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
          <ShieldAlert className="h-5 w-5" />
        </div>
        <h3 className="text-lg md:text-xl font-bold text-foreground">
          What This Model Does Not Do
        </h3>
      </div>
      
      <div className="prose prose-invert prose-sm max-w-none">
        <div 
          className="text-foreground/90 leading-relaxed space-y-4"
          dangerouslySetInnerHTML={{ __html: formatParadigmContent(paradigmDefense.content) }}
        />
      </div>
    </div>
  );
}

// Format paradigm defense content with scholarly paragraph styling
function formatParadigmContent(content: string): string {
  return content
    // Headers - styled as scholarly section headers
    .replace(/^### (.+)$/gm, '<h4 class="font-bold text-foreground mt-8 mb-4 text-base border-b border-border/30 pb-2">$1</h4>')
    .replace(/^## (.+)$/gm, '<h3 class="font-bold text-foreground text-lg mt-8 mb-4 border-b border-border/30 pb-2">$1</h3>')
    .replace(/^# (.+)$/gm, '<h2 class="font-bold text-foreground text-xl mt-8 mb-4 border-b border-border/30 pb-2">$1</h2>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-foreground font-semibold">$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    // Blockquotes
    .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-primary/50 pl-4 py-2 my-4 italic text-foreground/80 bg-primary/5 rounded-r">$1</blockquote>')
    // Numbered lists (scholarly style)
    .replace(/^(\d+)\. (.+)$/gm, '<p class="ml-4 my-2 text-foreground/85"><span class="font-mono text-primary mr-2">$1.</span>$2</p>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>')
    // Paragraphs - double newline creates new paragraph
    .replace(/\n\n/g, '</p><p class="mt-4 text-foreground/85 leading-relaxed">')
    // Single newlines become line breaks
    .replace(/\n/g, '<br />')
    // Wrap in paragraph if not already
    .replace(/^(?!<)/, '<p class="text-foreground/85 leading-relaxed">')
    .replace(/(?!>)$/, '</p>');
}
