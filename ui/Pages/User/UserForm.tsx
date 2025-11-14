import React from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance } from "antd";
import { useFragment, graphql } from "react-relay/hooks";
import { UserForm_record$key } from "./__generated__/UserForm_record.graphql";

const fragmentSpec = graphql`
  fragment UserForm_record on User {
    id
    name
    username
  }
`;



interface IUserFormProps {
  form?: FormInstance<any>;
  record: UserForm_record$key | null;
  onSubmit?: (values: any) => void;
}

function UserForm(props: IUserFormProps) {
  const record = useFragment(fragmentSpec, props.record);

  const onFinish = (values: any) => {
    props.onSubmit?.(values);
  };

  return (
    <Form
      preserve={false}
      form={props.form}
      layout="vertical"
      onFinish={onFinish}
      name="UserForm"
      initialValues={record || undefined}
    >

      <Form.Item
        label="Name"
        name="name"
        rules={[
          {
            required: true,
            message: "Please input name!",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Username"
        name="username"
        initialValue={record?.username}
        rules={[
          {
            required: true,
            message: "Please input username!",
          },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item
        label="Password"
        name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password />
      </Form.Item>

      {props.onSubmit ?
        <Form.Item>
          <Button type="primary" htmlType="submit" block>
            {record ? "Update" : "Sign Up"}
          </Button>
        </Form.Item> : null
      }
    </Form>
  );
};

export default UserForm;