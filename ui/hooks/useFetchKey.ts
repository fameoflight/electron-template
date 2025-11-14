import { useState } from 'react';

function useFetchKey(): [string, () => void] {
  const [fetchKey, setFetchKey] = useState(new Date().toLocaleString());

  const updateFetchKey = () => {
    setFetchKey(new Date().toLocaleString());
  };

  return [fetchKey, updateFetchKey];
}

export default useFetchKey;
