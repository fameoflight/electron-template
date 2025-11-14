/**
 * @generated SignedSource<<a872379ab0bb9b3f706a1fbc5b50e138>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type LLMModelPageQuery$variables = Record<PropertyKey, never>;
export type LLMModelPageQuery$data = {
  readonly connectionsArray: ReadonlyArray<{
    readonly id: string;
    readonly kind: ConnectionBaseKind;
    readonly name: string;
    readonly provider: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"LLMModelForm_connections">;
  }>;
  readonly currentUser: {
    readonly id: string;
  } | null | undefined;
  readonly lLMModelsArray: ReadonlyArray<{
    readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
    readonly connectionId: string;
    readonly contextLength: number;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly temperature: number;
    readonly " $fragmentSpreads": FragmentRefs<"LLMModelForm_record" | "LLMModelList_records">;
  }>;
};
export type LLMModelPageQuery = {
  response: LLMModelPageQuery$data;
  variables: LLMModelPageQuery$variables;
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
  "name": "temperature",
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
  "name": "capabilities",
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
    "name": "LLMModelPageQuery",
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
            "name": "LLMModelForm_connections"
          }
        ],
        "storageKey": null
      },
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
          (v5/*: any*/),
          (v6/*: any*/),
          (v7/*: any*/),
          (v8/*: any*/),
          (v9/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "LLMModelList_records"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "LLMModelForm_record"
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
    "name": "LLMModelPageQuery",
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
            "kind": "ScalarField",
            "name": "modelId",
            "storageKey": null
          },
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
        "concreteType": "LLMModel",
        "kind": "LinkedField",
        "name": "lLMModelsArray",
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
            "name": "default",
            "storageKey": null
          },
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
    "cacheID": "6378c39859d5de8ab3f3927e17e5a84a",
    "id": null,
    "metadata": {},
    "name": "LLMModelPageQuery",
    "operationKind": "query",
    "text": "query LLMModelPageQuery {\n  currentUser {\n    id\n  }\n  connectionsArray {\n    id\n    name\n    provider\n    kind\n    ...LLMModelForm_connections\n  }\n  lLMModelsArray {\n    id\n    name\n    connectionId\n    temperature\n    contextLength\n    capabilities\n    modelIdentifier\n    ...LLMModelList_records\n    ...LLMModelForm_record\n  }\n}\n\nfragment LLMModelForm_connections on Connection {\n  id\n  modelId\n  name\n  provider\n  kind\n  models {\n    id\n    name\n  }\n}\n\nfragment LLMModelForm_record on LLMModel {\n  id\n  name\n  connectionId\n  temperature\n  contextLength\n  capabilities\n  modelIdentifier\n  systemPrompt\n}\n\nfragment LLMModelList_records on LLMModel {\n  id\n  name\n  default\n  connectionId\n  temperature\n  contextLength\n  capabilities\n  modelIdentifier\n  ...LLMModelView_record\n}\n\nfragment LLMModelView_record on LLMModel {\n  id\n  name\n  connectionId\n  temperature\n  contextLength\n  capabilities\n  modelIdentifier\n}\n"
  }
};
})();

(node as any).hash = "d97df04fa4d9eb76584001b065bb52b4";

export default node;
