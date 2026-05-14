import { useModeStore } from '@/stores/modeStore';

interface MetaConfig {
  research: {
    title: string;
    description: string;
  };
  explorer: {
    title: string;
    description: string;
  };
}

const pageMetaConfig: Record<string, MetaConfig> = {
  home: {
    research: {
      title: 'DMT Code | 650nm Laser Visual Symbol Research',
      description: 'Open peer-reviewed catalogue of visual symbols from 650nm laser and N,N-DMT research. CSV/JSON datasets, CC-BY-4.0 licensed.',
    },
    explorer: {
      title: 'DMT Code | Visual Symbol Discovery & Community Research Hub',
      description: 'Explore the mystery of visual symbols reported during DMT experiences. Join 3,000+ replicators documenting the 650nm laser protocol phenomenon.',
    },
  },
  tools: {
    research: {
      title: 'Research Equipment & Protocol Tools | DMT Code',
      description: 'Verified 650nm laser equipment, optical components, and research tools for controlled symbol documentation studies.',
    },
    explorer: {
      title: 'Journey Equipment | From Entry-Level to Premium | DMT Code',
      description: 'Curated equipment for consciousness exploration. $12 starter items to $2,000 ceremonial experiences. Fund ongoing research.',
    },
  },
  bibliography: {
    research: {
      title: 'Peer-Reviewed Research Bibliography | DMT Code',
      description: 'Complete bibliography of peer-reviewed citations: Davis 2021, Timmermann 2019, Strassman 2001, Goler 2025. DOI links and abstracts.',
    },
    explorer: {
      title: 'Scientific Research & Citations | DMT Code',
      description: 'The science behind the symbols. Explore peer-reviewed research documenting visual phenomena during DMT experiences.',
    },
  },
  registry: {
    research: {
      title: 'Visual Symbol Registry | DMT Code Research Database',
      description: 'Submit and browse discrete visual symbols. Structured metadata, validation voting, CSV/JSON exports for academic analysis.',
    },
    explorer: {
      title: 'Symbol Registry | Discover & Contribute | DMT Code',
      description: 'Browse symbols reported by thousands of explorers. Submit your own observations and validate others. Join the community.',
    },
  },
  events: {
    research: {
      title: 'Clinical Trials & Research Events | DMT Code',
      description: 'Track active psychedelic clinical trials, academic conferences, and research publications. ClinicalTrials.gov integration.',
    },
    explorer: {
      title: 'Events, Retreats & Ceremonies | DMT Code',
      description: 'Discover retreats, ceremonies, and community events. Find verified facilitators and integration support worldwide.',
    },
  },
  bundles: {
    research: {
      title: 'Research Kits & Protocol Equipment Bundles | DMT Code',
      description: 'Pre-configured equipment bundles for 650nm protocol research. Starter to advanced kits with verified components.',
    },
    explorer: {
      title: 'Journey Kits & Bundles | Save Up to 20% | DMT Code',
      description: 'Curated equipment packages for every explorer. From $85 starter kits to $2,300 complete ceremony bundles.',
    },
  },
};

export const useDynamicMeta = (page: keyof typeof pageMetaConfig) => {
  const { mode } = useModeStore();
  const config = pageMetaConfig[page];
  
  if (!config) {
    return {
      title: 'DMT Code Visual Symbol Catalogue',
      description: 'Open catalogue of visual symbols from 650nm laser exposure and N,N-DMT experiences.',
    };
  }
  
  return config[mode];
};

export const getPageMeta = (page: string, mode: 'research' | 'explorer') => {
  const config = pageMetaConfig[page as keyof typeof pageMetaConfig];
  if (!config) {
    return {
      title: 'DMT Code Visual Symbol Catalogue',
      description: 'Open catalogue of visual symbols from 650nm laser exposure and N,N-DMT experiences.',
    };
  }
  return config[mode];
};
