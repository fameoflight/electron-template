import React, { useState } from "react";
import { Form, message } from "antd";
import { graphql } from 'react-relay/hooks';
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { AnimatePresence } from "@ui/Components/Motion";

import type { EmbeddingModelPageQuery } from "./__generated__/EmbeddingModelPageQuery.graphql";
import type { EmbeddingModelPageCreateUpdateMutation } from "./__generated__/EmbeddingModelPageCreateUpdateMutation.graphql";
import type { EmbeddingModelPageDestroyMutation } from "./__generated__/EmbeddingModelPageDestroyMutation.graphql";

import SettingsPageContainer from "../Shared/SettingsPageContainer";
import SettingsPageHeader from "../Shared/SettingsPageHeader";
import SettingsPageActions from "../Shared/SettingsPageActions";
import EmbeddingModelForm from "../EmbeddingModels/EmbeddingModelForm";
import EmbeddingModelList from "../EmbeddingModels/EmbeddingModelList";

const EmbeddingModelPageQuery = graphql`
  query EmbeddingModelPageQuery {
    currentUser {
     id
    }
    connectionsArray {
      id
      name
      provider
      kind
      ...EmbeddingModelForm_connections
    }
    embeddingModelsArray {
      id
      name
      connectionId
      dimension
      contextLength
      maxBatchSize
      modelIdentifier
      ...EmbeddingModelList_records
      ...EmbeddingModelForm_record
    }
  }
`;

const EmbeddingModelPageCreateUpdateMutation = graphql`
  mutation EmbeddingModelPageCreateUpdateMutation($input: CreateUpdateEmbeddingModelInput!) {
    createUpdateEmbeddingModel(input: $input) {
      id
      name
      connectionId
      dimension
      contextLength
      maxBatchSize
      modelIdentifier
    }
  }
`;

const EmbeddingModelPageDestroyMutation = graphql`
  mutation EmbeddingModelPageDestroyMutation($id: String!) {
    destroyEmbeddingModel(id: $id)
  }
`;

function EmbeddingModelPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<EmbeddingModelPageQuery>(
    EmbeddingModelPageQuery,
    {}
  );
  const [modeOrRecord, setMode] = useState<'list' | 'new' | any>('list');

  const embeddingModels = [...(data?.embeddingModelsArray || [])];
  const connections = Array.from(data?.connectionsArray || []);

  const [commitCreateUpdate, isInFlight] = useCompatMutation(EmbeddingModelPageCreateUpdateMutation);
  const [commitDestroy] = useCompatMutation(EmbeddingModelPageDestroyMutation);

  const onAdd = () => {
    setMode('new');
    form.resetFields();
  };

  const onEdit = (recordId: string) => {
    const record = embeddingModels.find(item => item.id === recordId);
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
          message.success('Embedding Model deleted successfully');
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to delete Embedding Model');
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
          message.success(modeOrRecord === 'new' ? 'Embedding Model created successfully' : 'Embedding Model updated successfully');
          setMode('list');
          form.resetFields();
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to save Embedding Model');
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
        title: isEdit ? 'Edit Embedding Model' : 'New Embedding Model',
        subtitle: isEdit ? 'Edit embedding model settings' : 'Configure embedding model settings'
      };
    } else {
      return {
        title: embeddingModels.length === 0 ? 'No Embedding Models yet' : `Embedding Models (${embeddingModels.length})`,
        subtitle: 'Manage your embedding models'
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
        addButtonText="Add Embedding Model"
      />

      <AnimatePresence mode="wait">
        {isShowingForm ? (
          <div key="form" className="surface-elevated p-6 rounded-xl border border-border-default">
            <EmbeddingModelForm
              form={form}
              record={modeOrRecord === 'new' ? null : modeOrRecord}
              connections={connections}
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
          <EmbeddingModelList
            records={embeddingModels}
            connections={connections}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </SettingsPageContainer>
  );
}

export default EmbeddingModelPage;