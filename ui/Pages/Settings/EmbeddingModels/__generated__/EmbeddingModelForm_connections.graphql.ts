/**
 * @generated SignedSource<<9e9335ef2d816303db812a251b771ad3>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type EmbeddingModelForm_connections$data = ReadonlyArray<{
  readonly id: string;
  readonly kind: ConnectionBaseKind;
  readonly models: ReadonlyArray<{
    readonly id: string | null | undefined;
    readonly name: string | null | undefined;
  }> | null | undefined;
  readonly name: string;
  readonly provider: string | null | undefined;
  readonly " $fragmentType": "EmbeddingModelForm_connections";
}>;
export type EmbeddingModelForm_connections$key = ReadonlyArray<{
  readonly " $data"?: EmbeddingModelForm_connections$data;
  readonly " $fragmentSpreads": FragmentRefs<"EmbeddingModelForm_connections">;
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
  "name": "name",
  "storageKey": null
};
return {
  "argumentDefinitions": [],
  "kind": "Fragment",
  "metadata": {
    "plural": true
  },
  "name": "EmbeddingModelForm_connections",
  "selections": [
    (v0/*: any*/),
    (v1/*: any*/),
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

(node as any).hash = "8453584b4cc792058b571dbd4f86f308";

export default node;
