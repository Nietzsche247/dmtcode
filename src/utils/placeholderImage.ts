// Generate placeholder image with manufacturer initials
export const getPlaceholderImage = (title: string, category: string): string => {
  // Extract initials from title
  const words = title.split(' ').filter(w => w.length > 0);
  let initials = '';
  
  if (words.length >= 2) {
    initials = words[0][0] + words[1][0];
  } else if (words.length === 1) {
    initials = words[0].substring(0, 2);
  } else {
    initials = 'PR';
  }
  
  initials = initials.toUpperCase();

  // Category-based colors (ASCII only - no emojis to avoid btoa encoding issues)
  const categoryConfig: Record<string, { symbol: string; bg: string; text: string }> = {
    'laser': { symbol: '*', bg: '#C41E3A', text: '#FFFFFF' },
    'lens': { symbol: 'O', bg: '#1E5AA8', text: '#FFFFFF' },
    'red-light': { symbol: '+', bg: '#FF3333', text: '#FFFFFF' },
    'integration': { symbol: '~', bg: '#7B3FB5', text: '#FFFFFF' },
    'mysticism': { symbol: '#', bg: '#D4AF37', text: '#000000' },
    'retreat': { symbol: '^', bg: '#2E8B57', text: '#FFFFFF' },
    'product': { symbol: 'P', bg: '#333333', text: '#FFFFFF' },
    'default': { symbol: '?', bg: '#333333', text: '#FFFFFF' }
  };

  const config = categoryConfig[category] || categoryConfig['default'];

  // Create SVG placeholder - ASCII only for btoa compatibility
  const svg = `<svg width="400" height="400" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="400" fill="${config.bg}"/><text x="200" y="200" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="${config.text}" text-anchor="middle" dominant-baseline="middle">${initials}</text></svg>`;

  // Use encodeURIComponent for safe data URL (handles any characters)
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
