import { cn } from "@/lib/utils";

export type ConfidenceTier = 'high' | 'medium' | 'speculative' | 'all';

interface ConfidenceTierFiltersProps {
  activeTier: ConfidenceTier;
  onTierChange: (tier: ConfidenceTier) => void;
}

const tiers: { id: ConfidenceTier; label: string; description: string }[] = [
  { id: 'high', label: 'High Confidence 80%+', description: 'Core causal chain events' },
  { id: 'medium', label: 'Medium 60-80%', description: 'Likely secondary effects' },
  { id: 'speculative', label: 'Speculative <60%', description: 'Conditional outcomes' },
  { id: 'all', label: 'Show All', description: 'Complete model' },
];

export function ConfidenceTierFilters({ activeTier, onTierChange }: ConfidenceTierFiltersProps) {
  return (
    <div className="flex flex-wrap justify-center gap-2 md:gap-3">
      {tiers.map((tier) => (
        <button
          key={tier.id}
          onClick={() => onTierChange(tier.id)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all duration-300",
            "border focus:outline-none focus:ring-2 focus:ring-primary/50",
            activeTier === tier.id
              ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20"
              : "bg-transparent text-muted-foreground border-border/50 hover:border-primary/50 hover:text-foreground"
          )}
          aria-pressed={activeTier === tier.id}
          title={tier.description}
        >
          {tier.label}
        </button>
      ))}
    </div>
  );
}
