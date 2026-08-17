// Shared predicate for deciding whether an image value is worth rendering.
// Approved symbol_submissions rows are never missing image_url outright, but
// some carry a data: URI that was truncated or otherwise never captured a
// real drawing. Those are short (well under any real base64 PNG/SVG payload)
// and render as blank tiles. http(s) URLs are not length-checked here; those
// rely on the <img> onError handler at render time instead.
const MIN_DATA_URI_LENGTH = 50;

export const isRenderableImage = (value: string | null | undefined): boolean => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (trimmed === '') return false;
  if (trimmed.startsWith('data:') && trimmed.length < MIN_DATA_URI_LENGTH) return false;
  return true;
};
