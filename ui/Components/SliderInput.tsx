import React from 'react';
import { Slider, InputNumber } from 'antd';

interface ISliderInputProps {
  value?: number;
  onChange?: (value: number | null) => void;
  min: number;
  max: number;
  step: number;
  marks?: Record<number, string>;
  precision?: number;
  formatter?: (value: number | string | undefined) => string;
  parser?: (value: string) => string;
  sliderClassName?: string;
  placeholder?: string;
  className?: string;
}

function SliderInput(props: ISliderInputProps) {
  const {
    value,
    onChange,
    min,
    max,
    step,
    marks,
    precision,
    formatter,
    parser,
    sliderClassName,
    placeholder,
    className
  } = props;

  const [val, setVal] = React.useState<number>(value ?? min);

  // Update internal state when value prop changes
  React.useEffect(() => {
    if (value !== undefined) {
      setVal(value);
    }
  }, [value]);

  const handleSliderChange = (sliderValue: number) => {
    setVal(sliderValue);
    onChange?.(sliderValue);
  };

  const handleInputChange = (inputValue: number | null) => {
    setVal(Math.max(min, Math.min(max, inputValue ?? min)));
    onChange?.(Math.max(min, Math.min(max, inputValue ?? min)));
  };

  const MAX_MARK_LABEL_LENGTH = 12;
  const processedMarks: Record<number, React.ReactNode> | undefined = marks
    ? Object.entries(marks).reduce((acc, [k, v]) => {
      const label = String(v ?? '');
      const short =
        label.length > MAX_MARK_LABEL_LENGTH
          ? `${label.slice(0, MAX_MARK_LABEL_LENGTH - 1)}…`
          : label;
      acc[Number(k)] = (
        <span title={label} className="inline-block max-w-[8rem] truncate">
          {short}
        </span>
      );
      return acc;
    }, {} as Record<number, React.ReactNode>)
    : undefined;

  return (
    // increased gap between slider and input (gap-6)
    <div className={`flex items-center gap-6 py-2 ${className}`}>
      <div className="flex-1 min-w-[120px] pt-2">
        <Slider
          min={min}
          max={max}
          step={step}
          value={val}
          onChange={handleSliderChange}
          marks={processedMarks}
          className={sliderClassName}
        />
      </div>
      <InputNumber
        min={min}
        max={max}
        step={step}
        value={val}
        onChange={handleInputChange}
        precision={precision}
        formatter={formatter}
        parser={parser ? (v => Number(parser(v ?? ''))) : undefined}
        placeholder={placeholder}
        className="min-w-20"
      />
    </div>
  );
}

export default SliderInput;
