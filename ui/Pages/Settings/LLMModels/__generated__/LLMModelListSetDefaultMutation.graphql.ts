/**
 * @generated SignedSource<<f640697eec632b3811b905abc8b4b673>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
export type LLMModelListSetDefaultMutation$variables = {
  id: string;
};
export type LLMModelListSetDefaultMutation$data = {
  readonly setDefaultLLMModel: {
    readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
    readonly connectionId: string;
    readonly contextLength: number;
    readonly default: boolean | null | undefined;
    readonly id: string;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
    readonly temperature: number;
  };
};
export type LLMModelListSetDefaultMutation = {
  response: LLMModelListSetDefaultMutation$data;
  variables: LLMModelListSetDefaultMutation$variables;
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
    "concreteType": "LLMModel",
    "kind": "LinkedField",
    "name": "setDefaultLLMModel",
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
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "LLMModelListSetDefaultMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "LLMModelListSetDefaultMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "f7d2004a704f751b00925b47025dfa61",
    "id": null,
    "metadata": {},
    "name": "LLMModelListSetDefaultMutation",
    "operationKind": "mutation",
    "text": "mutation LLMModelListSetDefaultMutation(\n  $id: String!\n) {\n  setDefaultLLMModel(id: $id) {\n    id\n    name\n    connectionId\n    temperature\n    contextLength\n    capabilities\n    modelIdentifier\n    default\n  }\n}\n"
  }
};
})();

(node as any).hash = "c5c62d350986a5513099a471ded5d8f5";

export default node;
