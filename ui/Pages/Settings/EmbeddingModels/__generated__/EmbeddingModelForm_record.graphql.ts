/**
 * @generated SignedSource<<cf97f1ca2c6e5af7f290cf03177bd27b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type EmbeddingModelForm_record$data = {
  readonly connectionId: string;
  readonly contextLength: number;
  readonly dimension: number;
  readonly id: string;
  readonly maxBatchSize: number | null | undefined;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly systemPrompt: string | null | undefined;
  readonly " $fragmentType": "EmbeddingModelForm_record";
};
export type EmbeddingModelForm_record$key = {
  readonly " $data"?: EmbeddingModelForm_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelForm_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EmbeddingModelForm_record",
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
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "systemPrompt",
      "storageKey": null
    }
  ],
  "type": "EmbeddingModel",
  "abstractKey": null
};

(node as any).hash = "72cc73bf764b028a5badaa6325e0e89b";

export default node;
