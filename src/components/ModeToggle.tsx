import { useModeStore } from "@/stores/modeStore";
import { cn } from "@/lib/utils";
import { FlaskConical, Sparkles } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ModeToggle = () => {
  const { mode, setMode } = useModeStore();

  const handleModeChange = (newMode: 'research' | 'explorer') => {
    setMode(newMode);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 p-1 rounded-full bg-secondary/50 border border-border/50">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleModeChange('research')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                mode === 'research'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Research mode"
              aria-pressed={mode === 'research'}
              title="Research mode"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Research</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Research mode</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => handleModeChange('explorer')}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                mode === 'explorer'
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              aria-label="Explorer mode"
              aria-pressed={mode === 'explorer'}
              title="Explorer mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Explorer</span>
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Explorer mode</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
};
