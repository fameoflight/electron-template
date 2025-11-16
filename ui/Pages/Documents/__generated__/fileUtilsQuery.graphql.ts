/**
 * @generated SignedSource<<3bed6bf44087ee9b08504e263162cb6b>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type fileUtilsQuery$variables = {
  fileId: string;
};
export type fileUtilsQuery$data = {
  readonly fileEntity: {
    readonly filename: string;
    readonly fullPath: string;
    readonly id: string;
  } | null | undefined;
};
export type fileUtilsQuery = {
  response: fileUtilsQuery$data;
  variables: fileUtilsQuery$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "fileId"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "id",
        "variableName": "fileId"
      }
    ],
    "concreteType": "FileEntity",
    "kind": "LinkedField",
    "name": "fileEntity",
    "plural": false,
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
        "name": "fullPath",
        "storageKey": null
      },
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
];
return {
  "fragment": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Fragment",
    "metadata": null,
    "name": "fileUtilsQuery",
    "selections": (v1/*: any*/),
    "type": "Query",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "fileUtilsQuery",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7612743925cea212a2ae6215de9fc600",
    "id": null,
    "metadata": {},
    "name": "fileUtilsQuery",
    "operationKind": "query",
    "text": "query fileUtilsQuery(\n  $fileId: String!\n) {\n  fileEntity(id: $fileId) {\n    id\n    fullPath\n    filename\n  }\n}\n"
  }
};
})();

(node as any).hash = "7298521fbbae7687d4b18fdbc5f280d5";

export default node;
