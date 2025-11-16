import React from 'react';

import _ from 'lodash';

import { XCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

import { classNames } from './utils';

export type ErrorsType = string | readonly string[] | null | undefined;

interface IErrorsProps {
  className?: string;
  errors: ErrorsType;
  onClose?: () => void;
}

export function ErrorMessageList({
  messages,
  className,
}: {
  messages: ErrorsType;
  className?: string;
}) {
  if (!messages) {
    return null;
  }

  if (_.isString(messages)) {
    messages = [messages];
  }

  const content =
    _.size(messages) > 1 ? (
      <>
        <h3 className={classNames(className, 'font-bold mb-2')}>
          There were {_.size(messages)} errors
        </h3>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          {_.map(messages, (error, idx) => (
            <li key={idx}>{error}</li>
          ))}
        </ul>
      </>
    ) : (
      <p>{messages[0]}</p>
    );

  return <div className={className}>{content}</div>;
}

function Errors({ errors, onClose, className }: IErrorsProps) {
  if (_.isNil(errors) || _.isEmpty(errors)) {
    return null;
  }

  return (
    <div className={className}>
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <XCircleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
          </div>
          <div className="ml-3">
            <ErrorMessageList messages={errors} className="text-sm text-red-700" />
          </div>
          {onClose && (
            <div className="ml-auto pl-3">
              <div className="-mx-1.5 -my-1.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex bg-red-50 border-none rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                >
                  <span className="sr-only">Dismiss</span>
                  <XMarkIcon className="h-5 w-5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Errors;
