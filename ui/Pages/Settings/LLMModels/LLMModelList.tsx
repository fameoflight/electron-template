import React from "react";
import _ from "lodash";
import { useFragment, graphql, useMutation } from "react-relay/hooks";
import { motion } from "@ui/Components/Motion";
import { PencilIcon, TrashIcon, StarIcon as StarOutlineIcon } from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { message } from "antd";

import { LLMModelList_records$key } from "./__generated__/LLMModelList_records.graphql";
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

  if (!records || records.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-16"
      >
        <div className="relative mb-6 flex justify-center">
          <div className="absolute inset-0 bg-primary-100 rounded-full blur-3xl opacity-20 scale-75" />
          <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-primary-50 to-primary-100">
            <StarSolidIcon className="w-10 h-10 text-primary-600" />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-primary mb-2">
          No LLM models yet
        </h3>
        <p className="text-sm text-secondary max-w-md mx-auto">
          Add your first language model to start chatting.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4">
      {records.map((record, index) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          className="surface-elevated p-6 rounded-xl border border-border-default hover:shadow-lg transition-all group"
        >
          <div className="flex items-start justify-between gap-4">
            {/* Content */}
            <div className="flex-1 min-w-0">
              <LLMModelView
                record={record}
                connectionName={getConnectionName(record.connectionId)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleSetDefault(record.id)}
                disabled={isInFlight}
                className={`p-2 rounded-lg transition-colors ${record.default
                    ? 'text-amber-600 bg-amber-50'
                    : 'text-secondary hover:text-amber-600 hover:bg-amber-50'
                  }`}
                title={record.default ? 'Default model' : 'Set as default'}
              >
                {record.default ? (
                  <StarSolidIcon className="w-5 h-5" />
                ) : (
                  <StarOutlineIcon className="w-5 h-5" />
                )}
              </motion.button>

              {props.onEdit && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => props.onEdit!(record.id)}
                  className="p-2 rounded-lg text-secondary hover:text-primary-600 hover:bg-primary-50 transition-colors"
                  title="Edit model"
                >
                  <PencilIcon className="w-5 h-5" />
                </motion.button>
              )}

              {props.onDelete && (
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => props.onDelete!(record.id)}
                  className="p-2 rounded-lg text-secondary hover:text-error-600 hover:bg-error-50 transition-colors"
                  title="Delete model"
                >
                  <TrashIcon className="w-5 h-5" />
                </motion.button>
              )}
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export default LLMModelList;