// Canonical DOI for the DMT Code Open Dataset (current version record)
export const ZENODO_DOI = "10.5281/zenodo.21987511";
export const ZENODO_URL = `https://doi.org/${ZENODO_DOI}`;

// Concept DOI: always resolves to the latest version
export const ZENODO_CONCEPT_DOI = "10.5281/zenodo.17816519";
export const ZENODO_CONCEPT_URL = `https://doi.org/${ZENODO_CONCEPT_DOI}`;

export const ZENODO_VERSION = "4.1";
export const ZENODO_DATE_PUBLISHED = "2026-08-17";

// Citation templates
export const CITATION_APA = `DMT Code Project. (2026). DMT Code Open Dataset v4.1 [Data set]. Zenodo. ${ZENODO_URL}`;
export const CITATION_BIBTEX = `@dataset{dmtcode2026,
  author       = {{DMT Code Project}},
  title        = {{DMT Code Open Dataset v4.1}},
  month        = aug,
  year         = 2026,
  publisher    = {Zenodo},
  version      = {${ZENODO_VERSION}},
  doi          = {${ZENODO_DOI}},
  url          = {${ZENODO_URL}}
}`;
