import React from "react";
import _ from "lodash";
import { Button, ButtonProps } from "antd";
import { useNavigate } from "react-router-dom";

interface ILinkButtonProps extends ButtonProps {
  to: string;
}

function LinkButton(props: ILinkButtonProps) {
  const { to, onClick, ...restProps } = props;

  const navigate = useNavigate();

  const onButtonClick = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    navigate(to);
    onClick?.(e);
  }

  return (
    <Button {...restProps} onClick={onButtonClick} />
  )
}

export default LinkButton;