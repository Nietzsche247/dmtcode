import { Helmet } from "react-helmet";
import { PageHero } from "@/components/PageHero";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Download, ExternalLink, FileJson, FileSpreadsheet, Copy, Check } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const Dataset = () => {
  const [copied, setCopied] = useState(false);
  
  // Zenodo DOI - replace XXXXXXX with actual DOI after Zenodo deposition
  const zenodoDOI = "10.5281/zenodo.14584521";
  const zenodoURL = `https://doi.org/${zenodoDOI}`;
  
  const citationText = `DMT Code Project. (2025). DMT Code Visual Symbol Catalogue v1.0 [Data set]. Zenodo. https://doi.org/${zenodoDOI}`;
  
  const bibtexCitation = `@dataset{dmtcode2025,
  author       = {{DMT Code Project}},
  title        = {{DMT Code Visual Symbol Catalogue v1.0}},
  month        = dec,
  year         = 2025,
  publisher    = {Zenodo},
  doi          = {${zenodoDOI}},
  url          = {${zenodoURL}}
}`;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Helmet>
        <title>Dataset | DMT Code Visual Symbol Catalogue</title>
        <meta name="description" content="Download the complete DMT Code Visual Symbol Catalogue dataset. CC-BY-4.0 licensed, DOI-registered on Zenodo for academic citation." />
        <link rel="canonical" href="https://dmtcode.com/dataset" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": "DMT Code Visual Symbol Catalogue v1.0",
            "description": "Open catalogue of discrete visual symbols reported during 650 nm laser exposure and N,N-DMT experiences",
            "license": "https://creativecommons.org/licenses/by/4.0/",
            "creator": {
              "@type": "Organization",
              "name": "DMT Code Project"
            },
            "datePublished": "2025-12",
            "identifier": zenodoDOI,
            "distribution": [
              {
                "@type": "DataDownload",
                "encodingFormat": "application/json",
                "contentUrl": "https://dmtcode.com/data.json"
              }
            ]
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background transition-theme">
        <div className="pt-24 pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            <Breadcrumb />
            
            <PageHero 
              eyebrow="Open Data"
              title="Dataset"
              subtitle="Download the complete DMT Code Visual Symbol Catalogue"
            />

            {/* Zenodo DOI Badge */}
            <div className="flex flex-col items-center gap-6 mb-12">
              <a 
                href={zenodoURL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 hover:opacity-80 transition-opacity"
                aria-label="View dataset on Zenodo"
              >
                <img 
                  src={`https://zenodo.org/badge/DOI/${zenodoDOI}.svg`} 
                  alt="Zenodo DOI Badge"
                  className="h-5"
                />
              </a>
              <Badge variant="outline" className="text-xs">
                CC-BY-4.0 Licensed
              </Badge>
            </div>

            {/* Citation Block */}
            <Card className="mb-8 transition-theme">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  How to Cite
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">APA Format:</p>
                  <div className="bg-muted/50 p-4 rounded-lg font-mono text-sm relative group">
                    <p className="pr-10">{citationText}</p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(citationText, "APA citation")}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                
                <div>
                  <p className="text-sm text-muted-foreground mb-2">BibTeX:</p>
                  <div className="bg-muted/50 p-4 rounded-lg font-mono text-xs relative group overflow-x-auto">
                    <pre className="pr-10">{bibtexCitation}</pre>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopy(bibtexCitation, "BibTeX citation")}
                    >
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Download Options */}
            <Card className="mb-8 transition-theme">
              <CardHeader>
                <CardTitle className="text-lg">Download Formats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <a 
                    href="/data.json" 
                    download
                    className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileJson className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">JSON Format</p>
                      <p className="text-sm text-muted-foreground">Complete dataset with metadata</p>
                    </div>
                    <Download className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                  
                  <a 
                    href={zenodoURL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                      <FileSpreadsheet className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Zenodo Archive</p>
                      <p className="text-sm text-muted-foreground">JSON + CSV + PNG archive</p>
                    </div>
                    <ExternalLink className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                  </a>
                </div>
              </CardContent>
            </Card>

            {/* Dataset Description */}
            <Card className="transition-theme">
              <CardHeader>
                <CardTitle className="text-lg">About This Dataset</CardTitle>
              </CardHeader>
              <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                <p className="text-muted-foreground">
                  The DMT Code Visual Symbol Catalogue is an open, community-maintained collection of discrete visual symbols 
                  reported during 650 nm laser exposure and N,N-DMT experiences. This dataset supports independent replication 
                  and academic research into reported visual phenomena.
                </p>
                
                <h4 className="text-foreground font-semibold mt-6 mb-2">Dataset Contents</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li>Symbol images (100×100 px PNG)</li>
                  <li>Structured metadata (source, dose, observation conditions)</li>
                  <li>Community validation counts</li>
                  <li>Motif tags and classifications</li>
                </ul>
                
                <h4 className="text-foreground font-semibold mt-6 mb-2">License</h4>
                <p className="text-muted-foreground">
                  This dataset is released under the{" "}
                  <a 
                    href="https://creativecommons.org/licenses/by/4.0/" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Creative Commons Attribution 4.0 International License (CC-BY-4.0)
                  </a>. 
                  You are free to share and adapt this data for any purpose, provided you give appropriate credit.
                </p>
                
                <h4 className="text-foreground font-semibold mt-6 mb-2">Version History</h4>
                <ul className="text-muted-foreground space-y-1">
                  <li><strong>v1.0 (December 2025)</strong> — Initial public release</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Dataset;
