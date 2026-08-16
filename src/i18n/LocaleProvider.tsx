import { createContext, useContext, useEffect, type ReactNode } from "react";
import i18n, { type AppLocale } from "./index";

const LocaleContext = createContext<AppLocale>("en");

export function useLocale(): AppLocale {
  return useContext(LocaleContext);
}

// Prefix a site-relative path with the active locale. English stays unprefixed.
// The locale root keeps its trailing slash ("/es/") so canonical, sitemap and
// hreflang all name the same URL.
export function localePath(locale: AppLocale, path: string): string {
  if (locale === "en") return path;
  return `/${locale}${path === "/" ? "/" : path}`;
}

export function LocaleProvider({
  locale,
  children,
}: {
  locale: AppLocale;
  children: ReactNode;
}) {
  useEffect(() => {
    if (i18n.language !== locale) void i18n.changeLanguage(locale);
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  return <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>;
}
