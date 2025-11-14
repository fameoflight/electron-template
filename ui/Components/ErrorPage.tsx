import React from 'react';

import { LeftOutlined } from '@ant-design/icons';
import { Result } from 'antd';
import { ResultStatusType } from 'antd/lib/result';

import ButtonLink from './LinkButton';

import Errors from './Errors';
import type { ErrorsType } from './Errors';

interface IErrorPageProps {
  children?: React.ReactNode;
  errors: ErrorsType;
  extra?: React.ReactNode;
  status?: ResultStatusType;
  title?: string;
  className?: string;
}

function ErrorPage(props: IErrorPageProps) {
  const status = props.status || '500';

  const title = props.title || 'Error';

  const extra = props.extra || (
    <ButtonLink className="mt-4" to="/" type="primary">
      <LeftOutlined /> Back Home
    </ButtonLink>
  );

  return (
    <div className={props.className ?? 'mt-32'}>
      <Result
        status={status}
        title={title}
        subTitle={
          <Errors errors={props.errors} className="mx-auto max-w-xl mt-24" />
        }
        extra={extra}
      />
    </div>
  );
}

export default ErrorPage;
