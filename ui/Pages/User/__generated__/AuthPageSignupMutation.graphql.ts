/**
 * @generated SignedSource<<a967cda89ba5de1bb8b7787a2985b3e4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateUserInput = {
  name: string;
  password: string;
  username: string;
};
export type AuthPageSignupMutation$variables = {
  input: CreateUserInput;
};
export type AuthPageSignupMutation$data = {
  readonly createUser: {
    readonly id: string;
    readonly name: string;
    readonly sessionKey: string | null | undefined;
    readonly username: string;
  };
};
export type AuthPageSignupMutation = {
  response: AuthPageSignupMutation$data;
  variables: AuthPageSignupMutation$variables;
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
    "name": "createUser",
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
    "name": "AuthPageSignupMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "AuthPageSignupMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "e4560c986f2478472428c0a04d502e8c",
    "id": null,
    "metadata": {},
    "name": "AuthPageSignupMutation",
    "operationKind": "mutation",
    "text": "mutation AuthPageSignupMutation(\n  $input: CreateUserInput!\n) {\n  createUser(input: $input) {\n    id\n    name\n    username\n    sessionKey\n  }\n}\n"
  }
};
})();

(node as any).hash = "12f2fcb830bce975d351169e7ba67679";

export default node;
