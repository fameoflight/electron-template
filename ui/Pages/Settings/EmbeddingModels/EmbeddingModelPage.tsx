import React from "react";
import _ from "lodash";
import { graphql } from 'react-relay/hooks';
import { Button, Form, message, Spin } from "antd";

import type { EmbeddingModelPageQuery } from "./__generated__/EmbeddingModelPageQuery.graphql";
import type { EmbeddingModelPageCreateUpdateMutation } from "./__generated__/EmbeddingModelPageCreateUpdateMutation.graphql";
import type { EmbeddingModelPageDestroyMutation } from "./__generated__/EmbeddingModelPageDestroyMutation.graphql";
import { useCompatMutation, useNetworkLazyReloadQuery } from "@ui/hooks/relay";
import useFormRecordState from "@ui/hooks/useFormRecordState";
import PageContainer from "@ui/Components/PageContainer";
import EmbeddingModelList from "@ui/Pages/Settings/EmbeddingModels/EmbeddingModelList";
import EmbeddingModelForm from "@ui/Pages/Settings/EmbeddingModels/EmbeddingModelForm";
import { ArrowLeftCircleIcon, PlusCircleIcon } from "@heroicons/react/24/outline";

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
`

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
`

const EmbeddingModelPageDestroyMutation = graphql`
  mutation EmbeddingModelPageDestroyMutation($id: String!) {
    destroyEmbeddingModel(id: $id)
  }
`

function EmbeddingModelPage() {
  const [form] = Form.useForm();
  const [data, refreshData] = useNetworkLazyReloadQuery<EmbeddingModelPageQuery>(
    EmbeddingModelPageQuery,
    {}
  );
  const connections = [...(data.connectionsArray || [])];
  const embeddingModels = [...(data.embeddingModelsArray || [])];
  const [modeOrRecord, setMode] = useFormRecordState('list', embeddingModels);

  const [commitCreateUpdate, isInFlight] = useCompatMutation<
    EmbeddingModelPageCreateUpdateMutation
  >(EmbeddingModelPageCreateUpdateMutation);

  const [commitDestroy] = useCompatMutation<
    EmbeddingModelPageDestroyMutation
  >(EmbeddingModelPageDestroyMutation);

  const onAddEmbeddingModel = () => {
    setMode('new');
    form.resetFields();
  };

  const onEditEmbeddingModel = (recordId: string) => {
    const record = embeddingModels.find(c => c.id === recordId);
    if (record) {
      setMode(record);
      form.setFieldsValue(record);
    }
  };

  const onDeleteEmbeddingModel = (recordId: string) => {
    commitDestroy({
      variables: { id: recordId },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success('Embedding Model deleted successfully');
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
          message.success(modeOrRecord !== 'new' && modeOrRecord !== 'list' ? 'Embedding Model updated successfully' : 'Embedding Model created successfully');
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
      title="Embedding Models"
      extra={isShowingForm ?
        { title: 'Back', onClick: onCancelForm, icon: <ArrowLeftCircleIcon className="h-5 w-5" /> } :
        { title: 'Add Embedding Model', onClick: onAddEmbeddingModel, icon: <PlusCircleIcon className="h-5 w-5" /> }
      }
    >
      <Spin spinning={isInFlight}>
        {isShowingForm ? (
          <div className="mt-2">
            <EmbeddingModelForm
              form={form}
              record={modeOrRecord === 'new' ? null : modeOrRecord}
              connections={connections}
              onSubmit={onSubmitForm}
            />

            <Button className="mt-4" onClick={() => form.submit()} type="primary" block>
              {modeOrRecord === 'new' ? 'Create Embedding Model' : 'Update Embedding Model'}
            </Button>
          </div>
        ) : (
          <EmbeddingModelList
            records={embeddingModels}
            connections={connections}
            onEdit={onEditEmbeddingModel}
            onDelete={onDeleteEmbeddingModel}
          />
        )}
      </Spin>
    </PageContainer>
  );
};

export default EmbeddingModelPage;