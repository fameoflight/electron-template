/**
 * @generated SignedSource<<88b2fbd46bb96d78e1c1a76699d2ddda>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
export type UpdateMessageInput = {
  chatId?: string | null | undefined;
  currentVersionId?: string | null | undefined;
  id: string;
  llmModelId?: string | null | undefined;
  role?: MessageBaseRole | null | undefined;
};
export type MessageListUpdateMutation$variables = {
  input: UpdateMessageInput;
};
export type MessageListUpdateMutation$data = {
  readonly updateMessage: {
    readonly currentVersionId: string;
    readonly id: string;
  };
};
export type MessageListUpdateMutation = {
  response: MessageListUpdateMutation$data;
  variables: MessageListUpdateMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
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
    "name": "updateMessage",
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
        "name": "currentVersionId",
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
    "name": "MessageListUpdateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "MessageListUpdateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "b32a46a3312faf750cdd4f7c90365298",
    "id": null,
    "metadata": {},
    "name": "MessageListUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation MessageListUpdateMutation(\n  $input: UpdateMessageInput!\n) {\n  updateMessage(input: $input) {\n    id\n    currentVersionId\n  }\n}\n"
  }
};
})();

(node as any).hash = "79df07b427d35c95bae3092f8bf7b480";

export default node;
