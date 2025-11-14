/**
 * @generated SignedSource<<fbdd945fd75597cc47d2b2be209cfbe7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type LLMBaseCapabilities = "TEXT" | "VISION" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LLMModelForm_record$data = {
  readonly capabilities: ReadonlyArray<LLMBaseCapabilities>;
  readonly connectionId: string;
  readonly contextLength: number;
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly systemPrompt: string | null | undefined;
  readonly temperature: number;
  readonly " $fragmentType": "LLMModelForm_record";
};
export type LLMModelForm_record$key = {
  readonly " $data"?: LLMModelForm_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelForm_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "LLMModelForm_record",
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
      "name": "systemPrompt",
      "storageKey": null
    }
  ],
  "type": "LLMModel",
  "abstractKey": null
};

(node as any).hash = "b7decd3a457440caa2a1ddd6a5884391";

export default node;
