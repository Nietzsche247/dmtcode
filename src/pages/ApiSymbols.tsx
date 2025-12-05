import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';

interface Symbol {
  id: string;
  description: string;
  tags: string[];
  source: string;
  surface?: string;
  symmetry: string;
  doi?: string;
  consistency?: number;
  confidence_rating?: number;
  drawing_duration_seconds?: number;
  orcid?: string;
}

interface ApiResponse {
  version: string;
  dateModified: string;
  license: string;
  total: number;
  offset: number;
  limit: number;
  symbols: Symbol[];
}

const ApiSymbols = () => {
  const [searchParams] = useSearchParams();
  const [response, setResponse] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAndFilterSymbols();
  }, [searchParams]);

  const fetchAndFilterSymbols = async () => {
    setLoading(true);
    try {
      const res = await fetch('/data.json');
      const data = await res.json();
      
      let symbols: Symbol[] = data.symbols || [];
      
      // Parse query params
      const tag = searchParams.get('tag');
      const source = searchParams.get('source');
      const consistency = searchParams.get('consistency');
      const symmetry = searchParams.get('symmetry');
      const orcid = searchParams.get('orcid');
      const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10), 500);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Filter by tag (comma-separated)
      if (tag) {
        const tags = tag.split(',').map(t => t.trim().toLowerCase());
        symbols = symbols.filter(s => 
          s.tags?.some(t => tags.some(rt => t.toLowerCase().includes(rt)))
        );
      }

      // Filter by source
      if (source) {
        symbols = symbols.filter(s => 
          s.source?.toLowerCase().includes(source.toLowerCase())
        );
      }

      // Filter by symmetry
      if (symmetry) {
        symbols = symbols.filter(s => 
          s.symmetry?.toLowerCase() === symmetry.toLowerCase()
        );
      }

      // Filter by ORCID
      if (orcid) {
        symbols = symbols.filter(s => s.orcid === orcid);
      }

      // Filter by consistency (e.g., gte:80, lte:50, eq:90)
      if (consistency) {
        const match = consistency.match(/^(gte|lte|gt|lt|eq):(\d+)$/);
        if (match) {
          const [, op, val] = match;
          const threshold = parseInt(val, 10);
          // Mock consistency based on index for demo (real would come from DB)
          symbols = symbols.map((s, i) => ({
            ...s,
            consistency: s.consistency ?? (60 + (i % 40)) // Mock: 60-99%
          }));
          
          symbols = symbols.filter(s => {
            const c = s.consistency || 0;
            switch (op) {
              case 'gte': return c >= threshold;
              case 'lte': return c <= threshold;
              case 'gt': return c > threshold;
              case 'lt': return c < threshold;
              case 'eq': return c === threshold;
              default: return true;
            }
          });
        }
      }

      const total = symbols.length;
      
      // Apply pagination
      symbols = symbols.slice(offset, offset + limit);

      setResponse({
        version: data.version || '2.0',
        dateModified: data.dateModified || new Date().toISOString().split('T')[0],
        license: 'CC-BY-4.0',
        total,
        offset,
        limit,
        symbols
      });
    } catch (error) {
      console.error('Failed to fetch symbols:', error);
      setResponse({
        version: '2.0',
        dateModified: new Date().toISOString().split('T')[0],
        license: 'CC-BY-4.0',
        total: 0,
        offset: 0,
        limit: 100,
        symbols: []
      });
    }
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>Symbol API | DMT Code</title>
        <meta name="description" content="Public API for querying DMT Code Visual Symbol Catalogue with filtering by tag, source, symmetry, consistency, and ORCID." />
        <meta name="robots" content="noindex, follow" />
      </Helmet>
      
      <div className="min-h-screen bg-background p-4 font-mono text-sm">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-xl font-bold mb-4 text-foreground">Symbol API Response</h1>
          
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border">
            <h2 className="font-semibold mb-2 text-foreground">Query Parameters:</h2>
            <ul className="text-muted-foreground space-y-1 text-xs">
              <li><code className="bg-muted px-1 rounded">?tag=helix,spiral</code> — Filter by tags (comma-separated)</li>
              <li><code className="bg-muted px-1 rounded">?source=650nm_laser</code> — Filter by observation source</li>
              <li><code className="bg-muted px-1 rounded">?symmetry=radial</code> — Filter by symmetry type</li>
              <li><code className="bg-muted px-1 rounded">?consistency=gte:80</code> — Filter by consistency (gte, gt, lte, lt, eq)</li>
              <li><code className="bg-muted px-1 rounded">?orcid=0000-0002-1825-0097</code> — Filter by ORCID</li>
              <li><code className="bg-muted px-1 rounded">?limit=50&offset=0</code> — Pagination (max 500)</li>
            </ul>
          </div>

          {loading ? (
            <div className="text-muted-foreground">Loading...</div>
          ) : (
            <pre className="bg-card border border-border rounded-lg p-4 overflow-x-auto text-foreground whitespace-pre-wrap break-words">
              {JSON.stringify(response, null, 2)}
            </pre>
          )}
        </div>
      </div>
    </>
  );
};

export default ApiSymbols;