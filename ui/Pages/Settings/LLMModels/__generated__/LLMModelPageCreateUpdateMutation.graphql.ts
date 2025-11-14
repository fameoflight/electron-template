/**
 * @generated SignedSource<<9aebd7abcc6e6bb6e1cb1bfbfed6ff10>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type CreateUpdateLLMModelInput = {
  capabilities?: ReadonlyArray<LLMBaseCapabilities> | null | undefined;
  connectionId: string;
  contextLength?: number | null | undefined;
  default?: boolean | null | undefined;
  id?: string | null | undefined;
  modelIdentifier?: string | null | undefined;
  name?: string | null | undefined;
  systemPrompt?: string | null | undefined;
  temperature?: number | null | undefined;
};
export type LLMModelPageCreateUpdateMutation$variables = {
  input: CreateUpdateLLMModelInput;
};
export type LLMModelPageCreateUpdateMutation$data = {
  readonly createUpdateLLMModel: {
    readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
    readonly connectionId: string;
    readonly contextLength: number;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly temperature: number;
  };
};
export type LLMModelPageCreateUpdateMutation = {
  response: LLMModelPageCreateUpdateMutation$data;
  variables: LLMModelPageCreateUpdateMutation$variables;
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
    "concreteType": "LLMModel",
    "kind": "LinkedField",
    "name": "createUpdateLLMModel",
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
        "name": "connectionId",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "temperature",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "contextLength",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "capabilities",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "modelIdentifier",
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
    "name": "LLMModelPageCreateUpdateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "LLMModelPageCreateUpdateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "6b85dd30b370728b40959d11a538f893",
    "id": null,
    "metadata": {},
    "name": "LLMModelPageCreateUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation LLMModelPageCreateUpdateMutation(\n  $input: CreateUpdateLLMModelInput!\n) {\n  createUpdateLLMModel(input: $input) {\n    id\n    name\n    connectionId\n    temperature\n    contextLength\n    capabilities\n    modelIdentifier\n  }\n}\n"
  }
};
})();

(node as any).hash = "387c4a39bfc67ffad3685752d16b4b3e";

export default node;
