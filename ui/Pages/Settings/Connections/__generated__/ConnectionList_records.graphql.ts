/**
 * @generated SignedSource<<fbe3c4edf4574558c6c798662c9d1295>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConnectionList_records$data = ReadonlyArray<{
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly id: string;
  readonly kind: ConnectionBaseKind;
  readonly name: string;
  readonly provider: string | null | undefined;
  readonly " $fragmentSpreads": FragmentRefs<"ConnectionView_record">;
  readonly " $fragmentType": "ConnectionList_records";
}>;
export type ConnectionList_records$key = ReadonlyArray<{
  readonly " $data"?: ConnectionList_records$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConnectionList_records">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "ConnectionList_records",
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
      "name": "apiKey",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "baseUrl",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "provider",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "kind",
      "storageKey": null
    },
    {
      "args": null,
      "kind": "FragmentSpread",
      "name": "ConnectionView_record"
    }
  ],
  "type": "Connection",
  "abstractKey": null
};

(node as any).hash = "8365c687fb7b60a4bcd8a4e7c057538c";

export default node;
