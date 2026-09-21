// Country legal frames for /legal/:country.
//
// Editorial rules for this file, which are the reason it exists as data rather
// than prose scattered through the renderer:
//
// 1. Every factual claim carries a source URL that was fetched and read on the
//    verified date. A claim without a source does not go in. An omission is
//    correct; a plausible sentence with no source behind it is not.
// 2. A country frame is a frame. It is not a licence for any one operator and
//    it is not legal advice. The page says so on its face.
// 3. Where sources conflict, the page says they conflict and names both. It
//    does not pick the more convenient one and drop the other.
// 4. "Grey area" means enforcement is weak, not that the conduct is lawful.
//    Anywhere this file uses the phrase it also states the exposure.
// 5. verified is the date a human last read the sources on that row. It is not
//    a computed timestamp and must not be refreshed without re-reading them.

export interface LegalSource {
  label: string;
  url: string;
}

export interface LegalEvent {
  date: string;
  what: string;
  source: LegalSource;
}

export type LegalStance = "prosecuted" | "unregulated" | "contested";

export interface LegalCountry {
  slug: string;
  name: string;
  /** One sentence. The answer to the question the page is looked up to answer. */
  verdict: string;
  stance: LegalStance;
  stanceLabel: string;
  /** Meta description. Under 160 characters where possible. */
  summary: string;
  /** Is the molecule scheduled, under what instrument. */
  molecule: string[];
  /** How the brew is treated as distinct from the molecule. */
  brew: string[];
  /** Religious, traditional or indigenous exemption, or the absence of one. */
  exemption: string[];
  /** Dated events, newest last. */
  recent: LegalEvent[];
  /** What this means for someone running or attending a retreat. */
  reality: string[];
  wrongClaim: { claim: string; correction: string };
  /** Named gaps. Printed on the page, not hidden in a comment. */
  gaps: string[];
  sources: LegalSource[];
  verified: string;
}

/** The international baseline every country frame on this site inherits. */
export const INCB_BASELINE = {
  text:
    "N,N-DMT is in Schedule I of the 1971 Convention on Psychotropic Substances. " +
    "The International Narcotics Control Board stated in its 2010 Annual Report that no plants " +
    "are controlled under that Convention, and that preparations made from plants containing " +
    "controlled ingredients, including decoctions for oral use, are also not under international " +
    "control. The same passage recommends that governments consider controlling such plant " +
    "material at the national level.",
  caution:
    "That statement is about international control only. It creates no right, no exemption and " +
    "no defence under any country's domestic law. Retreat marketing quotes it as though it did.",
  source: {
    label: "INCB Annual Report 2010 (E/INCB/2010/1), paragraphs 284 to 287",
    url: "https://www.incb.org/documents/Publications/AnnualReports/AR2010/AR_2010_English.pdf",
  } as LegalSource,
};

const MEXICO: LegalCountry = {
  slug: "mexico",
  name: "Mexico",
  stance: "contested",
  stanceLabel: "Scheduled molecule, unnamed brew, question live at the Supreme Court",
  verdict:
    "DMT is in the most restrictive Mexican schedule with no personal-quantity threshold. Ayahuasca is not named anywhere in Mexican law. Whether the brew falls inside the DMT entry is unresolved and is before the Supreme Court.",
  summary:
    "Mexico schedules DMT in Ley General de Salud Article 245 fraccion I and names no brew. The indigenous-use exemption covers peyote and mushrooms only.",
  molecule: [
    "Ley General de Salud, Article 245, fraccion I, lists DMT under the heading for substances with little or no therapeutic value that pose an especially serious public health problem. The table entry reads n,n-dimetiltriptamina.",
    "Codigo Penal Federal Article 193 makes conduct involving the substances listed in Article 245 fraccion I punishable, and defines narcotics to include vegetales, that is, plant material.",
    "There is no personal-consumption threshold for DMT. The maximum-dose table at Ley General de Salud Article 479 lists opium, heroin, cannabis, cocaine, LSD, MDA, MDMA and methamphetamine. DMT is absent, so the non-prosecution route at Articles 478 and 479 does not apply to it at any quantity.",
  ],
  brew: [
    "A full-text search of the Ley General de Salud returns no hits for banisteriopsis, psychotria or ayahuasca. The brew is not named.",
    "That omission is visible rather than accidental, because the same table does name two plant preparations: mescaline is listed together with peyote and Lophophora williamsii, and psilocybin is listed together with hallucinogenic mushrooms of any botanical variety.",
    "The argument that an unnamed plant preparation therefore falls outside the law has no textual foothold in Mexico. The Article 245 entry for DMT carries no qualifier restricting it to isolated or synthetic form, Codigo Penal Federal Article 193 reaches vegetales by name, and Article 198 separately criminalises cultivating hallucinogenic mushrooms, peyote or any other plant producing similar effects.",
  ],
  exemption: [
    "One exemption exists and it does not cover ayahuasca. Codigo Penal Federal Article 195 bis, fraccion II, as reformed on 1 April 2024, bars prosecution of a person holding peyote or hallucinogenic mushrooms where the quantity and circumstances indicate use in the ceremonies, uses and customs of indigenous and Afro-Mexican peoples recognised by their own authorities.",
    "Two plants are named. Ayahuasca, its component plants and DMT are not among them, and were not added in the 2024 reform of that fraccion.",
    "Mexico is party to ILO Convention 169 and defence counsel have invoked it. No Mexican statute, decree or binding ruling turns that into an ayahuasca exemption.",
  ],
  recent: [
    {
      date: "March 2022",
      what:
        "Claudino Perez, a Uitoto curandero from Colombia, was detained at Mexico City airport and charged with introducing narcotics. A judge later found insufficient grounds and ordered his release.",
      source: {
        label: "swissinfo, 24 April 2024",
        url: "https://www.swissinfo.ch/spa/%22como-narcotraficantes%22:-ind%C3%ADgenas-sudamericanos-presos-en-m%C3%A9xico-por-ayahuasca/76331513",
      },
    },
    {
      date: "7 March 2023",
      what:
        "Jose Campos, a Peruvian healer detained in March 2022, was acquitted on the ground of error de prohibicion, meaning he reasonably believed his conduct was lawful. The court expressly did not rule on whether ayahuasca is substantively legal.",
      source: {
        label: "ICEERS, 10 March 2023",
        url: "https://www.iceers.org/historic-trial-mexico-ayahuasca/",
      },
    },
    {
      date: "24 September 2025",
      what:
        "The Supreme Court plenary exercised its facultad de atraccion over a case on sanctions for ayahuasca possession. The reported issue is whether Codigo Penal Federal Articles 193 and 194 fraccion II and Ley General de Salud Article 245 fraccion I violate the principle of taxatividad, given the absence of a personal-consumption threshold for DMT.",
      source: {
        label: "SCJN Sintesis Informativa, 25 September 2025",
        url: "https://www.scjn.gob.mx/sites/default/files/sintesis-informativa/2025-09/S%C3%ADntesisPDF-25septiembre2025_0.pdf",
      },
    },
    {
      date: "1 September 2026",
      what:
        "930 grams of ayahuasca extract from Peru were seized at Mexico City airport. Authorities cited Ley General de Salud Article 245 fraccion I as the legal basis.",
      source: {
        label: "Infobae, 1 September 2026",
        url: "https://www.infobae.com/mexico/2026/09/01/asi-intentaron-traficar-por-el-aicm-casi-un-kilo-de-extracto-de-ayahuasca-procedente-de-peru/",
      },
    },
  ],
  reality: [
    "Unregulated, with an active enforcement pattern, and not lawful.",
    "Every prosecution traced here involves bringing material into Mexico rather than running a ceremony. That is the observable pattern in the sources, not a legal rule, and it should not be read as one.",
    "There is no licensing regime, no COFEPRIS authorisation pathway and no Mexican government statement saying ayahuasca ceremonies are permitted.",
    "A prosecutor charging an operator under Codigo Penal Federal Articles 193 and 194 with Ley General de Salud Article 245 fraccion I is on straightforward statutory ground. The only published defence that has worked is error de prohibicion, which is personal to someone who plausibly did not know the law and is unavailable to a commercial operator who has read a page like this one.",
  ],
  wrongClaim: {
    claim:
      "That Article 195 of the Federal Penal Code makes psilocybin mushrooms and ayahuasca legal for traditional ceremonies.",
    correction:
      "The provision is Article 195 bis, fraccion II, and its text names exactly two things: peyote and hallucinogenic mushrooms. Ayahuasca is not in it and appears nowhere in the Codigo Penal Federal. A close runner-up seen on retreat sites is that the law targets DMT only as an isolated synthetic compound. Article 245 fraccion I carries no such qualifier and Article 193 expressly reaches plant material.",
  },
  gaps: [
    "No docket number was found for the September 2025 Supreme Court atraccion. It is confirmed by the Court's own press synthesis and by news coverage, but the resolution itself was not located.",
    "Whether the brew falls within Article 245 fraccion I is genuinely unresolved. Anyone claiming Mexican law is settled in either direction is overstating it.",
  ],
  sources: [
    { label: "Ley General de Salud, consolidated text", url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/LGS.pdf" },
    { label: "Codigo Penal Federal, consolidated text", url: "https://www.diputados.gob.mx/LeyesBiblio/pdf/CPF.pdf" },
    { label: "SCJN Sintesis Informativa, 25 September 2025", url: "https://www.scjn.gob.mx/sites/default/files/sintesis-informativa/2025-09/S%C3%ADntesisPDF-25septiembre2025_0.pdf" },
    { label: "ICEERS, historic trial in Mexico", url: "https://www.iceers.org/historic-trial-mexico-ayahuasca/" },
    { label: "Gatopardo, la ayahuasca y sus abogados, 5 April 2023", url: "https://www.gatopardo.com/articulos/al-amparo-de-la-ayahuasca-la-disputa-legal-por-su-consumo-en-mexico" },
    { label: "Infobae, airport seizure, 1 September 2026", url: "https://www.infobae.com/mexico/2026/09/01/asi-intentaron-traficar-por-el-aicm-casi-un-kilo-de-extracto-de-ayahuasca-procedente-de-peru/" },
  ],
  verified: "2026-09-21",
};

const COSTA_RICA: LegalCountry = {
  slug: "costa-rica",
  name: "Costa Rica",
  stance: "unregulated",
  stanceLabel: "No permitting regime, a published health warning against the practice",
  verdict:
    "DMT is on Costa Rica's national controlled list. The brew is not. The Ministry of Health published a warning in January 2025 saying these operations are not authorised, and is trying to revoke the one permit that exists.",
  summary:
    "Costa Rica lists DMT as PD 004 on its national schedule, has no ayahuasca licensing regime, and published a sanitary warning against ayahuasca and ibogaine in January 2025.",
  molecule: [
    "Ley 8204 Article 1 brings the 1971 Convention on Psychotropic Substances into Costa Rican law, approved domestically by Ley 4990 of 10 June 1972, and provides that the operative lists are drawn up and published by the Ministry of Health and the Ministry of Agriculture.",
    "The Ministry of Health list, updated 10 October 2022 under resolution MS-DM-RM-1912-2022, carries DMT as code PD 004 under Sustancias Psicotropicas de la Lista I.",
  ],
  brew: [
    "A search of the Ministry list returns no hits for banisteriopsis, psychotria or ayahuasca, and none for peyote, mushrooms or iboga. The Costa Rican list is molecules only.",
    "The plant-is-not-listed argument is weaker here than in Mexico, because the offence articles reach plants directly. Ley 8204 Article 58 criminalises preparing the drugs or substances referred to in the law and separately criminalises cultivating the plants from which such substances are obtained, at eight to fifteen years. Article 95 empowers the judicial police to eradicate plantations of cannabis or of any other plant from which illicit drugs may be produced.",
    "Article 79 treats a person consuming unauthorised drugs in public as a health matter and carries no criminal penalty for consumption itself. There is no quantity table. No source establishes a threshold below which possession is non-criminal, so do not assume one exists.",
  ],
  exemption: [
    "None. A full-text search of Ley 8204 for religious, ritual, indigenous, ancestral, plant and vegetable terms returns no exemption of any kind.",
    "The only hit in that neighbourhood runs the other way: Article 77(e) makes it an aggravating factor where the offender acts by taking advantage of a role as teacher, educator or spiritual guide.",
    "Costa Rica is party to ILO Convention 169. No Costa Rican statute, decree, ministerial resolution or court ruling creating a ceremonial carve-out for ayahuasca or DMT was found.",
  ],
  recent: [
    {
      date: "20 November 2020",
      what:
        "The Ministry of Health issued Rythmia Life Advancement Center in Guanacaste a sanitary operating permit for complementary therapies.",
      source: {
        label: "La Nacion",
        url: "https://www.nacion.com/sucesos/errores-del-ministerio-de-salud-permiten-a-resort/AFSGVOW3GJEMJLQLYHIUDNPLYY/story/",
      },
    },
    {
      date: "July 2022",
      what:
        "The Ministry temporarily enabled the permit for ayahuasca use with therapeutic purposes, until a regulation was published. No regulation was ever published.",
      source: {
        label: "La Nacion",
        url: "https://www.nacion.com/sucesos/errores-del-ministerio-de-salud-permiten-a-resort/AFSGVOW3GJEMJLQLYHIUDNPLYY/story/",
      },
    },
    {
      date: "August 2024",
      what:
        "Lauren Levis, a 40-year-old US social worker, died after taking ibogaine at a centre in Paquera. The judicial investigation ran about eight months and findings went to prosecutors in March 2025.",
      source: {
        label: "Tico Times, 27 August 2026",
        url: "https://ticotimes.net/2026/08/27/costa-rica-psychedelic-retreat-tourist-death",
      },
    },
    {
      date: "27 January 2025",
      what:
        "The Ministry of Health published a sanitary warning on the use, consumption and advertising of ayahuasca and ibogaine. It identifies ayahuasca's active component as DMT, states that DMT appears on international and national controlled-substance lists, and warns that rituals advertising healing are unauthorised practice.",
      source: {
        label: "Ministerio de Salud, Advertencia Sanitaria",
        url: "https://www.ministeriodesalud.go.cr/index.php/prensa/62-noticias-2025/2048-advertencia-sanitaria-sobre-uso-consumo-y-publicidad-de-ayahuasca-e-ibogaina",
      },
    },
    {
      date: "17 February 2025",
      what:
        "The Procuraduria General declined to annul the Rythmia authorisation on procedural grounds, holding that the Ministry had not identified which specific norms the authorisation contravened. It did not rule that ayahuasca is lawful.",
      source: {
        label: "CRHoy, 27 February 2025",
        url: "https://crhoy.com/nacionales/procuraduria-no-puede-anular-autorizacion-a-cllinica/",
      },
    },
  ],
  reality: [
    "Unregulated, with the government on record since January 2025 saying these operations are not authorised.",
    "There is no licensing regime for ayahuasca. The one authorisation in play rests on a 2020 sanitary operating permit for complementary therapies plus a July 2022 temporary enablement that was expressly conditioned on a future regulation that never appeared.",
    "The Procuraduria's February 2025 refusal to annul that permit was procedural. It was not a validation.",
    "Grey area here means enforcement has been weak, not that the conduct is lawful. Articles 58 and 95 are broad enough to cover preparing the brew and cultivating the plants.",
  ],
  wrongClaim: {
    claim:
      "That ayahuasca in Costa Rica is neither legal nor illegal because it is unscheduled, and that there are therefore no laws regulating it.",
    correction:
      "Both halves are wrong. Ley 8204 Article 1 incorporates the 1971 Convention, Article 58 criminalises preparing a controlled substance and cultivating the plants it is obtained from, and Article 95 covers eradication of any plant from which illicit drugs may be produced. Unscheduled is true only of the brew's name. The psychoactive it is made to deliver is on the Ministry of Health's own national list as PD 004. The Ministry said so itself on 27 January 2025.",
  },
  gaps: [
    "The Procuraduria dictamen itself could not be retrieved. Its number and date are unverified here, and the finding rests on news coverage.",
    "The Ministry of Agriculture is reported to have said that no sanitary norm exists for iboga and ayahuasca and that any entry of such plants is therefore illegal. The primary document was not obtained.",
    "No source was found for a personal-possession quantity threshold in Costa Rica.",
  ],
  sources: [
    { label: "Ley 8204, official text", url: "https://www.importlicensing.wto.org/sites/default/files/members/36/Ley%20No.8204%20-%20Estupefacientes%20sustancias%20psicotr%C3%B3picas%20drogas_11.01.2002.pdf" },
    { label: "Ministerio de Salud, national controlled substances list, updated 10 October 2022", url: "https://www.ministeriodesalud.go.cr/index.php/biblioteca-de-archivos-left/documentos-ministerio-de-salud/regulacion-de-la-salud/junta-de-vigilancia-de-drogas/jvd-listados/2471-lista-de-estupefacientes-y-sustancias-psicotropicas-sometidas-a-fiscalizacion-nacional-2020/file" },
    { label: "Ministerio de Salud, Advertencia Sanitaria, 27 January 2025", url: "https://www.ministeriodesalud.go.cr/index.php/prensa/62-noticias-2025/2048-advertencia-sanitaria-sobre-uso-consumo-y-publicidad-de-ayahuasca-e-ibogaina" },
    { label: "La Nacion, Ministry of Health and the Tamarindo resort permit", url: "https://www.nacion.com/sucesos/errores-del-ministerio-de-salud-permiten-a-resort/AFSGVOW3GJEMJLQLYHIUDNPLYY/story/" },
    { label: "CRHoy, Procuraduria declines to annul, 27 February 2025", url: "https://crhoy.com/nacionales/procuraduria-no-puede-anular-autorizacion-a-cllinica/" },
    { label: "Tico Times, retreat industry scrutiny, 27 August 2026", url: "https://ticotimes.net/2026/08/27/costa-rica-psychedelic-retreat-tourist-death" },
  ],
  verified: "2026-09-21",
};

const PERU: LegalCountry = {
  slug: "peru",
  name: "Peru",
  stance: "unregulated",
  stanceLabel: "Absolute prohibition on the molecule, a heritage declaration that is not a licence",
  verdict:
    "DMT sits on Peru's Lista IB under an absolute prohibition. The 2008 cultural patrimony declaration is a heritage designation from a culture body, not a legalisation statute, and on its face it distances traditional use from commercial tourism.",
  summary:
    "Peru prohibits DMT under DIGEMID Lista IB. The 2008 ayahuasca patrimony declaration protects traditional knowledge and does not license retreat centres.",
  molecule: [
    "DIGEMID, the medicines and drugs directorate of the Ministry of Health, publishes the official catalogue of controlled substances. In the November 2024 edition DMT appears in Lista IB, entry 7, with the CAS number 61-50-7.",
    "The list header states that the production, manufacture, export, import, trade and use of Lista IA and IB substances is prohibited. That is an absolute prohibition, not a permit regime.",
    "The governing framework is Decreto Supremo 023-2001-SA. It is cited here by name and number only. Every mirror of the decree text returned an error, so its operative articles were not read.",
  ],
  brew: [
    "The same DIGEMID catalogue contains no entry for ayahuasca, harmine, harmaline or Banisteriopsis.",
    "No source, Peruvian court decision, prosecutorial guidance or ministerial interpretation was found resolving whether a Banisteriopsis and Psychotria decoction is legally a preparation containing a Lista IB substance. Every source claiming ayahuasca is legal in Peru asserts it without engaging that question.",
    "ICEERS states that Peru filed a reservation to the 1971 Convention protecting ayahuasca use by Amazonian indigenous groups. That could not be confirmed against the UN depositary record and should be treated as unverified.",
  ],
  exemption: [
    "Resolucion Directoral Nacional 836/INC declared the traditional knowledge and uses of ayahuasca practised by Amazonian native communities to be Cultural Patrimony of the Nation. The state news agency published the announcement on 12 July 2008; one secondary source dates the resolution itself to 24 June 2008.",
    "Its stated purpose is the protection of traditional use and the sacred character of the ayahuasca ritual, differentiating it from western uses that are decontextualised, consumerist and commercial in purpose.",
    "What it does not do: it is a heritage instrument issued by a culture body rather than a health or justice body. It creates no licence, no exemption from Decreto Supremo 023-2001-SA, and no registry, and it confers nothing on commercial operators. It has no operative effect on the DIGEMID list.",
  ],
  recent: [
    {
      date: "August 2024",
      what:
        "The Ministry of Health, through the national health institute, published a guide for the safe and informed use of ayahuasca. It is recommendations only, framed as harm reduction. It is not licensing and creates no safe harbour.",
      source: {
        label: "Gestion, August 2024",
        url: "https://gestion.pe/peru/peru-lanza-una-guia-para-uso-seguro-de-la-ayahuasca-tras-el-aumento-de-su-popularidad-peru-ministerio-de-salud-ayahuasca-amazonia-noticia/",
      },
    },
    {
      date: "23 January 2025",
      what:
        "The US Embassy in Lima issued a health alert titled Do Not Use Ayahuasca or Kambo, stating that facilities or groups offering them are not regulated by the Peruvian government and may not follow health and safety laws or practices. It cites sexual assaults, robberies, and US citizen deaths and severe illness in 2024.",
      source: {
        label: "Marijuana Moment, reporting the embassy alert",
        url: "https://www.marijuanamoment.net/u-s-embassy-warns-americans-not-to-use-traditional-psychedelics-in-peru-including-ayahuasca/",
      },
    },
  ],
  reality: [
    "Unregulated, and greyer than the industry admits.",
    "There is no licensing regime. The US State Department says so in terms, and the only self-regulation is voluntary among lodges.",
    "The 2008 heritage declaration gives operators nothing legally and rhetorically cuts against commercial tourism.",
    "DMT is on a prohibition list and whether the brew falls inside it is untested in any source found. Centres operate because nobody enforces against them, not because a law permits them. That is tolerance, and tolerance is revocable without legislation.",
  ],
  wrongClaim: {
    claim:
      "That ayahuasca is fully legal in Peru, or that the 2008 resolution legalised it.",
    correction:
      "The English Wikipedia entry on the legal status of ayahuasca by country says superficial research suggests ayahuasca is fully legal in Peru, and carries no citation for it. Two things correct it. DMT is on DIGEMID's Lista IB under absolute prohibition. And the 2008 resolution protects traditional knowledge while expressly differentiating it from decontextualised, consumerist and commercial western use.",
  },
  gaps: [
    "The full text of Resolucion Directoral Nacional 836/INC was not obtained. Its operative language here is quoted through the Peruvian state news agency.",
    "Sources conflict on the resolution's date: 24 June 2008 versus publication on 12 July 2008.",
    "Whether the brew falls within the Lista IB prohibition on DMT is the central unresolved question and no source addresses it.",
    "No Peruvian criminal prosecution, court ruling or regulatory enforcement action against a retreat centre as such was found for 2021 to 2026.",
  ],
  sources: [
    { label: "DIGEMID catalogue of controlled substances, November 2024", url: "https://www.digemid.minsa.gob.pe/Archivos/PortalWeb/Informativo/Catalogacion/SUSTANCIA_CONTROLADA_NOVIEMBRE_2024.pdf" },
    { label: "Decreto Supremo 023-2001-SA, listing page", url: "https://www.gob.pe/institucion/minsa/normas-legales/255646-023-2001-sa" },
    { label: "Andina, patrimony declaration announcement, 12 July 2008", url: "https://andina.pe/agencia/noticia-declaran-patrimonio-cultural-de-nacion-a-los-conocimientos-y-usos-tradicionales-del-ayahuasca-184254.aspx" },
    { label: "ICEERS, Peru legal information", url: "https://www.iceers.org/peru/" },
    { label: "Gestion, MINSA safe-use guide, August 2024", url: "https://gestion.pe/peru/peru-lanza-una-guia-para-uso-seguro-de-la-ayahuasca-tras-el-aumento-de-su-popularidad-peru-ministerio-de-salud-ayahuasca-amazonia-noticia/" },
    { label: "Marijuana Moment, US Embassy health alert, January 2025", url: "https://www.marijuanamoment.net/u-s-embassy-warns-americans-not-to-use-traditional-psychedelics-in-peru-including-ayahuasca/" },
  ],
  verified: "2026-09-21",
};

const UNITED_STATES: LegalCountry = {
  slug: "united-states",
  name: "United States",
  stance: "prosecuted",
  stanceLabel: "Federal Schedule I, with narrow exemptions held by named organisations",
  verdict:
    "A commercial ayahuasca retreat is a federal Schedule I offence. Protection exists only for specific named organisations and is not transferable. Colorado decriminalised DMT for personal use and its licensed centres administer psilocybin only.",
  summary:
    "DMT is federally Schedule I in the United States. Four named religious organisations hold exemptions. Colorado decriminalisation covers personal use, not sale.",
  molecule: [
    "21 U.S.C. 812, Schedule I(c)(6) lists dimethyltryptamine among the hallucinogenic substances. The Schedule I criteria at 812(b)(1) are high potential for abuse, no currently accepted medical use in treatment in the United States, and lack of accepted safety for use under medical supervision.",
    "21 C.F.R. 1308.11(d)(19) carries dimethyltryptamine, DEA code 7435. The DEA states that DMT has been controlled in Schedule I since the Controlled Substances Act took effect in 1971 and has no approved medical use in the United States.",
  ],
  brew: [
    "United States law draws no meaningful distinction between the brew and the molecule. The hallucinogen paragraph of the CFR reaches any material, compound, mixture or preparation containing the listed substance.",
    "The D.C. Circuit put it flatly in 2024, describing a church whose primary organisational and operational purpose, ayahuasca use and ceremony, is illegal on its face without a Controlled Substances Act exemption.",
  ],
  exemption: [
    "Gonzales v. O Centro Espirita Beneficente Uniao do Vegetal, 546 U.S. 418, decided 21 February 2006, affirmed a preliminary injunction protecting the UDV's sacramental hoasca. Under the Religious Freedom Restoration Act the government must show the burden on the particular claimant furthers a compelling interest by the least restrictive means, and on an evenly balanced record it failed. UDV is now DEA-registered as an importer, distributor and manufacturer of hoasca.",
    "Church of the Holy Light of the Queen v. Mukasey, 615 F. Supp. 2d 1210 (D. Or. 2009), gave Santo Daime churches in Oregon a permanent injunction subject to conditions: health screening, consumption confined to ceremonies, restricted supply access, periodic DEA potency testing and inventory recordkeeping.",
    "The Church of the Eagle and the Condor obtained DEA permits on 15 April 2024 through a litigation settlement rather than a petition grant. The Church of Gaia was announced on 18 May 2025 as the first ayahuasca RFRA exemption granted through the DEA petition process without litigation.",
    "DEA's own guidance, version 2 of 20 November 2020, states that no petitioner may engage in any activity prohibited under the Controlled Substances Act unless the petition has been granted. A 2024 GAO report found 24 petitions filed between fiscal 2016 and January 2024 with zero granted, some pending for nearly eight years.",
    "Each exemption is organisation-specific and non-transferable. There is no generic ayahuasca church status.",
  ],
  recent: [
    {
      date: "18 December 2023",
      what:
        "Soul Quest Church of Mother Earth v. Attorney General, 11th Circuit. District courts lack subject-matter jurisdiction to review DEA denials of religious exemption petitions, because 21 U.S.C. 877 channels review to the courts of appeals. Affirmed on jurisdiction, not on the merits.",
      source: {
        label: "Justia, 11th Circuit No. 22-11072",
        url: "https://law.justia.com/cases/federal/appellate-courts/ca11/22-11072/22-11072-2023-12-18.html",
      },
    },
    {
      date: "May 2024",
      what:
        "GAO report GAO-24-106630 found DEA's religious exemption petition process had granted none of 24 petitions since fiscal 2016 and set no determination timeframes. DEA accepted all four recommendations. Three organisations were cleared in the period that followed.",
      source: {
        label: "GAO-24-106630",
        url: "https://www.gao.gov/assets/gao-24-106630.pdf",
      },
    },
    {
      date: "21 June 2024",
      what:
        "Iowaska Church of Healing v. Werfel, D.C. Circuit. The IRS denial of tax-exempt status was affirmed and the church was held to lack standing for its RFRA claim.",
      source: {
        label: "Justia, D.C. Circuit No. 23-5122",
        url: "https://law.justia.com/cases/federal/appellate-courts/cadc/23-5122/23-5122-2024-06-21.html",
      },
    },
    {
      date: "February 2026",
      what:
        "Colorado's licensed healing centres administer psilocybin only. Nine standard and 25 micro-licensed centres were operating. The Natural Medicine Advisory Board had recommended ibogaine and had not begun discussions on DMT or mescaline.",
      source: {
        label: "Axios Denver, 3 February 2026",
        url: "https://www.axios.com/local/denver/2026/02/03/psychedelic-therapy-expands-natural-medicine-options",
      },
    },
  ],
  reality: [
    "Explicitly illegal at federal level, with narrow exceptions held by four named organisations.",
    "Colorado Proposition 122 does name DMT as one of five natural medicines decriminalised for personal cultivation, possession, use and gifting by adults over 21. It does not permit sale, and selling access sits outside it.",
    "Oakland's 2019 entheogenic plants resolution names combinations such as ayahuasca that contain forms of DMT, and Santa Cruz's January 2020 resolution cites ayahuasca in its preamble. Both are lowest-law-enforcement-priority measures by municipalities with no power over federal or state prosecutors. Denver's 2019 ordinance covers psilocybin mushrooms only.",
    "Nothing at state or city level touches federal exposure. Colorado's decriminalisation of DMT does not make a paid ayahuasca retreat lawful in Colorado.",
  ],
  wrongClaim: {
    claim:
      "That Colorado legalised ayahuasca, so ayahuasca retreats are legal there.",
    correction:
      "Proposition 122 decriminalises personal cultivation, possession, use and gifting and does not allow retail sales. The licensed healing-centre programme administers psilocybin only, and as of February 2026 the Advisory Board had not opened DMT discussions. A close runner-up is that anyone can form an ayahuasca church and be covered by the UDV case. The GAO found zero grants across 24 petitions through January 2024, and Soul Quest establishes that a district court will not review a denial.",
  },
  gaps: [
    "The reported December 2024 DEA exemption to Santo Daime rests on a single secondary source and is unconfirmed.",
    "No final merits judgment was found in Arizona Yage Assembly, nor a disposition of its certiorari petition, nor a ruling in the D.C. Circuit case argued in November 2025.",
  ],
  sources: [
    { label: "21 U.S.C. 812", url: "https://www.law.cornell.edu/uscode/text/21/812" },
    { label: "21 C.F.R. Part 1308", url: "https://www.ecfr.gov/current/title-21/chapter-II/part-1308" },
    { label: "DEA drug factsheet, DMT", url: "https://www.deadiversion.usdoj.gov/drug_chem_info/dmt.pdf" },
    { label: "Gonzales v. O Centro Espirita, 546 U.S. 418 (2006)", url: "https://supreme.justia.com/cases/federal/us/546/418/" },
    { label: "Church of the Holy Light of the Queen v. Mukasey", url: "https://www.courtlistener.com/opinion/2482682/church-of-the-holy-light-of-the-queen-v-mukasey/" },
    { label: "GAO-24-106630, DEA religious exemption process", url: "https://www.gao.gov/assets/gao-24-106630.pdf" },
    { label: "Soul Quest v. Attorney General, 11th Circuit", url: "https://law.justia.com/cases/federal/appellate-courts/ca11/22-11072/22-11072-2023-12-18.html" },
    { label: "Iowaska Church of Healing v. Werfel, D.C. Circuit", url: "https://law.justia.com/cases/federal/appellate-courts/cadc/23-5122/23-5122-2024-06-21.html" },
    { label: "Colorado Proposition 122, Ballotpedia", url: "https://ballotpedia.org/Colorado_Proposition_122,_Decriminalization_and_Regulated_Access_Program_for_Certain_Psychedelic_Plants_and_Fungi_Initiative_(2022)" },
    { label: "Oakland File 18-1790", url: "https://oakland.legistar.com/LegislationDetail.aspx?GUID=5E53E7F6-F79F-433D-B669-0D687786590F&ID=3950933" },
    { label: "Axios Denver, healing centre status, 3 February 2026", url: "https://www.axios.com/local/denver/2026/02/03/psychedelic-therapy-expands-natural-medicine-options" },
  ],
  verified: "2026-09-21",
};

const GERMANY: LegalCountry = {
  slug: "germany",
  name: "Germany",
  stance: "prosecuted",
  stanceLabel: "Plant material prosecuted by its DMT content, with a quantity threshold to prove it",
  verdict:
    "German courts prosecute DMT-containing plant material by its DMT content and have set the not-insignificant-quantity threshold at 3.6 grams of DMT. There is no religious exemption. This is not a grey area.",
  summary:
    "Germany lists DMT in BtMG Anlage I and prosecutes DMT-containing plant material by content. A court set the not-insignificant quantity at 3.6 grams.",
  molecule: [
    "The consolidated text of Anlage I to the Betaubungsmittelgesetz carries N,N-Dimethyltryptamin, written as Dimethyltryptamin, DMT, with the IUPAC name given. N,N-Diethyltryptamin, psilocin and psilocybin are in the same Anlage.",
    "The verified negative finding matters more than the listing. Anlage I contains no entry for harmine, harmaline, Banisteriopsis caapi, Psychotria viridis or Mimosa. The only botanical entry written as a plant is Salvia divinorum, listed as plants and plant parts. When the German legislature wants to schedule a plant it says so and names it. It has not done so for any ayahuasca admixture plant.",
  ],
  brew: [
    "German practice does not distinguish the brew from the molecule. The controlled item is the substance, and a preparation is treated by its DMT content.",
    "Landgericht Wurzburg, judgment of 26 October 2022, case 8 KLs 822 Js 14426/19, concerned Mimosa hostilis and held that the threshold for a not-insignificant quantity under BtMG section 29a paragraph 1 number 2 is 3.6 grams of DMT. The reasoning relied on a toxicological expert and on an earlier Landgericht Frankenthal decision from 7 December 2012 that derived 3.6 grams as 120 consumption units of 30 milligrams.",
    "No German case testing a brew on its own facts was found. The 3.6 gram threshold and the content-governs approach come from Mimosa hostilis prosecutions. Whether a court would compute a threshold the same way for a dilute oral decoction is untested in any accessible source.",
  ],
  exemption: [
    "None was found. Santo Daime and other ayahuasca religions operate openly in several German cities, but no religious exemption exists and the practice is neither permitted nor encouraged by German law enforcement.",
    "The public-interest gateway at BtMG section 3 paragraph 2 has been opened, but for medical necessity rather than religion. The Bundesverwaltungsgericht ordered a home-cultivation exemption for a multiple sclerosis patient on 6 April 2016 and had earlier held there is no categorical bar to therapeutic permits. No source shows that gateway being opened, or even formally applied for, for ceremonial ayahuasca use.",
    "In 1999 roughly a hundred armed police raided a Santo Daime congregation in Thuringia and confiscated 62 litres of ayahuasca. Charges were dropped in 2007 on the basis that the defendants acted without knowing they committed a crime. That is ordinary criminal procedure, not a religious carve-out.",
  ],
  recent: [
    {
      date: "26 October 2022",
      what:
        "Landgericht Wurzburg set the not-insignificant-quantity threshold for DMT at 3.6 grams in a Mimosa hostilis case. This is the strongest German authority located and it comes from the official Bavarian court decisions portal.",
      source: {
        label: "Landgericht Wurzburg, 8 KLs 822 Js 14426/19",
        url: "https://www.gesetze-bayern.de/Content/Pdf/Y-300-Z-BECKRS-B-2022-N-34619?all=False",
      },
    },
    {
      date: "March 2026",
      what:
        "ICEERS reported that its legal support programme handled three German cases in 2025. The figure is aggregate, with no courts, dockets or outcomes given.",
      source: {
        label: "ICEERS, ten years of legal support",
        url: "https://www.iceers.org/en/news/advocacy/ten-years-legal-support/",
      },
    },
  ],
  reality: [
    "Serving ayahuasca in Germany means handling a substance whose DMT content is scheduled in Anlage I.",
    "Buying the plants is itself flagged. A Berlin defence practice writes that ordering plant parts needed for preparation can by itself trigger BtMG proceedings, and that the ready-to-drink brew is illegal in Germany.",
    "Groups do operate openly, but they do so exposed, with no exemption and no favourable precedent.",
  ],
  wrongClaim: {
    claim:
      "That the ayahuasca plants are not on the BtMG schedules, so ayahuasca is legal or a grey area in Germany.",
    correction:
      "The premise is true and the conclusion is false. The plants genuinely are absent from Anlage I. But Anlage I controls the substance DMT, and German courts prosecute plant material by its DMT content, as Landgericht Wurzburg did in 2022. The plant-scheduling gap that makes the Spanish position arguable does not produce the same result in Germany. A second common claim, that Santo Daime is legally recognised in Germany, is also wrong: no religious exemption exists.",
  },
  gaps: [
    "The verbatim text of BtMG sections 29, 29a, 30 and 3 paragraph 2, and the formal caption of Anlage I, could not be retrieved. The substance listing is confirmed; the statutory wording around it is not quoted here.",
    "The Landgericht Frankenthal judgment text was not obtained. It is described consistently by two independent secondary sources.",
    "No German court decision addressing the brew specifically under a citable docket number was found, and none dated 2023 to 2026.",
  ],
  sources: [
    { label: "BtMG Anlage I, consolidated text", url: "https://www.gesetze-im-internet.de/btmg_1981/anlage_i.html" },
    { label: "Landgericht Wurzburg, 26 October 2022", url: "https://www.gesetze-bayern.de/Content/Pdf/Y-300-Z-BECKRS-B-2022-N-34619?all=False" },
    { label: "Bundesverwaltungsgericht 3 C 10.14, 6 April 2016", url: "https://www.bverwg.de/060416U3C10.14.0" },
    { label: "ICEERS, Germany legal information", url: "https://www.iceers.org/en/legal-info/germany/" },
    { label: "Criminal defence commentary on the DMT quantity threshold", url: "https://www.kk-strafrecht.de/aktuelles/zum-strafrecht/mimosa-hostilis-die-nicht-geringe-menge-des-stoffes-dimethyltryptamin-dmt" },
    { label: "Berlin defence practice note on ayahuasca and the BtMG", url: "https://www.die-anwalts-kanzlei.de/btmg-drogenstrafrecht/ayahuasca-btmg/" },
  ],
  verified: "2026-09-21",
};

const SPAIN: LegalCountry = {
  slug: "spain",
  name: "Spain",
  stance: "contested",
  stanceLabel: "Courts repeatedly acquit on the ground that the brew is not the scheduled substance",
  verdict:
    "Spanish courts have repeatedly held that a plant decoction is not the scheduled substance and have acquitted, most recently at regional high court level in July 2025. That is not legalisation, a single ruling is not binding law in Spain, and the process itself is punishing.",
  summary:
    "Spain schedules DMT but its courts acquit on ayahuasca because the brew is not a scheduled substance. TSJ Madrid confirmed an acquittal in July 2025.",
  molecule: [
    "Real Decreto 2829/1977, Anexo 1, Lista I, item 6 lists N,N-dimetiltriptamina. The decree implements the 1971 Vienna Convention domestically and its lists have been actively maintained, with modifications recorded from 1983 through April 2026.",
    "The Ley Organica 1/1992 and Ley Organica 4/2015 line is not the scheduling instrument. It is the administrative public-order statute. Scheduling sits in Real Decreto 2829/1977 and criminal liability sits in the Codigo Penal. Three separate layers.",
    "Codigo Penal Article 368 punishes cultivation, elaboration or trafficking, or otherwise promoting, favouring or facilitating illegal consumption, or possessing with those purposes, at three to six years plus a fine of one to three times the value of the drug where the substance causes grave harm to health.",
  ],
  brew: [
    "Audiencia Provincial de Barcelona, 23 May 2016, concerned roughly 11.6 kilograms of ayahuasca decoction sent by post to a closed private group. It acquitted, holding that ayahuasca as a plant preparation, a decoction of plants for oral ingestion, is not subject to control.",
    "Audiencia Provincial de Malaga, sentencia 86/2021, concerned about five litres. The prosecution sought four years and a fine of 309,000 euros; the defendant had already spent three months in pre-trial detention. The court acquitted in a seventeen-page ruling, holding that ayahuasca as a plant preparation is not subject to prohibition or control internationally or nationally in Spain.",
    "Tribunal Superior de Justicia de Madrid, sentencia 316/2025 of 10 July 2025, is the most significant Spanish ruling to date and the first above Audiencia Provincial level. A five-judge panel confirmed an acquittal, held that ayahuasca as such is not a controlled substance in Spain, and held that the conduct therefore falls outside Article 368 as atipica. It rejected the national toxicology institute's evidence on the ground that what is or is not a controlled substance is a legal question rather than a technical one.",
    "Orden SCO/190/2004 did once list Banisteriopsis caapi by name. It was annulled by the Audiencia Nacional on 29 June 2005 for failure to notify the European Commission, and the Tribunal Supremo declared the State's appeal inadmissible on 9 July 2008, leaving the annulment standing. Sources still citing it as current, including English Wikipedia, are citing an annulled instrument.",
  ],
  exemption: [
    "Registered, but never authorised. Santo Daime and Uniao do Vegetal both appear in Spain's Ministry of Justice registry of religious entities. Santo Daime's 2008 application to import ayahuasca for ritual use was denied by the Audiencia Nacional.",
    "No Spanish court has recognised religious use as the ground of any acquittal. The acquittals rest on the substance not being scheduled, not on freedom of religion. The TSJ Madrid ruling expressly does not refer to a specific use, ritual, personal or medicinal, and makes no mention of Santo Daime or UDV.",
  ],
  recent: [
    {
      date: "2020 or 2021",
      what:
        "Audiencia Provincial de Malaga, sentencia 86/2021, acquitted on about five litres. Sources conflict on whether the ruling issued in March 2020 or May 2021, and the judgment was not obtained to resolve it.",
      source: {
        label: "ICEERS, Spain's second-to-last ayahuasca trial",
        url: "https://www.iceers.org/spains-second-to-last-ayahuasca-trial/",
      },
    },
    {
      date: "2023",
      what:
        "Police, the tax agency and the labour inspectorate entered a residence at Sant Pol de Mar where 23 people were awaiting a ceremony. Two people were detained and released with charges of belonging to a criminal group and an offence against public health. Four separate interventions against plant-medicine ceremonies were reported in a three-month span.",
      source: {
        label: "Canamo, police operation against an ayahuasca retreat",
        url: "https://canamo.net/noticias/espana/nueva-operacion-policial-contra-un-retiro-de-ayahuasca",
      },
    },
    {
      date: "10 July 2025",
      what:
        "Tribunal Superior de Justicia de Madrid, sentencia 316/2025, confirmed an acquittal on a prosecution appeal. It is the first Spanish ruling above Audiencia Provincial level on ayahuasca.",
      source: {
        label: "Plantaforma, historic ruling",
        url: "https://www.plantaforma.org/sentencia-historica-ayahuasca-no-esta-prohibida/",
      },
    },
  ],
  reality: [
    "Ceremony groups operate openly and win in court far more often than they lose. Nothing about that is a permission.",
    "The process is the punishment. The Malaga defendant did three months of pre-trial detention and faced a four-year, 309,000 euro demand before being acquitted. The Sant Pol de Mar operation brought in the tax agency and the labour inspectorate alongside police.",
    "The 2025 ruling creates no operating channel. It does not authorise any ayahuasca therapy provider and it does not create an access pathway. Exposure extends to civil liability and to administrative sanctions covering licensing, health codes and tax obligations.",
    "An organiser charging money, holding events at scale or importing in bulk is squarely within the conduct verbs of Article 368. Whether the substance element is met is exactly what courts keep answering in the defendant's favour, case by case, and what no binding authority has settled.",
  ],
  wrongClaim: {
    claim:
      "That ayahuasca is legal in Spain, or that Spain has decriminalised it.",
    correction:
      "Decriminalised conflates two layers. Personal consumption and possession are not criminal offences, but consumption or possession in public places, thoroughfares, public establishments or collective transport is a serious administrative infraction under Ley Organica 4/2015 Article 36.16, carrying 601 to 30,000 euros under Article 39. Trafficking-scale conduct remains fully criminal under Article 368. And legal misreads what the courts decided: they found the conduct atipica because the substance is not scheduled. In Spain only Tribunal Supremo decisions, and only after at least two concordant rulings, constitute binding jurisprudencia. There is no Tribunal Supremo decision on ayahuasca.",
  },
  gaps: [
    "Sources conflict on the underlying facts of TSJ Madrid 316/2025. Three accounts give different defendants, years and circumstances. The court, date and sentencia number are consistent across all three; the facts are not, and the judgment text was not obtained.",
    "Sources conflict on the date of the Malaga ruling, March 2020 versus May 2021.",
    "The Codigo Penal Article 368 text here comes from a commercial reproduction rather than from the official state gazette.",
    "No Tribunal Supremo ruling on ayahuasca was found, and no appeal of 316/2025 to it.",
  ],
  sources: [
    { label: "Real Decreto 2829/1977, consolidated text", url: "https://www.boe.es/buscar/act.php?id=BOE-A-1977-27160" },
    { label: "Ley Organica 4/2015, official gazette PDF", url: "https://www.boe.es/boe/dias/2015/03/31/pdfs/BOE-A-2015-3442.pdf" },
    { label: "Orden SCO/190/2004, official gazette PDF", url: "https://www.boe.es/boe/dias/2004/02/06/pdfs/A05061-05065.pdf" },
    { label: "Record of the annulment of Orden SCO/190/2004", url: "https://vlex.es/vid/listado-plantas-prohibidas-toxicidad-42930028" },
    { label: "Audiencia Provincial de Barcelona, 23 May 2016, judgment PDF", url: "https://www.plantaforma.org/sentencia/" },
    { label: "Plantaforma, TSJ Madrid 316/2025", url: "https://www.plantaforma.org/sentencia-historica-ayahuasca-no-esta-prohibida/" },
    { label: "ICEERS, ayahuasca used legally in Spain", url: "https://www.iceers.org/en/news/ayahuasca-used-legally-in-spain/" },
    { label: "ICEERS, Spain's second-to-last ayahuasca trial", url: "https://www.iceers.org/spains-second-to-last-ayahuasca-trial/" },
    { label: "Lucid News, ayahuasca arrests in Spain", url: "https://www.lucid.news/ayahuasca-arrests-on-the-rise-in-spain/" },
  ],
  verified: "2026-09-21",
};

/**
 * Keyed by slug. The set of slugs here is the set spa-guard accepts under
 * /legal, and scripts/check-legal-routes-drift.mjs asserts that. Adding a
 * country means adding it in both places and shipping the page in the same
 * change, or the new path serves the empty SPA shell at 200.
 */
export const LEGAL_COUNTRIES: Record<string, LegalCountry> = {
  mexico: MEXICO,
  "costa-rica": COSTA_RICA,
  peru: PERU,
  "united-states": UNITED_STATES,
  germany: GERMANY,
  spain: SPAIN,
};

export const LEGAL_SLUGS: string[] = Object.keys(LEGAL_COUNTRIES);
