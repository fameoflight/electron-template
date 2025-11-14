/**
 * @generated SignedSource<<a48dcef19c21c76fab7e43addda70934>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
export type EmbeddingModelPageQuery$variables = Record<PropertyKey, never>;
export type EmbeddingModelPageQuery$data = {
  readonly connectionsArray: ReadonlyArray<{
    readonly id: string;
    readonly kind: ConnectionBaseKind;
    readonly name: string;
    readonly provider: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelForm_connections">;
  }>;
  readonly currentUser: {
    readonly id: string;
  } | null | undefined;
  readonly embeddingModelsArray: ReadonlyArray<{
    readonly connectionId: string;
    readonly contextLength: number;
    readonly dimension: number;
    readonly id: string;
    readonly maxBatchSize: number | null | undefined;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelForm_record" | "EmbeddingModelList_records">;
  }>;
};
export type EmbeddingModelPageQuery = {
  response: EmbeddingModelPageQuery$data;
  variables: EmbeddingModelPageQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "currentUser",
  "plural": false,
  "selections": [
    (v0/*: any*/)
  ],
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "provider",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kind",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "connectionId",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "dimension",
  "storageKey": null
},
v7 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "contextLength",
  "storageKey": null
},
v8 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "maxBatchSize",
  "storageKey": null
},
v9 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "modelIdentifier",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "EmbeddingModelPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Connection",
        "kind": "LinkedField",
        "name": "connectionsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "EmbeddingModelForm_connections"
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "EmbeddingModel",
        "kind": "LinkedField",
        "name": "embeddingModelsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v9/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "EmbeddingModelList_records"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "EmbeddingModelForm_record"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "EmbeddingModelPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Connection",
        "kind": "LinkedField",
        "name": "connectionsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          {
            "alias": null,
            "args": null,
            "concreteType": "ConnectionModelType",
            "kind": "LinkedField",
            "name": "models",
            "plural": true,
            "selections": [
              (v0/*: any*/),
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "concreteType": "EmbeddingModel",
        "kind": "LinkedField",
        "name": "embeddingModelsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v9/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "systemPrompt",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d020dbdc61a935a91821e58cf505140f",
    "id": null,
    "metadata": {},
    "name": "EmbeddingModelPageQuery",
    "operationKind": "query",
    "text": "query EmbeddingModelPageQuery {\n  currentUser {\n    id\n  }\n  connectionsArray {\n    id\n    name\n    provider\n    kind\n    ...EmbeddingModelForm_connections\n  }\n  embeddingModelsArray {\n    id\n    name\n    connectionId\n    dimension\n    contextLength\n    maxBatchSize\n    modelIdentifier\n    ...EmbeddingModelList_records\n    ...EmbeddingModelForm_record\n  }\n}\n\nfragment EmbeddingModelForm_connections on Connection {\n  id\n  name\n  provider\n  kind\n  models {\n    id\n    name\n  }\n}\n\nfragment EmbeddingModelForm_record on EmbeddingModel {\n  id\n  name\n  connectionId\n  dimension\n  contextLength\n  maxBatchSize\n  modelIdentifier\n  systemPrompt\n}\n\nfragment EmbeddingModelList_records on EmbeddingModel {\n  id\n  name\n  connectionId\n  dimension\n  contextLength\n  maxBatchSize\n  modelIdentifier\n  ...EmbeddingModelView_record\n}\n\nfragment EmbeddingModelView_record on EmbeddingModel {\n  id\n  name\n  connectionId\n  dimension\n  contextLength\n  maxBatchSize\n  modelIdentifier\n}\n"
  }
};
})();

(node as any).hash = "2ddaac8ff07185e7f3c239729490c62b";

export default node;
