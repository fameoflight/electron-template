import React from "react";
import _ from "lodash";
import { useFragment, graphql } from "react-relay/hooks";

import { EmbeddingModelView_record$key } from "./__generated__/EmbeddingModelView_record.graphql";

const fragmentSpec = graphql`
  fragment EmbeddingModelView_record on EmbeddingModel {
    id
    name
    connectionId
    dimension
    contextLength
    maxBatchSize
    modelIdentifier
  }
`;

interface IEmbeddingModelViewProps {
  record: EmbeddingModelView_record$key;
  connectionName: string;
}

function EmbeddingModelView(props: IEmbeddingModelViewProps) {
  const record = useFragment(fragmentSpec, props.record);

  const displayName = record.name || record.modelIdentifier;

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900">{displayName}</h4>
        <div className="flex space-x-2">
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            {props.connectionName}
          </span>
          <span className="px-3 py-1 text-sm font-medium bg-purple-100 text-purple-800 rounded-full">
            {record.dimension}D
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">Model Identifier</span>
          <span className="text-gray-600 font-mono">{record.modelIdentifier}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">Dimension</span>
          <span className="text-gray-600">{record.dimension.toLocaleString()}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">Context Length</span>
          <span className="text-gray-600">{record.contextLength.toLocaleString()} tokens</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">Max Batch Size</span>
          <span className="text-gray-600">{(record.maxBatchSize || 32).toLocaleString()}</span>
        </div>
        {record.name && record.name !== record.modelIdentifier && (
          <div className="flex flex-col md:col-span-2">
            <span className="font-semibold text-gray-900">Display Name</span>
            <span className="text-gray-600">{record.name}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddingModelView;