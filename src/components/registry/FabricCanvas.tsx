import { useEffect, useRef, useState } from 'react';
import { Canvas as FabricCanvas, PencilBrush } from 'fabric';
import { Button } from '@/components/ui/button';
import { Undo2, Redo2, Trash2 } from 'lucide-react';

interface FabricCanvasProps {
  onImageChange: (imageData: string) => void;
  onFirstStroke?: () => void;
  onSvgExport?: (svgData: string) => void;
}

export const FabricDrawingCanvas = ({ onImageChange, onFirstStroke, onSvgExport }: FabricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [fabricCanvas, setFabricCanvas] = useState<FabricCanvas | null>(null);
  const [currentColor, setCurrentColor] = useState(() => {
    const saved = localStorage.getItem('dmtcode-canvas-color');
    return saved || '#000000';
  });
  const [brushSize, setBrushSize] = useState(() => {
    const saved = localStorage.getItem('dmtcode-brush-size');
    return saved ? parseInt(saved) : 3;
  });
  const [history, setHistory] = useState<string[]>([]);
  const [historyStep, setHistoryStep] = useState(-1);

  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Gold', value: '#FFD700' }
  ];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: 400,
      height: 400,
      backgroundColor: '#FFFFFF',
      isDrawingMode: true,
    });

    const brush = new PencilBrush(canvas);
    brush.color = currentColor;
    brush.width = brushSize;
    canvas.freeDrawingBrush = brush;

    setFabricCanvas(canvas);

    // Save initial state
    const initialState = canvas.toDataURL({ format: 'png', multiplier: 2 });
    setHistory([initialState]);
    setHistoryStep(0);

    // Track changes
    canvas.on('path:created', () => {
      // Trigger onFirstStroke callback
      if (onFirstStroke) {
        onFirstStroke();
      }
      saveState(canvas);
      const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 2 });
      onImageChange(dataUrl);
      
      // Generate SVG export at 1200×1200px (300 DPI)
      if (onSvgExport) {
        const svgData = canvas.toSVG({
          width: '1200',
          height: '1200'
        });
        onSvgExport(svgData);
      }
      
      // Auto-save to localStorage
      localStorage.setItem('dmtcode-canvas-draft', dataUrl);
    });

    // Load draft if exists
    const draft = localStorage.getItem('dmtcode-canvas-draft');
    if (draft) {
      const img = new Image();
      img.onload = () => {
        const ctx = canvas.getContext();
        ctx.drawImage(img, 0, 0);
        canvas.renderAll();
      };
      img.src = draft;
    }

    return () => {
      canvas.dispose();
    };
  }, []);

  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;
    fabricCanvas.freeDrawingBrush.color = currentColor;
    localStorage.setItem('dmtcode-canvas-color', currentColor);
  }, [currentColor, fabricCanvas]);

  useEffect(() => {
    if (!fabricCanvas || !fabricCanvas.freeDrawingBrush) return;
    fabricCanvas.freeDrawingBrush.width = brushSize;
    localStorage.setItem('dmtcode-brush-size', brushSize.toString());
  }, [brushSize, fabricCanvas]);

  const saveState = (canvas: FabricCanvas) => {
    const newState = canvas.toDataURL({ format: 'png', multiplier: 2 });
    const newHistory = history.slice(0, historyStep + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
  };

  const undo = () => {
    if (historyStep > 0 && fabricCanvas) {
      const newStep = historyStep - 1;
      setHistoryStep(newStep);
      loadFromHistory(history[newStep]);
    }
  };

  const redo = () => {
    if (historyStep < history.length - 1 && fabricCanvas) {
      const newStep = historyStep + 1;
      setHistoryStep(newStep);
      loadFromHistory(history[newStep]);
    }
  };

  const loadFromHistory = (dataUrl: string) => {
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
  };

  const clearCanvas = () => {
    if (!fabricCanvas) return;
    fabricCanvas.clear();
    fabricCanvas.backgroundColor = '#FFFFFF';
    fabricCanvas.renderAll();
    const clearedState = fabricCanvas.toDataURL({ format: 'png', multiplier: 2 });
    const newHistory = [...history.slice(0, historyStep + 1), clearedState];
    setHistory(newHistory);
    setHistoryStep(newHistory.length - 1);
    onImageChange('');
    localStorage.removeItem('dmtcode-canvas-draft');
  };

  const brushSizes = [1, 3, 5, 8];

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          className="border-2 border-border cursor-crosshair"
          style={{ width: '400px', height: '400px', imageRendering: 'auto' }}
          role="img"
          aria-label="Draw visual symbol on 400 by 400 pixel canvas"
          aria-describedby="metadata-form"
        />
      </div>

      <div className="space-y-3">
        <div className="flex gap-2 justify-center flex-wrap">
          {colors.map((color) => (
            <button
              key={color.value}
              type="button"
              onClick={() => setCurrentColor(color.value)}
              className={`w-10 h-10 rounded border-2 transition-all ${
                currentColor === color.value ? 'border-primary scale-110' : 'border-border'
              }`}
              style={{ backgroundColor: color.value }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>

        <div className="flex gap-2 justify-center items-center flex-wrap">
          <span className="text-sm text-muted-foreground">Brush:</span>
          {brushSizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => setBrushSize(size)}
              className={`w-10 h-10 rounded border-2 transition-all flex items-center justify-center text-xs ${
                brushSize === size ? 'border-primary bg-primary/10' : 'border-border'
              }`}
              aria-label={`Select ${size}px brush size`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={historyStep <= 0}
          aria-label="Undo last drawing action"
        >
          <Undo2 className="w-4 h-4 mr-1" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={redo}
          disabled={historyStep >= history.length - 1}
          aria-label="Redo drawing action"
        >
          <Redo2 className="w-4 h-4 mr-1" />
          Redo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clearCanvas}
          aria-label="Clear canvas"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          Clear
        </Button>
      </div>
    </div>
  );
};
