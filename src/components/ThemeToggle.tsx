import { useThemeStore } from "@/stores/themeStore";
import { useModeStore } from "@/stores/modeStore";
import { cn } from "@/lib/utils";
import { Sun, Moon } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useThemeStore();
  const { mode } = useModeStore();
  
  // Research Mode forces light theme
  const isLocked = mode === 'research';
  const effectiveTheme = isLocked ? 'light' : resolvedTheme;

  const toggleTheme = () => {
    if (isLocked) return;
    setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
  };

  const button = (
    <button
      onClick={toggleTheme}
      disabled={isLocked}
      className={cn(
        "flex items-center justify-center w-9 h-9 rounded-full transition-all",
        "bg-secondary/50 border border-border/50",
        isLocked 
          ? "opacity-50 cursor-not-allowed" 
          : "hover:bg-secondary hover:border-border"
      )}
      aria-label={`Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {effectiveTheme === 'dark' ? (
        <Moon className="w-4 h-4 text-muted-foreground" />
      ) : (
        <Sun className="w-4 h-4 text-muted-foreground" />
      )}
    </button>
  );

  if (isLocked) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {button}
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">Light mode locked in Research Mode</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return button;
};
