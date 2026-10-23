import { useState } from 'react';

type LdNode = { '@id'?: string; '@type'?: string | string[]; '@graph'?: LdNode[] };
export type LdMatcher = { id: string } | { type: string };
const documentPath = typeof window === 'undefined' ? '' : window.location.pathname;

export function matchesPrerenderedLd(nodes: LdNode[], matcher: LdMatcher): boolean {
  return nodes.some((node) => 'id' in matcher
    ? node['@id'] === matcher.id
    : [node['@type']].flat().includes(matcher.type));
}

export function usePrerenderedLd(matcher: LdMatcher): boolean {
  const [snapshot] = useState(() => {
    if (typeof document === 'undefined') return { path: '', nodes: [] as LdNode[] };
    const nodes: LdNode[] = [];
    for (const script of document.querySelectorAll('script[type="application/ld+json"]:not([data-react-helmet])')) {
      try {
        const value = JSON.parse(script.textContent ?? '');
        for (const node of [value].flat()) {
          if (!node || typeof node !== 'object') continue;
          nodes.push(...(Array.isArray(node['@graph']) ? node['@graph'] : [node]));
        }
      } catch { /* Malformed metadata cannot suppress a valid client node. */ }
    }
    return { path: documentPath, nodes };
  });
  return typeof window !== 'undefined' && snapshot.path === window.location.pathname
    && matchesPrerenderedLd(snapshot.nodes, matcher);
}