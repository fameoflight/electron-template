import { useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { graphql } from "react-relay/hooks";
import { useLLMModelsQuery } from "@ui/Pages/Chat/__generated__/useLLMModelsQuery.graphql";

export type LLMModel = useLLMModelsQuery['response']['lLMModelsArray'][0];

/**
 * Hook to fetch available LLM models for message input.
 * Returns [llmModels, loading, error]
 */
export function useLLMModels(): LLMModel[] {
  const LLMModelsQuery = graphql`
    query useLLMModelsQuery {
      lLMModelsArray {
        id
        name
        modelIdentifier
        systemPrompt
        default
        capabilities
      }
    }
  `;

  const [data] = useNetworkLazyReloadQuery<useLLMModelsQuery>(
    LLMModelsQuery,
    {}
  );

  return Array.from(data?.lLMModelsArray ?? []);
}