/**
 * File utilities for search results
 */

import { fetchQuery } from "@ui/relay/environment";
import { graphql } from "relay-runtime";
import { chatUtilsQuery } from "./__generated__/chatUtilsQuery.graphql";
import { useAuth } from "@ui/contexts/AuthRelayProvider";

type ChatMessage = chatUtilsQuery['response']['chatMessages'][0];
type VersionStatus = ChatMessage['versions'][0]['status'];

export async function getChatMessages(chatId: string): Promise<ChatMessage[]> {
  const auth = useAuth();
  const query = graphql`
    query chatUtilsQuery($chatId: String!) {
      chatMessages(chatId: $chatId) {
        versions {
          id
          status
        }
      }
    }
  `;

  const variables = { chatId };
  return new Promise<ChatMessage[]>((resolve, reject) => {
    fetchQuery<chatUtilsQuery>(query, variables, { sessionKey: auth.user?.sessionKey })
      .then(data => resolve(Array.from(data.data.chatMessages)))
      .catch(error => reject(error));
  });
}

export async function getChatStatuses(chatId: string): Promise<VersionStatus[]> {
  const messages = await getChatMessages(chatId);

  const statuses = new Set<VersionStatus>();
  messages.forEach(message => {
    message.versions.forEach(version => {
      statuses.add(version.status);
    });
  });

  return Array.from(statuses);
}