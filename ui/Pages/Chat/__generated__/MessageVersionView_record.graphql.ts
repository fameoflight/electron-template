/**
 * @generated SignedSource<<e6d2ecdb215f39493c0f8377c80321f4>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type MessageVersionView_record$data = {
  readonly content: string;
  readonly files: ReadonlyArray<{
    readonly filename: string;
    readonly id: string;
  }>;
  readonly id: string;
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
      "concreteType": "File",
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

(node as any).hash = "7ba94e5351971ed923ff17bc7bfa159b";

export default node;
