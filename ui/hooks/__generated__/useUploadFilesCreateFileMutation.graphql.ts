/**
 * @generated SignedSource<<0d11acb04c2a5f96cbf6a37150ada127>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateFileEntityInput = {
  extension: string;
  filename: string;
  fullPath: string;
  ownerId?: string | null | undefined;
  ownerType?: string | null | undefined;
};
export type useUploadFilesCreateFileMutation$variables = {
  input: CreateFileEntityInput;
};
export type useUploadFilesCreateFileMutation$data = {
  readonly createFileEntity: {
    readonly fileSize: number;
    readonly filename: string;
    readonly fullPath: string;
    readonly id: string;
    readonly mimeType: string;
  };
};
export type useUploadFilesCreateFileMutation = {
  response: useUploadFilesCreateFileMutation$data;
  variables: useUploadFilesCreateFileMutation$variables;
};

const node: ConcreteRequest = (function(){
var v0 = [
  {
    "defaultValue": null,
    "kind": "LocalArgument",
    "name": "input"
  }
],
v1 = [
  {
    "alias": null,
    "args": [
      {
        "kind": "Variable",
        "name": "input",
        "variableName": "input"
      }
    ],
    "concreteType": "FileEntity",
    "kind": "LinkedField",
    "name": "createFileEntity",
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
        "name": "filename",
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
        "name": "fileSize",
        "storageKey": null
      },
      {
        "alias": null,
        "args": null,
        "kind": "ScalarField",
        "name": "mimeType",
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
    "name": "useUploadFilesCreateFileMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "useUploadFilesCreateFileMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "7552c9654eeaa54fb34507e6f66c5aad",
    "id": null,
    "metadata": {},
    "name": "useUploadFilesCreateFileMutation",
    "operationKind": "mutation",
    "text": "mutation useUploadFilesCreateFileMutation(\n  $input: CreateFileEntityInput!\n) {\n  createFileEntity(input: $input) {\n    id\n    filename\n    fullPath\n    fileSize\n    mimeType\n  }\n}\n"
  }
};
})();

(node as any).hash = "91537370fa5041e605c40685f2a0d77f";

export default node;
