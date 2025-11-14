import React from "react";
import _ from "lodash";
import { useFragment, graphql } from "react-relay/hooks";

import { EmbeddingModelList_records$key } from "./__generated__/EmbeddingModelList_records.graphql";
import { Button, List, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import EmbeddingModelView from "@ui/Pages/Settings/EmbeddingModels/EmbeddingModelView";

const fragmentSpec = graphql`
  fragment EmbeddingModelList_records on EmbeddingModel @relay(plural: true) {
    id
    name
    connectionId
    dimension
    contextLength
    maxBatchSize
    modelIdentifier
    ...EmbeddingModelView_record
  }
`;

interface IEmbeddingModelListProps {
  records: EmbeddingModelList_records$key;
  connections: any[];
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

function EmbeddingModelList(props: IEmbeddingModelListProps) {
  const records = useFragment(fragmentSpec, props.records);

  const getConnectionName = (connectionId: string) => {
    const connection = props.connections.find(c => c.id === connectionId);
    return connection ? connection.name : 'Unknown Connection';
  };

  const renderActions = (record: any) => (
    <Space>
      {props.onEdit && (
        <Button
          type="link"
          icon={<EditOutlined />}
          onClick={() => props.onEdit!(record.id)}
        >
          Edit
        </Button>
      )}
      {props.onDelete && (
        <Button
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => props.onDelete!(record.id)}
        >
          Delete
        </Button>
      )}
    </Space>
  );

  return (
    <List
      itemLayout="horizontal"
      dataSource={records as any[]}
      renderItem={(item) => (
        <List.Item
          className="bg-white shadow-md rounded-lg p-4 mb-4 border border-gray-200 hover:shadow-lg transition-shadow"
          key={item.id}
          actions={[renderActions(item)]}
        >
          <EmbeddingModelView
            record={item}
            connectionName={getConnectionName(item.connectionId)}
          />
        </List.Item>
      )}
    />
  );
}

export default EmbeddingModelList;