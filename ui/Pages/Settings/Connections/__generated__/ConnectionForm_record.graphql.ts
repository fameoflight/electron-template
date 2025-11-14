/**
 * @generated SignedSource<<2ae440a2b6102164a398baaa4d4c8371>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConnectionForm_record$data = {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly customHeaders: any | null | undefined;
  readonly id: string;
  readonly kind: ConnectionBaseKind;
  readonly name: string;
  readonly provider: string | null | undefined;
  readonly " $fragmentType": "ConnectionForm_record";
};
export type ConnectionForm_record$key = {
  readonly " $data"?: ConnectionForm_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConnectionForm_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConnectionForm_record",
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
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "customHeaders",
      "storageKey": null
    }
  ],
  "type": "Connection",
  "abstractKey": null
};

(node as any).hash = "a1d3ef45dd269afa4f94851f1323b1df";

export default node;
