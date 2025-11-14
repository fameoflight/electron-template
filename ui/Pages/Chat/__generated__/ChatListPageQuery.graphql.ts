/**
 * @generated SignedSource<<d16defad1b1e321b9a358bbf567c813c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ChatBaseStatus = "active" | "archived" | "deleted" | "%future added value";
export type ChatListPageQuery$variables = Record<PropertyKey, never>;
export type ChatListPageQuery$data = {
  readonly currentUser: {
    readonly id: string;
  } | null | undefined;
  readonly myChats: ReadonlyArray<{
    readonly createdAt: any;
    readonly id: string;
    readonly llmModel: {
      readonly id: string;
      readonly modelIdentifier: string;
      readonly name: string | null | undefined;
    };
    readonly status: ChatBaseStatus;
    readonly title: string;
    readonly updatedAt: any;
    readonly " $fragmentSpreads": FragmentRefs<"ChatListItem_chat">;
  }>;
};
export type ChatListPageQuery = {
  response: ChatListPageQuery$data;
  variables: ChatListPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "currentUser",
  "plural": false,
  "selections": [
    (v0/*: any*/)
  ],
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "title",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v6 = {
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
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "ChatListPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Chat",
        "kind": "LinkedField",
        "name": "myChats",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ChatListItem_chat"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "ChatListPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Chat",
        "kind": "LinkedField",
        "name": "myChats",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
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
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "64b84f89f34832f9cc78327b6106bcf7",
    "id": null,
    "metadata": {},
    "name": "ChatListPageQuery",
    "operationKind": "query",
    "text": "query ChatListPageQuery {\n  currentUser {\n    id\n  }\n  myChats {\n    id\n    title\n    status\n    createdAt\n    updatedAt\n    llmModel {\n      id\n      name\n      modelIdentifier\n    }\n    ...ChatListItem_chat\n  }\n}\n\nfragment ChatListItem_chat on Chat {\n  id\n  title\n  tags\n  description\n  status\n  createdAt\n  updatedAt\n  llmModel {\n    id\n    name\n    modelIdentifier\n  }\n}\n"
  }
};
})();

(node as any).hash = "a65638cd0b8ffe298c29b48fcbc09ae7";

export default node;
