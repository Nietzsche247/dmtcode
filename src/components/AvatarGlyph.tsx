import { glyphDataUri } from '@/lib/avatar';

interface AvatarGlyphProps {
  seed: string;
  handle?: string;
  size?: number;
  className?: string;
}

export const AvatarGlyph = ({ seed, handle, size = 48, className = '' }: AvatarGlyphProps) => {
  return (
    <img
      src={glyphDataUri(seed || handle || 'anon', size)}
      alt={handle ? `Avatar for ${handle}` : 'Assigned avatar'}
      width={size}
      height={size}
      className={`rounded-md border border-border ${className}`}
    />
  );
};
