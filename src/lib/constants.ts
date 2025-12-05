// Canonical DOI for the DMT Code Visual Symbol Catalogue
export const ZENODO_DOI = "10.5281/zenodo.17816520";
export const ZENODO_URL = `https://doi.org/${ZENODO_DOI}`;

// Citation templates
export const CITATION_APA = `DMT Code Project. (2025). DMT Code Visual Symbol Catalogue v1.0 [Data set]. Zenodo. ${ZENODO_URL}`;
export const CITATION_BIBTEX = `@dataset{dmtcode2025,
  author       = {{DMT Code Project}},
  title        = {{DMT Code Visual Symbol Catalogue v1.0}},
  month        = dec,
  year         = 2025,
  publisher    = {Zenodo},
  doi          = {${ZENODO_DOI}},
  url          = {${ZENODO_URL}}
}`;
