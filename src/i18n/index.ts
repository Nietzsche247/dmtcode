import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en/common.json";
import es from "./locales/es/common.json";
import de from "./locales/de/common.json";

// English is the default and lives at unprefixed paths. /es/* and /de/* are
// path-based mirrors; the active locale is set by LocaleProvider from the URL,
// so detection only matters before the router mounts.
export const SUPPORTED_LOCALES = ["en", "es", "de"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

if (!i18n.isInitialized) {
  void i18n
    .use(LanguageDetector)
    .use(initReactI18next)
    .init({
      resources: {
        en: { common: en },
        es: { common: es },
        de: { common: de },
      },
      ns: ["common"],
      defaultNS: "common",
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      fallbackLng: "en",
      // A missing key must never render blank or throw: fall back to English.
      returnEmptyString: false,
      interpolation: { escapeValue: false },
      detection: { order: ["path", "htmlTag", "navigator"], caches: [] },
      react: { useSuspense: false },
    });
}

export default i18n;
