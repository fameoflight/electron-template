/**
 * @generated SignedSource<<4741f00b60bc9fdbb3dff430b7a874db>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type ConnectionPageDestroyMutation$variables = {
  id: string;
};
export type ConnectionPageDestroyMutation$data = {
  readonly destroyConnection: boolean;
};
export type ConnectionPageDestroyMutation = {
  response: ConnectionPageDestroyMutation$data;
  variables: ConnectionPageDestroyMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "id"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "id"
      }
    ],
    "kind": "ScalarField",
    "name": "destroyConnection",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "ConnectionPageDestroyMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "ConnectionPageDestroyMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "27147d9ed8196bad4e150fcfda59c702",
    "id": null,
    "metadata": {},
    "name": "ConnectionPageDestroyMutation",
    "operationKind": "mutation",
    "text": "mutation ConnectionPageDestroyMutation(\n  $id: String!\n) {\n  destroyConnection(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "0d68da8244b29d50a634ff53f82a7f59";

export default node;
