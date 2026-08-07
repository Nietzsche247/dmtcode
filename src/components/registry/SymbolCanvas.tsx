import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Path } from 'fabric';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Undo2, Redo2, Trash2, Pencil, Eraser, Grid3X3, Sparkles, RefreshCw } from 'lucide-react';
import { useCanvasTracking } from '@/hooks/useCanvasTracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SymbolCanvasProps {
  onImageChange: (imageData: string) => void;
  onSave?: () => void;
  disabled?: boolean;
  onCanvasReady?: (canvas: FabricCanvas) => void;
}

const EXPORT_SIZE = 512;

/**
 * Pick a drawing size once, at mount, from the real viewport width.
 *
 * The previous version derived the size from useIsMobile(), which reports
 * false on the first render and then flips to true on a phone. That flip
 * changed the canvas size, which re-ran the init effect, which called
 * fabric's dispose() (asynchronous in fabric v6) and immediately constructed
 * a second canvas on the same DOM element. On iOS Safari that race threw and
 * the error boundary showed the failure card. Sizing once removes the race.
 */
const pickCanvasSize = () => {
  if (typeof window === 'undefined') return 400;
  const available = window.innerWidth - 48;
  return Math.round(Math.max(240, Math.min(400, available)));
};

export const SymbolCanvas = ({ onImageChange, onSave, disabled, onCanvasReady }: SymbolCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [activeTool, setActiveTool] = useState<'pen' | 'eraser'>('pen');
  const [brushSize, setBrushSize] = useState(5);
  const [showGrid, setShowGrid] = useState(false);
  const [symmetryMode, setSymmetryMode] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [initAttempt, setInitAttempt] = useState(0);
  const [initError, setInitError] = useState<string | null>(null);

  const isMobile = useIsMobile();
  const { trackToolSelected, trackSymmetryToggled, trackGridToggled } = useCanvasTracking();

  const [canvasSize] = useState(pickCanvasSize);
  const gridSize = canvasSize / 8;
  const exportMultiplier = EXPORT_SIZE / canvasSize;

  // Live refs so the fabric event handlers, which are bound once, always read
  // the current values instead of the ones captured at mount.
  const symmetryRef = useRef(symmetryMode);
  const onImageChangeRef = useRef(onImageChange);
  useEffect(() => { symmetryRef.current = symmetryMode; }, [symmetryMode]);
  useEffect(() => { onImageChangeRef.current = onImageChange; }, [onImageChange]);

  // Prevent page scroll on touch devices while drawing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) e.preventDefault();
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [isDrawing]);

  const createSymmetricPaths = useCallback((canvas: FabricCanvas, originalPath: Path) => {
    const pathData = originalPath.path;
    const center = canvasSize / 2;

    for (let rotation = 1; rotation <= 3; rotation++) {
      const clonedPath = new Path(pathData, {
        stroke: originalPath.stroke,
        strokeWidth: originalPath.strokeWidth,
        fill: originalPath.fill,
        selectable: false,
        evented: false,
      });

      clonedPath.set({
        originX: 'center',
        originY: 'center',
        left: center,
        top: center,
        angle: rotation * 90,
      });

      canvas.add(clonedPath);
    }
    canvas.renderAll();
  }, [canvasSize]);

  const saveState = useCallback((canvas: FabricCanvas) => {
    // History snapshots stay at 1x. Storing 20 retina snapshots at 2x is what
    // exhausted canvas memory on iOS Safari.
    const newState = canvas.toDataURL({ format: 'png', multiplier: 1 });
    setHistory(prev => {
      const next = [...prev, newState];
      return next.length > 20 ? next.slice(next.length - 20) : next;
    });
    setHistoryStep(prev => Math.min(prev + 1, 19));
  }, []);

  // Initialize canvas. Depends only on the retry counter, so it never tears
  // down and rebuilds itself because of an unrelated state change.
  useEffect(() => {
    let cancelled = false;
    let canvas: FabricCanvas | null = null;
    let frame = 0;

    const start = () => {
      if (cancelled) return;
      const el = canvasRef.current;
      // getContext returns null while the element is detached or has no box,
      // so wait a frame for layout rather than failing the first attempt.
      if (!el || !el.isConnected || el.getBoundingClientRect().width === 0) {
        frame = requestAnimationFrame(start);
        return;
      }

      try {
        canvas = new FabricCanvas(el, {
          width: canvasSize,
          height: canvasSize,
          backgroundColor: '#FFFFFF',
          isDrawingMode: true,
          // Cap the backing store. iPhones report devicePixelRatio 3, which
          // would allocate a 3x buffer and can exceed the iOS canvas limit.
          enableRetinaScaling: (window.devicePixelRatio || 1) <= 2,
        });

        const brush = new PencilBrush(canvas);
        brush.color = '#000000';
        brush.width = brushSize;
        canvas.freeDrawingBrush = brush;

        canvas.on('mouse:down', () => setIsDrawing(true));
        canvas.on('mouse:up', () => setIsDrawing(false));

        canvas.on('path:created', (e: any) => {
          if (!canvas) return;
          if (symmetryRef.current && e?.path) {
            createSymmetricPaths(canvas, e.path as Path);
          }
          saveState(canvas);
          onImageChangeRef.current(canvas.toDataURL({ format: 'png', multiplier: exportMultiplier }));
        });

        const initialState = canvas.toDataURL({ format: 'png', multiplier: 1 });
        setHistory([initialState]);
        setHistoryStep(0);
        setInitError(null);
        setFabricCanvas(canvas);
        onCanvasReady?.(canvas);
      } catch (err) {
        console.error('Canvas init failed:', err);
        setInitError(err instanceof Error ? err.message : 'Unknown canvas error');
      }
    };

    frame = requestAnimationFrame(start);

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      if (canvas) {
        // dispose() is asynchronous in fabric v6. Swallow its rejection so a
        // teardown never surfaces as a render error.
        Promise.resolve(canvas.dispose()).catch(() => {});
        canvas = null;
      }
      setFabricCanvas(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initAttempt]);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvas?.freeDrawingBrush) return;
    fabricCanvas.freeDrawingBrush.color = activeTool === 'eraser' ? '#FFFFFF' : '#000000';
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }, [activeTool, brushSize, fabricCanvas]);

  const loadFromHistory = useCallback((dataUrl: string) => {
    if (!fabricCanvas) return;
    const img = new Image();
    img.onload = () => {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#FFFFFF';
      const ctx = fabricCanvas.getContext();
      ctx.drawImage(img, 0, 0, canvasSize, canvasSize);
      fabricCanvas.renderAll();
      onImageChangeRef.current(fabricCanvas.toDataURL({ format: 'png', multiplier: exportMultiplier }));
    };
    img.src = dataUrl;
  }, [fabricCanvas, canvasSize, exportMultiplier]);

  const undo = () => {
    if (historyStep > 0) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      loadFromHistory(history[newStep]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      loadFromHistory(history[newStep]);
    }
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#FFFFFF';
    fabricCanvas.renderAll();
    saveState(fabricCanvas);
    onImageChange('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyStep, history]);

  const handleToolChange = (tool: 'pen' | 'eraser') => {
    setActiveTool(tool);
    trackToolSelected(tool, brushSize);
  };

  const handleBrushSizeChange = (size: number) => {
    setBrushSize(size);
    trackToolSelected(activeTool, size);
  };

  const handleGridToggle = () => {
    setShowGrid(prev => {
      trackGridToggled(!prev);
      return !prev;
    });
  };

  const handleSymmetryToggle = () => {
    setSymmetryMode(prev => {
      trackSymmetryToggled(!prev);
      return !prev;
    });
  };

  const penSizes = [
    { size: 2, label: 'Fine' },
    { size: 5, label: 'Medium' },
    { size: 10, label: 'Bold' },
  ];

  // Plain buttons rather than Radix Toggle wrapped in a tooltip trigger. On
  // touch devices the tooltip trigger swallowed the first tap, so the grid and
  // symmetry buttons appeared dead. Tooltips are kept for pointer devices only.
  const ToolButton = ({
    pressed,
    onPress,
    label,
    hint,
    children,
  }: {
    pressed: boolean;
    onPress: () => void;
    label: string;
    hint: string;
    children: React.ReactNode;
  }) => {
    const button = (
      <button
        type="button"
        onClick={onPress}
        aria-label={label}
        aria-pressed={pressed}
        title={hint}
        className={cn(
          'min-w-[44px] min-h-[44px] rounded-md border-2 flex items-center justify-center transition-colors touch-manipulation',
          pressed
            ? 'border-primary bg-primary text-primary-foreground'
            : 'border-border bg-background text-foreground hover:border-primary/50'
        )}
      >
        {children}
      </button>
    );

    if (isMobile) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">
          <p>{hint}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  if (initError) {
    return (
      <div className="p-6 rounded-lg border border-destructive/50 bg-destructive/5 text-center space-y-3">
        <h3 className="text-lg font-semibold">Canvas could not start</h3>
        <p className="text-sm text-muted-foreground">
          The drawing surface failed to initialize on this browser. You can try again.
        </p>
        <Button
          variant="outline"
          className="gap-2 min-h-[44px]"
          onClick={() => {
            setInitError(null);
            setHistory([]);
            setHistoryStep(-1);
            setInitAttempt(n => n + 1);
          }}
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <div className={cn('flex gap-4', isMobile ? 'flex-col' : 'flex-row')}>
          {/* Tool Palette */}
          <div className={cn(
            'flex gap-2 p-3 bg-secondary/30 rounded-lg border border-border',
            isMobile ? 'flex-row justify-center flex-wrap order-2' : 'flex-col items-center'
          )}>
            <div className="flex gap-1" role="group" aria-label="Drawing tools">
              <ToolButton
                pressed={activeTool === 'pen'}
                onPress={() => handleToolChange('pen')}
                label="Pen tool"
                hint="Draw freehand"
              >
                <Pencil className="w-4 h-4" />
              </ToolButton>
              <ToolButton
                pressed={activeTool === 'eraser'}
                onPress={() => handleToolChange('eraser')}
                label="Eraser tool"
                hint="Erase strokes"
              >
                <Eraser className="w-4 h-4" />
              </ToolButton>
            </div>

            <div className={cn('bg-border', isMobile ? 'w-px h-8' : 'h-px w-full')} />

            <div className="flex gap-1" role="group" aria-label="Pen sizes">
              {penSizes.map(({ size, label }) => (
                <ToolButton
                  key={size}
                  pressed={brushSize === size}
                  onPress={() => handleBrushSizeChange(size)}
                  label={`${label} brush (${size}px)`}
                  hint={`${label} brush (${size}px)`}
                >
                  <span
                    className="rounded-full bg-current block"
                    style={{ width: size + 4, height: size + 4 }}
                  />
                </ToolButton>
              ))}
            </div>

            <div className={cn('bg-border', isMobile ? 'w-px h-8' : 'h-px w-full')} />

            <div className="flex gap-1" role="group" aria-label="Canvas options">
              <ToolButton
                pressed={showGrid}
                onPress={handleGridToggle}
                label="Toggle grid overlay"
                hint="Toggle 8 by 8 alignment grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </ToolButton>
              <ToolButton
                pressed={symmetryMode}
                onPress={handleSymmetryToggle}
                label="Toggle 4 way symmetry mode"
                hint="Toggle 4 way radial symmetry for mandala patterns"
              >
                <Sparkles className="w-4 h-4" />
              </ToolButton>
            </div>

            <div className={cn('bg-border', isMobile ? 'w-px h-8' : 'h-px w-full')} />

            <div className="flex gap-1" role="group" aria-label="Canvas actions">
              <Button
                variant="ghost"
                size="icon"
                onClick={undo}
                disabled={historyStep <= 0}
                aria-label="Undo"
                className="min-w-[44px] min-h-[44px]"
              >
                <Undo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={redo}
                disabled={historyStep >= history.length - 1}
                aria-label="Redo"
                className="min-w-[44px] min-h-[44px]"
              >
                <Redo2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={clearCanvas}
                aria-label="Clear canvas"
                className="min-w-[44px] min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div ref={containerRef} className="flex-1 flex flex-col items-center gap-4">
            <div
              className="relative bg-card rounded-lg p-4 border border-border shadow-lg"
              style={{ touchAction: 'none' }}
            >
              {symmetryMode && (
                <div className="absolute top-2 left-2 z-10 text-xs text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  4 way symmetry
                </div>
              )}
              {showGrid && (
                <div className="absolute top-2 right-2 z-10 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  8 by 8 grid
                </div>
              )}

              <div className="relative" style={{ width: canvasSize, height: canvasSize }}>
                <canvas
                  ref={canvasRef}
                  className="border border-border cursor-crosshair focus:outline-none focus:ring-2 focus:ring-primary rounded"
                  style={{
                    width: canvasSize,
                    height: canvasSize,
                    touchAction: 'none',
                  }}
                  role="application"
                  tabIndex={0}
                  aria-label={`Draw visual symbol on ${canvasSize} by ${canvasSize} pixel canvas`}
                />
                {/* Grid drawn as a CSS overlay so it never enters the exported
                    image, the undo history, or the fabric object list. */}
                {showGrid && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none rounded"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(0,0,0,0.14) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.14) 1px, transparent 1px)',
                      backgroundSize: `${gridSize}px ${gridSize}px`,
                    }}
                  />
                )}
              </div>
            </div>

            {onSave && (
              <Button
                onClick={onSave}
                disabled={disabled || historyStep <= 0}
                className="w-full max-w-[300px] h-12 rounded-full font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all min-h-[44px]"
              >
                Save and continue
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Draw your symbol using the pen tool. Use symmetry mode for mandala patterns.
          {isMobile ? ' Touch and drag to draw.' : ' Keyboard: Ctrl+Z to undo, Ctrl+Shift+Z to redo.'}
        </p>
      </div>
    </TooltipProvider>
  );
};
