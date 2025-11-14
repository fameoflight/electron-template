/**
 * @generated SignedSource<<e56ec4b8d7817d80f13dd36a8bae575d>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type MessageBaseRole = "assistant" | "system" | "user" | "%future added value";
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
          "name": "content",
          "storageKey": null
        },
        (v1/*: any*/),
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

(node as any).hash = "64ce756f9e9b02567d7fdc146041e77c";

export default node;
