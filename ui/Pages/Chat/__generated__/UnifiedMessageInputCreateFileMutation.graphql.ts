/**
 * @generated SignedSource<<460823bd31e25a7c08325d802af26883>>
 * @lightSyntaxTransform
 * @nogrep
 */

/* tslint:disable */
/* eslint-disable */
// @ts-nocheck

import { ConcreteRequest } from 'relay-runtime';
export type FileBaseFileType = "audio" | "document" | "image" | "other" | "video" | "%future added value";
export type CreateFileInput = {
  aiAnalysis?: any | null | undefined;
  extension: string;
  fileHash: string;
  fileSize: number;
  fileType: FileBaseFileType;
  filename: string;
  fullPath: string;
  metadata?: any | null | undefined;
  mimeType: string;
};
export type UnifiedMessageInputCreateFileMutation$variables = {
  input: CreateFileInput;
};
export type UnifiedMessageInputCreateFileMutation$data = {
  readonly createFile: {
    readonly fileSize: number;
    readonly filename: string;
    readonly fullPath: string;
    readonly id: string;
    readonly mimeType: string;
  };
};
export type UnifiedMessageInputCreateFileMutation = {
  response: UnifiedMessageInputCreateFileMutation$data;
  variables: UnifiedMessageInputCreateFileMutation$variables;
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
    "name": "UnifiedMessageInputCreateFileMutation",
    "selections": (v1/*: any*/),
    "type": "Mutation",
    "abstractKey": null
  },
  "kind": "Request",
  "operation": {
    "argumentDefinitions": (v0/*: any*/),
    "kind": "Operation",
    "name": "UnifiedMessageInputCreateFileMutation",
    "selections": (v1/*: any*/)
  },
  "params": {
    "cacheID": "9ba05042d01bc7def6aeeb229aebabc8",
    "id": null,
    "metadata": {},
    "name": "UnifiedMessageInputCreateFileMutation",
    "operationKind": "mutation",
    "text": "mutation UnifiedMessageInputCreateFileMutation(\n  $input: CreateFileInput!\n) {\n  createFile(input: $input) {\n    id\n    filename\n    fullPath\n    fileSize\n    mimeType\n  }\n}\n"
  }
};
})();

(node as any).hash = "a8b1f73ded7df40f2b4d3b04ed07c64a";

export default node;
