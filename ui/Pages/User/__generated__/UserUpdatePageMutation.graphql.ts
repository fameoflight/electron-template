/**
 * @generated SignedSource<<ea3d20c2fe22538f88c564f7518876e0>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type UpdateUserInput = {
  name?: string | null | undefined;
  password?: string | null | undefined;
  sessionKey?: string | null | undefined;
  username?: string | null | undefined;
};
export type UserUpdatePageMutation$variables = {
  input: UpdateUserInput;
};
export type UserUpdatePageMutation$data = {
  readonly updateUser: {
    readonly id: string;
    readonly name: string;
    readonly sessionKey: string | null | undefined;
    readonly username: string;
  };
};
export type UserUpdatePageMutation = {
  response: UserUpdatePageMutation$data;
  variables: UserUpdatePageMutation$variables;
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
    "name": "updateUser",
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
    "name": "UserUpdatePageMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UserUpdatePageMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6817705ec52c725ab9b9979117086c5c",
    "id": null,
    "metadata": {},
    "name": "UserUpdatePageMutation",
    "operationKind": "mutation",
    "text": "mutation UserUpdatePageMutation(\n  $input: UpdateUserInput!\n) {\n  updateUser(input: $input) {\n    id\n    name\n    username\n    sessionKey\n  }\n}\n"
  }
};
})();

(node as any).hash = "0e03fd1e09931cce411458175df162ca";

export default node;
