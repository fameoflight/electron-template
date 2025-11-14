/**
 * @generated SignedSource<<5899e4c1bd44ee65530f914df899edf0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LoginInput = {
  password: string;
  username: string;
};
export type AuthPageLoginMutation$variables = {
  input: LoginInput;
};
export type AuthPageLoginMutation$data = {
  readonly login: {
    readonly id: string;
    readonly name: string;
    readonly sessionKey: string | null | undefined;
    readonly username: string;
  };
};
export type AuthPageLoginMutation = {
  response: AuthPageLoginMutation$data;
  variables: AuthPageLoginMutation$variables;
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
    "concreteType": "User",
    "kind": "LinkedField",
    "name": "login",
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
    "name": "AuthPageLoginMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AuthPageLoginMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "c4c2bf1d65a292a6c0426158e5abc6d0",
    "id": null,
    "metadata": {},
    "name": "AuthPageLoginMutation",
    "operationKind": "mutation",
    "text": "mutation AuthPageLoginMutation(\n  $input: LoginInput!\n) {\n  login(input: $input) {\n    id\n    name\n    username\n    sessionKey\n  }\n}\n"
  }
};
})();

(node as any).hash = "5da2ff7b635f17078fb9df6e16991b73";

export default node;
