import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface SearchResultsEvent extends CustomEvent {
  detail: {
    entity: string;
    data: any | null;
    filterStatus?: string;
  };
}

export const useSearchResults = (entity: string, currentPage: number, filterStatus?: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleSearchResults = (event: Event) => {
      const searchEvent = event as SearchResultsEvent;
      const { entity: searchEntity, data, filterStatus: searchFilterStatus } = searchEvent.detail;
      if (searchEntity === entity) {
        // If data is null, don't update the cache (this will show the complete listing)
        if (data === null) return;

        // Update the query cache with search results
        const queryKey = filterStatus 
          ? [entity, currentPage, filterStatus]
          : [entity, currentPage];
        queryClient.setQueryData(queryKey, data);
      }
    };

    window.addEventListener('searchResults', handleSearchResults);
    return () => window.removeEventListener('searchResults', handleSearchResults);
  }, [queryClient, currentPage, entity, filterStatus]);
}; 