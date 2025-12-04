import { useModeStore } from "@/stores/modeStore";
import { cn } from "@/lib/utils";
import { FlaskConical, Sparkles } from "lucide-react";

export const ModeToggle = () => {
  const { mode, setMode } = useModeStore();

  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
      <button
        onClick={() => setMode('research')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          mode === 'research'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to Research Mode"
      >
        <FlaskConical className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Research</span>
      </button>
      <button
        onClick={() => setMode('explorer')}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
          mode === 'explorer'
            ? "bg-primary text-primary-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground"
        )}
        aria-label="Switch to Explorer Mode"
      >
        <Sparkles className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Explorer</span>
      </button>
    </div>
  );
};
