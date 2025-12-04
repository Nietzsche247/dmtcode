import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  return (
    <div className={cn("flex flex-col hover:opacity-80 transition-opacity", className)}>
      <span 
        className="font-bold text-white tracking-tight leading-none"
        style={{ 
          fontFamily: "'Founders Grotesk', 'Inter', system-ui, sans-serif",
          fontSize: size === "sm" ? "18px" : "22px"
        }}
      >
        DMT Code
      </span>
      <span 
        className="text-slate-400 leading-none mt-0.5"
        style={{ 
          fontFamily: "'Inter', system-ui, sans-serif",
          fontWeight: 300,
          fontStyle: "italic",
          fontSize: size === "sm" ? "11px" : "14px"
        }}
      >
        Project
      </span>
    </div>
  );
};

export default Logo;