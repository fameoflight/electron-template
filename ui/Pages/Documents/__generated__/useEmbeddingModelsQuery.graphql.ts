/**
 * @generated SignedSource<<9eda9cb6d792a346329884a8be29628e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type useEmbeddingModelsQuery$variables = Record<PropertyKey, never>;
export type useEmbeddingModelsQuery$data = {
  readonly embeddingModelsArray: ReadonlyArray<{
    readonly default: boolean | null | undefined;
    readonly dimension: number;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
  }>;
};
export type useEmbeddingModelsQuery = {
  response: useEmbeddingModelsQuery$data;
  variables: useEmbeddingModelsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "EmbeddingModel",
    "kind": "LinkedField",
    "name": "embeddingModelsArray",
    "plural": true,
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
        "name": "modelIdentifier",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "dimension",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "default",
        "storageKey": null
      }
    ],
    "storageKey": null
  }
];
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "useEmbeddingModelsQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useEmbeddingModelsQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "85f920d60cd4c693c12cee3d36fa0527",
    "id": null,
    "metadata": {},
    "name": "useEmbeddingModelsQuery",
    "operationKind": "query",
    "text": "query useEmbeddingModelsQuery {\n  embeddingModelsArray {\n    id\n    name\n    modelIdentifier\n    dimension\n    default\n  }\n}\n"
  }
};
})();

(node as any).hash = "7f6f4d49256a05387fd31a208788e327";

export default node;
