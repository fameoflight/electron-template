/**
 * @generated SignedSource<<c9b3582762b2a2c2c95734d5cd0f6a3f>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
export type CreateUpdateConnectionInput = {
  apiKey?: string | null | undefined;
  baseUrl?: string | null | undefined;
  customHeaders?: any | null | undefined;
  id?: string | null | undefined;
  kind?: ConnectionBaseKind | null | undefined;
  name?: string | null | undefined;
  provider?: string | null | undefined;
};
export type ConnectionPageCreateUpdateMutation$variables = {
  input: CreateUpdateConnectionInput;
};
export type ConnectionPageCreateUpdateMutation$data = {
  readonly createUpdateConnection: {
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly customHeaders: any | null | undefined;
    readonly id: string;
    readonly kind: ConnectionBaseKind;
    readonly name: string;
    readonly provider: string | null | undefined;
  };
};
export type ConnectionPageCreateUpdateMutation = {
  response: ConnectionPageCreateUpdateMutation$data;
  variables: ConnectionPageCreateUpdateMutation$variables;
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
    "concreteType": "Connection",
    "kind": "LinkedField",
    "name": "createUpdateConnection",
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
        "name": "apiKey",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "baseUrl",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "provider",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "kind",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "customHeaders",
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
    "name": "ConnectionPageCreateUpdateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ConnectionPageCreateUpdateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "935117cdd32d996a4e53454443a73afe",
    "id": null,
    "metadata": {},
    "name": "ConnectionPageCreateUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation ConnectionPageCreateUpdateMutation(\n  $input: CreateUpdateConnectionInput!\n) {\n  createUpdateConnection(input: $input) {\n    id\n    name\n    apiKey\n    baseUrl\n    provider\n    kind\n    customHeaders\n  }\n}\n"
  }
};
})();

(node as any).hash = "f367426280492613e254d536f7fb8ff7";

export default node;
