/**
 * @generated SignedSource<<4a3c5917c2d03a05957de966760f043d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateUpdateEmbeddingModelInput = {
  connectionId: string;
  contextLength?: number | null | undefined;
  default?: boolean | null | undefined;
  dimension?: number | null | undefined;
  id?: string | null | undefined;
  maxBatchSize?: number | null | undefined;
  modelIdentifier?: string | null | undefined;
  name?: string | null | undefined;
  systemPrompt?: string | null | undefined;
};
export type EmbeddingModelPageCreateUpdateMutation$variables = {
  input: CreateUpdateEmbeddingModelInput;
};
export type EmbeddingModelPageCreateUpdateMutation$data = {
  readonly createUpdateEmbeddingModel: {
    readonly connectionId: string;
    readonly contextLength: number;
    readonly dimension: number;
    readonly id: string;
    readonly maxBatchSize: number | null | undefined;
    readonly modelIdentifier: string;
    readonly name: string | null | undefined;
  };
};
export type EmbeddingModelPageCreateUpdateMutation = {
  response: EmbeddingModelPageCreateUpdateMutation$data;
  variables: EmbeddingModelPageCreateUpdateMutation$variables;
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
    "concreteType": "EmbeddingModel",
    "kind": "LinkedField",
    "name": "createUpdateEmbeddingModel",
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
        "name": "dimension",
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
        "name": "maxBatchSize",
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
    "name": "EmbeddingModelPageCreateUpdateMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "EmbeddingModelPageCreateUpdateMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "77cff76746dfb590a0a8588b712b7210",
    "id": null,
    "metadata": {},
    "name": "EmbeddingModelPageCreateUpdateMutation",
    "operationKind": "mutation",
    "text": "mutation EmbeddingModelPageCreateUpdateMutation(\n  $input: CreateUpdateEmbeddingModelInput!\n) {\n  createUpdateEmbeddingModel(input: $input) {\n    id\n    name\n    connectionId\n    dimension\n    contextLength\n    maxBatchSize\n    modelIdentifier\n  }\n}\n"
  }
};
})();

(node as any).hash = "91ca3819aa3ae98a90a984d0924cdda2";

export default node;
