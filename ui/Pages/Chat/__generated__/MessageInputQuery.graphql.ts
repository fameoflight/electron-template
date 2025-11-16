/**
 * @generated SignedSource<<cd2c71478ab95d3b9dd014d4ca110c70>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type MessageInputQuery$variables = Record<PropertyKey, never>;
export type MessageInputQuery$data = {
  readonly currentUser: {
    readonly id: string;
  } | null | undefined;
  readonly lLMModelsArray: ReadonlyArray<{
    readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
    readonly default: boolean | null | undefined;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly systemPrompt: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"MessageInputBottomBar_models">;
  }>;
};
export type MessageInputQuery = {
  response: MessageInputQuery$data;
  variables: MessageInputQuery$variables;
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
  "name": "modelIdentifier",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "systemPrompt",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "default",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "capabilities",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "MessageInputQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "LLMModel",
        "kind": "LinkedField",
        "name": "lLMModelsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "MessageInputBottomBar_models"
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
    "name": "MessageInputQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "LLMModel",
        "kind": "LinkedField",
        "name": "lLMModelsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "updatedAt",
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "fe010cbd1cbf8495fa8d036d83f3834e",
    "id": null,
    "metadata": {},
    "name": "MessageInputQuery",
    "operationKind": "query",
    "text": "query MessageInputQuery {\n  currentUser {\n    id\n  }\n  lLMModelsArray {\n    id\n    name\n    modelIdentifier\n    systemPrompt\n    default\n    capabilities\n    ...MessageInputBottomBar_models\n  }\n}\n\nfragment LLMModelSelect_records on LLMModel {\n  id\n  name\n  modelIdentifier\n  default\n}\n\nfragment MessageInputBottomBar_models on LLMModel {\n  id\n  name\n  capabilities\n  updatedAt\n  systemPrompt\n  ...LLMModelSelect_records\n}\n"
  }
};
})();

(node as any).hash = "dacd35efd97269177719181bc1712888";

export default node;
