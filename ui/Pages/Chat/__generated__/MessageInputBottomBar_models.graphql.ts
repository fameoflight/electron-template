/**
 * @generated SignedSource<<f01dba4465db676df9ecd22f75bd44f8>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type MessageInputBottomBar_models$data = ReadonlyArray<{
  readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
  readonly id: string;
  readonly name: string | null | undefined;
  readonly systemPrompt: string | null | undefined;
  readonly updatedAt: any;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelSelect_records">;
  readonly " $fragmentType": "MessageInputBottomBar_models";
}>;
export type MessageInputBottomBar_models$key = ReadonlyArray<{
  readonly " $data"?: MessageInputBottomBar_models$data;
  readonly " $fragmentSpreads": FragmentRefs<"MessageInputBottomBar_models">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "MessageInputBottomBar_models",
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
      "name": "capabilities",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "systemPrompt",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "LLMModelSelect_records"
    }
  ],
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "c67c891cd9e4c8cefdfe181b39f7a84f";

export default node;
