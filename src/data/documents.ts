// The document catalogue. One source of truth for /downloads, for the document
// section on /prepare, and for the count in public/llms.txt.
//
// This exists because the count drifted. /prepare said "Twelve PDF documents"
// while llms.txt, which counts the files in public/downloads at build time,
// said thirteen, and the file the two disagreed about was the symbol set, the
// single most searched document on the site. A hand typed list beside a
// directory is a list that will disagree with the directory.
//
// scripts/check-docs-drift.mjs fails the build when this file, its edge mirror
// at netlify/lib/documents.ts, the files actually present in public/downloads,
// and the count published in public/llms.txt do not all agree.
//
// Edit this file first, then copy the DOCUMENTS array verbatim into
// netlify/lib/documents.ts.

export type DocLang = "en" | "es" | "de";

export interface DocFile {
  lang: DocLang;
  file: string;
  label: string;
}

export interface DocRecord {
  id: string;
  title: string;
  kind: "Field material" | "Protocol" | "Catalogue";
  summary: string;
  notThis: string;
  useWhen: string;
  files: DocFile[];
}

export const DOCUMENTS: DocRecord[] = [
  {
    id: "screening-card",
    title: "Screening Card",
    kind: "Field material",
    summary:
      "A one page self check to run before anything else. Contraindications, medication interactions, and the questions a prescriber will ask you.",
    notThis:
      "It is not medical clearance and it is not a substitute for talking to a qualified prescriber.",
    useWhen: "Read this first, before equipment and before protocol.",
    files: [
      { lang: "en", file: "DMTCode_Screening_Card_v1.pdf", label: "English" },
      { lang: "es", file: "DMTCode_Tarjeta_de_Cribado_v1_ES.pdf", label: "Espanol" },
      { lang: "de", file: "DMTCode_Screening_Karte_v1_DE.pdf", label: "Deutsch" },
    ],
  },
  {
    id: "observation-field-sheet",
    title: "Observation Field Sheet",
    kind: "Field material",
    summary:
      "The standard per session record. Apparatus, wavelength, distance, observer state, and room to draw what you saw before you look at what anyone else saw.",
    notThis:
      "It is not a questionnaire about meaning. Nothing on it asks what a form represents.",
    useWhen: "Print one per session. This is the record the registry is built from.",
    files: [
      { lang: "en", file: "DMTCode_Observation_Field_Sheet_v1.pdf", label: "English" },
      { lang: "es", file: "DMTCode_Hoja_de_Campo_v1_ES.pdf", label: "Espanol" },
      { lang: "de", file: "DMTCode_Feldblatt_v1_DE.pdf", label: "Deutsch" },
    ],
  },
  {
    id: "sober-baseline-protocol",
    title: "Sober Baseline Protocol",
    kind: "Protocol",
    summary:
      "The control condition. Same apparatus, same room, sober observers, a sobriety attestation, and a speckle characterization step that describes what the optics do on their own.",
    notThis:
      "It is not a lesser version of the main protocol. It is the half of the comparison the corpus is missing.",
    useWhen:
      "The registry holds no sober baseline records at all. Until it holds some, nothing in the corpus has a control to be measured against, which makes this the single most useful session anyone can run today.",
    files: [
      { lang: "en", file: "DMTCode_Sober_Baseline_Protocol_v1.pdf", label: "English" },
      { lang: "es", file: "DMTCode_Protocolo_Base_Sobria_v1_ES.pdf", label: "Espanol" },
      { lang: "de", file: "DMTCode_Basisprotokoll_Nuechtern_v1_DE.pdf", label: "Deutsch" },
    ],
  },
  {
    id: "avp-passthrough-protocol",
    title: "AVP Passthrough Protocol",
    kind: "Protocol",
    summary:
      "An A B A comparison of direct vision against camera passthrough vision of the same projected pattern. A form that survives a camera sensor is in the light. A form that does not survive it is in the observer.",
    notThis:
      "It is not a test of the DMT state. It characterizes the apparatus, which is what makes it a substrate discriminator.",
    useWhen:
      "Run this if you have an Apple Vision Pro or any headset with camera passthrough. It needs no substance and no participants beyond you.",
    files: [
      { lang: "en", file: "DMTCode_AVP_Passthrough_Protocol_v1.pdf", label: "English" },
      { lang: "es", file: "DMTCode_Protocolo_AVP_Passthrough_v1_ES.pdf", label: "Espanol" },
      { lang: "de", file: "DMTCode_AVP_Passthrough_Protokoll_v1_DE.pdf", label: "Deutsch" },
    ],
  },
  {
    id: "symbol-set",
    title: "DMT Laser Code Symbols",
    kind: "Catalogue",
    summary:
      "Every public registry record in one citable PDF, with drawings, identifiers, contributor handles and confirmation counts. Version 1.0, 51 records, CC BY 4.0, DOI 10.5281/zenodo.22101522.",
    notThis:
      "It is a record of what observers drew. It is not a key, not a translation, and not a claim that the forms mean anything.",
    useWhen:
      "Cite it, print it, argue with it. If you have not recorded your own observation yet, record it first. Reading this counts as having seen the catalogue, and a record made afterwards should say so.",
    files: [
      { lang: "en", file: "dmt-laser-code-symbols.pdf", label: "English" },
    ],
  },
];

export const DOC_FILE_COUNT = DOCUMENTS.reduce((n, d) => n + d.files.length, 0);

export const DOC_NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty",
];

export function docCountWord(capitalized = true): string {
  const w = DOC_NUMBER_WORDS[DOC_FILE_COUNT];
  if (!w) return String(DOC_FILE_COUNT);
  return capitalized ? w.charAt(0).toUpperCase() + w.slice(1) : w;
}

export const DOC_PATH = (file: string) => `/downloads/${file}`;
