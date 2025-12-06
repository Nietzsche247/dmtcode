import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useModeStore } from "@/stores/modeStore";
import { cn } from "@/lib/utils";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import {
  Database,
  Map,
  FlaskConical,
  BookOpen,
  Calendar,
  Wrench,
  Users,
  Sparkles,
  FileText,
  BarChart3,
  Microscope,
  ScrollText,
  HelpCircle,
  ClipboardCheck,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const researchItems: NavItem[] = [
  {
    title: "Symbol Registry",
    href: "/registry",
    description: "Community-curated catalogue of visual symbols",
    icon: Database,
  },
  {
    title: "Evidence Map",
    href: "/evidence-map",
    description: "Pro/con analysis of research findings",
    icon: Map,
  },
  {
    title: "Clinical Trials",
    href: "/events",
    description: "Active psychedelic research trials",
    icon: FlaskConical,
  },
  {
    title: "Bibliography",
    href: "/bibliography",
    description: "Peer-reviewed papers and citations",
    icon: BookOpen,
  },
  {
    title: "Methods",
    href: "/methods",
    description: "Replication methodology and protocols",
    icon: Microscope,
  },
  {
    title: "Critiques",
    href: "/critiques",
    description: "Skeptical perspectives and counter-evidence",
    icon: ScrollText,
  },
];

const explorerItems: NavItem[] = [
  {
    title: "Events & Retreats",
    href: "/events",
    description: "Conferences, workshops, and retreat centers",
    icon: Calendar,
  },
  {
    title: "Tools & Equipment",
    href: "/tools",
    description: "Lasers, lenses, and research equipment",
    icon: Wrench,
  },
  {
    title: "Community",
    href: "/leaderboard",
    description: "Contributors, rankings, and discussions",
    icon: Users,
  },
  {
    title: "Mysticism Store",
    href: "/community/woo",
    description: "Symbolism items and mystical artifacts",
    icon: Sparkles,
  },
];

const resourceItems: NavItem[] = [
  {
    title: "Protocols",
    href: "/protocols",
    description: "Therapeutic protocol frameworks",
    icon: FlaskConical,
  },
  {
    title: "Voice Logger",
    href: "/log",
    description: "Record and analyze experiences",
    icon: FileText,
  },
  {
    title: "Assessment",
    href: "/assess",
    description: "PHQ-9, GAD-7, and clinical evaluations",
    icon: ClipboardCheck,
  },
  {
    title: "Analysis",
    href: "/analysis",
    description: "t-SNE clustering and research tools",
    icon: BarChart3,
  },
  {
    title: "Dataset",
    href: "/dataset",
    description: "Download open research data",
    icon: Database,
  },
  {
    title: "Protocol Guide",
    href: "/protocol-guide",
    description: "650nm laser protocol documentation",
    icon: Microscope,
  },
  {
    title: "FAQ",
    href: "/faq",
    description: "Frequently asked questions",
    icon: HelpCircle,
  },
  {
    title: "Glossary",
    href: "/glossary",
    description: "Key terms and definitions",
    icon: BookOpen,
  },
  {
    title: "Null Reports",
    href: "/null-reports",
    description: "Negative results and baseline data",
    icon: ScrollText,
  },
];

export const MegaMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode } = useModeStore();

  const handleNavigate = (href: string) => {
    navigate(href);
  };

  const isActive = (href: string) => location.pathname === href;

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        {/* Research Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">
            Research
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {researchItems.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors w-full text-left",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium leading-none">{item.title}</div>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </button>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Explorer Menu - Only show items in Explorer mode or always show Tools */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">
            Explorer
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {explorerItems
                .filter((item) => mode === 'explorer' || item.href === '/tools' || item.href === '/events')
                .map((item) => (
                  <li key={item.href}>
                    <NavigationMenuLink asChild>
                      <button
                        onClick={() => handleNavigate(item.href)}
                        className={cn(
                          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors w-full text-left",
                          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                          isActive(item.href) && "bg-accent/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <item.icon className="h-4 w-4 text-primary" />
                          <div className="text-sm font-medium leading-none">{item.title}</div>
                        </div>
                        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                          {item.description}
                        </p>
                      </button>
                    </NavigationMenuLink>
                  </li>
                ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* Resources Menu */}
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">
            Resources
          </NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
              {resourceItems.map((item) => (
                <li key={item.href}>
                  <NavigationMenuLink asChild>
                    <button
                      onClick={() => handleNavigate(item.href)}
                      className={cn(
                        "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors w-full text-left",
                        "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
                        isActive(item.href) && "bg-accent/50"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-4 w-4 text-primary" />
                        <div className="text-sm font-medium leading-none">{item.title}</div>
                      </div>
                      <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                        {item.description}
                      </p>
                    </button>
                  </NavigationMenuLink>
                </li>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* About Link */}
        <NavigationMenuItem>
          <button
            onClick={() => handleNavigate('/about')}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors rounded-md",
              isActive('/about')
                ? "text-primary bg-primary/10"
                : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
            )}
          >
            About
          </button>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
