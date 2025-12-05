import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md";
}

export const Logo = ({ className, size = "md" }: LogoProps) => {
  return (
    <div className={cn("flex flex-col hover:opacity-80 transition-opacity", className)}>
      <span 
        className="font-bold tracking-tight leading-none text-foreground dark:text-white"
        style={{ 
          fontFamily: "'Founders Grotesk', 'Inter', system-ui, sans-serif",
          fontSize: size === "sm" ? "18px" : "22px"
        }}
      >
        DMT Code
      </span>
      <span 
        className="leading-none mt-0.5 text-muted-foreground dark:text-[#94a3b8]"
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
