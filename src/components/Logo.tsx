import { cn } from "@/lib/utils";
import logoImage from "@/assets/logo.png";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  const height = size === "sm" ? 44 : 48;
  
  return (
    <img 
      src={logoImage}
      alt="DMT Code Project"
      className={cn(
        "hover:opacity-90 transition-opacity object-contain",
        className
      )}
      style={{ height: `${height}px`, width: 'auto' }}
    />
  );
};

export default Logo;
