/**
 * @generated SignedSource<<21709f589646827616673e72a7e8990e>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LLMModelView_record$data = {
  readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
  readonly connectionId: string;
  readonly contextLength: number;
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly temperature: number;
  readonly " $fragmentType": "LLMModelView_record";
};
export type LLMModelView_record$key = {
  readonly " $data"?: LLMModelView_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelView_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "LLMModelView_record",
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
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "e6c0ef37ca2098435a3b2b547f24bca2";

export default node;
