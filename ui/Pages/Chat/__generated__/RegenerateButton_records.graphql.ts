/**
 * @generated SignedSource<<af5e69d0e92e5c06aeb7a42bf02868c7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type RegenerateButton_records$data = ReadonlyArray<{
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly " $fragmentType": "RegenerateButton_records";
}>;
export type RegenerateButton_records$key = ReadonlyArray<{
  readonly " $data"?: RegenerateButton_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"RegenerateButton_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "RegenerateButton_records",
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
      "name": "modelIdentifier",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "name",
      "storageKey": null
    }
  ],
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "03a02c0a4111b0b8cf5ed280b2437249";

export default node;
