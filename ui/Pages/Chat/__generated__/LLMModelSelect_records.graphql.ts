/**
 * @generated SignedSource<<a6109ba9bcc37e286d43bf586baf89a6>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type LLMModelSelect_records$data = ReadonlyArray<{
  readonly default: boolean | null | undefined;
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly " $fragmentType": "LLMModelSelect_records";
}>;
export type LLMModelSelect_records$key = ReadonlyArray<{
  readonly " $data"?: LLMModelSelect_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelSelect_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "LLMModelSelect_records",
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
      "name": "default",
      "storageKey": null
    }
  ],
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "3dd1f7be81db92580b1c7c2f0e0b4aae";

export default node;
