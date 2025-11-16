import React, { useMemo } from "react";
import _ from "lodash";
import { Button, Dropdown } from "antd";
import { ItemType } from "antd/es/menu/interface";
import { humanize } from "@shared/utils";
import { DownOutlined } from "@ant-design/icons";
import { LLMModel, useLLMModels } from "@ui/Pages/Chat/useLLMModels";


interface IMessageRedoButtonProps {
  className?: string;
  onClick?: (modelId: string) => void;
}


function MessageRedoButton(props: IMessageRedoButtonProps) {
  const models = useLLMModels();
  const menuItems: ItemType[] = useMemo(() => {
    return models.map((model: LLMModel) => {
      return {
        key: model.id,
        label: model.name || humanize(model.modelIdentifier),
      };
    });
  }, [models]);

  return (
    <Dropdown
      className={props.className}
      menu={{ items: menuItems, onClick: (info) => props.onClick?.(info.key as string) }}
    >
      <Button
        type="text"
        size="small"
        className="text-xs opacity-80 hover:opacity-100 p-2 min-w-8 flex items-center gap-1"
      >
        <span>Redo</span>
        <DownOutlined className="text-xs" />
      </Button>
    </Dropdown>
  );
}

export default MessageRedoButton;