import { useRef } from 'react';
import { FabricImage, type Canvas } from 'fabric';
import { SymbolCanvas } from '@/components/registry/SymbolCanvas';
import type { RecordDraft, RecordStroke } from '@/lib/recordDraft';

interface Props { draft: RecordDraft; label: string; onChange: (patch: Partial<RecordDraft>) => void }

export function RecordDrawing({ draft, label, onChange }: Props) {
  const strokes = useRef(draft.strokes);
  const current = useRef<RecordStroke | null>(null);
  const change = useRef(onChange);
  change.current = onChange;
  const canvas = useRef<Canvas | null>(null);

  const ready = async (drawing: Canvas) => {
    canvas.current = drawing;
    if (draft.vector) {
      await drawing.loadFromJSON(draft.vector);
      drawing.renderAll();
    } else if (draft.png) {
      const image = await FabricImage.fromURL(draft.png);
      image.scaleToWidth(drawing.width);
      image.set({ selectable: false, evented: false });
      drawing.add(image);
      drawing.renderAll();
    }
    const point = (event: { scenePoint: { x: number; y: number } }) => ({
      x: event.scenePoint.x / drawing.width, y: event.scenePoint.y / drawing.height, t: Date.now(),
    });
    drawing.on('mouse:down', event => { current.current = [point(event)]; });
    drawing.on('mouse:move', event => {
      if (!current.current) return;
      current.current.push(point(event));
      change.current({ strokes: [...strokes.current, [...current.current]], png: drawing.toDataURL({ format: 'png', multiplier: 2 }) });
    });
    drawing.on('mouse:up', event => {
      if (!current.current) return;
      current.current.push(point(event));
      strokes.current = [...strokes.current, current.current];
      current.current = null;
      change.current({ strokes: strokes.current, png: drawing.toDataURL({ format: 'png', multiplier: 2 }), vector: JSON.stringify(drawing.toJSON()) });
    });
  };

  return <SymbolCanvas quickCapture drawingLabel={label} onCanvasReady={ready} onImageChange={png => {
    change.current({ png, strokes: strokes.current, vector: canvas.current ? JSON.stringify(canvas.current.toJSON()) : '' });
  }} />;
}