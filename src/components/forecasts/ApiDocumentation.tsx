import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Code, Copy, Check, ExternalLink, Zap } from "lucide-react";
import { toast } from "sonner";

const API_BASE = "https://bbmhrgpsyiahefnxqwfg.supabase.co/functions/v1/forecasts-export";

const EXAMPLES = [
  {
    label: "Full Export",
    description: "Complete forecasts with dependencies and market comparisons",
    url: API_BASE,
    format: "full"
  },
  {
    label: "Summary (Token-Efficient)",
    description: "Condensed format for context-limited AI systems",
    url: `${API_BASE}?format=summary`,
    format: "summary"
  },
  {
    label: "Timeline View",
    description: "Grouped by year for temporal analysis",
    url: `${API_BASE}?format=timeline`,
    format: "timeline"
  },
  {
    label: "Filtered",
    description: "High-probability 2028 events only",
    url: `${API_BASE}?min_probability=50&year=2028`,
    format: "filtered"
  }
];

const SAMPLE_RESPONSE = `{
  "meta": {
    "generated_at": "2025-12-10T06:00:00Z",
    "source": "dmtcode.com/forecasts",
    "methodology": "Mechanism-based forecasting for unprecedented events.",
    "total_events": 59
  },
  "forecasts": [
    { "event": "China-Taiwan Military Conflict", "when": "Q1 2027", "probability": "22%" },
    { "event": "AGI (Human-Level General Intelligence)", "when": "Q4 2028", "probability": "18%" },
    { "event": "Artificial Superintelligence", "when": "Q2 2029", "probability": "15%" }
  ]
}`;

export function ApiDocumentation() {
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(text);
    toast.success(`Copied ${label} URL`);
    setTimeout(() => setCopiedUrl(null), 2000);
  };

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Zap className="w-5 h-5 text-primary" />
          AI-Readable API
          <Badge variant="outline" className="ml-2">Public</Badge>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Query this endpoint to feed forecasts into your AI system as context
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Endpoints */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Endpoints</h4>
          <div className="space-y-2">
            {EXAMPLES.map((example) => (
              <div
                key={example.format}
                className="flex items-start justify-between gap-3 p-3 bg-muted/30 rounded-lg border border-border/30"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{example.label}</span>
                    <Badge variant="secondary" className="text-xs">GET</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{example.description}</p>
                  <code className="text-xs text-primary/80 break-all block">{example.url}</code>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(example.url, example.label)}
                  className="shrink-0"
                >
                  {copiedUrl === example.url ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* Query Parameters */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-foreground">Query Parameters</h4>
          <div className="grid gap-2 text-sm">
            <div className="flex items-start gap-3">
              <code className="bg-muted px-2 py-0.5 rounded text-xs shrink-0">format</code>
              <span className="text-muted-foreground text-xs">
                <code>full</code> (default), <code>summary</code>, or <code>timeline</code>
              </span>
            </div>
            <div className="flex items-start gap-3">
              <code className="bg-muted px-2 py-0.5 rounded text-xs shrink-0">min_probability</code>
              <span className="text-muted-foreground text-xs">Filter events ≥ this probability (0-100)</span>
            </div>
            <div className="flex items-start gap-3">
              <code className="bg-muted px-2 py-0.5 rounded text-xs shrink-0">year</code>
              <span className="text-muted-foreground text-xs">Filter to specific year (2025-2035)</span>
            </div>
          </div>
        </div>

        {/* Sample Response */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Code className="w-4 h-4" />
              Sample Response
              <Badge variant="outline" className="text-xs">summary format</Badge>
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => copyToClipboard(SAMPLE_RESPONSE, "sample response")}
            >
              <Copy className="w-4 h-4 mr-1" />
              Copy
            </Button>
          </div>
          <pre className="bg-muted/50 rounded-lg p-4 text-xs overflow-x-auto border border-border/30">
            <code className="text-muted-foreground">{SAMPLE_RESPONSE}</code>
          </pre>
        </div>

        {/* Usage Note */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">For AI systems:</span> Use the <code className="bg-muted px-1 rounded">summary</code> format 
            to minimize token usage. The <code className="bg-muted px-1 rounded">meta.methodology</code> field explains our forecasting paradigm 
            (mechanism-based, not reference-class anchoring).
          </p>
        </div>

        {/* Try It */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(API_BASE, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Try Full Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(`${API_BASE}?format=summary`, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Try Summary
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
