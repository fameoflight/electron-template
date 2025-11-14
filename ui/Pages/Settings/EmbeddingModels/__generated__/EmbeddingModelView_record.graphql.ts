/**
 * @generated SignedSource<<3daa81da9c54ba186561c9bd87de493a>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type EmbeddingModelView_record$data = {
  readonly connectionId: string;
  readonly contextLength: number;
  readonly dimension: number;
  readonly id: string;
  readonly maxBatchSize: number | null | undefined;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly " $fragmentType": "EmbeddingModelView_record";
};
export type EmbeddingModelView_record$key = {
  readonly " $data"?: EmbeddingModelView_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelView_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "EmbeddingModelView_record",
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
  "type": "EmbeddingModel",
  "abstractKey": null
};

(node as any).hash = "f4aec5b11d1631f313876879a5812001";

export default node;
