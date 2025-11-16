/**
 * @generated SignedSource<<32ef153829367f81b533d36abaafe875>>
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
export type ChatNodePageQuery$variables = {
  id: string;
};
export type ChatNodePageQuery$data = {
  readonly chat: {
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
  } | null | undefined;
  readonly chatMessages: ReadonlyArray<{
    readonly createdAt: any;
    readonly currentVersionId: string;
    readonly id: string;
    readonly role: MessageBaseRole;
    readonly updatedAt: any;
    readonly versions: ReadonlyArray<{
      readonly id: string;
      readonly modelId: string;
      readonly status: MessageVersionBaseStatus;
    }>;
    readonly " $fragmentSpreads": FragmentRefs<"MessageList_messages">;
  }>;
};
export type ChatNodePageQuery = {
  response: ChatNodePageQuery$data;
  variables: ChatNodePageQuery$variables;
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
      "name": "tags",
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
  "name": "role",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "currentVersionId",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "modelId",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ChatNodePageQuery",
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
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "MessageVersion",
            "kind": "LinkedField",
            "name": "versions",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              (v2/*: any*/),
              (v9/*: any*/)
            ],
            "storageKey": null
          },
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
    "name": "ChatNodePageQuery",
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
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "MessageVersion",
            "kind": "LinkedField",
            "name": "versions",
            "plural": true,
            "selections": [
              (v1/*: any*/),
              (v2/*: any*/),
              (v9/*: any*/),
              {
                "alias": null,
                "args": null,
                "kind": "ScalarField",
                "name": "content",
                "storageKey": null
              },
              (v3/*: any*/),
              (v4/*: any*/),
              {
                "alias": null,
                "args": null,
                "concreteType": "FileEntity",
                "kind": "LinkedField",
                "name": "files",
                "plural": true,
                "selections": [
                  (v1/*: any*/),
                  {
                    "alias": null,
                    "args": null,
                    "kind": "ScalarField",
                    "name": "filename",
                    "storageKey": null
                  }
                ],
                "storageKey": null
              }
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "88f4cbe4aa6a8f1bd7a000164d65028c",
    "id": null,
    "metadata": {},
    "name": "ChatNodePageQuery",
    "operationKind": "query",
    "text": "query ChatNodePageQuery(\n  $id: String!\n) {\n  chat(id: $id) {\n    id\n    title\n    description\n    tags\n    status\n    createdAt\n    updatedAt\n    llmModel {\n      id\n      name\n      modelIdentifier\n    }\n  }\n  chatMessages(chatId: $id) {\n    id\n    role\n    currentVersionId\n    createdAt\n    updatedAt\n    versions {\n      id\n      status\n      modelId\n    }\n    ...MessageList_messages\n  }\n}\n\nfragment MessageList_messages on Message {\n  id\n  role\n  createdAt\n  updatedAt\n  currentVersionId\n  versions {\n    id\n    modelId\n    content\n    status\n    createdAt\n    updatedAt\n    ...MessageVersionView_record\n  }\n}\n\nfragment MessageVersionView_record on MessageVersion {\n  id\n  content\n  status\n  files {\n    id\n    filename\n  }\n}\n"
  }
};
})();

(node as any).hash = "249edbb6ae028f5a9506ff3f65b7bcec";

export default node;
