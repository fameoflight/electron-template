/**
 * @generated SignedSource<<f447adf75c1fc85c30cc3f3d16d8293c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type MessageVersionBaseStatus = "cancelled" | "completed" | "failed" | "pending" | "streaming" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type MessageVersionView_record$data = {
  readonly content: string;
  readonly files: ReadonlyArray<{
    readonly filename: string;
    readonly id: string;
  }>;
  readonly id: string;
  readonly status: MessageVersionBaseStatus;
  readonly " $fragmentType": "MessageVersionView_record";
};
export type MessageVersionView_record$key = {
  readonly " $data"?: MessageVersionView_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"MessageVersionView_record">;
};

const node: ReaderFragment = (function(){
var v0 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "id",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "MessageVersionView_record",
  "selections": [
    (v0/*: any*/),
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
    {
      "alias": null,
      "args": null,
      "concreteType": "FileEntity",
      "kind": "LinkedField",
      "name": "files",
      "plural": true,
      "selections": [
        (v0/*: any*/),
        {
          "alias": null,
          "args": null,
          "kind": "ScalarField",
          "name": "filename",
          "storageKey": null
        }
      ],
      "storageKey": null
    }
  ],
  "type": "MessageVersion",
  "abstractKey": null
};
})();

(node as any).hash = "e83893402cc92bdc80b7cad51e7f15a6";

export default node;
