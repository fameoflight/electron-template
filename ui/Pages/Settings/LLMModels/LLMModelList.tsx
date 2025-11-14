import React from "react";
import _ from "lodash";
import { useFragment, graphql, useMutation } from "react-relay/hooks";

import { LLMModelList_records$key } from "./__generated__/LLMModelList_records.graphql";
import { Button, List, Space, Tag, message } from "antd";
import { EditOutlined, DeleteOutlined, StarOutlined, StarFilled } from "@ant-design/icons";
import LLMModelView from "@ui/Pages/Settings/LLMModels/LLMModelView";

// Note: This should be generated from a proper .graphql file
const SetDefaultLLMModelMutation = graphql`
  mutation LLMModelListSetDefaultMutation($id: String!) {
    setDefaultLLMModel(id: $id) {
      id
      name
      connectionId
      temperature
      contextLength
      capabilities
      modelIdentifier
      default
    }
  }
`;

const fragmentSpec = graphql`
  fragment LLMModelList_records on LLMModel @relay(plural: true) {
    id
    name
    default
    connectionId
    temperature
    contextLength
    capabilities
    modelIdentifier
    ...LLMModelView_record
  }
`;

interface ILLMModelListProps {
  records: LLMModelList_records$key;
  connections: any[];
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

function LLMModelList(props: ILLMModelListProps) {
  const records = useFragment(fragmentSpec, props.records);
  const [setDefaultCommit, isInFlight] = useMutation(SetDefaultLLMModelMutation);

  const handleSetDefault = (id: string) => {
    setDefaultCommit({
      variables: { id },
      onCompleted: () => {
        message.success('Default model updated successfully!');
      },
      onError: (error) => {
        message.error(`Failed to set default model: ${error.message}`);
      },
    });
  };

  const getConnectionName = (connectionId: string) => {
    const connection = props.connections.find(c => c.id === connectionId);
    return connection ? connection.name : 'Unknown Connection';
  };

  const renderActions = (record: any) => (
    <Space>
      <Button
        type="link"
        icon={record.default ? <StarFilled /> : <StarOutlined />}
        onClick={() => handleSetDefault(record.id)}
        loading={isInFlight}
        className={record.default ? 'text-yellow-500' : ''}
      >
        {record.default ? 'Default' : 'Set Default'}
      </Button>
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
          <LLMModelView
            record={item}
            connectionName={getConnectionName(item.connectionId)}
          />
        </List.Item>
      )}
    />
  );
}

export default LLMModelList;