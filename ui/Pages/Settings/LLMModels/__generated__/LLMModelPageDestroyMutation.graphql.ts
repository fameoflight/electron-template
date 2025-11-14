/**
 * @generated SignedSource<<aeef56b18467070c4dbda153af382153>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LLMModelPageDestroyMutation$variables = {
  id: string;
};
export type LLMModelPageDestroyMutation$data = {
  readonly destroyLLMModel: boolean;
};
export type LLMModelPageDestroyMutation = {
  response: LLMModelPageDestroyMutation$data;
  variables: LLMModelPageDestroyMutation$variables;
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
    "name": "destroyLLMModel",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "LLMModelPageDestroyMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "LLMModelPageDestroyMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "62d3cf7396a70f1c8de3da1d319f43ce",
    "id": null,
    "metadata": {},
    "name": "LLMModelPageDestroyMutation",
    "operationKind": "mutation",
    "text": "mutation LLMModelPageDestroyMutation(\n  $id: String!\n) {\n  destroyLLMModel(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "7b93c48fc49135bd7c07031da476a406";

export default node;
