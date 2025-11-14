/**
 * @generated SignedSource<<3ac042da515845c063d030260517072c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type EmbeddingModelPageDestroyMutation$variables = {
  id: string;
};
export type EmbeddingModelPageDestroyMutation$data = {
  readonly destroyEmbeddingModel: boolean;
};
export type EmbeddingModelPageDestroyMutation = {
  response: EmbeddingModelPageDestroyMutation$data;
  variables: EmbeddingModelPageDestroyMutation$variables;
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
    "name": "destroyEmbeddingModel",
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "EmbeddingModelPageDestroyMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "EmbeddingModelPageDestroyMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "fc77533dc76b116b68a37475c4f26f23",
    "id": null,
    "metadata": {},
    "name": "EmbeddingModelPageDestroyMutation",
    "operationKind": "mutation",
    "text": "mutation EmbeddingModelPageDestroyMutation(\n  $id: String!\n) {\n  destroyEmbeddingModel(id: $id)\n}\n"
  }
};
})();

(node as any).hash = "fd63277fa755706481525b9504c5e8fa";

export default node;
