/**
 * @generated SignedSource<<8eed3c30647260293edf4140c7f5d30d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type EmbeddingModelList_records$data = ReadonlyArray<{
  readonly connectionId: string;
  readonly contextLength: number;
  readonly dimension: number;
  readonly id: string;
  readonly maxBatchSize: number | null | undefined;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelView_record">;
  readonly " $fragmentType": "EmbeddingModelList_records";
}>;
export type EmbeddingModelList_records$key = ReadonlyArray<{
  readonly " $data"?: EmbeddingModelList_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelList_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "EmbeddingModelList_records",
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
      "args": null,
      "kind": "FragmentSpread",
      "name": "EmbeddingModelView_record"
    }
  ],
  "type": "EmbeddingModel",
  "abstractKey": null
};

(node as any).hash = "cbb5172c59ca7102e40fdaef266c1084";

export default node;
