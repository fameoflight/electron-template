import React from 'react';

import { classNames } from './utils';

interface IToggleOption<T> {
  label: string;
  value: T;
}

interface IToggleProps<T> {
  className?: string;
  value: T;
  onChange?: (value: T) => void;
  options: [IToggleOption<T>, IToggleOption<T>];
}

function Toggle<T>(props: IToggleProps<T>) {
  const { className, options } = props;

  const commonClasses =
    'focus:ring-2 focus:ring-offset-2 focus:ring-picasso-primary-800 focus:outline-none text-base leading-none rounded-full py-4 px-6 transition-all duration-300 ease-in-out transform';

  const activeClasses = 'bg-picasso-primary-900 text-white';

  const inactiveClasses = 'bg-white text-gray-900';

  const toggle = () => {
    const newValue =
      props.value === options[0].value ? options[1].value : options[0].value;

    props.onChange?.(newValue);
  };

  return (
    <div className={classNames(className)}>
      <button
        className="bg-white shadow-lg flex items-center mt-10 rounded-full"
        onClick={toggle}
      >
        {options.map((option, idx) => (
          <div
            key={idx}
            className={classNames(
              commonClasses,
              option.value == props.value ? activeClasses : inactiveClasses
            )}
          >
            {option.label}
          </div>
        ))}
      </button>
    </div>
  );
}

export default Toggle;
