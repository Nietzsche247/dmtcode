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

  // Category-based icon/color
  const categoryConfig: Record<string, { icon: string; bg: string; text: string }> = {
    'laser': { icon: '🔴', bg: 'hsl(0, 85%, 62%)', text: 'hsl(0, 0%, 100%)' },
    'lens': { icon: '🔬', bg: 'hsl(210, 100%, 45%)', text: 'hsl(0, 0%, 100%)' },
    'red-light': { icon: '💡', bg: 'hsl(0, 100%, 50%)', text: 'hsl(0, 0%, 100%)' },
    'integration': { icon: '🧘', bg: 'hsl(280, 60%, 50%)', text: 'hsl(0, 0%, 100%)' },
    'mysticism': { icon: '✡️', bg: 'hsl(45, 100%, 51%)', text: 'hsl(0, 0%, 0%)' },
    'retreat': { icon: '🏔️', bg: 'hsl(120, 40%, 40%)', text: 'hsl(0, 0%, 100%)' },
    'default': { icon: '📦', bg: 'hsl(0, 0%, 30%)', text: 'hsl(0, 0%, 100%)' }
  };

  const config = categoryConfig[category] || categoryConfig['default'];

  // Create SVG placeholder
  const svg = `
    <svg width="400" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="400" fill="${config.bg}"/>
      <text x="200" y="180" font-family="Arial, sans-serif" font-size="120" font-weight="bold" fill="${config.text}" text-anchor="middle">${initials}</text>
      <text x="200" y="260" font-family="Arial, sans-serif" font-size="60" fill="${config.text}" text-anchor="middle">${config.icon}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;base64,${btoa(svg)}`;
};