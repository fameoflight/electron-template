import React, { useMemo, useCallback } from 'react';
import { FormInstance, Select } from 'antd';
import { useFragment, graphql } from 'react-relay/hooks';
// Generic type for both LLM and Embedding connection fragments
type ConnectionFragmentKey = any;

const fragmentSpec = graphql`
  fragment ConnectionSelector_connections on Connection @relay(plural: true) {
    id
    name
    provider
    kind
  }
`;

interface IConnectionSelectorProps {
  connections: ConnectionFragmentKey;
  form: FormInstance<any>;
  disabled?: boolean;
  onConnectionChange?: (connectionId: string) => void;
}

function ConnectionSelector(props: IConnectionSelectorProps) {
  const { connections, form, disabled = false, onConnectionChange } = props;
  const connectionsData = useFragment(fragmentSpec, connections);

  // Memoize connection options
  const connectionOptions = useMemo(() =>
    connectionsData.map((connection: any) => ({
      key: connection.id,
      value: connection.id,
      label: `${connection.name} (${connection.provider} - ${connection.kind})`
    })), [connectionsData]);

  const handleChange = useCallback((connectionId: string) => {
    onConnectionChange?.(connectionId);
  }, [onConnectionChange]);

  return (
    <Select
      disabled={disabled}
      placeholder="Select a connection"
      allowClear
      options={connectionOptions}
      onChange={handleChange}
      className="input"
      size="large"
    />
  );
}

export default React.memo(ConnectionSelector);