/**
 * @generated SignedSource<<dd0178c46371866d9bac5062585c9fa1>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
export type MessageBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type MessageList_messages$data = ReadonlyArray<{
  readonly content: string | null | undefined;
  readonly createdAt: any;
  readonly id: string;
  readonly role: MessageBaseRole;
  readonly status: MessageBaseStatus;
  readonly updatedAt: any;
  readonly " $fragmentType": "MessageList_messages";
}>;
export type MessageList_messages$key = ReadonlyArray<{
  readonly " $data"?: MessageList_messages$data;
  readonly " $fragmentSpreads": FragmentRefs<"MessageList_messages">;
}>;

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "MessageList_messages",
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
      "name": "content",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "role",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "status",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "createdAt",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "updatedAt",
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};

(node as any).hash = "fe3ec8888b85b0dbcc31d1de48168f44";

export default node;
