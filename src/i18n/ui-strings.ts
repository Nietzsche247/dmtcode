// MIRROR FILE. Source of truth: netlify/lib/ui-strings.ts.
// Edge functions cannot import from src/, and the SPA cannot import from
// netlify/lib/, so this file is a hand copy. Edit netlify/lib/ui-strings.ts
// first, then copy the UI_STRINGS object here verbatim.
// scripts/check-ui-strings-drift.mjs fails the build if the two disagree.

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
  documents: {
    en: {
      title: "Free protocol documents and the symbol set | DMT Code",
      description:
        "Every DMT Code document as a free PDF: screening card, observation field sheet, sober baseline protocol, AVP passthrough protocol, and the full symbol set with DOI. No account, CC BY 4.0, English, Spanish and German.",
    },
    es: {
      title: "Documentos de protocolo gratuitos y el conjunto de simbolos | DMT Code",
      description:
        "Todos los documentos de DMT Code en PDF gratuito: tarjeta de cribado, hoja de campo de observacion, protocolo de linea base sobria, protocolo AVP passthrough y el conjunto completo de simbolos con DOI. Sin cuenta, CC BY 4.0, en ingles, espanol y aleman.",
    },
    de: {
      title: "Kostenlose Protokolldokumente und der Symbolsatz | DMT Code",
      description:
        "Alle DMT-Code-Dokumente als kostenloses PDF: Screening-Karte, Beobachtungs-Feldblatt, Nuechtern-Basisprotokoll, AVP-Passthrough-Protokoll und der vollstaendige Symbolsatz mit DOI. Kein Konto, CC BY 4.0, auf Englisch, Spanisch und Deutsch.",
    },
  },
  answers: {
    en: {
      title: "Ten questions about the DMT laser claim, answered from the record | DMT Code",
      description:
        "How many observations exist, what Danny Goler's published setup actually used, whether the kits match it, how many independently validated matches there are, what a recognition means, which records are registered clinical trials, and the strongest evidence on both sides. Every figure computed from the live dataset.",
    },
    es: {
      title: "Diez preguntas sobre la afirmacion del laser DMT, respondidas desde el registro | DMT Code",
      description:
        "Cuantas observaciones existen, que uso realmente el montaje publicado de Danny Goler, si los kits coinciden con el, cuantas coincidencias validadas de forma independiente hay, que significa un reconocimiento, que registros son ensayos clinicos registrados, y la evidencia mas solida de ambos lados. Cada cifra se calcula a partir del conjunto de datos en vivo.",
    },
    de: {
      title: "Zehn Fragen zur DMT-Laser-Behauptung, aus dem Datenbestand beantwortet | DMT Code",
      description:
        "Wie viele Beobachtungen es gibt, was Danny Golers veroeffentlichter Aufbau tatsaechlich verwendete, ob die Kits dem entsprechen, wie viele unabhaengig bestaetigte Uebereinstimmungen existieren, was eine Wiedererkennung bedeutet, welche Datensaetze registrierte klinische Studien sind, und die staerksten Belege auf beiden Seiten. Jede Zahl wird aus dem Live-Datensatz berechnet.",
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
      title: "The Science Room: what has actually been measured | DMT Code",
      description:
        "The scientific counterpart to the theory board. Direct tests of the laser observation, mechanistic science, DMT science, methodology, and the projects open to work on.",
    },
    es: {
      title: "La sala de ciencia: qué se ha medido realmente | DMT Code",
      description:
        "La contraparte científica del tablero de teorías. Pruebas directas de la observación con láser, ciencia de mecanismos, ciencia del DMT, metodología y los proyectos abiertos.",
    },
    de: {
      title: "Der Wissenschaftsraum: was tatsächlich gemessen wurde | DMT Code",
      description:
        "Das wissenschaftliche Gegenstück zum Theorie-Board. Direkte Tests der Laserbeobachtung, Mechanismusforschung, DMT-Forschung, Methodik und die offenen Projekte.",
    },
  },
  "object-model": {
    en: {
      title: "Object model: how one experience becomes a record | DMT Code",
      description:
        "The seven levels between one person's experience and a canonical symbol candidate, and why the community symbol count and the registry glyph count are different numbers rather than two names for the same thing.",
    },
    es: {
      title: "Modelo de objetos: cómo una experiencia se convierte en registro | DMT Code",
      description:
        "Los siete niveles entre la experiencia de una persona y un símbolo canónico candidato, y por qué el recuento de símbolos de la comunidad y el de glifos del registro son cifras distintas y no dos nombres para lo mismo.",
    },
    de: {
      title: "Objektmodell: wie aus einer Erfahrung ein Datensatz wird | DMT Code",
      description:
        "Die sieben Ebenen zwischen der Erfahrung einer Person und einem kanonischen Symbolkandidaten, und warum die Zahl der Community-Symbole und die Zahl der Registerglyphen unterschiedliche Werte sind und nicht zwei Namen für dasselbe.",
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
  preregister: {
    en: {
      title: "Research pre-registration | DMT Code",
      description:
        "Pre-register a proposed physiological instrumentation study for the DMT Code open research call.",
    },
    es: {
      title: "Prerregistro de investigación | DMT Code",
      description:
        "Prerregistre un estudio propuesto de instrumentación fisiológica para la convocatoria abierta de investigación de DMT Code.",
    },
    de: {
      title: "Forschungs-Präregistrierung | DMT Code",
      description:
        "Registrieren Sie eine geplante physiologische Instrumentierungsstudie vorab für den offenen Forschungsaufruf von DMT Code.",
    },
  },
  // Store policy pages. "Meridian Optics Lab" is the legal seller and is never
  // translated, and neither is the " | Meridian Optics Lab via DMT Code" suffix.
  shipping: {
    en: {
      title: "Shipping Policy | Meridian Optics Lab via DMT Code",
      description:
        "Shipping timelines, tracking, packaging and international terms for Meridian Optics Lab, the store of record for DMT Code kits.",
    },
    es: {
      title: "Política de envíos | Meridian Optics Lab via DMT Code",
      description:
        "Plazos de envío, seguimiento, embalaje y condiciones internacionales de Meridian Optics Lab, la tienda de registro de los kits de DMT Code.",
    },
    de: {
      title: "Versandrichtlinie | Meridian Optics Lab via DMT Code",
      description:
        "Versandzeiten, Sendungsverfolgung, Verpackung und internationale Bedingungen von Meridian Optics Lab, dem Verkäufer der DMT-Code-Kits.",
    },
  },
  returns: {
    en: {
      title: "Returns and Refunds | Meridian Optics Lab via DMT Code",
      description:
        "Return eligibility, refund timelines and damaged item handling for Meridian Optics Lab, the store of record for DMT Code kits.",
    },
    es: {
      title: "Devoluciones y reembolsos | Meridian Optics Lab via DMT Code",
      description:
        "Condiciones de devolución, plazos de reembolso y gestión de artículos dañados de Meridian Optics Lab, la tienda de registro de los kits de DMT Code.",
    },
    de: {
      title: "Rückgabe und Erstattung | Meridian Optics Lab via DMT Code",
      description:
        "Rückgabebedingungen, Erstattungsfristen und Umgang mit beschädigten Artikeln bei Meridian Optics Lab, dem Verkäufer der DMT-Code-Kits.",
    },
  },
  "store-terms": {
    en: {
      title: "Terms of Service | Meridian Optics Lab via DMT Code",
      description:
        "Purchase terms, laser safety requirements, liability and governing law for Meridian Optics Lab, the store of record for DMT Code kits.",
    },
    es: {
      title: "Términos del servicio | Meridian Optics Lab via DMT Code",
      description:
        "Condiciones de compra, requisitos de seguridad láser, responsabilidad y ley aplicable de Meridian Optics Lab, la tienda de registro de los kits de DMT Code.",
    },
    de: {
      title: "Verkaufsbedingungen | Meridian Optics Lab via DMT Code",
      description:
        "Kaufbedingungen, Anforderungen an die Lasersicherheit, Haftung und anwendbares Recht von Meridian Optics Lab, dem Verkäufer der DMT-Code-Kits.",
    },
  },
  "store-contact": {
    en: {
      title: "Contact Information | Meridian Optics Lab via DMT Code",
      description:
        "Contact details and response times for Meridian Optics Lab, the store of record for DMT Code kits.",
    },
    es: {
      title: "Información de contacto | Meridian Optics Lab via DMT Code",
      description:
        "Datos de contacto y tiempos de respuesta de Meridian Optics Lab, la tienda de registro de los kits de DMT Code.",
    },
    de: {
      title: "Kontaktinformationen | Meridian Optics Lab via DMT Code",
      description:
        "Kontaktdaten und Antwortzeiten von Meridian Optics Lab, dem Verkäufer der DMT-Code-Kits.",
    },
  },
  // "The Discovery" is the film's title and is never translated.
  "the-discovery": {
    en: {
      title:
        "The Discovery (2026): release date, where to watch, and what the film claims",
      description:
        "The Discovery is an independent documentary about the DMT laser observation first reported by Danny Goler. Premiere window, ticket status, and what is and is not confirmed.",
    },
    es: {
      title:
        "The Discovery (2026): fecha de estreno, dónde verla y qué afirma la película",
      description:
        "The Discovery es un documental independiente sobre la observación con láser de 650 nm y N,N-DMT reportada por Danny Goler. Ventana de estreno, estado de las entradas y qué está confirmado y qué no.",
    },
    de: {
      title:
        "The Discovery (2026): Starttermin, wo man ihn sehen kann und was der Film behauptet",
      description:
        "The Discovery ist ein unabhängiger Dokumentarfilm über die von Danny Goler berichtete Laserbeobachtung mit 650 nm und N,N-DMT. Premierenzeitraum, Ticketstatus und was bestätigt ist und was nicht.",
    },
  },
  // One key per kit drill-down page at /products/<handle>, keyed product-<kit.id>.
  // Prices are deliberately absent: they live in src/data/kits.ts and would go
  // stale here. Laser class designations are absent too, so nothing in this
  // dictionary can restate a class in translated form.
  "product-solo": {
    en: {
      title: "Solo kit: 650 nm laser diffraction research kit for one observer | DMT Code",
      description:
        "Every part in the Solo kit with Arbor part numbers and quantities, the full photo set, and the vendor laser rating. Built for a single observer at 650 nm.",
    },
    es: {
      title: "Kit Solo: kit de investigación de difracción láser de 650 nm para un observador | DMT Code",
      description:
        "Todas las piezas del kit Solo con sus números de pieza Arbor y cantidades, el juego completo de fotos y la clasificación láser del fabricante. Para un solo observador a 650 nm.",
    },
    de: {
      title: "Solo-Kit: 650 nm Laserbeugungs-Forschungskit für einen Beobachter | DMT Code",
      description:
        "Alle Teile des Solo-Kits mit Arbor-Teilenummern und Mengen, der vollständige Fotosatz und die Herstellerangabe zur Laserklasse. Für einen einzelnen Beobachter bei 650 nm.",
    },
  },
  "product-dual": {
    en: {
      title: "Dual kit: 650 and 532 nm laser diffraction research kit for one to two observers | DMT Code",
      description:
        "Every part in the Dual kit with Arbor part numbers and quantities, the full photo set, and the vendor laser rating. One switchable source covering 650 and 532 nm.",
    },
    es: {
      title: "Kit Dual: kit de investigación de difracción láser de 650 y 532 nm para uno o dos observadores | DMT Code",
      description:
        "Todas las piezas del kit Dual con sus números de pieza Arbor y cantidades, el juego completo de fotos y la clasificación láser del fabricante. Una fuente conmutable de 650 y 532 nm.",
    },
    de: {
      title: "Dual-Kit: 650 und 532 nm Laserbeugungs-Forschungskit für ein bis zwei Beobachter | DMT Code",
      description:
        "Alle Teile des Dual-Kits mit Arbor-Teilenummern und Mengen, der vollständige Fotosatz und die Herstellerangabe zur Laserklasse. Eine umschaltbare Quelle für 650 und 532 nm.",
    },
  },
  "product-triad": {
    en: {
      title: "Triad kit: 650 and 405 nm laser diffraction research kit for two to three observers | DMT Code",
      description:
        "Every part in the Triad kit with Arbor part numbers and quantities, the full photo set, and vendor ratings listed per emitter. Two light sources covering 650 and 405 nm.",
    },
    es: {
      title: "Kit Triad: kit de investigación de difracción láser de 650 y 405 nm para dos o tres observadores | DMT Code",
      description:
        "Todas las piezas del kit Triad con sus números de pieza Arbor y cantidades, el juego completo de fotos y las clasificaciones del fabricante por cada emisor. Dos fuentes de luz: 650 y 405 nm.",
    },
    de: {
      title: "Triad-Kit: 650 und 405 nm Laserbeugungs-Forschungskit für zwei bis drei Beobachter | DMT Code",
      description:
        "Alle Teile des Triad-Kits mit Arbor-Teilenummern und Mengen, der vollständige Fotosatz und die Herstellerangaben je Emitter. Zwei Lichtquellen mit 650 und 405 nm.",
    },
  },
  "product-circle": {
    en: {
      title: "Circle kit: 650, 532 and 405 nm laser diffraction research kit for up to six observers | DMT Code",
      description:
        "Every part in the Circle kit with Arbor part numbers and quantities, the full photo set, and vendor ratings listed per emitter. Three light sources covering 650, 532 and 405 nm.",
    },
    es: {
      title: "Kit Circle: kit de investigación de difracción láser de 650, 532 y 405 nm para hasta seis observadores | DMT Code",
      description:
        "Todas las piezas del kit Circle con sus números de pieza Arbor y cantidades, el juego completo de fotos y las clasificaciones del fabricante por cada emisor. Tres fuentes de luz: 650, 532 y 405 nm.",
    },
    de: {
      title: "Circle-Kit: 650, 532 und 405 nm Laserbeugungs-Forschungskit für bis zu sechs Beobachter | DMT Code",
      description:
        "Alle Teile des Circle-Kits mit Arbor-Teilenummern und Mengen, der vollständige Fotosatz und die Herstellerangaben je Emitter. Drei Lichtquellen mit 650, 532 und 405 nm.",
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
