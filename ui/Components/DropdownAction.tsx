import React from "react";
import { Button, Dropdown, Space, ButtonProps } from "antd";
import { DownOutlined } from "@ant-design/icons";
import { MenuProps } from "antd";

interface DropdownOption {
  id: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

interface DropdownActionProps extends Omit<ButtonProps, 'onClick'> {
  options: DropdownOption[];
  onOptionSelected: (optionId: string) => void;
  buttonText?: string;
  loading?: boolean;
  disabled?: boolean;
  placement?: 'bottomLeft' | 'bottomRight' | 'topLeft' | 'topRight';
  showIcon?: boolean;
}

function DropdownAction({
  options,
  onOptionSelected,
  buttonText = 'Actions',
  loading = false,
  disabled = false,
  placement = 'bottomLeft',
  showIcon = true,
  children,
  ...buttonProps
}: DropdownActionProps) {
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    if (!key) return;
    onOptionSelected(key);
  };

  const menuItems: MenuProps['items'] = options.map((option) => ({
    key: option.id,
    label: option.label,
    disabled: option.disabled || disabled,
    icon: option.icon,
  }));

  const menuProps: MenuProps = {
    items: menuItems,
    onClick: handleMenuClick,
    disabled: loading || disabled,
  };

  return (
    <Dropdown menu={menuProps} placement={placement}>
      <Button loading={loading} disabled={disabled} {...buttonProps}>
        <Space>
          {children || buttonText}
          {showIcon && <DownOutlined />}
        </Space>
      </Button>
    </Dropdown>
  );
}

export default DropdownAction;