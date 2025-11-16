import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';

interface AutoResizeTextareaProps {
  // Basic textarea props
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  maxLength?: number;

  // Auto-resize behavior
  autoResize?: boolean;
  minHeight?: number;
  maxHeight?: number;

  // Events
  onChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;

  // Styling
  containerClassName?: string;
}

interface AutoResizeTextareaRef {
  focus: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
}

const AutoResizeTextarea = forwardRef<AutoResizeTextareaRef, AutoResizeTextareaProps>(
  function AutoResizeTextarea({
    value,
    defaultValue = '',
    placeholder = 'Type your message...',
    disabled = false,
    readOnly = false,
    className = '',
    maxLength,
    autoResize = true,
    minHeight = 40,
    maxHeight = 400,
    onChange,
    onKeyDown,
    onKeyUp,
    onFocus,
    onBlur,
    containerClassName = '',
  }, ref) {

    const [internalValue, setInternalValue] = useState(defaultValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Resize textarea to fit content
    const resizeTextarea = useCallback(() => {
      if (!autoResize || !textareaRef.current) return;

      const textarea = textareaRef.current;

      // Temporarily set height to auto to measure scroll height
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;

      // Apply min/max constraints
      const newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));
      textarea.style.height = `${newHeight}px`;
    }, [autoResize, minHeight, maxHeight]);

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue, event);

      if (autoResize) {
        resizeTextarea();
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      focus: () => textareaRef.current?.focus(),
      setValue: (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        if (textareaRef.current) {
          textareaRef.current.value = newValue;
          setTimeout(resizeTextarea, 0);
        }
      },
      getValue: () => textareaRef.current?.value || '',
    }), [isControlled, resizeTextarea]);

    // Initial resize and handle external value changes
    useEffect(() => {
      if (autoResize) {
        resizeTextarea();
      }
    }, [autoResize, resizeTextarea, value]);

    return (
      <div className={`relative ${containerClassName}`}>
        <textarea
          ref={textareaRef}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={`
            w-full
            bg-card
            transition-all duration-200 ease-out
            placeholder:text-muted-foreground
            text-foreground
            disabled:opacity-50
            disabled:cursor-not-allowed
            resize-none
            overflow-hidden
            ${className}
          `}
          style={{
            minHeight: `${minHeight}px`,
            maxHeight: `${maxHeight}px`,
          }}
          onChange={handleChange}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export type { AutoResizeTextareaProps, AutoResizeTextareaRef };
export default AutoResizeTextarea;