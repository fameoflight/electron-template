/**
 * @generated SignedSource<<c6afa041fcc8226b9dcf81784c1840a1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type UnifiedMessageInputQuery$variables = Record<PropertyKey, never>;
export type UnifiedMessageInputQuery$data = {
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
    readonly " $fragmentSpreads": FragmentRefs<"LLMModelSelect_records">;
  }>;
};
export type UnifiedMessageInputQuery = {
  response: UnifiedMessageInputQuery$data;
  variables: UnifiedMessageInputQuery$variables;
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
    "name": "UnifiedMessageInputQuery",
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
            "name": "LLMModelSelect_records"
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
    "name": "UnifiedMessageInputQuery",
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
          (v6/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "b873a7fe4e844d5d22b34ff4fffc49b4",
    "id": null,
    "metadata": {},
    "name": "UnifiedMessageInputQuery",
    "operationKind": "query",
    "text": "query UnifiedMessageInputQuery {\n  currentUser {\n    id\n  }\n  lLMModelsArray {\n    id\n    name\n    modelIdentifier\n    systemPrompt\n    default\n    capabilities\n    ...LLMModelSelect_records\n  }\n}\n\nfragment LLMModelSelect_records on LLMModel {\n  id\n  name\n  modelIdentifier\n  default\n}\n"
  }
};
})();

(node as any).hash = "c9d11378636a5029ac6e9a0ddb53c213";

export default node;
