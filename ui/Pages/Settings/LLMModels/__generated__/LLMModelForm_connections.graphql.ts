/**
 * @generated SignedSource<<1d47e4e261116ebc0ffc103fe9818763>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ReaderFragment } from 'relay-runtime';
export type ConnectionBaseKind = "ANTHROPIC" | "OPENAI" | "%future added value";
import { FragmentRefs } from "relay-runtime";
export type LLMModelForm_connections$data = ReadonlyArray<{
  readonly id: string;
  readonly kind: ConnectionBaseKind;
  readonly modelId: string;
  readonly models: ReadonlyArray<{
    readonly id: string | null | undefined;
    readonly name: string | null | undefined;
  }> | null | undefined;
  readonly name: string;
  readonly provider: string | null | undefined;
  readonly " $fragmentType": "LLMModelForm_connections";
}>;
export type LLMModelForm_connections$key = ReadonlyArray<{
  readonly " $data"?: LLMModelForm_connections$data;
  readonly " $fragmentSpreads": FragmentRefs<"LLMModelForm_connections">;
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
  "name": "LLMModelForm_connections",
  "selections": [
    (v0/*: any*/),
    {
      "alias": null,
      "args": null,
      "kind": "ScalarField",
      "name": "modelId",
      "storageKey": null
    },
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

(node as any).hash = "673c181434ddaace567a4484ef3f95e8";

export default node;
