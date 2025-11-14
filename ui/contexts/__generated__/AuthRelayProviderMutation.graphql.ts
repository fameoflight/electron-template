/**
 * @generated SignedSource<<e4143698e02d4091feafabbd39790a07>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type AuthRelayProviderMutation$variables = {
  sessionKey: string;
};
export type AuthRelayProviderMutation$data = {
  readonly validateSessionKey: {
    readonly id: string;
    readonly name: string;
    readonly sessionKey: string | null | undefined;
    readonly username: string;
  } | null | undefined;
};
export type AuthRelayProviderMutation = {
  response: AuthRelayProviderMutation$data;
  variables: AuthRelayProviderMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "sessionKey"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "sessionKey",
        "variableName": "sessionKey"
      }
    ],
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "validateSessionKey",
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
        "name": "name",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "username",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "sessionKey",
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
    "name": "AuthRelayProviderMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AuthRelayProviderMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c0f4594164f826c7060fd2488f507b7a",
    "id": null,
    "metadata": {},
    "name": "AuthRelayProviderMutation",
    "operationKind": "mutation",
    "text": "mutation AuthRelayProviderMutation(\n  $sessionKey: String!\n) {\n  validateSessionKey(sessionKey: $sessionKey) {\n    id\n    name\n    username\n    sessionKey\n  }\n}\n"
  }
};
})();

(node as any).hash = "4b7593f29562d01ae6b67e9d8a4bc74e";

export default node;
