import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const height = size === "sm" ? 44 : 48;
  
  return (
    <svg 
      viewBox="0 0 160 48" 
      height={height}
      className={cn("hover:opacity-90 transition-opacity", className)}
      aria-label="DMT Code Project"
      role="img"
    >
      {/* Dark blue network "D" icon - #1e3a8a */}
      <g transform="translate(4, 8)">
        {/* Main "D" arc */}
        <path
          d="M4 2 L4 28 M4 2 C4 2 22 2 22 15 C22 28 4 28 4 28"
          stroke="#1e3a8a"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {/* Network nodes */}
        <circle cx="4" cy="2" r="2.5" fill="#1e3a8a" />
        <circle cx="4" cy="15" r="2.5" fill="#1e3a8a" />
        <circle cx="4" cy="28" r="2.5" fill="#1e3a8a" />
        <circle cx="15" cy="5" r="2" fill="#1e3a8a" />
        <circle cx="20" cy="15" r="2" fill="#1e3a8a" />
        <circle cx="15" cy="25" r="2" fill="#1e3a8a" />
        {/* Connecting lines */}
        <line x1="4" y1="2" x2="15" y2="5" stroke="#1e3a8a" strokeWidth="1" opacity="0.6" />
        <line x1="4" y1="15" x2="20" y2="15" stroke="#1e3a8a" strokeWidth="1" opacity="0.6" />
        <line x1="4" y1="28" x2="15" y2="25" stroke="#1e3a8a" strokeWidth="1" opacity="0.6" />
      </g>
      
      {/* White "DMT Code" text */}
      <text 
        x="44" 
        y="22" 
        fill="white" 
        fontFamily="Montserrat, Inter, system-ui, sans-serif" 
        fontWeight="700"
        fontSize="16"
      >
        DMT Code
      </text>
      
      {/* Light grey "Project" text */}
      <text 
        x="44" 
        y="38" 
        fill="#9CA3AF" 
        fontFamily="Inter, system-ui, sans-serif" 
        fontWeight="500"
        fontSize="11"
      >
        Project
      </text>
    </svg>
  );
};

export default Logo;