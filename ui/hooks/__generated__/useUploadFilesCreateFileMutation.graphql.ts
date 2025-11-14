/**
 * @generated SignedSource<<4b43057c9421d2b3e0f986292241b957>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type CreateFileInput = {
  extension: string;
  filename: string;
  fullPath: string;
  ownerId?: string | null | undefined;
  ownerType?: string | null | undefined;
};
export type useUploadFilesCreateFileMutation$variables = {
  input: CreateFileInput;
};
export type useUploadFilesCreateFileMutation$data = {
  readonly createFile: {
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
    "concreteType": "File",
    "kind": "LinkedField",
    "name": "createFile",
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
    "cacheID": "d5920fc49c7db7683d69955070dd999a",
    "id": null,
    "metadata": {},
    "name": "useUploadFilesCreateFileMutation",
    "operationKind": "mutation",
    "text": "mutation useUploadFilesCreateFileMutation(\n  $input: CreateFileInput!\n) {\n  createFile(input: $input) {\n    id\n    filename\n    fullPath\n    fileSize\n    mimeType\n  }\n}\n"
  }
};
})();

(node as any).hash = "4325a6b9307e1abc388a8a24d040a800";

export default node;
