import React from 'react';

import { classNames } from './utils';

import _ from 'lodash';

import { PlusOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';

type PageExtraType =
  | {
    title: string;
    icon?: JSX.Element;
    onClick: () => void;
  }
  | React.ReactNode[];

interface IPageContainerProps {
  title: string;
  description?: string;
  loading?: boolean;
  extra?: PageExtraType;
  children: React.ReactNode;
}

function PageContainer(props: IPageContainerProps) {
  let extraView: any = null;

  let extraClass = '';

  if (props.extra) {
    if (Array.isArray(props.extra)) {
      if (props.extra.length > 0) {
        extraClass = 'space-x-2';
      }
      extraView = props.extra;
    } else {
      const { title, icon, onClick } = props.extra as {
        title: string;
        icon?: JSX.Element;
        onClick: () => void;
      };

      extraView = (
        <Button onClick={onClick} type="primary">
          {icon == undefined ? <PlusOutlined /> : icon}
          {title}
        </Button>
      );
    }
  }

  return (
    <Spin spinning={!!props.loading} wrapperClassName="sm:px-4 md:px-0">
      <div className="bg-white px-4 py-5 border-b-2 border-gray-200 border-dotted border-0 sm:px-6">
        <div className="-ml-4 -mt-2 flex items-center justify-between flex-wrap sm:flex-nowrap">
          <div className="ml-4 mt-2">
            <h3 className="text-md text-gray-800">{props.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{props.description}</p>
          </div>

          <div
            className={classNames(
              'ml-4 mt-2 flex-shrink-0 content-center',
              extraClass
            )}
          >
            {extraView}
          </div>
        </div>
      </div>
      <div className="mt-4 overflow-hidden">{props.children}</div>
    </Spin>
  );
}

export default PageContainer;
