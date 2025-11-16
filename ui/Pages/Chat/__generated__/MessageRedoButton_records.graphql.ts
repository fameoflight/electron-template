/**
 * @generated SignedSource<<d0dae0abc498cfbeb18ef5cfa1f791c7>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MessageRedoButton_records$data = ReadonlyArray<{
  readonly id: string;
  readonly modelIdentifier: string;
  readonly name: string | null | undefined;
  readonly " $fragmentType": "MessageRedoButton_records";
}>;
export type MessageRedoButton_records$key = ReadonlyArray<{
  readonly " $data"?: MessageRedoButton_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"MessageRedoButton_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "MessageRedoButton_records",
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

(node as any).hash = "3e2caeeadbd25ca5b510b097dd3d8111";

export default node;
