/**
 * @generated SignedSource<<d9b01851c8dd7f2b249ff11fe53f630c>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type UserUpdatePageQuery$variables = Record<PropertyKey, never>;
export type UserUpdatePageQuery$data = {
  readonly currentUser: {
    readonly id: string;
    readonly name: string;
    readonly username: string;
    readonly " $fragmentSpreads": FragmentRefs<"UserForm_record">;
  } | null | undefined;
};
export type UserUpdatePageQuery = {
  response: UserUpdatePageQuery$data;
  variables: UserUpdatePageQuery$variables;
};

const node: ConcreteRequest = (function(){
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
  "name": "name",
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "username",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "UserUpdatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "currentUser",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "UserForm_record"
          }
        ],
        "storageKey": null
      }
    ],
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": [],
    "kind": "Operation",
    "name": "UserUpdatePageQuery",
    "selections": [
      {
        "alias": null,
        "args": null,
        "concreteType": "User",
        "kind": "LinkedField",
        "name": "currentUser",
        "plural": false,
        "selections": [
          (v0/*: any*/),
          (v1/*: any*/),
          (v2/*: any*/)
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "de42f357be1aca074a25c91894b2257a",
    "id": null,
    "metadata": {},
    "name": "UserUpdatePageQuery",
    "operationKind": "query",
    "text": "query UserUpdatePageQuery {\n  currentUser {\n    id\n    name\n    username\n    ...UserForm_record\n  }\n}\n\nfragment UserForm_record on User {\n  id\n  name\n  username\n}\n"
  }
};
})();

(node as any).hash = "b81e6b511deb08c6b9c22a91dac3d88b";

export default node;
