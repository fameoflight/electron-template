/**
 * @generated SignedSource<<0885e32a6903e8a85a046d2c1eca507f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ChatBaseStatus = "active" | "archived" | "deleted" | "%future added value";
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
export type ChatPageQuery$variables = {
  id: string;
};
export type ChatPageQuery$data = {
  readonly chat: {
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
  } | null | undefined;
  readonly chatMessages: ReadonlyArray<{
    readonly content: string | null | undefined;
    readonly createdAt: any;
    readonly id: string;
    readonly role: MessageBaseRole;
    readonly status: MessageVersionBaseStatus;
    readonly updatedAt: any;
    readonly " $fragmentSpreads": FragmentRefs<"MessageList_messages">;
  }>;
};
export type ChatPageQuery = {
  response: ChatPageQuery$data;
  variables: ChatPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "status",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": [
    {
      "kind": "Variable",
      "name": "id",
      "variableName": "id"
    }
  ],
  "concreteType": "Chat",
  "kind": "LinkedField",
  "name": "chat",
  "plural": false,
  "selections": [
    (v1/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "title",
      "storageKey": null
    },
    (v2/*: any*/),
    (v3/*: any*/),
    (v4/*: any*/),
    {
      "alias": null,
      "args": null,
      "concreteType": "LLMModel",
      "kind": "LinkedField",
      "name": "llmModel",
      "plural": false,
      "selections": [
        (v1/*: any*/),
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
  "storageKey": null
},
v6 = [
  {
    "kind": "Variable",
    "name": "chatId",
    "variableName": "id"
  }
],
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "content",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "role",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ChatPageQuery",
    "selections": [
      (v5/*: any*/),
      {
        "alias": null,
        "args": (v6/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "chatMessages",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "MessageList_messages"
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ChatPageQuery",
    "selections": [
      (v5/*: any*/),
      {
        "alias": null,
        "args": (v6/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "chatMessages",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "249fd23583ec0f1de642ed2fba0cd717",
    "id": null,
    "metadata": {},
    "name": "ChatPageQuery",
    "operationKind": "query",
    "text": "query ChatPageQuery(\n  $id: String!\n) {\n  chat(id: $id) {\n    id\n    title\n    status\n    createdAt\n    updatedAt\n    llmModel {\n      id\n      name\n      modelIdentifier\n    }\n  }\n  chatMessages(chatId: $id) {\n    id\n    content\n    role\n    status\n    createdAt\n    updatedAt\n    ...MessageList_messages\n  }\n}\n\nfragment MessageList_messages on Message {\n  id\n  content\n  role\n  status\n  createdAt\n  updatedAt\n}\n"
  }
};
})();

(node as any).hash = "7e61e701035d0a16e2019af15557f864";

export default node;
