import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { graphql } from "react-relay/hooks";
import { useEmbeddingModelsQuery } from "@ui/Pages/Documents/__generated__/useEmbeddingModelsQuery.graphql";

export type EmbeddingModel = useEmbeddingModelsQuery['response']['embeddingModelsArray'][0];

/**
 * Hook to fetch available embedding models for search.
 * Returns [embeddingModels, loading, error]
 */
export function useEmbeddingModels(): EmbeddingModel[] {
  const EmbeddingModelsQuery = graphql`
    query useEmbeddingModelsQuery {
      embeddingModelsArray {
        id
        name
        modelIdentifier
        dimension
        default
      }
    }
  `;

  const [data] = useNetworkLazyReloadQuery<useEmbeddingModelsQuery>(
    EmbeddingModelsQuery,
    {}
  );

  return Array.from(data?.embeddingModelsArray ?? []);
}