/**
 * @generated SignedSource<<3e773dbe087fbb408eedf7cbb158da44>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
import { FragmentRefs } from "relay-runtime";
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
export type ConnectionPageQuery$variables = Record<PropertyKey, never>;
export type ConnectionPageQuery$data = {
  readonly connectionsArray: ReadonlyArray<{
    readonly apiKey: string;
    readonly baseUrl: string;
    readonly id: string;
    readonly kind: ConnectionBaseKind;
    readonly name: string;
    readonly provider: string | null | undefined;
    readonly " $fragmentSpreads": FragmentRefs<"ConnectionForm_record" | "ConnectionList_records">;
  }>;
  readonly currentUser: {
    readonly id: string;
  } | null | undefined;
};
export type ConnectionPageQuery = {
  response: ConnectionPageQuery$data;
  variables: ConnectionPageQuery$variables;
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
  "concreteType": "User",
  "kind": "LinkedField",
  "name": "currentUser",
  "plural": false,
  "selections": [
    (v0/*: any*/)
  ],
  "storageKey": null
},
v2 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "name",
  "storageKey": null
},
v3 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "apiKey",
  "storageKey": null
},
v4 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "baseUrl",
  "storageKey": null
},
v5 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "provider",
  "storageKey": null
},
v6 = {
  "alias": null,
  "args": null,
  "kind": "ScalarField",
  "name": "kind",
  "storageKey": null
};
return {
  "fragment": {
    "argumentDefinitions": [],
    "kind": "Fragment",
    "metadata": null,
    "name": "ConnectionPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Connection",
        "kind": "LinkedField",
        "name": "connectionsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConnectionList_records"
          },
          {
            "args": null,
            "kind": "FragmentSpread",
            "name": "ConnectionForm_record"
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
    "name": "ConnectionPageQuery",
    "selections": [
      (v1/*: any*/),
      {
        "alias": null,
        "args": null,
        "concreteType": "Connection",
        "kind": "LinkedField",
        "name": "connectionsArray",
        "plural": true,
        "selections": [
          (v0/*: any*/),
          (v2/*: any*/),
          (v3/*: any*/),
          (v4/*: any*/),
          (v5/*: any*/),
          (v6/*: any*/),
          {
            "alias": null,
            "args": null,
            "kind": "ScalarField",
            "name": "customHeaders",
            "storageKey": null
          },
          {
            "alias": null,
            "args": null,
            "concreteType": "ConnectionModelType",
            "kind": "LinkedField",
            "name": "models",
            "plural": true,
            "selections": [
              (v0/*: any*/),
              (v2/*: any*/)
            ],
            "storageKey": null
          }
        ],
        "storageKey": null
      }
    ]
  },
  "params": {
    "cacheID": "d2af9fda38617dad8621681deff38d47",
    "id": null,
    "metadata": {},
    "name": "ConnectionPageQuery",
    "operationKind": "query",
    "text": "query ConnectionPageQuery {\n  currentUser {\n    id\n  }\n  connectionsArray {\n    id\n    name\n    apiKey\n    baseUrl\n    provider\n    kind\n    ...ConnectionList_records\n    ...ConnectionForm_record\n  }\n}\n\nfragment ConnectionForm_record on Connection {\n  id\n  name\n  apiKey\n  baseUrl\n  provider\n  kind\n  customHeaders\n}\n\nfragment ConnectionList_records on Connection {\n  id\n  name\n  apiKey\n  baseUrl\n  provider\n  kind\n  ...ConnectionView_record\n}\n\nfragment ConnectionView_record on Connection {\n  id\n  name\n  apiKey\n  baseUrl\n  provider\n  kind\n  customHeaders\n  models {\n    id\n    name\n  }\n}\n"
  }
};
})();

(node as any).hash = "2f83db1400528216a5cfd83ac2571a26";

export default node;
