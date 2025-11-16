/**
 * @generated SignedSource<<c53484c5b2ff37c461d34e696792568c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type MessageList_messages$data = ReadonlyArray<{
  readonly createdAt: any;
  readonly currentVersionId: string;
  readonly id: string;
  readonly role: MessageBaseRole;
  readonly updatedAt: any;
  readonly versions: ReadonlyArray<{
    readonly content: string;
    readonly createdAt: any;
    readonly id: string;
    readonly modelId: string;
    readonly status: MessageVersionBaseStatus;
    readonly updatedAt: any;
    readonly " $fragmentSpreads": FragmentRefs<"MessageVersionView_record">;
  }>;
  readonly " $fragmentType": "MessageList_messages";
}>;
export type MessageList_messages$key = ReadonlyArray<{
  readonly " $data"?: MessageList_messages$data;
  readonly " $fragmentSpreads": FragmentRefs<"MessageList_messages">;
}>;

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
},
v1 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "createdAt",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "updatedAt",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "MessageList_messages",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "role",
      "storageKey": null
    },
    (v1/*: any*/),
    (v2/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "currentVersionId",
      "storageKey": null
    },
    {
      "alias": null,
      "args": null,
      "concreteType": "MessageVersion",
      "kind": "LinkedField",
      "name": "versions",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "modelId",
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
          "name": "status",
          "storageKey": null
        },
        (v1/*: any*/),
        (v2/*: any*/),
        {
          "args": null,
          "kind": "FragmentSpread",
          "name": "MessageVersionView_record"
        }
      ],
      "storageKey": null
    }
  ],
  "type": "Message",
  "abstractKey": null
};
})();

(node as any).hash = "43598bc9ba6f791dd26e833cedfa81e5";

export default node;
