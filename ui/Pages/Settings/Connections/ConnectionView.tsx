import React from "react";
import _ from "lodash";
import { useFragment, graphql } from "react-relay/hooks";

import { ConnectionView_record$key } from "./__generated__/ConnectionView_record.graphql";

const fragmentSpec = graphql`
  fragment ConnectionView_record on Connection {
    id
    name
    apiKey
    baseUrl
    provider
    kind
    customHeaders
    models {
      id
      name
    }
  }
`;

interface IConnectionViewProps {
  record: ConnectionView_record$key;
}

function ConnectionView(props: IConnectionViewProps) {
  const record = useFragment(fragmentSpec, props.record);

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xl font-bold text-gray-900">{record.name}</h4>
        <div className="flex space-x-2">
          <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full">
            {record.provider}
          </span>
          <span className="px-3 py-1 text-sm font-medium bg-gray-100 text-gray-800 rounded-full">
            {record.kind}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">Base URL</span>
          <span className="text-gray-600 break-all">{record.baseUrl}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-gray-900">API Key</span>
          <span className="text-gray-600">
            {record.apiKey ? '••••••••' + record.apiKey.slice(-4) : 'Not set'}
          </span>
        </div>
        {record.customHeaders && Object.keys(record.customHeaders).length > 0 && (
          <div className="flex flex-col md:col-span-2">
            <span className="font-semibold text-gray-900">Custom Headers</span>
            <span className="text-gray-600">
              {Object.keys(record.customHeaders).length} configured
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConnectionView;