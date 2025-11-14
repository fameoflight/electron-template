import React, { useEffect } from "react";
import { useFragment, graphql } from "react-relay/hooks";

import { LLMModelSelect_records$key } from "./__generated__/LLMModelSelect_records.graphql";
import { SelectProps } from "antd";
import Select from "@ui/Components/Select";

const fragmentSpec = graphql`
  fragment LLMModelSelect_records on LLMModel @relay(plural: true) {
    id
    name
    modelIdentifier
    default
  }
`;

interface ILLMModelSelectProps extends Omit<SelectProps, "options"> {
  records: LLMModelSelect_records$key;
}

function LLMModelSelect(props: ILLMModelSelectProps) {
  const records = useFragment(fragmentSpec, props.records);
  const { value, onChange, ...rest } = props;

  const options = React.useMemo(
    () =>
      records.map((record) => ({
        label: record.name || record.modelIdentifier,
        value: record.id,
        help: record.modelIdentifier
      })),
    [records]
  );

  const defaultRecord = React.useMemo(
    () => records.find((r) => !!r.default) ?? records[0] ?? null,
    [records]
  );
  const defaultValue = defaultRecord?.id;

  // If no value is provided (undefined), select the default (or first) and
  // trigger onChange so parent knows about the selection.
  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      // call onChange with the default value; cast to any to match Select onChange signature
      (onChange as any)?.(defaultValue, options.find((o) => o.value === defaultValue));
    }
    // Intentionally only depends on value/defaultValue/onChange/options
  }, [value, defaultValue, onChange, options]);

  const selectValue = value === undefined ? defaultValue : value;

  return <Select {...(rest)} value={selectValue} onChange={onChange} options={options} />;
}

export default LLMModelSelect;