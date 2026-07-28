import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

export interface FieldPin {
  x: number;
  y: number;
}

interface VisualFieldMapProps {
  value?: FieldPin | null;
  onChange?: (pin: FieldPin | null) => void;
  readOnly?: boolean;
  otherPins?: FieldPin[];
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
const round4 = (n: number) => Math.round(n * 10000) / 10000;

export const VisualFieldMap = ({ value, onChange, readOnly = false, otherPins = [] }: VisualFieldMapProps) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [keyboardPin, setKeyboardPin] = useState<FieldPin>({ x: 0.5, y: 0.5 });

  const editable = !readOnly;
  const pins = editable ? [] : otherPins;

  const place = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg || !onChange) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const x = round4(clamp01((clientX - rect.left) / rect.width));
    const y = round4(clamp01((clientY - rect.top) / rect.height));
    onChange({ x, y });
  };

  const handleKeyDown = (e: React.KeyboardEvent<SVGSVGElement>) => {
    if (!editable || !onChange) return;
    const step = 0.02;
    const base = value ?? keyboardPin;
    let next: FieldPin | null = null;
    if (e.key === 'ArrowUp') next = { x: base.x, y: clamp01(base.y - step) };
    if (e.key === 'ArrowDown') next = { x: base.x, y: clamp01(base.y + step) };
    if (e.key === 'ArrowLeft') next = { x: clamp01(base.x - step), y: base.y };
    if (e.key === 'ArrowRight') next = { x: clamp01(base.x + step), y: base.y };
    if (next) {
      e.preventDefault();
      setKeyboardPin({ x: round4(next.x), y: round4(next.y) });
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      onChange({ x: round4(base.x), y: round4(base.y) });
    }
  };

  const marker = value ?? null;
  const ghost = editable && !value ? keyboardPin : null;

  return (
    <div className="space-y-3">
      <svg
        ref={svgRef}
        viewBox="0 0 100 100"
        className="w-full max-w-[420px] mx-auto aspect-square rounded-lg"
        role={editable ? 'application' : 'img'}
        tabIndex={editable ? 0 : undefined}
        aria-label={
          editable
            ? 'Visual field map. Use arrow keys to move the marker, then press Enter to place it.'
            : 'Visual field map showing placed markers.'
        }
        onKeyDown={handleKeyDown}
        onClick={editable ? (e) => place(e.clientX, e.clientY) : undefined}
        style={{ cursor: editable ? 'crosshair' : 'default' }}
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="100"
          fill="hsl(var(--muted))"
          fillOpacity="0.35"
          stroke="hsl(var(--border))"
          strokeWidth="0.6"
        />

        <circle
          cx="50"
          cy="50"
          r="30"
          fill="none"
          stroke="hsl(var(--primary))"
          strokeOpacity="0.5"
          strokeWidth="0.5"
          strokeDasharray="2 2"
        />
        <text x="50" y="17" textAnchor="middle" fontSize="3.5" fill="hsl(var(--muted-foreground))">
          diffraction band
        </text>

        <line x1="47" y1="50" x2="53" y2="50" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" />
        <line x1="50" y1="47" x2="50" y2="53" stroke="hsl(var(--muted-foreground))" strokeWidth="0.4" />
        <text x="50" y="57" textAnchor="middle" fontSize="3.5" fill="hsl(var(--muted-foreground))">
          centre
        </text>

        {pins.map((p, i) => (
          <circle
            key={`${p.x}-${p.y}-${i}`}
            cx={p.x * 100}
            cy={p.y * 100}
            r="1.8"
            fill="none"
            stroke="hsl(var(--muted-foreground))"
            strokeWidth="0.4"
            opacity="0.55"
          />
        ))}

        {ghost && (
          <circle
            cx={ghost.x * 100}
            cy={ghost.y * 100}
            r="2.5"
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="0.5"
            strokeDasharray="1 1"
          />
        )}

        {marker && (
          <g>
            <circle cx={marker.x * 100} cy={marker.y * 100} r="2.5" fill="hsl(var(--primary))" />
            <circle
              cx={marker.x * 100}
              cy={marker.y * 100}
              r="3.4"
              fill="none"
              stroke="hsl(var(--background))"
              strokeWidth="0.5"
            />
          </g>
        )}
      </svg>

      {editable && value && (
        <div className="flex justify-center">
          <Button type="button" variant="ghost" size="sm" onClick={() => onChange?.(null)}>
            Clear marker
          </Button>
        </div>
      )}
    </div>
  );
};
