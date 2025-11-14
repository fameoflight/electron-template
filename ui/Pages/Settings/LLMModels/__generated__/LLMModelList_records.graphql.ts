/**
 * @generated SignedSource<<d678b7d6133ec6e3f1e1d98bc953bb74>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LLMModelList_records$data = ReadonlyArray<{
  readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
  readonly connectionId: string;
  readonly contextLength: number;
  readonly default: boolean | null | undefined;
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly temperature: number;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelView_record">;
  readonly " $fragmentType": "LLMModelList_records";
}>;
export type LLMModelList_records$key = ReadonlyArray<{
  readonly " $data"?: LLMModelList_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelList_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "LLMModelList_records",
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
      "name": "default",
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
      "args": null,
      "kind": "FragmentSpread",
      "name": "LLMModelView_record"
    }
  ],
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "6bee9816f97c26213dc1dc0a43f1d9a6";

export default node;
