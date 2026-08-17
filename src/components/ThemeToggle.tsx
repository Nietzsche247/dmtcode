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

  const label = isLocked
    ? 'Light and dark theme, locked to light in Research mode'
    : `Switch to ${effectiveTheme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
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
            aria-label={label}
            title={label}
          >
            {effectiveTheme === 'dark' ? (
              <Moon className="w-4 h-4 text-muted-foreground" />
            ) : (
              <Sun className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
