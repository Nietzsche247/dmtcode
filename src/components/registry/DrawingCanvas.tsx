import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';

interface DrawingCanvasProps {
  onImageChange: (imageData: string) => void;
}

export const DrawingCanvas = ({ onImageChange }: DrawingCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState('#000000');
  
  const colors = [
    { name: 'Black', value: '#000000' },
    { name: 'White', value: '#FFFFFF' },
    { name: 'Red', value: '#FF0000' },
    { name: 'Gold', value: '#FFD700' }
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set white background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 100, 100);
  }, []);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    draw(e);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      onImageChange(canvas.toDataURL('image/png'));
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing && e.type !== 'mousedown') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    ctx.fillStyle = currentColor;
    ctx.beginPath();
    ctx.arc(x, y, 1.5, 0, Math.PI * 2); // 3px brush (radius 1.5)
    ctx.fill();
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, 100, 100);
    onImageChange('');
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <canvas
          ref={canvasRef}
          width={100}
          height={100}
          className="border-2 border-border cursor-crosshair"
          style={{ width: '300px', height: '300px', imageRendering: 'pixelated' }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
        />
      </div>

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
          />
        ))}
      </div>

      <div className="flex justify-center">
        <Button type="button" variant="outline" onClick={clearCanvas}>
          Clear Canvas
        </Button>
      </div>
    </div>
  );
};
