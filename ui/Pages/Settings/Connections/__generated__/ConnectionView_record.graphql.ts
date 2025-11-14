/**
 * @generated SignedSource<<e7e3527d04d6986ab32ce91029fd3322>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type ConnectionView_record$data = {
  readonly apiKey: string;
  readonly baseUrl: string;
  readonly customHeaders: any | null | undefined;
  readonly id: string;
  readonly kind: ConnectionBaseKind;
  readonly models: ReadonlyArray<{
    readonly id: string | null | undefined;
    readonly name: string | null | undefined;
  }> | null | undefined;
  readonly name: string;
  readonly provider: string | null | undefined;
  readonly " $fragmentType": "ConnectionView_record";
};
export type ConnectionView_record$key = {
  readonly " $data"?: ConnectionView_record$data;
  readonly " $fragmentSpreads": FragmentRefs<"ConnectionView_record">;
};

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
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": null,
  "name": "ConnectionView_record",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
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
        (v1/*: any*/)
      ],
      "storageKey": null
    }
  ],
  "type": "Connection",
  "abstractKey": null
};
})();

(node as any).hash = "31e7852eca8b83631c69d9cf253644ef";

export default node;
