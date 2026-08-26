import { Link } from "react-router-dom";
import { useLocale, localePath } from "@/i18n/LocaleProvider";
import { cn } from "@/lib/utils";

/**
 * Canonical full attribution statement for any surface that names Danny Goler.
 * Carries all three facts the attribution rule requires: he first reported the
 * observation, he has no part in the store, site, its founding, or its
 * editorial direction, and he endorses nothing published here.
 * Additive: existing shorter attribution sentences stay in place.
 */
export const GolerAttribution = ({ className }: { className?: string }) => {
  const locale = useLocale();
  return (
    <p className={cn("text-xs text-muted-foreground leading-relaxed", className)}>
      First reported by{" "}
      <Link
        to={localePath(locale, "/people/danny-goler")}
        className="text-primary hover:underline"
      >
        Danny Goler
      </Link>{" "}
      in August 2020; the written protocol grew out of that observation. He has
      no part in Meridian Optics Lab, this store, or this site, is not a founder
      and holds no editorial role, and has not reviewed or endorsed any kit,
      page, or claim published here.
    </p>
  );
};
