import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useModeStore } from "@/stores/modeStore";
import { useLocale, localePath } from "@/i18n/LocaleProvider";
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
  TrendingUp,
  History,
  PencilLine,
} from "lucide-react";

// Labels and descriptions are i18n keys resolved at render time so the mega
// menu reads in the visitor's locale.
interface NavItem {
  title: string;
  href: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const researchItems: NavItem[] = [
  { title: "nav.articles", href: "/articles", description: "menu.articlesDesc", icon: FileText },
  { title: "nav.symbolRegistry", href: "/registry", description: "menu.registryDesc", icon: Database },
  { title: "nav.evidenceMapTitle", href: "/evidence-map", description: "menu.evidenceMapDesc", icon: Map },
  { title: "nav.timeline", href: "/timeline", description: "menu.timelineDesc", icon: History },
  { title: "nav.clinicalTrials", href: "/trials", description: "menu.trialsDesc", icon: FlaskConical },
  { title: "nav.bibliographyTitle", href: "/bibliography", description: "menu.bibliographyDesc", icon: BookOpen },
  { title: "nav.methods", href: "/methods", description: "menu.methodsDesc", icon: Microscope },
  { title: "nav.critiques", href: "/critiques", description: "menu.critiquesDesc", icon: ScrollText },
  { title: "nav.openTheories", href: "/theories", description: "menu.theoriesDesc", icon: Sparkles },
];

const explorerItems: NavItem[] = [
  { title: "nav.capture", href: "/capture", description: "menu.captureDesc", icon: PencilLine },
  { title: "nav.eventsRetreats", href: "/events", description: "menu.eventsDesc", icon: Calendar },
  { title: "nav.retreatCenters", href: "/retreats", description: "menu.retreatsDesc", icon: Users },
  { title: "nav.toolsEquipment", href: "/prepare", description: "menu.toolsDesc", icon: Wrench },
  { title: "nav.community", href: "/leaderboard", description: "menu.communityDesc", icon: Users },
  { title: "nav.coWitnessWall", href: "/co-witnesses", description: "menu.coWitnessDesc", icon: Users },
];

const resourceItems: NavItem[] = [
  { title: "nav.forecasts", href: "/forecasts", description: "menu.forecastsDesc", icon: TrendingUp },
  { title: "nav.protocols", href: "/protocols", description: "menu.protocolsDesc", icon: FlaskConical },
  { title: "nav.voiceLogger", href: "/log", description: "menu.voiceLoggerDesc", icon: FileText },
  { title: "nav.assessment", href: "/assess", description: "menu.assessmentDesc", icon: ClipboardCheck },
  { title: "nav.analysis", href: "/analysis", description: "menu.analysisDesc", icon: BarChart3 },
  { title: "nav.dataset", href: "/dataset", description: "menu.datasetDesc", icon: Database },
  { title: "nav.protocolGuide", href: "/protocol-guide", description: "menu.protocolGuideDesc", icon: Microscope },
  { title: "nav.faqShort", href: "/faq", description: "menu.faqDesc", icon: HelpCircle },
  { title: "nav.glossary", href: "/glossary", description: "menu.glossaryDesc", icon: BookOpen },
  { title: "nav.nullReportsTitle", href: "/null-reports", description: "menu.nullReportsDesc", icon: ScrollText },
];

const renderItem = (
  item: NavItem,
  active: boolean,
  href: string,
  t: (key: string) => string,
) => (
  <li key={item.href}>
    <NavigationMenuLink asChild>
      <Link
        to={href}
        className={cn(
          "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors w-full text-left",
          "hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
          active && "bg-accent/50"
        )}
      >
        <div className="flex items-center gap-2">
          <item.icon className="h-4 w-4 text-primary" />
          <div className="text-sm font-medium leading-none">{t(item.title)}</div>
        </div>
        <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
          {t(item.description)}
        </p>
      </Link>
    </NavigationMenuLink>
  </li>
);

export const MegaMenu = () => {
  const location = useLocation();
  const { mode } = useModeStore();
  const locale = useLocale();
  const { t } = useTranslation();
  // Keep a visitor inside their locale while navigating the mega menu.
  const lp = (path: string) => localePath(locale, path);
  const isActive = (href: string) => location.pathname === lp(href);

  return (
    <NavigationMenu className="hidden lg:flex">
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">{t("nav.sectionResearch")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {researchItems.map((item) => renderItem(item, isActive(item.href), lp(item.href), t))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">{t("nav.sectionExplorer")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
              {explorerItems
                .filter((item) => mode === 'explorer' || item.href === '/prepare' || item.href === '/events' || item.href === '/capture')
                .map((item) => renderItem(item, isActive(item.href), lp(item.href), t))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuTrigger className="bg-transparent text-sm">{t("nav.sectionResources")}</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-[400px] gap-2 p-4 md:w-[500px] md:grid-cols-2">
              {resourceItems.map((item) => renderItem(item, isActive(item.href), lp(item.href), t))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        <NavigationMenuItem>
          <NavigationMenuLink asChild>
            <Link
              to={lp('/about')}
              className={cn(
                "px-4 py-2 text-sm font-medium transition-colors rounded-md inline-block",
                isActive('/about')
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
              )}
            >
              {t('nav.about')}
            </Link>
          </NavigationMenuLink>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
};
