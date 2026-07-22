import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, PencilBrush, Path, Line } from 'fabric';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Undo2, Redo2, Trash2, Pencil, Eraser, Grid3X3, Sparkles } from 'lucide-react';
import { useCanvasTracking } from '@/hooks/useCanvasTracking';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

interface SymbolCanvasProps {
  onImageChange: (imageData: string) => void;
  onSave?: () => void;
  disabled?: boolean;
}

export const SymbolCanvas = ({ onImageChange, onSave, disabled }: SymbolCanvasProps) => {
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
  
  const isMobile = useIsMobile();
  const { trackToolSelected, trackSymmetryToggled, trackGridToggled } = useCanvasTracking();
  
  const canvasSize = isMobile ? 300 : 400;
  const gridSize = canvasSize / 8;
  // Standardize every exported PNG to 512x512 regardless of device size,
  // so the same symbol yields a comparable asset for downstream analysis.
  const EXPORT_SIZE = 512;
  const exportMultiplier = EXPORT_SIZE / canvasSize;

  // Prevent page scroll on touch devices while drawing
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const preventScroll = (e: TouchEvent) => {
      if (isDrawing) {
        e.preventDefault();
      }
    };

    container.addEventListener('touchmove', preventScroll, { passive: false });
    return () => container.removeEventListener('touchmove', preventScroll);
  }, [isDrawing]);

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: canvasSize,
      height: canvasSize,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true,
    });

    const brush = new PencilBrush(canvas);
    brush.color = '#000000';
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    // Save initial state
    const initialState = canvas.toDataURL({ format: 'png', multiplier: 2 });
    setHistory([initialState]);
    setHistoryStep(0);

    // Track drawing events
    canvas.on('mouse:down', () => setIsDrawing(true));
    canvas.on('mouse:up', () => setIsDrawing(false));

    canvas.on('path:created', (e) => {
      if (symmetryMode && e.path) {
        createSymmetricPaths(canvas, e.path as Path);
      }
      saveState(canvas);
      onImageChange(canvas.toDataURL({ format: 'png', multiplier: 2 }));
    });

    return () => {
      canvas.dispose();
    };
  }, [canvasSize]);

  // Update brush settings
  useEffect(() => {
    if (!fabricCanvas?.freeDrawingBrush) return;
    
    if (activeTool === 'eraser') {
      fabricCanvas.freeDrawingBrush.color = '#FFFFFF';
    } else {
      fabricCanvas.freeDrawingBrush.color = '#000000';
    }
    fabricCanvas.freeDrawingBrush.width = brushSize;
  }, [activeTool, brushSize, fabricCanvas]);

  // Draw grid overlay
  useEffect(() => {
    if (!fabricCanvas) return;
    
    // Remove existing grid lines
    const objects = fabricCanvas.getObjects();
    const gridLines = objects.filter(obj => (obj as any).isGridLine);
    gridLines.forEach(line => fabricCanvas.remove(line));

    if (showGrid) {
      // Draw grid lines
      for (let i = 1; i < 8; i++) {
        const pos = i * gridSize;
        
        // Vertical line
        const vLine = new Line([pos, 0, pos, canvasSize], {
          stroke: 'rgba(0, 0, 0, 0.1)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (vLine as any).isGridLine = true;
        fabricCanvas.add(vLine);
        
        // Horizontal line
        const hLine = new Line([0, pos, canvasSize, pos], {
          stroke: 'rgba(0, 0, 0, 0.1)',
          strokeWidth: 1,
          selectable: false,
          evented: false,
        });
        (hLine as any).isGridLine = true;
        fabricCanvas.add(hLine);
      }
      fabricCanvas.renderAll();
    }
  }, [showGrid, fabricCanvas, canvasSize, gridSize]);

  const createSymmetricPaths = (canvas: FabricCanvas, originalPath: Path) => {
    const pathData = originalPath.path;
    const center = canvasSize / 2;

    // Create 3 mirrored paths for 4-way radial symmetry
    for (let rotation = 1; rotation <= 3; rotation++) {
      const angle = (rotation * 90 * Math.PI) / 180;
      
      const clonedPath = new Path(pathData, {
        stroke: originalPath.stroke,
        strokeWidth: originalPath.strokeWidth,
        fill: originalPath.fill,
        selectable: false,
      });
      
      // Rotate around center
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
  };

  const saveState = useCallback((canvas: FabricCanvas) => {
    const newState = canvas.toDataURL({ format: 'png', multiplier: 2 });
    setHistory(prev => {
      const newHistory = prev.slice(0, historyStep + 1);
      // Limit history to 20 states
      if (newHistory.length >= 20) {
        newHistory.shift();
      }
      return [...newHistory, newState];
    });
    setHistoryStep(prev => Math.min(prev + 1, 19));
  }, [historyStep]);

  const loadFromHistory = useCallback((dataUrl: string) => {
    if (!fabricCanvas) return;
    const img = new Image();
    img.onload = () => {
      fabricCanvas.clear();
      fabricCanvas.backgroundColor = '#FFFFFF';
      const ctx = fabricCanvas.getContext();
      ctx.drawImage(img, 0, 0);
      fabricCanvas.renderAll();
      onImageChange(fabricCanvas.toDataURL({ format: 'png', multiplier: 2 }));
    };
    img.src = dataUrl;
  }, [fabricCanvas, onImageChange]);

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
        if (e.shiftKey) {
          e.preventDefault();
          redo();
        } else {
          e.preventDefault();
          undo();
        }
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
    const newState = !showGrid;
    setShowGrid(newState);
    trackGridToggled(newState);
  };

  const handleSymmetryToggle = () => {
    const newState = !symmetryMode;
    setSymmetryMode(newState);
    trackSymmetryToggled(newState);
  };

  const penSizes = [
    { size: 2, label: 'Fine' },
    { size: 5, label: 'Medium' },
    { size: 10, label: 'Bold' },
  ];

  return (
    <TooltipProvider delayDuration={300}>
      <div className="space-y-4">
        <div className={cn(
          "flex gap-4",
          isMobile ? "flex-col" : "flex-row"
        )}>
          {/* Tool Palette */}
          <div className={cn(
            "flex gap-2 p-3 bg-secondary/30 rounded-lg border border-border",
            isMobile ? "flex-row justify-center flex-wrap order-2" : "flex-col items-center"
          )}>
            {/* Drawing Tools */}
            <div className="flex gap-1" role="group" aria-label="Drawing tools">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={activeTool === 'pen'}
                    onPressedChange={() => handleToolChange('pen')}
                    aria-label="Pen tool"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Pencil className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Draw freehand (click again to change size)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={activeTool === 'eraser'}
                    onPressedChange={() => handleToolChange('eraser')}
                    aria-label="Eraser tool"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Eraser className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Erase strokes</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Separator */}
            <div className={cn(
              "bg-border",
              isMobile ? "w-px h-8" : "h-px w-full"
            )} />

            {/* Pen Sizes */}
            <div className="flex gap-1" role="group" aria-label="Pen sizes">
              {penSizes.map(({ size, label }) => (
                <Tooltip key={size}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => handleBrushSizeChange(size)}
                      className={cn(
                        "min-w-[44px] min-h-[44px] rounded-md border-2 flex items-center justify-center transition-all",
                        brushSize === size 
                          ? "border-primary bg-primary/10" 
                          : "border-border hover:border-primary/50"
                      )}
                      aria-label={`${label} brush (${size}px)`}
                      aria-pressed={brushSize === size}
                    >
                      <div 
                        className="rounded-full bg-foreground"
                        style={{ width: size + 4, height: size + 4 }}
                      />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>{label} brush ({size}px)</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>

            {/* Separator */}
            <div className={cn(
              "bg-border",
              isMobile ? "w-px h-8" : "h-px w-full"
            )} />

            {/* Toggles */}
            <div className="flex gap-1" role="group" aria-label="Canvas options">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={showGrid}
                    onPressedChange={handleGridToggle}
                    aria-label="Toggle grid overlay"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle 8×8 alignment grid</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Toggle
                    pressed={symmetryMode}
                    onPressedChange={handleSymmetryToggle}
                    aria-label="Toggle 4-way symmetry mode"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Sparkles className="w-4 h-4" />
                  </Toggle>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Toggle 4-way radial symmetry for mandala patterns</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Separator */}
            <div className={cn(
              "bg-border",
              isMobile ? "w-px h-8" : "h-px w-full"
            )} />

            {/* Actions */}
            <div className="flex gap-1" role="group" aria-label="Canvas actions">
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Undo last stroke (Ctrl+Z)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
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
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Redo stroke (Ctrl+Shift+Z)</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearCanvas}
                    aria-label="Clear canvas"
                    className="min-w-[44px] min-h-[44px]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>Clear entire canvas</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </div>

        {/* Canvas Area */}
        <div 
          ref={containerRef}
          className="flex-1 flex flex-col items-center gap-4"
        >
          <div 
            className="relative bg-card rounded-lg p-4 border border-border shadow-lg"
            style={{ touchAction: 'none' }}
          >
            {/* Grid indicator */}
            {showGrid && (
              <div className="absolute top-2 right-2 text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                8×8 Grid
              </div>
            )}
            {/* Symmetry indicator */}
            {symmetryMode && (
              <div className="absolute top-2 left-2 text-xs text-primary bg-primary/10 px-2 py-1 rounded flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                4-Way Symmetry
              </div>
            )}
            
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
          </div>

          {/* Save Button */}
          {onSave && (
            <Button
              onClick={onSave}
              disabled={disabled || historyStep <= 0}
              className="w-full max-w-[300px] h-12 rounded-full font-medium bg-primary hover:bg-primary/90 text-primary-foreground transition-all hover:shadow-[0_0_20px_rgba(196,30,58,0.3)] min-h-[44px]"
            >
              Save & Continue
            </Button>
          )}
        </div>
      </div>

        {/* Instructions */}
        <p className="text-center text-sm text-muted-foreground">
          Draw your symbol using the pen tool. Use symmetry mode for mandala patterns.
          {isMobile && " Touch and drag to draw."}
          {!isMobile && " Keyboard: Ctrl+Z to undo, Ctrl+Shift+Z to redo."}
        </p>
      </div>
    </TooltipProvider>
  );
};