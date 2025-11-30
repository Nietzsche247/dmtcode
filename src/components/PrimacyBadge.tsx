import { Award } from 'lucide-react';

export const PrimacyBadge = () => {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold/20 text-gold rounded-full text-xs font-medium">
      <Award className="w-3 h-3" />
      Primacy Validated
    </span>
  );
};
