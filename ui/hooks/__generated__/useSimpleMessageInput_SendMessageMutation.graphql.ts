/**
 * @generated SignedSource<<c0fa051cd89266049c1666e042f2755f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
export type SendMessageInput = {
  attachmentIds?: ReadonlyArray<string> | null | undefined;
  chatId?: string | null | undefined;
  content: string;
  llmModelId: string;
  systemPrompt?: string | null | undefined;
};
export type useSimpleMessageInput_SendMessageMutation$variables = {
  input: SendMessageInput;
};
export type useSimpleMessageInput_SendMessageMutation$data = {
  readonly sendMessage: {
    readonly chat: {
      readonly id: string;
    } | null | undefined;
    readonly createdAt: any;
    readonly id: string;
    readonly role: MessageBaseRole;
  };
};
export type useSimpleMessageInput_SendMessageMutation = {
  response: useSimpleMessageInput_SendMessageMutation$data;
  variables: useSimpleMessageInput_SendMessageMutation$variables;
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
    "name": "sendMessage",
    "plural": false,
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "role",
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
        "concreteType": "Chat",
        "kind": "LinkedField",
        "name": "chat",
        "plural": false,
        "selections": [
          (v1/*: any*/)
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
    "name": "useSimpleMessageInput_SendMessageMutation",
    "selections": (v2/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useSimpleMessageInput_SendMessageMutation",
    "selections": (v2/*: any*/)
  },
  "params": {
    "cacheID": "e6a74f72042043ab5079670ff3eab57c",
    "id": null,
    "metadata": {},
    "name": "useSimpleMessageInput_SendMessageMutation",
    "operationKind": "mutation",
    "text": "mutation useSimpleMessageInput_SendMessageMutation(\n  $input: SendMessageInput!\n) {\n  sendMessage(input: $input) {\n    id\n    role\n    createdAt\n    chat {\n      id\n    }\n  }\n}\n"
  }
};
})();

(node as any).hash = "cfe37ea358aacfa6eb4d01c4e1f1bbe3";

export default node;
