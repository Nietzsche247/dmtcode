import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Bundle data for OG image generation
const bundleInfo: Record<string, { name: string; tagline: string; price: number; tier: string }> = {
  starter: {
    name: "Fractal Starter Kit",
    tagline: "Perfect for first-time researchers",
    price: 85,
    tier: "entry",
  },
  gateway: {
    name: "Gateway Research Kit",
    tagline: "Most popular for serious researchers",
    price: 1200,
    tier: "mid",
  },
  complete: {
    name: "Complete Symbol Kit",
    tagline: "Everything for advanced research",
    price: 2300,
    tier: "high",
  },
  ceremony: {
    name: "Extended Ceremony Package",
    tagline: "For immersive ceremonial research",
    price: 3500,
    tier: "premium",
  },
};

function generateDiffractionPattern(): string {
  // Generate laser beam diffraction lines
  const lines: string[] = [];
  
  // Main horizontal laser line
  lines.push(`<line x1="0" y1="315" x2="1200" y2="315" stroke="#C41E3A" stroke-width="6" opacity="0.9"/>`);
  
  // Diffraction glow effect
  lines.push(`<line x1="0" y1="315" x2="1200" y2="315" stroke="#C41E3A" stroke-width="20" opacity="0.3" filter="url(#glow)"/>`);
  
  // Secondary diffraction lines
  for (let i = 1; i <= 8; i++) {
    const opacity = 0.4 - (i * 0.04);
    const yOffset = i * 25;
    lines.push(`<line x1="0" y1="${315 + yOffset}" x2="1200" y2="${315 + yOffset}" stroke="#C41E3A" stroke-width="2" opacity="${opacity}"/>`);
    lines.push(`<line x1="0" y1="${315 - yOffset}" x2="1200" y2="${315 - yOffset}" stroke="#C41E3A" stroke-width="2" opacity="${opacity}"/>`);
  }
  
  // Diagonal diffraction rays
  for (let i = 0; i < 12; i++) {
    const x = 100 + (i * 90);
    const opacity = 0.15 + Math.random() * 0.1;
    lines.push(`<line x1="${x}" y1="0" x2="${x + 100}" y2="630" stroke="#C41E3A" stroke-width="1" opacity="${opacity}"/>`);
  }
  
  return lines.join('\n');
}

function generateOGImageSVG(bundleId: string): string {
  const bundle = bundleInfo[bundleId];
  
  if (!bundle) {
    return generateDefaultOGImage();
  }
  
  const diffractionPattern = generateDiffractionPattern();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0a0a"/>
      <stop offset="50%" style="stop-color:#111111"/>
      <stop offset="100%" style="stop-color:#0a0a0a"/>
    </linearGradient>
    <linearGradient id="textGlow" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#ffffff"/>
      <stop offset="100%" style="stop-color:#e0e0e0"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="1200" height="630" fill="url(#bgGradient)"/>
  
  <!-- Grain overlay -->
  <rect width="1200" height="630" fill="url(#bgGradient)" opacity="0.1"/>
  
  <!-- Diffraction pattern -->
  ${diffractionPattern}
  
  <!-- Logo area -->
  <text x="60" y="80" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="700" fill="#ffffff">
    DMT Code
  </text>
  <text x="60" y="105" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="400" fill="#9CA3AF">
    Project
  </text>
  
  <!-- Bundle tier badge -->
  <rect x="60" y="180" width="120" height="32" rx="16" fill="#C41E3A" opacity="0.2"/>
  <text x="120" y="202" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#C41E3A" text-anchor="middle">
    ${bundle.tier.toUpperCase()} TIER
  </text>
  
  <!-- Bundle name (main title) -->
  <text x="60" y="290" font-family="system-ui, -apple-system, sans-serif" font-size="64" font-weight="900" fill="#ffffff" letter-spacing="-2">
    ${bundle.name.toUpperCase()}
  </text>
  
  <!-- Red beam underline -->
  <rect x="60" y="310" width="400" height="4" fill="#C41E3A" rx="2"/>
  <rect x="60" y="310" width="400" height="4" fill="#C41E3A" rx="2" filter="url(#glow)" opacity="0.6"/>
  
  <!-- Tagline -->
  <text x="60" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="24" font-weight="300" fill="#9CA3AF">
    ${bundle.tagline}
  </text>
  
  <!-- Price -->
  <text x="60" y="480" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="#C41E3A">
    $${bundle.price}
  </text>
  
  <!-- CTA hint -->
  <text x="60" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#6B7280">
    dmtcode.com/bundles/${bundleId}
  </text>
  
  <!-- Research badge -->
  <rect x="1000" y="50" width="150" height="40" rx="20" fill="#1e3a8a" opacity="0.8"/>
  <text x="1075" y="77" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#ffffff" text-anchor="middle">
    RESEARCH KIT
  </text>
</svg>`;
}

function generateDefaultOGImage(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation="10" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  
  <rect width="1200" height="630" fill="#0a0a0a"/>
  
  <!-- Main laser line -->
  <line x1="0" y1="315" x2="1200" y2="315" stroke="#C41E3A" stroke-width="6" opacity="0.9"/>
  <line x1="0" y1="315" x2="1200" y2="315" stroke="#C41E3A" stroke-width="20" opacity="0.3" filter="url(#glow)"/>
  
  <text x="600" y="280" font-family="system-ui, -apple-system, sans-serif" font-size="72" font-weight="900" fill="#ffffff" text-anchor="middle">
    DMT CODE PROJECT
  </text>
  
  <text x="600" y="380" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="300" fill="#9CA3AF" text-anchor="middle">
    650nm Laser Protocol Research Equipment
  </text>
  
  <text x="600" y="560" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="400" fill="#6B7280" text-anchor="middle">
    dmtcode.com
  </text>
</svg>`;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const bundleId = url.searchParams.get("bundle") || "";
    
    console.log("Generating OG image for bundle:", bundleId);
    
    const svg = generateOGImageSVG(bundleId);
    
    return new Response(svg, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (error: any) {
    console.error("Error generating OG image:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
