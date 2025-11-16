import React, { useState } from "react";
import { Form, message } from "antd";
import { graphql } from 'react-relay/hooks';
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import { AnimatePresence } from "@ui/Components/Motion";

import type { LLMModelPageQuery } from "./__generated__/LLMModelPageQuery.graphql";
import type { LLMModelPageCreateUpdateMutation } from "./__generated__/LLMModelPageCreateUpdateMutation.graphql";
import type { LLMModelPageDestroyMutation } from "./__generated__/LLMModelPageDestroyMutation.graphql";

import SettingsPageContainer from "../Shared/SettingsPageContainer";
import SettingsPageHeader from "../Shared/SettingsPageHeader";
import SettingsPageActions from "../Shared/SettingsPageActions";
import LLMModelForm from "../LLMModels/LLMModelForm";
import LLMModelList from "../LLMModels/LLMModelList";

const LLMModelPageQuery = graphql`
  query LLMModelPageQuery {
    currentUser {
     id
    }
    connectionsArray {
      id
      name
      provider
      kind
      ...LLMModelForm_connections
    }
    lLMModelsArray {
      id
      name
      connectionId
      temperature
      contextLength
      capabilities
      modelIdentifier
      ...LLMModelList_records
      ...LLMModelForm_record
    }
  }
`;

const LLMModelPageCreateUpdateMutation = graphql`
  mutation LLMModelPageCreateUpdateMutation($input: CreateUpdateLLMModelInput!) {
    createUpdateLLMModel(input: $input) {
      id
      name
      connectionId
      temperature
      contextLength
      capabilities
      modelIdentifier
    }
  }
`;

const LLMModelDestroyMutation = graphql`
  mutation LLMModelPageDestroyMutation($id: String!) {
    destroyLLMModel(id: $id)
  }
`;

function LLMModelPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<LLMModelPageQuery>(
    LLMModelPageQuery,
    {}
  );
  const [modeOrRecord, setMode] = useState<'list' | 'new' | any>('list');

  const llmModels = [...(data?.lLMModelsArray || [])];
  const connections = Array.from(data?.connectionsArray || []);

  const [commitCreateUpdate, isInFlight] = useCompatMutation(LLMModelPageCreateUpdateMutation);
  const [commitDestroy] = useCompatMutation<LLMModelPageDestroyMutation>(LLMModelDestroyMutation);

  const onAdd = () => {
    setMode('new');
    form.resetFields();
  };

  const onEdit = (recordId: string) => {
    const record = llmModels.find(item => item.id === recordId);
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
          message.success('LLM Model deleted successfully');
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to delete LLM Model');
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
          message.success(modeOrRecord === 'new' ? 'LLM Model created successfully' : 'LLM Model updated successfully');
          setMode('list');
          form.resetFields();
        }
        refreshData?.();
      },
      onError: () => {
        message.error('Failed to save LLM Model');
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
        title: isEdit ? 'Edit LLM Model' : 'New LLM Model',
        subtitle: isEdit ? 'Edit language model settings' : 'Configure language model settings'
      };
    } else {
      return {
        title: llmModels.length === 0 ? 'No LLM Models yet' : `LLM Models (${llmModels.length})`,
        subtitle: 'Manage your language models'
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
        addButtonText="Add LLM Model"
      />

      <AnimatePresence mode="wait">
        {isShowingForm ? (
          <div key="form" className="surface-elevated p-6 rounded-xl border border-border-default">
            <LLMModelForm
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
          <LLMModelList
            records={llmModels}
            connections={connections}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        )}
      </AnimatePresence>
    </SettingsPageContainer>
  );
}

export default LLMModelPage;