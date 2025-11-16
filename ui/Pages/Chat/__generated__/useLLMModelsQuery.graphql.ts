/**
 * @generated SignedSource<<83b0b758aee3f45e747be1dd070a7ac2>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type useLLMModelsQuery$variables = Record<PropertyKey, never>;
export type useLLMModelsQuery$data = {
  readonly lLMModelsArray: ReadonlyArray<{
    readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
    readonly default: boolean | null | undefined;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly systemPrompt: string | null | undefined;
  }>;
};
export type useLLMModelsQuery = {
  response: useLLMModelsQuery$data;
  variables: useLLMModelsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "alias": null,
    "args": null,
    "concreteType": "LLMModel",
    "kind": "LinkedField",
    "name": "lLMModelsArray",
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
        "name": "systemPrompt",
        "storageKey": null
      },
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
        "name": "capabilities",
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
    "name": "useLLMModelsQuery",
    "selections": (v0/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "useLLMModelsQuery",
    "selections": (v0/*: any*/)
  },
  "params": {
    "cacheID": "09a4dfec92dcf91bd8e6cbb6c81ab547",
    "id": null,
    "metadata": {},
    "name": "useLLMModelsQuery",
    "operationKind": "query",
    "text": "query useLLMModelsQuery {\n  lLMModelsArray {\n    id\n    name\n    modelIdentifier\n    systemPrompt\n    default\n    capabilities\n  }\n}\n"
  }
};
})();

(node as any).hash = "9c5f441e870dc410917438a600cdf6ef";

export default node;
