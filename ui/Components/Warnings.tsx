import React from 'react';

import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

import { ErrorsType, MessageList } from './Errors';

interface IWarningsProps {
  children?: React.ReactNode;
  title: string;
  errors: ErrorsType;
  actions?: React.ReactNode[];
}

function Warnings(props: IWarningsProps) {
  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <ExclamationTriangleIcon
            className="h-5 w-5 text-yellow-400"
            aria-hidden="true"
          />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">{props.title}</h3>
          <div className="mt-2">
            <MessageList
              messages={props.errors}
              className="text-sm text-yellow-700"
            />
          </div>
          {props.actions && (
            <div className="mt-4  space-x-2">{props.actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Warnings;
