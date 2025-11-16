/**
 * @generated SignedSource<<734e6e5c67f3f9cdd4dde928216d790d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
export type chatUtilsQuery$variables = {
  chatId: string;
};
export type chatUtilsQuery$data = {
  readonly chatMessages: ReadonlyArray<{
    readonly versions: ReadonlyArray<{
      readonly id: string;
      readonly status: MessageVersionBaseStatus;
    }>;
  }>;
};
export type chatUtilsQuery = {
  response: chatUtilsQuery$data;
  variables: chatUtilsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "chatId"
  }
],
v1 = [
  {
    "kind": "Variable",
    "name": "chatId",
    "variableName": "chatId"
  }
],
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "concreteType": "MessageVersion",
  "kind": "LinkedField",
  "name": "versions",
  "plural": true,
  "selections": [
    (v2/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "status",
      "storageKey": null
    }
  ],
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "chatUtilsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "chatMessages",
        "plural": true,
        "selections": [
          (v3/*: any*/)
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
    "name": "chatUtilsQuery",
    "selections": [
      {
        "alias": null,
        "args": (v1/*: any*/),
        "concreteType": "Message",
        "kind": "LinkedField",
        "name": "chatMessages",
        "plural": true,
        "selections": [
          (v3/*: any*/),
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "11b2208e0a01b7952908ebcde07b050d",
    "id": null,
    "metadata": {},
    "name": "chatUtilsQuery",
    "operationKind": "query",
    "text": "query chatUtilsQuery(\n  $chatId: String!\n) {\n  chatMessages(chatId: $chatId) {\n    versions {\n      id\n      status\n    }\n    id\n  }\n}\n"
  }
};
})();

(node as any).hash = "28234bc3a2d5439955999e293717a266";

export default node;
