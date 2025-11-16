/**
 * @generated SignedSource<<446c3750d22cc2f0c7858a6494e42fc8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
export type RegenerateMessageInput = {
  llmModelId?: string | null | undefined;
  messageVersionId: string;
};
export type MessageListRegenerateMutation$variables = {
  input: RegenerateMessageInput;
};
export type MessageListRegenerateMutation$data = {
  readonly regenerateMessage: {
    readonly currentVersionId: string;
    readonly id: string;
    readonly versions: ReadonlyArray<{
      readonly id: string;
      readonly status: MessageVersionBaseStatus;
    }>;
  };
};
export type MessageListRegenerateMutation = {
  response: MessageListRegenerateMutation$data;
  variables: MessageListRegenerateMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v2 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "Message",
    "kind": "LinkedField",
    "name": "regenerateMessage",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "currentVersionId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "MessageVersion",
        "kind": "LinkedField",
        "name": "versions",
        "plural": true,
        "selections": [
          (v1/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "status",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "MessageListRegenerateMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "MessageListRegenerateMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "f07cbb101e1e9b64461d0ea9ad1efa8e",
    "id": null,
    "metadata": {},
    "name": "MessageListRegenerateMutation",
    "operationKind": "mutation",
    "text": "mutation MessageListRegenerateMutation(\n  $input: RegenerateMessageInput!\n) {\n  regenerateMessage(input: $input) {\n    id\n    currentVersionId\n    versions {\n      id\n      status\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "3c3e92d7fdc0739c619b00d305e4832f";

export default node;
