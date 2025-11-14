import React from 'react'
import { Select as AntdSelect, SelectProps as AntdSelectProps } from 'antd';

export type SelectOption<T> = {
  label: string;
  value: T;
  disabled?: boolean;
  help?: string;
};

export type SelectProps<T> = AntdSelectProps<T> & {
  className?: string;
  options: Array<SelectOption<T>>;
};

interface ExtendedSelectOption<T> extends Omit<SelectOption<T>, 'label'> {
  dataLabel: string;
  label: React.ReactNode;
}

function Select<T>(props: SelectProps<T>) {
  const { className, options, onOpenChange, ...rest } = props;
  const [open, setOpen] = React.useState(false);

  const handleOpenChange = (visible: boolean) => {
    setOpen(visible);
    onOpenChange?.(visible);
  };

  const renderedOptions = options.map(opt => ({
    ...opt,
    dataLabel: opt.label,
    label: (
      <div>
        <span>{opt.label}</span>
        {open && opt.help && (
          <div className="text-xs text-muted-foreground mt-1">
            {opt.help}
          </div>
        )}
      </div>
    )
  }));

  return (
    <AntdSelect<T>
      showSearch
      // use dataLabel for filtering and selected value display (so tooltip nodes aren't used there)
      optionFilterProp="dataLabel"
      optionLabelProp="dataLabel"
      filterOption={(input, option) =>
        ((option as ExtendedSelectOption<T>)?.dataLabel ?? '').toString().toLowerCase().includes(input.toLowerCase())
      }
      className={className}
      options={renderedOptions}
      onOpenChange={handleOpenChange}
      {...rest}
    />
  );
}

export default Select;
