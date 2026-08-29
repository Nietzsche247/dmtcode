// Static, git-versioned dictionary for INDEX-page chrome (title + meta
// description). Detail pages are translated through content_translations,
// which is keyed (table_name, record_id, field) and therefore cannot hold
// copy for pages that have no record. This module fills that gap.
//
// Rules held here deliberately:
// - The " | DMT Code" suffix is identical in every locale.
// - "DMT Code", "N,N-DMT", "650 nm", "CC-BY-4.0", "DOI", "Crossref" are never
//   translated.
// - Epistemic statements stay flat statements, never hedges.
// - Any miss on locale or key falls back to English, never to an empty string.

export type Loc = "en" | "es" | "de";

export type UiCopy = { title: string; description: string };

export const UI_STRINGS: Record<string, Record<Loc, UiCopy>> = {
  home: {
    en: {
      title: "DMT Code | 650nm Laser Visual Symbol Research",
      description:
        "Open, community maintained record of visual forms reported during N,N-DMT experiences and the 650 nm laser protocols associated with them.",
    },
    es: {
      title: "DMT Code | Investigación de símbolos visuales con láser de 650nm",
      description:
        "Registro abierto y mantenido por la comunidad de formas visuales reportadas durante experiencias con N,N-DMT y los protocolos de láser de 650 nm asociados.",
    },
    de: {
      title: "DMT Code | Forschung zu visuellen Symbolen mit 650nm-Laser",
      description:
        "Offenes, gemeinschaftlich gepflegtes Verzeichnis visueller Formen aus N,N-DMT-Erfahrungen und der damit verbundenen 650 nm Laserprotokolle.",
    },
  },
  theories: {
    en: {
      title: "Open theories: what could the DMT code be? | DMT Code",
      description:
        "Attributed explanatory theories for the reported DMT code phenomenon. Curated from the public record and moderated community submissions. Theories are not evidence.",
    },
    es: {
      title: "Teorías abiertas: ¿qué podría ser el código DMT? | DMT Code",
      description:
        "Teorías explicativas atribuidas sobre el fenómeno reportado. Curadas del registro público y de aportes moderados. Las teorías no son evidencia.",
    },
    de: {
      title: "Offene Theorien: was könnte der DMT-Code sein? | DMT Code",
      description:
        "Zugeschriebene Erklärungstheorien zum berichteten Phänomen. Kuratiert aus öffentlichen Quellen und moderierten Beiträgen. Theorien sind keine Belege.",
    },
  },
  articles: {
    en: {
      title: "Articles | DMT Code",
      description:
        "Long form articles that answer specific questions using the DMT Code corpus. Every article names the trials, papers, symbols, and protocols it is built on.",
    },
    es: {
      title: "Artículos | DMT Code",
      description:
        "Artículos extensos que responden preguntas concretas con el corpus de DMT Code. Cada uno nombra los ensayos, artículos, símbolos y protocolos que usa.",
    },
    de: {
      title: "Artikel | DMT Code",
      description:
        "Ausführliche Artikel, die konkrete Fragen anhand des DMT-Code-Korpus beantworten. Jeder nennt die Studien, Arbeiten, Symbole und Protokolle dahinter.",
    },
  },
  guides: {
    en: {
      title: "Guides | DMT Code",
      description:
        "Direct answers to the questions people actually ask, each one graded by how strong the evidence behind it really is.",
    },
    es: {
      title: "Guías | DMT Code",
      description:
        "Respuestas directas a las preguntas que la gente realmente hace, cada una calificada según la solidez real de la evidencia que la respalda.",
    },
    de: {
      title: "Leitfäden | DMT Code",
      description:
        "Direkte Antworten auf die Fragen, die tatsächlich gestellt werden, jeweils bewertet danach, wie belastbar die zugrunde liegende Evidenz wirklich ist.",
    },
  },
  retreats: {
    en: {
      title: "Retreat centers | DMT Code",
      description:
        "Psychedelic retreat centers that operate openly and publish who they are and where. A listing is not an endorsement. Verify legal status and medical screening directly with each center.",
    },
    es: {
      title: "Centros de retiro | DMT Code",
      description:
        "Centros de retiro psicodélico que operan abiertamente y publican quiénes son y dónde. Un listado no es un aval. Verifique estatus legal y cribado médico con cada centro.",
    },
    de: {
      title: "Retreat-Zentren | DMT Code",
      description:
        "Psychedelische Retreat-Zentren, die offen arbeiten und angeben, wer sie sind und wo. Ein Eintrag ist keine Empfehlung. Rechtsstatus und medizinische Prüfung direkt klären.",
    },
  },
  faq: {
    en: {
      title:
        "Questions about the DMT Code project and preparing to observe | DMT Code",
      description:
        "Answers to common questions about the DMT Code project: what it is, how to prepare safely, why the data is open, and how convergence is measured.",
    },
    es: {
      title:
        "Preguntas sobre el proyecto DMT Code y cómo prepararse para observar | DMT Code",
      description:
        "Respuestas a preguntas frecuentes sobre DMT Code: qué es, cómo prepararse con seguridad, por qué los datos son abiertos y cómo se mide la convergencia.",
    },
    de: {
      title:
        "Fragen zum DMT-Code-Projekt und zur Vorbereitung der Beobachtung | DMT Code",
      description:
        "Antworten auf häufige Fragen zum DMT-Code-Projekt: was es ist, wie man sich sicher vorbereitet, warum die Daten offen sind und wie Konvergenz gemessen wird.",
    },
  },
  timeline: {
    en: {
      title: "Chronology of the DMT code question, {first} to {last} | DMT Code",
      description:
        "{n} dated records from {first} to {last}. Each one states what kind of evidence it is, and every DOI has been resolved against Crossref.",
    },
    es: {
      title: "Cronología de la cuestión del código DMT, {first} a {last} | DMT Code",
      description:
        "{n} registros fechados de {first} a {last}. Cada uno indica qué tipo de evidencia es, y cada DOI fue resuelto contra Crossref.",
    },
    de: {
      title: "Chronologie der DMT-Code-Frage, {first} bis {last} | DMT Code",
      description:
        "{n} datierte Einträge von {first} bis {last}. Jeder nennt die Art der Evidenz, und jede DOI wurde gegen Crossref aufgelöst.",
    },
  },
  "timeline-empty": {
    en: {
      title: "Chronology | DMT Code",
      description:
        "A dated record of the published research, legal decisions and community claims behind the DMT code question.",
    },
    es: {
      title: "Cronología | DMT Code",
      description:
        "Un registro fechado de la investigación publicada, las decisiones legales y las afirmaciones de la comunidad tras la cuestión del código DMT.",
    },
    de: {
      title: "Chronologie | DMT Code",
      description:
        "Ein datiertes Verzeichnis der publizierten Forschung, rechtlichen Entscheidungen und Gemeinschaftsaussagen hinter der DMT-Code-Frage.",
    },
  },
  people: {
    en: {
      title: "People | DMT Code",
      description:
        "Entity profiles for the people whose work this record is built on.",
    },
    es: {
      title: "Personas | DMT Code",
      description:
        "Perfiles de las personas cuyo trabajo sostiene este registro.",
    },
    de: {
      title: "Personen | DMT Code",
      description:
        "Profile der Personen, auf deren Arbeit dieses Verzeichnis aufbaut.",
    },
  },
  prepare: {
    en: {
      title: "Prepare. Laser diffraction research kits. | DMT Code",
      description:
        "Four laser diffraction research kits for one, one to two, two to three, or up to six observers, covering 650, 532 and 405 nm, with diffraction optics and a semicircle line maker in every kit; observation documents are free PDF downloads. Sold by Meridian Optics Lab.",
    },
    es: {
      title:
        "Preparación. Kits de investigación de difracción láser. | DMT Code",
      description:
        "Cuatro kits de investigacion de difraccion laser para uno, uno o dos, dos o tres, o hasta seis observadores, que cubren 650, 532 y 405 nm, con optica de difraccion y un semicirculo generador de linea en cada kit; los documentos de observacion son PDF gratuitos. Vendidos por Meridian Optics Lab.",
    },
    de: {
      title:
        "Vorbereitung. Forschungskits zur Laserbeugung. | DMT Code",
      description:
        "Vier Laserbeugungs-Forschungskits fuer einen, ein bis zwei, zwei bis drei oder bis zu sechs Beobachter, mit 650, 532 und 405 nm, Beugungsoptik und einem Halbkreis-Linienmacher in jedem Kit; Beobachtungsdokumente sind kostenlose PDFs. Verkauft von Meridian Optics Lab.",
    },
  },
  "evidence-map": {
    en: {
      title: "Is the DMT code real? Evidence Timeline and Analysis | DMT Code",
      description:
        "A balanced evidence timeline with peer reviewed citations and resolved DOIs from 1926 to 2025. Verifiability and falsifiability, laid out openly.",
    },
    es: {
      title: "¿Es real el código DMT? Cronología y análisis de la evidencia | DMT Code",
      description:
        "Cronología equilibrada de la evidencia con citas revisadas por pares y DOI resueltos, de 1926 a 2025. Verificabilidad y falsabilidad, expuestas abiertamente.",
    },
    de: {
      title: "Ist der DMT-Code real? Evidenz-Chronologie und Analyse | DMT Code",
      description:
        "Ausgewogene Evidenz-Chronologie mit begutachteten Quellen und aufgelösten DOIs von 1926 bis 2025. Überprüfbarkeit und Falsifizierbarkeit, offen dargelegt.",
    },
  },
  protocols: {
    en: {
      title: "Protocol catalogue | DMT Code",
      description:
        "Catalogue of psychedelic and 650 nm laser protocols indexed by the DMT Code project.",
    },
    es: {
      title: "Catálogo de protocolos | DMT Code",
      description:
        "Catálogo de protocolos psicodélicos y de láser de 650 nm indexados por el proyecto DMT Code.",
    },
    de: {
      title: "Protokollkatalog | DMT Code",
      description:
        "Katalog psychedelischer und 650 nm Laserprotokolle, indexiert vom DMT-Code-Projekt.",
    },
  },
  registry: {
    en: {
      title: "Visual Symbol Registry | DMT Code",
      description:
        "Open catalogue of visual forms reported in connection with N,N-DMT experiences, with machine readable data under CC-BY-4.0.",
    },
    es: {
      title: "Registro de símbolos visuales | DMT Code",
      description:
        "Catálogo abierto de formas visuales reportadas en relación con experiencias de N,N-DMT, con datos legibles por máquina bajo CC-BY-4.0.",
    },
    de: {
      title: "Register visueller Symbole | DMT Code",
      description:
        "Offener Katalog visueller Formen, die im Zusammenhang mit N,N-DMT-Erfahrungen berichtet werden, mit maschinenlesbaren Daten unter CC-BY-4.0.",
    },
  },
  trials: {
    en: {
      title: "Trials, Studies and Experiments | DMT Code",
      description:
        "Registered clinical trials involving DMT and related compounds, updated from public registries, listed alongside typed community experiments, pilot reports and claims. Only registered trials count as clinical evidence.",
    },
    es: {
      title: "Observatorio de ensayos clínicos | DMT Code",
      description:
        "Observatorio de ensayos clínicos relacionados con DMT con estado, patrocinador, fase y enlaces de solicitud. Actualizado desde registros públicos.",
    },
    de: {
      title: "Observatorium klinischer Studien | DMT Code",
      description:
        "Observatorium DMT-bezogener klinischer Studien mit Status, Sponsor, Phase und Bewerbungslinks. Aktualisiert aus öffentlichen Studienregistern.",
    },
  },
  bibliography: {
    en: {
      title: "Research Bibliography | DMT Code",
      description:
        "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds. Filter by content type, authority, stance, tag, and year.",
    },
    es: {
      title: "Bibliografía de investigación | DMT Code",
      description:
        "Biblioteca con puntuación de postura sobre N,N-DMT, 5-MeO-DMT y compuestos relacionados. Filtre por tipo, autoridad, postura, etiqueta y año.",
    },
    de: {
      title: "Forschungsbibliografie | DMT Code",
      description:
        "Forschungsbibliothek mit Haltungsbewertung zu N,N-DMT, 5-MeO-DMT und verwandten Substanzen. Filterbar nach Typ, Autorität, Haltung, Tag und Jahr.",
    },
  },
  dataset: {
    en: {
      title: "Machine Readable Dataset | DMT Code",
      description:
        "The unified DMT Code corpus. Bibliography, clinical trials, and approved symbols in one JSON document under CC-BY-4.0. Filterable by facet.",
    },
    es: {
      title: "Conjunto de datos legible por máquina | DMT Code",
      description:
        "El corpus unificado de DMT Code. Bibliografía, ensayos clínicos y símbolos aprobados en un solo JSON bajo CC-BY-4.0. Filtrable por faceta.",
    },
    de: {
      title: "Maschinenlesbarer Datensatz | DMT Code",
      description:
        "Das vereinheitlichte DMT-Code-Korpus. Bibliografie, klinische Studien und freigegebene Symbole in einem JSON unter CC-BY-4.0. Nach Facetten filterbar.",
    },
  },
  about: {
    en: {
      title: "About the DMT Code project | DMT Code",
      description:
        "Why the DMT Code project exists, how it operates, and how to inspect or critique the record.",
    },
    es: {
      title: "Sobre el proyecto DMT Code | DMT Code",
      description:
        "Por qué existe el proyecto DMT Code, cómo opera y cómo inspeccionar o criticar el registro.",
    },
    de: {
      title: "Über das DMT-Code-Projekt | DMT Code",
      description:
        "Warum das DMT-Code-Projekt existiert, wie es arbeitet und wie man das Verzeichnis prüfen oder kritisieren kann.",
    },
  },
  critiques: {
    en: {
      title: "Critiques and limitations | DMT Code",
      description:
        "Known limitations of the DMT Code method and dataset. Selection effects, cultural priors, and reasons the convergence signal may not survive scrutiny.",
    },
    es: {
      title: "Críticas y limitaciones | DMT Code",
      description:
        "Limitaciones conocidas del método y los datos. Efectos de selección, sesgos culturales y razones por las que la señal de convergencia puede no resistir el escrutinio.",
    },
    de: {
      title: "Kritik und Grenzen | DMT Code",
      description:
        "Bekannte Grenzen von Methode und Datensatz. Selektionseffekte, kulturelle Vorannahmen und Gründe, warum das Konvergenzsignal einer Prüfung nicht standhält.",
    },
  },
  "null-reports": {
    en: {
      title: "Null reports dashboard | DMT Code",
      description:
        "Public dashboard of negative and null replication results submitted to the DMT Code project.",
    },
    es: {
      title: "Panel de reportes nulos | DMT Code",
      description:
        "Panel público de resultados de replicación negativos y nulos enviados al proyecto DMT Code.",
    },
    de: {
      title: "Dashboard der Nullbefunde | DMT Code",
      description:
        "Öffentliches Dashboard negativer und nuller Replikationsergebnisse, die dem DMT-Code-Projekt gemeldet wurden.",
    },
  },
  events: {
    en: {
      title: "Research Timeline and Events | DMT Code",
      description:
        "Community reported research events, workshops, and DMT related clinical trial milestones. A scholarly reference timeline aggregated from public sources.",
    },
    es: {
      title: "Cronología de investigación y eventos | DMT Code",
      description:
        "Eventos de investigación, talleres e hitos de ensayos clínicos sobre DMT, reportados por la comunidad. Cronología de referencia de fuentes públicas.",
    },
    de: {
      title: "Forschungschronologie und Veranstaltungen | DMT Code",
      description:
        "Gemeldete Forschungsveranstaltungen, Workshops und Meilensteine DMT-bezogener Studien. Referenzchronologie aus öffentlichen Quellen.",
    },
  },
  glossary: {
    en: {
      title: "Glossary of key terms | DMT Code",
      description:
        "Definitions of the academic and technical terms used across the DMT Code project.",
    },
    es: {
      title: "Glosario de términos clave | DMT Code",
      description:
        "Definiciones de los términos académicos y técnicos usados en el proyecto DMT Code.",
    },
    de: {
      title: "Glossar zentraler Begriffe | DMT Code",
      description:
        "Definitionen der akademischen und technischen Begriffe, die im DMT-Code-Projekt verwendet werden.",
    },
  },
  methods: {
    en: {
      title: "Methods and protocol design | DMT Code",
      description:
        "The observation protocol, blinding approach, and data validation methods used by the DMT Code project.",
    },
    es: {
      title: "Métodos y diseño del protocolo | DMT Code",
      description:
        "El protocolo de observación, el enfoque de cegamiento y los métodos de validación de datos que usa el proyecto DMT Code.",
    },
    de: {
      title: "Methoden und Protokolldesign | DMT Code",
      description:
        "Das Beobachtungsprotokoll, das Verblindungsverfahren und die Datenvalidierung des DMT-Code-Projekts.",
    },
  },
  "open-questions": {
    en: {
      title: "Open research questions | DMT Code",
      description:
        "Unresolved research questions tracked by the DMT Code project.",
    },
    es: {
      title: "Preguntas de investigación abiertas | DMT Code",
      description:
        "Preguntas de investigación sin resolver que sigue el proyecto DMT Code.",
    },
    de: {
      title: "Offene Forschungsfragen | DMT Code",
      description:
        "Ungelöste Forschungsfragen, die das DMT-Code-Projekt verfolgt.",
    },
  },
  research: {
    en: {
      title: "Active research projects | DMT Code",
      description:
        "Ongoing research projects, collaborations, and findings related to the DMT Code paradigm.",
    },
    es: {
      title: "Proyectos de investigación activos | DMT Code",
      description:
        "Proyectos de investigación en curso, colaboraciones y hallazgos relacionados con el paradigma DMT Code.",
    },
    de: {
      title: "Laufende Forschungsprojekte | DMT Code",
      description:
        "Laufende Forschungsprojekte, Kooperationen und Befunde zum DMT-Code-Paradigma.",
    },
  },
  forecasts: {
    en: {
      title: "Research and technology forecasts | DMT Code",
      description:
        "Uncertainty-bounded forecasts for DMT research milestones and adjacent technology.",
    },
    es: {
      title: "Pronósticos de investigación y tecnología | DMT Code",
      description:
        "Pronósticos con márgenes de incertidumbre para hitos de investigación sobre DMT y tecnología adyacente.",
    },
    de: {
      title: "Prognosen zu Forschung und Technologie | DMT Code",
      description:
        "Prognosen mit Unsicherheitsspannen für DMT-Forschungsmeilensteine und angrenzende Technologie.",
    },
  },
  "protocol-guide": {
    en: {
      title: "650 nm Laser Protocol Guide | DMT Code",
      description:
        "Neutral overview of the reported 650 nm laser observation protocol, first described by Danny Goler in 2020: equipment, safety, and how observations are recorded.",
    },
    es: {
      title: "Guía del protocolo de láser de 650 nm | DMT Code",
      description:
        "Visión neutral del protocolo de observación con láser de 650 nm, descrito por Danny Goler en 2020: equipo, seguridad y cómo se registran las observaciones.",
    },
    de: {
      title: "Leitfaden zum 650 nm Laserprotokoll | DMT Code",
      description:
        "Neutraler Überblick zum 650 nm Beobachtungsprotokoll, 2020 von Danny Goler beschrieben: Ausrüstung, Sicherheit und wie Beobachtungen erfasst werden.",
    },
  },
  privacy: {
    en: {
      title: "Privacy | DMT Code",
      description:
        "What DMT Code collects, who processes it, and what becomes public.",
    },
    es: {
      title: "Privacidad | DMT Code",
      description:
        "Qué recopila DMT Code, quién lo procesa y qué se hace público.",
    },
    de: {
      title: "Datenschutz | DMT Code",
      description:
        "Was DMT Code erhebt, wer es verarbeitet und was öffentlich wird.",
    },
  },
  terms: {
    en: {
      title: "Terms | DMT Code",
      description:
        "The terms you agree to when you use DMT Code or contribute to it.",
    },
    es: {
      title: "Términos | DMT Code",
      description:
        "Los términos que acepta al usar DMT Code o al contribuir al proyecto.",
    },
    de: {
      title: "Nutzungsbedingungen | DMT Code",
      description:
        "Die Bedingungen, denen Sie zustimmen, wenn Sie DMT Code nutzen oder dazu beitragen.",
    },
  },
  disclosure: {
    en: {
      title: "Disclosure | DMT Code",
      description:
        "How this project makes money, who we have relationships with, and where the conflicts are.",
    },
    es: {
      title: "Divulgación | DMT Code",
      description:
        "Cómo gana dinero este proyecto, con quién tenemos relaciones y dónde están los conflictos.",
    },
    de: {
      title: "Offenlegung | DMT Code",
      description:
        "Wie dieses Projekt Geld verdient, mit wem wir Beziehungen unterhalten und wo die Interessenkonflikte liegen.",
    },
  },
  capture: {
    en: {
      title: "Capture a memory | DMT Code",
      description:
        "Record and seal a first person account of a visual form seen during a DMT session, before viewing the catalogue.",
    },
    es: {
      title: "Registrar un recuerdo | DMT Code",
      description:
        "Registre y selle un relato en primera persona de una forma visual vista durante una sesión con DMT, antes de ver el catálogo.",
    },
    de: {
      title: "Eine Erinnerung festhalten | DMT Code",
      description:
        "Erfassen und versiegeln Sie einen Ich-Bericht einer visuellen Form aus einer DMT-Sitzung, bevor Sie den Katalog ansehen.",
    },
  },
  join: {
    en: {
      title: "Help build it | DMT Code",
      description:
        "Volunteer to help test whether independent reports of visual symbols actually converge. Recorders, translators, analysts, and developers welcome.",
    },
    es: {
      title: "Ayude a construirlo | DMT Code",
      description:
        "Colabore para probar si los reportes independientes de símbolos visuales realmente convergen. Buscamos registradores, traductores, analistas y desarrolladores.",
    },
    de: {
      title: "Hilf mit beim Aufbau | DMT Code",
      description:
        "Mitmachen und prüfen, ob unabhängige Berichte visueller Symbole tatsächlich konvergieren. Erfasser, Übersetzer, Analysten und Entwickler willkommen.",
    },
  },
  "co-witnesses": {
    en: {
      title: "Co-witness wall | DMT Code",
      description:
        "Field notes from people who independently reported the same visual form. Opt-in only, shown by handle and avatar, with no personal details.",
    },
    es: {
      title: "Muro de co-testigos | DMT Code",
      description:
        "Notas de personas que reportaron de forma independiente la misma forma visual. Solo con consentimiento, por alias y avatar, sin datos personales.",
    },
    de: {
      title: "Mitzeugen-Wand | DMT Code",
      description:
        "Notizen von Personen, die unabhängig dieselbe visuelle Form berichteten. Nur mit Zustimmung, per Handle und Avatar, ohne persönliche Daten.",
    },
  },
  "submit-symbol": {

    en: {
      title: "Submit a symbol to the registry | DMT Code",
      description:
        "The drawing tool for adding a symbol to the DMT Code visual registry with its observation metadata. Open to anyone, with no account required.",
    },
    es: {
      title: "Enviar un símbolo al registro | DMT Code",
      description:
        "La herramienta de dibujo para añadir un símbolo al registro visual de DMT Code con sus metadatos de observación.",
    },
    de: {
      title: "Ein Symbol an das Register senden | DMT Code",
      description:
        "Das Zeichenwerkzeug, um dem visuellen Register von DMT Code ein Symbol samt Beobachtungsmetadaten hinzuzufügen.",
    },
  },
};

/**
 * Resolve index-page chrome. Any miss on locale degrades to English, never to
 * an empty string and never to the key itself. An unknown key returns empty
 * strings so the caller can keep its own literal as the final fallback.
 * `vars` fills {token} placeholders (used by the chronology, whose title
 * carries live year bounds and a live record count).
 */
export function uiCopy(
  key: string,
  locale: Loc = "en",
  vars?: Record<string, string | number>,
): UiCopy {
  const entry = UI_STRINGS[key];
  if (!entry) return { title: "", description: "" };
  const copy = entry[locale] ?? entry.en;
  const title = copy.title || entry.en.title;
  const description = copy.description || entry.en.description;
  if (!vars) return { title, description };
  const fill = (s: string) =>
    s.replace(/\{(\w+)\}/g, (_m, k) => (k in vars ? String(vars[k]) : _m));
  return { title: fill(title), description: fill(description) };
}

export const HUB_LABELS: Record<string, Record<Loc, string>> = {
  related: { en: "Related", es: "Relacionado", de: "Verwandt" },
  "link-registry": { en: "Visual symbol registry", es: "Registro de símbolos visuales", de: "Register visueller Symbole" },
  "link-bibliography": { en: "Research bibliography", es: "Bibliografía de investigación", de: "Forschungsbibliografie" },
  "link-evidence-map": { en: "Evidence map", es: "Mapa de evidencia", de: "Evidenzkarte" },
  "link-corpus": { en: "Machine readable corpus", es: "Corpus legible por máquina", de: "Maschinenlesbares Korpus" },
  "theories-h1": { en: "Open theories", es: "Teorías abiertas", de: "Offene Theorien" },
  "theories-p1": {
    en: "Theories are not evidence. They are explanations that people have offered for what could account for the reported DMT code phenomenon. Read them as candidate hypotheses to be tested, not as findings.",
    es: "Las teorías no son evidencia. Son explicaciones que distintas personas han propuesto para dar cuenta del fenómeno reportado del código DMT. Léalas como hipótesis candidatas por poner a prueba, no como hallazgos.",
    de: "Theorien sind keine Belege. Es sind Erklärungen, die Menschen dafür vorgeschlagen haben, was das berichtete DMT-Code-Phänomen erklären könnte. Lesen Sie sie als zu prüfende Hypothesen, nicht als Befunde.",
  },
  "theories-p2": {
    en: "Entries here are either curated from the public record (published, attributed positions) or submitted by the community and reviewed before appearing. Votes on this page are never seeded or fabricated; every count reflects real reader activity.",
    es: "Las entradas provienen del registro público (posiciones publicadas y atribuidas) o son enviadas por la comunidad y revisadas antes de aparecer. Los votos de esta página nunca se siembran ni se fabrican; cada recuento refleja actividad real de lectores.",
    de: "Die Einträge stammen entweder aus öffentlichen Quellen (veröffentlichte, zugeschriebene Positionen) oder werden von der Gemeinschaft eingereicht und vor der Veröffentlichung geprüft. Stimmen auf dieser Seite werden nie vorbelegt oder erfunden; jede Zahl spiegelt echte Leseraktivität wider.",
  },
  "theories-h2": { en: "Theories", es: "Teorías", de: "Theorien" },
  "theories-empty": { en: "No approved theories are currently indexed.", es: "Actualmente no hay teorías aprobadas indexadas.", de: "Derzeit sind keine freigegebenen Theorien indexiert." },
  "origin-record": { en: "From the public record", es: "Del registro público", de: "Aus öffentlichen Quellen" },
  "origin-community": { en: "Community", es: "Comunidad", de: "Gemeinschaft" },
  proponent: { en: "Proponent:", es: "Proponente:", de: "Vertreter:" },
  "full-argument": { en: "Full argument", es: "Argumento completo", de: "Vollständiges Argument" },
  source: { en: "Source:", es: "Fuente:", de: "Quelle:" },
  tags: { en: "Tags:", es: "Etiquetas:", de: "Schlagwörter:" },
  "retreats-h1": { en: "Retreat centers", es: "Centros de retiro", de: "Retreat-Zentren" },
  "retreats-protocol": {
    en: "We know of no legal retreat or public event that runs this laser observation protocol with inhaled N,N-DMT. The listings below are for context only and do not run it. If that changes, it will be stated here first.",
    es: "No conocemos ningún retiro legal ni evento público que ejecute este protocolo de observación con láser con N,N-DMT inhalado. Los listados siguientes se ofrecen solo como contexto y no lo ejecutan. Si eso cambia, se indicará aquí primero.",
    de: "Uns ist kein legales Retreat und keine öffentliche Veranstaltung bekannt, die dieses Laserbeobachtungsprotokoll mit inhaliertem N,N-DMT durchführt. Die folgenden Einträge dienen nur dem Kontext und führen es nicht durch. Sollte sich das ändern, wird es hier zuerst vermerkt.",
  },
  "retreats-p1": {
    en: "Centers that operate openly and publish who they are, where they operate, and under what legal framework. This list is short on purpose. Centers we could not confirm are currently operating are not shown.",
    es: "Centros que operan abiertamente y publican quiénes son, dónde operan y bajo qué marco legal. Esta lista es corta a propósito. Los centros cuya operación actual no pudimos confirmar no se muestran.",
    de: "Zentren, die offen arbeiten und angeben, wer sie sind, wo sie tätig sind und in welchem rechtlichen Rahmen. Diese Liste ist absichtlich kurz. Zentren, deren laufender Betrieb wir nicht bestätigen konnten, werden nicht angezeigt.",
  },
  "retreats-p2": {
    en: "A listing here is not an endorsement. Psychedelic retreats carry real medical and psychological risk, and the legal position varies by country and changes. Verify current legal status, medical screening practice, staff credentials and emergency procedures directly with the center before you book.",
    es: "Un listado aquí no es un aval. Los retiros psicodélicos conllevan riesgos médicos y psicológicos reales, y la situación legal varía según el país y cambia. Verifique el estatus legal vigente, la práctica de cribado médico, las credenciales del personal y los procedimientos de emergencia directamente con el centro antes de reservar.",
    de: "Ein Eintrag hier ist keine Empfehlung. Psychedelische Retreats bergen reale medizinische und psychische Risiken, und die Rechtslage ist je nach Land unterschiedlich und ändert sich. Klären Sie den aktuellen Rechtsstatus, die medizinische Prüfung, die Qualifikation des Personals und die Notfallverfahren direkt mit dem Zentrum, bevor Sie buchen.",
  },
  "retreats-centers": { en: "Centers", es: "Centros", de: "Zentren" },
  "events-upcoming": { en: "Upcoming events", es: "Próximos eventos", de: "Kommende Veranstaltungen" },
  "events-past": { en: "Past events", es: "Eventos pasados", de: "Vergangene Veranstaltungen" },
  "events-retreats": { en: "Retreats", es: "Retiros", de: "Retreats" },
  "events-empty-h2": { en: "No approved events or retreats yet", es: "Aún no hay eventos ni retiros aprobados", de: "Noch keine freigegebenen Veranstaltungen oder Retreats" },
  "events-empty-p": { en: "Nothing has been approved for this timeline yet. Submissions are reviewed before publication.", es: "Todavía no se ha aprobado nada para esta cronología. Los envíos se revisan antes de su publicación.", de: "Für diese Chronologie wurde noch nichts freigegeben. Einreichungen werden vor der Veröffentlichung geprüft." },
  "events-note": { en: "Scholarly reference only. Inclusion does not constitute endorsement.", es: "Solo como referencia académica. La inclusión no constituye un aval.", de: "Nur als wissenschaftliche Referenz. Aufnahme bedeutet keine Empfehlung." },
  "articles-h1": { en: "Articles", es: "Artículos", de: "Artikel" },
  "articles-p1": {
    en: "Answer shaped articles built on named evidence in the DMT Code corpus. Each piece links every trial, paper, symbol, and protocol it rests on, so readers and language models can verify the source directly. Every article is published under CC-BY-4.0.",
    es: "Artículos con forma de respuesta, construidos sobre evidencia nombrada del corpus de DMT Code. Cada pieza enlaza cada ensayo, artículo, símbolo y protocolo en que se apoya, para que lectores y modelos de lenguaje puedan verificar la fuente directamente. Todos los artículos se publican bajo CC-BY-4.0.",
    de: "Antwortförmige Artikel, die auf benannter Evidenz aus dem DMT-Code-Korpus aufbauen. Jeder Beitrag verlinkt jede Studie, Arbeit, jedes Symbol und Protokoll, auf dem er beruht, damit Leser und Sprachmodelle die Quelle direkt prüfen können. Jeder Artikel erscheint unter CC-BY-4.0.",
  },
  "articles-all": { en: "All articles", es: "Todos los artículos", de: "Alle Artikel" },
  "articles-empty": { en: "No articles have been published yet.", es: "Aún no se ha publicado ningún artículo.", de: "Es wurden noch keine Artikel veröffentlicht." },
  "articles-machine": { en: "Machine access", es: "Acceso para máquinas", de: "Maschinenzugang" },
  "articles-json": { en: "Full corpus JSON (CC-BY-4.0)", es: "Corpus completo en JSON (CC-BY-4.0)", de: "Vollständiges Korpus als JSON (CC-BY-4.0)" },
  "articles-rss": { en: "RSS feed", es: "Canal RSS", de: "RSS-Feed" },
  "home-latest": { en: "Latest article", es: "Último artículo", de: "Neuester Artikel" },
  "home-read-all": { en: "Read all articles", es: "Leer todos los artículos", de: "Alle Artikel lesen" },
};

export function hubLabel(key: string, locale: Loc = "en"): string {
  const entry = HUB_LABELS[key];
  if (!entry) return "";
  return entry[locale] || entry.en;
}
