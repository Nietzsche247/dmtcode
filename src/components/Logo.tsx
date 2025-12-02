import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const iconSize = size === "sm" ? 28 : 32;
  
  return (
    <div 
      className={cn(
        "flex items-center gap-3 hover:opacity-80 transition-opacity",
        size === "sm" ? "h-11" : "h-12",
        className
      )}
    >
      {/* Geometric Icon: Interlocking circles/nodes forming subtle "D" shape */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 32 32" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        {/* Main "D" arc */}
        <path
          d="M8 6 L8 26 M8 6 C8 6 24 6 24 16 C24 26 8 26 8 26"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
          className="text-logo-icon dark:text-logo-icon-dark"
        />
        {/* Network nodes */}
        <circle cx="8" cy="6" r="2.5" className="fill-logo-icon dark:fill-logo-icon-dark" />
        <circle cx="8" cy="16" r="2.5" className="fill-logo-icon dark:fill-logo-icon-dark" />
        <circle cx="8" cy="26" r="2.5" className="fill-logo-icon dark:fill-logo-icon-dark" />
        <circle cx="18" cy="8" r="2" className="fill-logo-icon dark:fill-logo-icon-dark" />
        <circle cx="22" cy="16" r="2" className="fill-logo-icon dark:fill-logo-icon-dark" />
        <circle cx="18" cy="24" r="2" className="fill-logo-icon dark:fill-logo-icon-dark" />
        {/* Connecting lines (network style) */}
        <line x1="8" y1="6" x2="18" y2="8" stroke="currentColor" strokeWidth="1" className="text-logo-icon dark:text-logo-icon-dark opacity-60" />
        <line x1="8" y1="16" x2="22" y2="16" stroke="currentColor" strokeWidth="1" className="text-logo-icon dark:text-logo-icon-dark opacity-60" />
        <line x1="8" y1="26" x2="18" y2="24" stroke="currentColor" strokeWidth="1" className="text-logo-icon dark:text-logo-icon-dark opacity-60" />
      </svg>
      
      {/* Text */}
      <div className="flex flex-col justify-center leading-none">
        <span className={cn(
          "font-playfair font-bold text-logo-icon dark:text-logo-icon-dark",
          size === "sm" ? "text-lg" : "text-[22px]"
        )}>
          DMT Code
        </span>
        <span className={cn(
          "font-inter font-medium text-logo-secondary dark:text-logo-secondary-dark",
          size === "sm" ? "text-xs" : "text-sm"
        )}>
          Project
        </span>
      </div>
    </div>
  );
};

export default Logo;
