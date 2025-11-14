import React from "react";
import _ from "lodash";
import { graphql } from 'react-relay/hooks';
import { Button, Form, message, Spin } from "antd";

import type { LLMModelPageQuery } from "./__generated__/LLMModelPageQuery.graphql";
import type { LLMModelPageCreateUpdateMutation } from "./__generated__/LLMModelPageCreateUpdateMutation.graphql";
import type { LLMModelPageDestroyMutation } from "./__generated__/LLMModelPageDestroyMutation.graphql";
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import useFormRecordState from "@ui/hooks/useFormRecordState";
import PageContainer from "@ui/Components/PageContainer";
import LLMModelList from "@ui/Pages/Settings/LLMModels/LLMModelList";
import LLMModelForm from "@ui/Pages/Settings/LLMModels/LLMModelForm";
import { ArrowLeftCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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
`

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
`

const LLMModelPageDestroyMutation = graphql`
  mutation LLMModelPageDestroyMutation($id: String!) {
    destroyLLMModel(id: $id)
  }
`

function LLMModelPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<LLMModelPageQuery>(
    LLMModelPageQuery,
    {}
  );
  const llmModels = [...(data.lLMModelsArray || [])];
  const [modeOrRecord, setMode] = useFormRecordState('list', llmModels);

  const [commitCreateUpdate, isInFlight] = useCompatMutation<
    LLMModelPageCreateUpdateMutation
  >(LLMModelPageCreateUpdateMutation);

  const [commitDestroy] = useCompatMutation<
    LLMModelPageDestroyMutation
  >(LLMModelPageDestroyMutation);

  const onAddLLMModel = () => {
    setMode('new');
    form.resetFields();
  };

  const onEditLLMModel = (recordId: string) => {
    const record = llmModels.find(c => c.id === recordId);
    if (record) {
      setMode(record);
      form.setFieldsValue(record);
    }
  };

  const onDeleteLLMModel = (recordId: string) => {
    commitDestroy({
      variables: { id: recordId },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success('LLM Model deleted successfully');
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
          message.success(modeOrRecord !== 'new' && modeOrRecord !== 'list' ? 'LLM Model updated successfully' : 'LLM Model created successfully');
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
      title="LLM Models"
      extra={isShowingForm ?
        { title: 'Back', onClick: onCancelForm, icon: <ArrowLeftCircleIcon className="h-5 w-5" /> } :
        { title: 'Add LLM Model', onClick: onAddLLMModel, icon: <PlusCircleIcon className="h-5 w-5" /> }
      }
    >
      <Spin spinning={isInFlight}>
        {isShowingForm ? (
          <div className="mt-2">
            <LLMModelForm
              form={form}
              record={modeOrRecord === 'new' ? null : modeOrRecord}
              connections={Array.from(data.connectionsArray || [])}
              onSubmit={onSubmitForm}
            />

            <Button className="mt-4" onClick={() => form.submit()} type="primary" block>
              {modeOrRecord === 'new' ? 'Create LLM Model' : 'Update LLM Model'}
            </Button>
          </div>
        ) : (
          <LLMModelList
            records={llmModels}
            connections={Array.from(data.connectionsArray || [])}
            onEdit={onEditLLMModel}
            onDelete={onDeleteLLMModel}
          />
        )}
      </Spin>
    </PageContainer>
  );
};

export default LLMModelPage;