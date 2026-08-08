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
      title: "DMT Code | Investigacion de simbolos visuales con laser de 650nm",
      description:
        "Registro abierto y mantenido por la comunidad de formas visuales reportadas durante experiencias con N,N-DMT y los protocolos de laser de 650 nm asociados.",
    },
    de: {
      title: "DMT Code | Forschung zu visuellen Symbolen mit 650nm-Laser",
      description:
        "Offenes, von der Gemeinschaft gepflegtes Verzeichnis visueller Formen aus N,N-DMT-Erfahrungen und der damit verbundenen 650 nm Laserprotokolle.",
    },
  },
  theories: {
    en: {
      title: "Open theories: what could the DMT code be? | DMT Code",
      description:
        "Attributed explanatory theories for the reported DMT code phenomenon. Curated from the public record and moderated community submissions. Theories are not evidence.",
    },
    es: {
      title: "Teorias abiertas: que podria ser el codigo DMT? | DMT Code",
      description:
        "Teorias explicativas atribuidas sobre el fenomeno reportado. Curadas del registro publico y de aportes moderados. Las teorias no son evidencia.",
    },
    de: {
      title: "Offene Theorien: was koennte der DMT-Code sein? | DMT Code",
      description:
        "Zugeschriebene Erklaerungstheorien zum berichteten Phaenomen. Kuratiert aus oeffentlichen Quellen und moderierten Beitraegen. Theorien sind keine Belege.",
    },
  },
  articles: {
    en: {
      title: "Articles | DMT Code",
      description:
        "Long form articles that answer specific questions using the DMT Code corpus. Every article names the trials, papers, symbols, and protocols it is built on.",
    },
    es: {
      title: "Articulos | DMT Code",
      description:
        "Articulos extensos que responden preguntas concretas con el corpus de DMT Code. Cada uno nombra los ensayos, articulos, simbolos y protocolos que usa.",
    },
    de: {
      title: "Artikel | DMT Code",
      description:
        "Ausfuehrliche Artikel, die konkrete Fragen anhand des DMT-Code-Korpus beantworten. Jeder nennt die Studien, Arbeiten, Symbole und Protokolle dahinter.",
    },
  },
  guides: {
    en: {
      title: "Guides | DMT Code",
      description:
        "Direct answers to the questions people actually ask, each one graded by how strong the evidence behind it really is.",
    },
    es: {
      title: "Guias | DMT Code",
      description:
        "Respuestas directas a las preguntas que la gente realmente hace, cada una calificada segun la solidez real de la evidencia que la respalda.",
    },
    de: {
      title: "Leitfaeden | DMT Code",
      description:
        "Direkte Antworten auf die Fragen, die tatsaechlich gestellt werden, jeweils bewertet danach, wie belastbar die zugrunde liegende Evidenz wirklich ist.",
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
        "Centros de retiro psicodelico que operan abiertamente y publican quienes son y donde estan. Un listado no es un aval. Verifique estatus legal y cribado medico con cada centro.",
    },
    de: {
      title: "Retreat-Zentren | DMT Code",
      description:
        "Psychedelische Retreat-Zentren, die offen arbeiten und angeben, wer sie sind und wo. Ein Eintrag ist keine Empfehlung. Rechtsstatus und medizinische Pruefung direkt klaeren.",
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
        "Preguntas sobre el proyecto DMT Code y como prepararse para observar | DMT Code",
      description:
        "Respuestas a preguntas frecuentes sobre el proyecto DMT Code: que es, como prepararse con seguridad, por que los datos son abiertos y como se mide la convergencia.",
    },
    de: {
      title:
        "Fragen zum DMT-Code-Projekt und zur Vorbereitung der Beobachtung | DMT Code",
      description:
        "Antworten auf haeufige Fragen zum DMT-Code-Projekt: was es ist, wie man sich sicher vorbereitet, warum die Daten offen sind und wie Konvergenz gemessen wird.",
    },
  },
  timeline: {
    en: {
      title: "Chronology of the DMT code question, {first} to {last} | DMT Code",
      description:
        "{n} dated records from {first} to {last}. Each one states what kind of evidence it is, and every DOI has been resolved against Crossref.",
    },
    es: {
      title: "Cronologia de la cuestion del codigo DMT, {first} a {last} | DMT Code",
      description:
        "{n} registros fechados de {first} a {last}. Cada uno indica que tipo de evidencia es, y cada DOI fue resuelto contra Crossref.",
    },
    de: {
      title: "Chronologie der DMT-Code-Frage, {first} bis {last} | DMT Code",
      description:
        "{n} datierte Eintraege von {first} bis {last}. Jeder nennt die Art der Evidenz, und jede DOI wurde gegen Crossref aufgeloest.",
    },
  },
  "timeline-empty": {
    en: {
      title: "Chronology | DMT Code",
      description:
        "A dated record of the published research, legal decisions and community claims behind the DMT code question.",
    },
    es: {
      title: "Cronologia | DMT Code",
      description:
        "Un registro fechado de la investigacion publicada, las decisiones legales y las afirmaciones de la comunidad tras la cuestion del codigo DMT.",
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
      title: "Prepare. Kits and group bundles for careful practice. | DMT Code",
      description:
        "Kits and group bundles for careful practice. The two kits that ship now are printed material only. Everything with a 650 nm module is preorder.",
    },
    es: {
      title: "Preparacion. Kits y paquetes grupales para una practica cuidadosa. | DMT Code",
      description:
        "Kits y paquetes grupales para una practica cuidadosa. Los dos kits que se envian ahora son solo material impreso. Todo lo que lleva modulo de 650 nm es reserva.",
    },
    de: {
      title: "Vorbereitung. Kits und Gruppenpakete fuer sorgfaeltige Praxis. | DMT Code",
      description:
        "Kits und Gruppenpakete fuer sorgfaeltige Praxis. Die zwei sofort lieferbaren Kits enthalten nur Druckmaterial. Alles mit 650 nm Modul ist Vorbestellung.",
    },
  },
  "evidence-map": {
    en: {
      title: "Is the DMT code real? Evidence Timeline and Analysis | DMT Code",
      description:
        "A balanced evidence timeline with peer reviewed citations and resolved DOIs from 1926 to 2025. Verifiability and falsifiability, laid out openly.",
    },
    es: {
      title: "Es real el codigo DMT? Cronologia y analisis de la evidencia | DMT Code",
      description:
        "Cronologia equilibrada de la evidencia con citas revisadas por pares y DOI resueltos, de 1926 a 2025. Verificabilidad y falsabilidad, expuestas abiertamente.",
    },
    de: {
      title: "Ist der DMT-Code real? Evidenz-Chronologie und Analyse | DMT Code",
      description:
        "Ausgewogene Evidenz-Chronologie mit begutachteten Quellen und aufgeloesten DOIs von 1926 bis 2025. Ueberpruefbarkeit und Falsifizierbarkeit, offen dargelegt.",
    },
  },
  protocols: {
    en: {
      title: "Protocol catalogue | DMT Code",
      description:
        "Catalogue of psychedelic and 650 nm laser protocols indexed by the DMT Code project.",
    },
    es: {
      title: "Catalogo de protocolos | DMT Code",
      description:
        "Catalogo de protocolos psicodelicos y de laser de 650 nm indexados por el proyecto DMT Code.",
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
      title: "Registro de simbolos visuales | DMT Code",
      description:
        "Catalogo abierto de formas visuales reportadas en relacion con experiencias de N,N-DMT, con datos legibles por maquina bajo CC-BY-4.0.",
    },
    de: {
      title: "Register visueller Symbole | DMT Code",
      description:
        "Offener Katalog visueller Formen, die im Zusammenhang mit N,N-DMT-Erfahrungen berichtet werden, mit maschinenlesbaren Daten unter CC-BY-4.0.",
    },
  },
  trials: {
    en: {
      title: "Clinical Trials Observatory | DMT Code",
      description:
        "Observatory of DMT related clinical trials with status, sponsor, phase, and application links. Updated from public trial registries.",
    },
    es: {
      title: "Observatorio de ensayos clinicos | DMT Code",
      description:
        "Observatorio de ensayos clinicos relacionados con DMT con estado, patrocinador, fase y enlaces de solicitud. Actualizado desde registros publicos.",
    },
    de: {
      title: "Observatorium klinischer Studien | DMT Code",
      description:
        "Observatorium DMT-bezogener klinischer Studien mit Status, Sponsor, Phase und Bewerbungslinks. Aktualisiert aus oeffentlichen Studienregistern.",
    },
  },
  bibliography: {
    en: {
      title: "Research Bibliography | DMT Code",
      description:
        "Stance scored research library covering N,N-DMT, 5-MeO-DMT, and related compounds. Filter by content type, authority, stance, tag, and year.",
    },
    es: {
      title: "Bibliografia de investigacion | DMT Code",
      description:
        "Biblioteca de investigacion con puntuacion de postura sobre N,N-DMT, 5-MeO-DMT y compuestos relacionados. Filtre por tipo, autoridad, postura, etiqueta y ano.",
    },
    de: {
      title: "Forschungsbibliografie | DMT Code",
      description:
        "Forschungsbibliothek mit Haltungsbewertung zu N,N-DMT, 5-MeO-DMT und verwandten Substanzen. Filterbar nach Typ, Autoritaet, Haltung, Tag und Jahr.",
    },
  },
  dataset: {
    en: {
      title: "Machine Readable Dataset | DMT Code",
      description:
        "The unified DMT Code corpus. Bibliography, clinical trials, and approved symbols in one JSON document under CC-BY-4.0. Filterable by facet.",
    },
    es: {
      title: "Conjunto de datos legible por maquina | DMT Code",
      description:
        "El corpus unificado de DMT Code. Bibliografia, ensayos clinicos y simbolos aprobados en un solo JSON bajo CC-BY-4.0. Filtrable por faceta.",
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
        "Por que existe el proyecto DMT Code, como opera y como inspeccionar o criticar el registro.",
    },
    de: {
      title: "Ueber das DMT-Code-Projekt | DMT Code",
      description:
        "Warum das DMT-Code-Projekt existiert, wie es arbeitet und wie man das Verzeichnis pruefen oder kritisieren kann.",
    },
  },
  critiques: {
    en: {
      title: "Critiques and limitations | DMT Code",
      description:
        "Known limitations of the DMT Code method and dataset. Selection effects, cultural priors, and reasons the convergence signal may not survive scrutiny.",
    },
    es: {
      title: "Criticas y limitaciones | DMT Code",
      description:
        "Limitaciones conocidas del metodo y los datos. Efectos de seleccion, sesgos culturales y razones por las que la senal de convergencia puede no resistir el escrutinio.",
    },
    de: {
      title: "Kritik und Grenzen | DMT Code",
      description:
        "Bekannte Grenzen von Methode und Datensatz. Selektionseffekte, kulturelle Vorannahmen und Gruende, warum das Konvergenzsignal einer Pruefung nicht standhalten koennte.",
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
        "Panel publico de resultados de replicacion negativos y nulos enviados al proyecto DMT Code.",
    },
    de: {
      title: "Dashboard der Nullbefunde | DMT Code",
      description:
        "Oeffentliches Dashboard negativer und nuller Replikationsergebnisse, die dem DMT-Code-Projekt gemeldet wurden.",
    },
  },
  events: {
    en: {
      title: "Research Timeline and Events | DMT Code",
      description:
        "Community reported research events, workshops, and DMT related clinical trial milestones. A scholarly reference timeline aggregated from public sources.",
    },
    es: {
      title: "Cronologia de investigacion y eventos | DMT Code",
      description:
        "Eventos de investigacion, talleres e hitos de ensayos clinicos relacionados con DMT, reportados por la comunidad. Cronologia de referencia de fuentes publicas.",
    },
    de: {
      title: "Forschungschronologie und Veranstaltungen | DMT Code",
      description:
        "Von der Gemeinschaft gemeldete Forschungsveranstaltungen, Workshops und Meilensteine DMT-bezogener Studien. Referenzchronologie aus oeffentlichen Quellen.",
    },
  },
  glossary: {
    en: {
      title: "Glossary of key terms | DMT Code",
      description:
        "Definitions of the academic and technical terms used across the DMT Code project.",
    },
    es: {
      title: "Glosario de terminos clave | DMT Code",
      description:
        "Definiciones de los terminos academicos y tecnicos usados en el proyecto DMT Code.",
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
      title: "Metodos y diseno del protocolo | DMT Code",
      description:
        "El protocolo de observacion, el enfoque de cegamiento y los metodos de validacion de datos que usa el proyecto DMT Code.",
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
      title: "Preguntas de investigacion abiertas | DMT Code",
      description:
        "Preguntas de investigacion sin resolver que sigue el proyecto DMT Code.",
    },
    de: {
      title: "Offene Forschungsfragen | DMT Code",
      description:
        "Ungeloeste Forschungsfragen, die das DMT-Code-Projekt verfolgt.",
    },
  },
  research: {
    en: {
      title: "Active research projects | DMT Code",
      description:
        "Ongoing research projects, collaborations, and findings related to the DMT Code paradigm.",
    },
    es: {
      title: "Proyectos de investigacion activos | DMT Code",
      description:
        "Proyectos de investigacion en curso, colaboraciones y hallazgos relacionados con el paradigma DMT Code.",
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
      title: "Pronosticos de investigacion y tecnologia | DMT Code",
      description:
        "Pronosticos con margenes de incertidumbre para hitos de investigacion sobre DMT y tecnologia adyacente.",
    },
    de: {
      title: "Prognosen zu Forschung und Technologie | DMT Code",
      description:
        "Prognosen mit Unsicherheitsspannen fuer DMT-Forschungsmeilensteine und angrenzende Technologie.",
    },
  },
  "protocol-guide": {
    en: {
      title: "650 nm Laser Protocol Guide | DMT Code",
      description:
        "Neutral overview of the reported 650 nm laser observation protocol, first described by Danny Goler in 2020: equipment, safety, and how observations are recorded.",
    },
    es: {
      title: "Guia del protocolo de laser de 650 nm | DMT Code",
      description:
        "Vision neutral del protocolo de observacion con laser de 650 nm, descrito por Danny Goler en 2020: equipo, seguridad y como se registran las observaciones.",
    },
    de: {
      title: "Leitfaden zum 650 nm Laserprotokoll | DMT Code",
      description:
        "Neutraler Ueberblick zum 650 nm Beobachtungsprotokoll, 2020 von Danny Goler beschrieben: Ausruestung, Sicherheit und wie Beobachtungen erfasst werden.",
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
        "Que recopila DMT Code, quien lo procesa y que se hace publico.",
    },
    de: {
      title: "Datenschutz | DMT Code",
      description:
        "Was DMT Code erhebt, wer es verarbeitet und was oeffentlich wird.",
    },
  },
  terms: {
    en: {
      title: "Terms | DMT Code",
      description:
        "The terms you agree to when you use DMT Code or contribute to it.",
    },
    es: {
      title: "Terminos | DMT Code",
      description:
        "Los terminos que acepta al usar DMT Code o al contribuir al proyecto.",
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
      title: "Divulgacion | DMT Code",
      description:
        "Como gana dinero este proyecto, con quien tenemos relaciones y donde estan los conflictos.",
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
        "Registre y selle un relato en primera persona de una forma visual vista durante una sesion con DMT, antes de ver el catalogo.",
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
        "Volunteer to help test whether independent reports of visual symbols actually converge. Recorders, translators, analysts, developers, and test subjects welcome.",
    },
    es: {
      title: "Ayude a construirlo | DMT Code",
      description:
        "Colabore para probar si los reportes independientes de simbolos visuales realmente convergen. Buscamos registradores, traductores, analistas y desarrolladores.",
    },
    de: {
      title: "Hilf mit beim Aufbau | DMT Code",
      description:
        "Mitmachen und pruefen, ob unabhaengige Berichte visueller Symbole tatsaechlich konvergieren. Erfasser, Uebersetzer, Analysten und Entwickler willkommen.",
    },
  },
  "submit-symbol": {
    en: {
      title: "Submit a symbol to the registry | DMT Code",
      description:
        "The drawing tool for adding a symbol to the DMT Code visual registry with its observation metadata. Open to anyone, with no account required.",
    },
    es: {
      title: "Enviar un simbolo al registro | DMT Code",
      description:
        "La herramienta de dibujo para anadir un simbolo al registro visual de DMT Code con sus metadatos de observacion.",
    },
    de: {
      title: "Ein Symbol an das Register senden | DMT Code",
      description:
        "Das Zeichenwerkzeug, um dem visuellen Register von DMT Code ein Symbol samt Beobachtungsmetadaten hinzuzufuegen.",
    },
  },
};

/**
 * Resolve index-page chrome. Any miss on key or locale degrades to English,
 * never to an empty string and never to the key itself. `vars` fills {token}
 * placeholders (used by the chronology, whose title carries live year bounds).
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
    s.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? String(vars[k]) : m));
  return { title: fill(title), description: fill(description) };
}
