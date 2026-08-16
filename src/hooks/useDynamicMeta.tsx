import { useModeStore } from '@/stores/modeStore';
import { KIT_PRICE_RANGE } from '@/data/kits';

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
      description: 'Open community catalogue of visual symbols reported during 650nm laser and N,N-DMT sessions. CSV/JSON datasets, CC-BY-4.0 licensed.',
    },
    explorer: {
      title: 'DMT Code | Visual Symbol Discovery & Community Research Hub',
      description: 'Explore the mystery of visual symbols reported during DMT experiences. Join an independent replicator community documenting the 650nm laser protocol phenomenon.',
    },
  },
  tools: {
    research: {
      title: 'Laser Diffraction Research Kits | DMT Code',
      description: `Kits for one observer or for groups of two to three or six observers, ${KIT_PRICE_RANGE}. Sold by Meridian Optics Lab.`,
    },
    explorer: {
      title: 'Journey Equipment | From Entry-Level to Premium | DMT Code',
      description: `Kits for one observer or for groups of two to three or six observers, ${KIT_PRICE_RANGE}. Each card prints what the same parts cost if you sourced them yourself.`,
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
      description: 'Browse symbols reported by a broad community of explorers. Submit your own observations and validate others. Join the community.',
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
      description: `Equipment bundles for 650nm protocol observation, from ${KIT_PRICE_RANGE}. Component specifications are not yet published.`,
    },
    explorer: {
      title: `Kits & Group Bundles | ${KIT_PRICE_RANGE} | DMT Code`,
      description: `Equipment packages for one observer or for groups of two to three or six observers. From ${KIT_PRICE_RANGE}. Each kit costs more than sourcing the same parts yourself, and each card prints the difference.`,
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
