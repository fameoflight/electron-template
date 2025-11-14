import React from "react";
import _ from "lodash";
import { useFragment, graphql } from "react-relay/hooks";

import { ConnectionList_records$key } from "./__generated__/ConnectionList_records.graphql";
import { Button, List, Space } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
import ConnectionView from "@ui/Pages/Settings/Connections/ConnectionView";

const fragmentSpec = graphql`
  fragment ConnectionList_records on Connection @relay(plural: true) {
    id
    name
    apiKey
    baseUrl
    provider
    kind
    customHeaders
    ...ConnectionView_record
  }
`;

interface IConnectionListProps {
  records: ConnectionList_records$key;
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

function ConnectionList(props: IConnectionListProps) {
  const records = useFragment(fragmentSpec, props.records);

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
          <ConnectionView record={item} />
        </List.Item>
      )}
    />
  );
}

export default ConnectionList;
