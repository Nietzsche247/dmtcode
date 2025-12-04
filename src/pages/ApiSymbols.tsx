import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

interface Symbol {
  id: string;
  description: string;
  tags: string[];
  source: string;
  surface: string;
  symmetry: string;
  doi: string;
  consistency?: number;
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
      const limit = parseInt(searchParams.get('limit') || '100', 10);
      const offset = parseInt(searchParams.get('offset') || '0', 10);

      // Filter by tag (comma-separated)
      if (tag) {
        const tags = tag.split(',').map(t => t.trim().toLowerCase());
        symbols = symbols.filter(s => 
          s.tags.some(t => tags.includes(t.toLowerCase()))
        );
      }

      // Filter by source
      if (source) {
        symbols = symbols.filter(s => 
          s.source.toLowerCase() === source.toLowerCase()
        );
      }

      // Filter by symmetry
      if (symmetry) {
        symbols = symbols.filter(s => 
          s.symmetry?.toLowerCase() === symmetry.toLowerCase()
        );
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
            consistency: 60 + (i % 40) // Mock: 60-99%
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

  // Set CORS headers via response (client-side simulation)
  useEffect(() => {
    // For actual CORS, this would need server-side handling
    // This page returns JSON content type
  }, []);

  if (loading) {
    return (
      <pre style={{ 
        fontFamily: 'monospace', 
        padding: '20px',
        backgroundColor: '#0a0a0a',
        color: '#00ff00',
        minHeight: '100vh'
      }}>
        {JSON.stringify({ loading: true }, null, 2)}
      </pre>
    );
  }

  return (
    <pre style={{ 
      fontFamily: 'monospace', 
      padding: '20px',
      backgroundColor: '#0a0a0a',
      color: '#00ff00',
      minHeight: '100vh',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word'
    }}>
      {JSON.stringify(response, null, 2)}
    </pre>
  );
};

export default ApiSymbols;