/**
 * @generated SignedSource<<a48326492d49f4507fce53d25c2db616>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UserForm_record$data = {
  readonly id: string;
  readonly name: string;
  readonly username: string;
  readonly " $fragmentType": "UserForm_record";
};
export type UserForm_record$key = {
  readonly " $data"?: UserForm_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"UserForm_record">;
};

const node: ReaderFragment = {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "UserForm_record",
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
      "name": "username",
      "storageKey": null
    }
  ],
  "type": "User",
  "abstractKey": null
};

(node as any).hash = "73a996aa4fe1503f3a1e20101a730055";

export default node;
