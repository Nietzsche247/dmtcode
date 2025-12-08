import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RotateCcw, Info, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type AlignmentBranch = 'cooperative' | 'paternalistic' | 'indifferent' | 'adversarial';

interface ScenarioTogglesProps {
  taiwanConflict: boolean;
  onTaiwanConflictChange: (value: boolean) => void;
  alignment: AlignmentBranch;
  onAlignmentChange: (value: AlignmentBranch) => void;
  showSecondaryEvents: boolean;
  onShowSecondaryEventsChange: (value: boolean) => void;
  onReset: () => void;
  affectedCount: number;
}

const ALIGNMENT_OPTIONS: { value: AlignmentBranch; label: string; probability: number; disabled?: boolean }[] = [
  { value: 'cooperative', label: 'Cooperative', probability: 40 },
  { value: 'paternalistic', label: 'Paternalistic', probability: 25 },
  { value: 'indifferent', label: 'Indifferent', probability: 20 },
  { value: 'adversarial', label: 'Adversarial', probability: 15, disabled: true },
];

export function ScenarioToggles({
  taiwanConflict,
  onTaiwanConflictChange,
  alignment,
  onAlignmentChange,
  showSecondaryEvents,
  onShowSecondaryEventsChange,
  onReset,
  affectedCount
}: ScenarioTogglesProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-card/50 border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        className="w-full flex items-center justify-between p-4 hover:bg-secondary/20 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-bold text-foreground">Scenario Controls</h3>
          {affectedCount > 0 && (
            <Badge variant="secondary" className="bg-primary/20 text-primary">
              {affectedCount} events affected
            </Badge>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-6">
          {/* Taiwan Conflict Toggle */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="taiwan-toggle" className="text-sm font-medium text-foreground">
                  Taiwan Conflict Scenario
                </Label>
                <Badge variant="outline" className="text-xs">73% base probability</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {taiwanConflict 
                  ? "Taiwan Conflict active. AI timeline accelerated due to geopolitical pressure."
                  : "Taiwan Conflict removed. Baseline AI development timeline restored."}
              </p>
            </div>
            <Switch
              id="taiwan-toggle"
              checked={taiwanConflict}
              onCheckedChange={onTaiwanConflictChange}
            />
          </div>

          {/* Alignment Branch Selector */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium text-foreground">
                AI Alignment Outcome
              </Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-xs text-muted-foreground">
                  Select which alignment branch to highlight. Adversarial outcomes are excluded from planning scenarios.
                </div>
              </div>
            </div>
            <RadioGroup
              value={alignment}
              onValueChange={(v) => onAlignmentChange(v as AlignmentBranch)}
              className="flex flex-wrap gap-2"
            >
              {ALIGNMENT_OPTIONS.map((option) => (
                <div key={option.value} className="relative">
                  <RadioGroupItem
                    value={option.value}
                    id={`alignment-${option.value}`}
                    disabled={option.disabled}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`alignment-${option.value}`}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all",
                      "peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10",
                      option.disabled 
                        ? "opacity-50 cursor-not-allowed border-border" 
                        : "border-border hover:border-primary/50"
                    )}
                    title={option.disabled ? "Excluded from planning" : undefined}
                  >
                    <span className="text-sm font-medium">{option.label}</span>
                    <span className="text-xs text-muted-foreground">({option.probability}%)</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          {/* Show/Hide Secondary Events */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              {showSecondaryEvents ? (
                <Eye className="h-4 w-4 text-muted-foreground" />
              ) : (
                <EyeOff className="h-4 w-4 text-muted-foreground" />
              )}
              <Label htmlFor="secondary-toggle" className="text-sm font-medium text-foreground">
                Show Conditional Events
              </Label>
              <Badge variant="outline" className="text-xs">44 events</Badge>
            </div>
            <Switch
              id="secondary-toggle"
              checked={showSecondaryEvents}
              onCheckedChange={onShowSecondaryEventsChange}
            />
          </div>

          {/* Reset Button */}
          <div className="pt-2 border-t border-border/30">
            <Button
              variant="outline"
              size="sm"
              onClick={onReset}
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Database Baseline
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}