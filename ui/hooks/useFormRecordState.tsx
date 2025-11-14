import React, { useMemo, useState } from 'react';

function useFormRecordState<T>(
  initialMode: 'list' | 'new' | string,
  dataArray?: readonly T[] | null
): ['list' | 'new' | T, React.Dispatch<React.SetStateAction<'list' | 'new' | T>>] {
  const [modeOrRecord, setMode] = useState<'list' | 'new' | T>(initialMode as 'list' | 'new' | T);

  const record = useMemo(() => {
    if (modeOrRecord === 'list' || modeOrRecord === 'new') {
      return null;
    }
    if (dataArray) {
      return dataArray.find((item: any) => item.id === modeOrRecord) || null;
    }
    return null;
  }, [modeOrRecord, dataArray]);

  return [(record as T) || modeOrRecord, setMode];
}

export default useFormRecordState;