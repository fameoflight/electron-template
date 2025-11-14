import React from "react";
import _ from "lodash";
import { graphql } from 'react-relay/hooks';
import { Button, Form, message, Spin } from "antd";

import { ConnectionPageQuery } from "./__generated__/ConnectionPageQuery.graphql";
import type { ConnectionPageCreateUpdateMutation } from "./__generated__/ConnectionPageCreateUpdateMutation.graphql";
import type { ConnectionPageDestroyMutation } from "./__generated__/ConnectionPageDestroyMutation.graphql";
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import useFormRecordState from "@ui/hooks/useFormRecordState";
import PageContainer from "@ui/Components/PageContainer";
import ConnectionList from "@ui/Pages/Settings/Connections/ConnectionList";
import ConnectionForm from "@ui/Pages/Settings/Connections/ConnectionForm";
import { ArrowLeftCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

const ConnectionPagePageQuery = graphql`
  query ConnectionPageQuery {
    currentUser {
     id
    }
    connectionsArray {
      id
      name
      ...ConnectionList_records
      ...ConnectionForm_record
    }
  }
`

const ConnectionPageCreateUpdateMutation = graphql`
  mutation ConnectionPageCreateUpdateMutation($input: CreateUpdateConnectionInput!) {
    createUpdateConnection(input: $input) {
      id
      name
      apiKey
      baseUrl
      provider
      kind
      customHeaders
    }
  }
`

const ConnectionPageDestroyMutation = graphql`
  mutation ConnectionPageDestroyMutation($id: String!) {
    destroyConnection(id: $id)
  }
`

function ConnectionPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<ConnectionPageQuery>(
    ConnectionPagePageQuery,
    {}
  );
  const connections = data.connectionsArray || [];
  const [modeOrRecord, setMode] = useFormRecordState('list', connections);

  const [commitCreateUpdate, isInFlight] = useCompatMutation<
    ConnectionPageCreateUpdateMutation
  >(ConnectionPageCreateUpdateMutation);

  const [commitDestroy] = useCompatMutation<
    ConnectionPageDestroyMutation
  >(ConnectionPageDestroyMutation);

  const onAddConnection = () => {
    setMode('new');
    form.resetFields();
  };

  const onEditConnection = (recordId: string) => {
    const record = connections.find(c => c.id === recordId);
    if (record) {
      setMode(record);
      form.setFieldsValue(record);
    }
  };

  const onDeleteConnection = (recordId: string) => {
    commitDestroy({
      variables: { id: recordId },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success('Connection deleted successfully');
        }
        refreshData();
      }
    });
  };

  const onSubmitForm = (values: any) => {
    commitCreateUpdate({
      variables: {
        input: values
      },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success(modeOrRecord !== 'new' && modeOrRecord !== 'list' ? 'Connection updated successfully' : 'Connection created successfully');
          setMode('list');
          form.resetFields();
        }

        refreshData();
      }
    });
  };

  const onCancelForm = () => {
    setMode('list');
    form.resetFields();
  };

  const isShowingForm = modeOrRecord !== 'list';

  return (
    <PageContainer
      title="Connections"
      extra={isShowingForm ?
        { title: 'Back', onClick: onCancelForm, icon: <ArrowLeftCircleIcon className="h-5 w-5" /> } :
        { title: 'Add Connection', onClick: onAddConnection, icon: <PlusCircleIcon className="h-5 w-5" /> }
      }
    >
      <Spin spinning={isInFlight}>
        {isShowingForm ? (
          <div className="mt-2">
            <ConnectionForm
              form={form}
              record={modeOrRecord === 'new' ? null : modeOrRecord}
              onSubmit={onSubmitForm}
            />

            <Button className="mt-4" onClick={() => form.submit()} type="primary" block>
              {modeOrRecord === 'new' ? 'Create Connection' : 'Update Connection'}
            </Button>
          </div>
        ) : (
          <ConnectionList
            records={connections}
            onEdit={onEditConnection}
            onDelete={onDeleteConnection}
          />
        )}
      </Spin>
    </PageContainer>
  );
};

export default ConnectionPage;
