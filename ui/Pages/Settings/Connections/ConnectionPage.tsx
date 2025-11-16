import React, { useState } from "react";
import { Form, message } from "antd";
import { graphql } from 'react-relay/hooks';
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { AnimatePresence } from "@ui/Components/Motion";

import type { ConnectionPageQuery } from "./__generated__/ConnectionPageQuery.graphql";
import type { ConnectionPageCreateUpdateMutation } from "./__generated__/ConnectionPageCreateUpdateMutation.graphql";
import type { ConnectionPageDestroyMutation } from "./__generated__/ConnectionPageDestroyMutation.graphql";

import SettingsPageContainer from "../Shared/SettingsPageContainer";
import SettingsPageHeader from "../Shared/SettingsPageHeader";
import SettingsPageActions from "../Shared/SettingsPageActions";
import ConnectionForm from "../Connections/ConnectionForm";
import ConnectionList from "../Connections/ConnectionList";

const ConnectionPageQuery = graphql`
  query ConnectionPageQuery {
    currentUser {
     id
    }
    connectionsArray {
      id
      name
      apiKey
      baseUrl
      provider
      kind
      ...ConnectionList_records
      ...ConnectionForm_record
    }
  }
`;

const ConnectionPageCreateUpdateMutation = graphql`
  mutation ConnectionPageCreateUpdateMutation($input: CreateUpdateConnectionInput!) {
    createUpdateConnection(input: $input) {
      id
      name
      apiKey
      baseUrl
      provider
      kind
    }
  }
`;

const ConnectionPageDestroyMutation = graphql`
  mutation ConnectionPageDestroyMutation($id: String!) {
    destroyConnection(id: $id)
  }
`;

function ConnectionPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<ConnectionPageQuery>(
    ConnectionPageQuery,
    {}
  );
  const [modeOrRecord, setMode] = useState<'list' | 'new' | any>('list');

  const connections = [...(data?.connectionsArray || [])];

  const [commitCreateUpdate, isInFlight] = useCompatMutation(ConnectionPageCreateUpdateMutation);
  const [commitDestroy] = useCompatMutation(ConnectionPageDestroyMutation);

  const onAdd = () => {
    setMode('new');
    form.resetFields();
  };

  const onEdit = (recordId: string) => {
    const record = connections.find(item => item.id === recordId);
    if (record) {
      setMode(record);
      form.setFieldsValue(record);
    }
  };

  const onDelete = (recordId: string) => {
    commitDestroy({
      variables: { id: recordId },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success('Connection deleted successfully');
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to delete Connection');
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
          message.success(modeOrRecord === 'new' ? 'Connection created successfully' : 'Connection updated successfully');
          setMode('list');
          form.resetFields();
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to save Connection');
      }
    });
  };

  const onCancelForm = () => {
    setMode('list');
    form.resetFields();
  };

  const isShowingForm = modeOrRecord !== 'list';
  const isEdit = modeOrRecord !== 'new' && modeOrRecord !== 'list';

  const getHeaderInfo = () => {
    if (isShowingForm) {
      return {
        title: isEdit ? 'Edit Connection' : 'New Connection',
        subtitle: isEdit ? 'Edit connection settings' : 'Configure API connection settings'
      };
    } else {
      return {
        title: connections.length === 0 ? 'No Connections yet' : `Connections (${connections.length})`,
        subtitle: 'Manage your API connections'
      };
    }
  };

  const headerInfo = getHeaderInfo();

  return (
    <SettingsPageContainer
      title={headerInfo.title}
      subtitle={headerInfo.subtitle}
      isShowingForm={isShowingForm}
      onBack={isShowingForm ? onCancelForm : undefined}
    >
      <SettingsPageHeader
        title={headerInfo.title}
        subtitle={headerInfo.subtitle}
        isShowingForm={isShowingForm}
        isEdit={isEdit}
        onAdd={!isShowingForm ? onAdd : undefined}
        onBack={isShowingForm ? onCancelForm : undefined}
        addButtonText="Add Connection"
      />

      <AnimatePresence mode="wait">
        {isShowingForm ? (
          <div key="form" className="surface-elevated p-6 rounded-xl border border-border-default">
            <ConnectionForm
              form={form}
              record={modeOrRecord === 'new' ? null : modeOrRecord}
              onSubmit={onSubmitForm}
            />

            <SettingsPageActions
              isLoading={isInFlight}
              isEdit={isEdit}
              onSave={() => form.submit()}
              onCancel={onCancelForm}
            />
          </div>
        ) : (
          <ConnectionList
            records={data?.connectionsArray}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </SettingsPageContainer>
  );
}

export default ConnectionPage;