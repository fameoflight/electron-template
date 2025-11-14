import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useCallback } from 'react';

interface AutoResizeTextareaProps {
  // Basic textarea props
  value?: string;
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  style?: React.CSSProperties;
  maxLength?: number;

  // Auto-resize behavior
  autoResize?: boolean;
  minHeight?: number;
  maxHeight?: number;
  resizeDirection?: 'up' | 'down' | 'both';

  // Growth behavior
  growOnContent?: boolean;
  shrinkOnContent?: boolean;

  // Events
  onChange?: (value: string, event: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onKeyUp?: (event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onFocus?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
  onPaste?: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;

  // Submit behavior
  onSubmit?: (value: string, event: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  submitOnEnter?: boolean;
  submitOnCtrlEnter?: boolean;
  submitOnMetaEnter?: boolean;

  // Focus behavior
  autoFocus?: boolean;
  selectOnFocus?: boolean;

  // Styling overrides
  containerClassName?: string;
  containerStyle?: React.CSSProperties;

  // Performance
  debounceResize?: number;
}

interface AutoResizeTextareaRef {
  textarea: HTMLTextAreaElement | null;
  focus: () => void;
  blur: () => void;
  select: () => void;
  selectAll: () => void;
  setValue: (value: string) => void;
  getValue: () => string;
  resize: () => void;
}

const AutoResizeTextarea = forwardRef<AutoResizeTextareaRef, AutoResizeTextareaProps>(
  function AutoResizeTextarea({
    value,
    defaultValue = '',
    placeholder = 'Type your message...',
    disabled = false,
    readOnly = false,
    className = '',
    style,
    maxLength,

    // Auto-resize behavior
    autoResize = true,
    minHeight = 40,
    maxHeight = 400,
    resizeDirection = 'down',

    // Growth behavior
    growOnContent = true,
    shrinkOnContent = true,

    // Events
    onChange,
    onKeyDown,
    onKeyUp,
    onFocus,
    onBlur,
    onPaste,

    // Submit behavior
    onSubmit,
    submitOnEnter = true,
    submitOnCtrlEnter = false,
    submitOnMetaEnter = false,

    // Focus behavior
    autoFocus = false,
    selectOnFocus = false,

    // Styling
    containerClassName = '',
    containerStyle,

    // Performance
    debounceResize = 100,
  }, ref) {

    const [internalValue, setInternalValue] = useState(defaultValue);
    const [height, setHeight] = useState(minHeight);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const resizeTimeoutRef = useRef<NodeJS.Timeout>();
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    // Calculate textarea height based on content
    const calculateHeight = useCallback(() => {
      if (!autoResize || !textareaRef.current) return minHeight;

      const textarea = textareaRef.current;
      const originalHeight = textarea.style.height;

      // Temporarily set height to auto to measure scroll height
      textarea.style.height = 'auto';
      const scrollHeight = textarea.scrollHeight;
      textarea.style.height = originalHeight;

      let newHeight = scrollHeight;

      // Apply min/max constraints
      newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));

      return newHeight;
    }, [autoResize, minHeight, maxHeight]);

    // Resize textarea to fit content
    const resizeTextarea = useCallback(() => {
      if (!autoResize) return;

      const newHeight = calculateHeight();
      setHeight(newHeight);

      if (textareaRef.current) {
        textareaRef.current.style.height = `${newHeight}px`;
      }
    }, [autoResize, calculateHeight]);

    // Debounced resize for performance
    const debouncedResize = useCallback(() => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current);
      }

      resizeTimeoutRef.current = setTimeout(() => {
        resizeTextarea();
      }, debounceResize);
    }, [resizeTextarea, debounceResize]);

    // Handle value changes
    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = event.target.value;

      if (!isControlled) {
        setInternalValue(newValue);
      }

      onChange?.(newValue, event);

      if (autoResize) {
        if (growOnContent || shrinkOnContent) {
          debouncedResize();
        }
      }
    };

    // Handle keyboard events
    const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      onKeyDown?.(event);

      // Handle submit shortcuts
      if (onSubmit) {
        const isEnter = event.key === 'Enter';
        const isCtrl = event.ctrlKey || event.metaKey;
        const isMeta = event.metaKey;

        if (isEnter && submitOnEnter && !event.shiftKey) {
          event.preventDefault();
          onSubmit(currentValue, event);
          return;
        }

        if (isEnter && isCtrl && submitOnCtrlEnter) {
          event.preventDefault();
          onSubmit(currentValue, event);
          return;
        }

        if (isEnter && isMeta && submitOnMetaEnter) {
          event.preventDefault();
          onSubmit(currentValue, event);
          return;
        }
      }
    };

    // Handle focus events
    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocus?.(event);

      if (selectOnFocus && textareaRef.current) {
        textareaRef.current.select();
      }
    };

    // Handle paste events
    const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
      onPaste?.(event);

      // Resize after paste if content grows
      if (autoResize && growOnContent) {
        setTimeout(() => {
          resizeTextarea();
        }, 0);
      }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      textarea: textareaRef.current,
      focus: () => textareaRef.current?.focus(),
      blur: () => textareaRef.current?.blur(),
      select: () => textareaRef.current?.select(),
      selectAll: () => textareaRef.current?.select(),
      setValue: (newValue: string) => {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        if (textareaRef.current) {
          textareaRef.current.value = newValue;
          if (autoResize) {
            setTimeout(resizeTextarea, 0);
          }
        }
      },
      getValue: () => textareaRef.current?.value || '',
      resize: resizeTextarea,
    }), [isControlled, autoResize, resizeTextarea]);

    // Auto-focus on mount
    useEffect(() => {
      if (autoFocus && textareaRef.current) {
        textareaRef.current.focus();
      }
    }, [autoFocus]);

    // Initial resize
    useEffect(() => {
      if (autoResize) {
        resizeTextarea();
      }
    }, [autoResize, resizeTextarea]);

    // Handle external value changes
    useEffect(() => {
      if (isControlled && textareaRef.current && textareaRef.current.value !== value) {
        textareaRef.current.value = value || '';
        if (autoResize) {
          setTimeout(resizeTextarea, 0);
        }
      }
    }, [value, isControlled, autoResize, resizeTextarea]);

    // Cleanup
    useEffect(() => {
      return () => {
        if (resizeTimeoutRef.current) {
          clearTimeout(resizeTimeoutRef.current);
        }
      };
    }, []);

    // Determine positioning based on resize direction
    const getPositionStyle = (): React.CSSProperties => {
      switch (resizeDirection) {
        case 'up':
          return {
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            ...containerStyle,
          };
        case 'down':
        default:
          return containerStyle || {};
      }
    };

    const getTextareaStyle = (): React.CSSProperties => {
      const baseStyle: React.CSSProperties = {
        resize: 'none',
        overflow: 'hidden',
        height: autoResize ? `${height}px` : undefined,
        minHeight: autoResize ? undefined : minHeight,
        maxHeight: autoResize ? undefined : maxHeight,
        ...style,
      };

      if (resizeDirection === 'up' && autoResize) {
        baseStyle.flexGrow = 1;
        baseStyle.flexShrink = 0;
      }

      return baseStyle;
    };

    return (
      <div
        ref={containerRef}
        className={`relative ${containerClassName}`}
        style={getPositionStyle()}
      >
        <textarea
          ref={textareaRef}
          value={currentValue}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3
            bg-card
            border border-border
            rounded-md
            transition-all duration-200 ease-out
            placeholder:text-muted-foreground
            text-foreground
            focus:outline-none
            focus:ring-2
            focus:ring-primary/20
            focus:border-primary
            hover:border-strong
            disabled:opacity-50
            disabled:cursor-not-allowed
            ${autoResize ? 'overflow-y-auto' : 'overflow-y-auto'}
            ${className}
          `}
          style={getTextareaStyle()}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={onKeyUp}
          onFocus={handleFocus}
          onBlur={onBlur}
          onPaste={handlePaste}
        />
      </div>
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export type { AutoResizeTextareaProps, AutoResizeTextareaRef };
export default AutoResizeTextarea;