/**
 * @generated SignedSource<<20f58c780cae8e81b76b37a6f68e1a8e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ChatBaseStatus = "active" | "archived" | "deleted" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ChatListItem_chat$data = {
  readonly createdAt: any;
  readonly description: string | null | undefined;
  readonly id: string;
  readonly llmModel: {
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
  };
  readonly status: ChatBaseStatus;
  readonly tags: ReadonlyArray<string> | null | undefined;
  readonly title: string;
  readonly updatedAt: any;
  readonly " $fragmentType": "ChatListItem_chat";
};
export type ChatListItem_chat$key = {
  readonly " $data"?: ChatListItem_chat$data;
  readonly " $fragmentSpreads": FragmentRefs<"ChatListItem_chat">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ChatListItem_chat",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "tags",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "description",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "status",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "LLMModel",
      "kind": "LinkedField",
      "name": "llmModel",
      "plural": false,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "name",
          "storageKey": null
        },
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "modelIdentifier",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Chat",
  "abstractKey": null
};
})();

(node as any).hash = "1bbee6f43b7e7a3c9a759163beb278ef";

export default node;
