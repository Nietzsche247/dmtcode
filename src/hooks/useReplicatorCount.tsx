import useSWR from 'swr';

interface DataJson {
  symbols: Array<{
    id: string;
    description: string;
    tags: string[];
    source: string;
    doi?: string;
  }>;
  products: Array<any>;
  faq: Array<any>;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export const useReplicatorCount = () => {
  const { data, error, isLoading } = useSWR<DataJson>('/data.json', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000, // Cache for 1 minute
  });

  return {
    replicatorCount: data?.symbols?.length || 52,
    isLoading,
    error,
  };
};
