/**
 * @generated SignedSource<<4fdf5a842518c30b6c1e1d2c36d57286>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
export type ChatPageCancelMessageMutation$variables = {
  messageId: string;
};
export type ChatPageCancelMessageMutation$data = {
  readonly cancelMessage: {
    readonly id: string;
    readonly status: MessageVersionBaseStatus;
  };
};
export type ChatPageCancelMessageMutation = {
  response: ChatPageCancelMessageMutation$data;
  variables: ChatPageCancelMessageMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "messageId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "messageId",
        "variableName": "messageId"
      }
    ],
    "concreteType": "Message",
    "kind": "LinkedField",
    "name": "cancelMessage",
    "plural": false,
    "selections": [
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "id",
        "storageKey": null
      },
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ChatPageCancelMessageMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ChatPageCancelMessageMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "cfbc9a2824115d0b76921c33e74d7f01",
    "id": null,
    "metadata": {},
    "name": "ChatPageCancelMessageMutation",
    "operationKind": "mutation",
    "text": "mutation ChatPageCancelMessageMutation(\n  $messageId: String!\n) {\n  cancelMessage(messageId: $messageId) {\n    id\n    status\n  }\n}\n"
  }
};
})();

(node as any).hash = "5e8bb99cb148ac3604a620e9c08e66e5";

export default node;
