import React from 'react';

import _ from 'lodash';

import { RadioGroup } from '@headlessui/react';
import { CheckCircleIcon } from '@heroicons/react/24/solid';
import { classNames } from '@ui/Components/utils';


type RadioCardItem<T extends Recordable> = {
  label: React.ReactNode | string;
  value: T;
  descriptions?: string[];
};

interface IRadioCardProps<T extends Recordable> {
  label?: React.ReactNode | string;
  value?: T | null | T[];
  className?: string;
  onChange?: (value: T | T[]) => void;
  options: RadioCardItem<T>[];
  itemClassName?: string;
  multiple?: boolean;
}

function RadioCard<T extends Recordable>(props: IRadioCardProps<T>) {
  const handleToggle = (value: T) => {
    if (props.multiple) {
      const currentValues = (props.value as T[]) || [];
      const newValues = currentValues.includes(value)
        ? currentValues.filter(v => v !== value)
        : [...currentValues, value];
      props.onChange?.(newValues as T[]);
    } else {
      props.onChange?.(value);
    }
  };

  const isChecked = (value: T) => {
    if (props.multiple) {
      const currentValues = (props.value as T[]) || [];
      return currentValues.includes(value);
    }
    return props.value === value;
  };

  if (props.multiple) {
    // Multiple selection mode - custom implementation
    return (
      <div className={classNames(props.className, 'transition-all')}>
        {props.label && (
          <label className="text-base font-medium text-gray-900 mb-4 block">
            {props.label}
          </label>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {props.options.map((item) => {
            const checked = isChecked(item.value);
            return (
              <div
                key={item.value}
                onClick={() => handleToggle(item.value)}
                className={classNames(
                  checked
                    ? 'border-blue-500 shadow-sm ring-2 ring-blue-500 ring-opacity-20'
                    : 'border-gray-200 hover:border-gray-300',
                  'relative bg-white border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md',
                  props.itemClassName
                )}
              >
                <div className="flex items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className={classNames(
                        checked
                          ? 'bg-blue-500 border-blue-500'
                          : 'border-gray-300 bg-white',
                        'w-4 h-4 rounded border-2 mr-3 flex items-center justify-center'
                      )}>
                        {checked && (
                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {item.label}
                      </span>
                    </div>
                    {item.descriptions && (
                      <p className="mt-2 text-xs text-gray-500 ml-7">
                        {item.descriptions[0]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Single selection mode - original implementation
  return (
    <RadioGroup
      value={props.multiple ? undefined : (props.value as T | undefined)}
      onChange={handleToggle}
      className={classNames(props.className, 'transition-all')}
    >
      {props.label && (
        <RadioGroup.Label className="text-base font-medium text-gray-900 mb-4">
          {props.label}
        </RadioGroup.Label>
      )}

      <div className="flex flex-col md:flex-row">
        {props.options.map((item) => (
          <RadioGroup.Option
            key={item.value}
            value={item.value}
            className={({ checked, active }) =>
              classNames(
                checked
                  ? 'border-picasso-primary-500 shadow'
                  : 'border-gray-200',
                `relative bg-white border shadow-sm p-4 flex cursor-pointer focus:outline-none flex-1`,
                props.itemClassName
              )
            }
          >
            {({ checked, active }) => (
              <>
                <span className="flex-1 flex">
                  <span className="flex flex-col">
                    <RadioGroup.Label
                      as="span"
                      className="block text-sm font-medium text-gray-900"
                    >
                      {item.label}
                    </RadioGroup.Label>
                    {_.map(item.descriptions, (description, idx) => (
                      <RadioGroup.Description
                        as="span"
                        key={idx}
                        className="mt-2 flex items-center text-sm text-gray-500"
                      >
                        {description}
                      </RadioGroup.Description>
                    ))}
                  </span>
                </span>
                <CheckCircleIcon
                  className={classNames(
                    !checked ? 'invisible' : 'visible',
                    'h-5 w-5 text-picasso-primary-800 ml-4'
                  )}
                  aria-hidden="true"
                />
              </>
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  );
}

export default RadioCard;
