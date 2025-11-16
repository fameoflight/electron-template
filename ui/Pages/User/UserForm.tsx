import React from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance } from "antd";
import { motion } from "@ui/Components/Motion";
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
  isLoading?: boolean;
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
      className="space-y-4"
    >
      <Form.Item
        label={<span className="text-sm font-medium text-primary">Name</span>}
        name="name"
        rules={[
          {
            required: true,
            message: "Please input name!",
          },
        ]}
      >
        <Input
          placeholder="Enter your full name"
          className="input"
          size="large"
          disabled={props.isLoading}
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Username</span>}
        name="username"
        initialValue={record?.username}
        rules={[
          {
            required: true,
            message: "Please input username!",
          },
        ]}
      >
        <Input
          placeholder="Choose a username"
          className="input"
          size="large"
          disabled={props.isLoading}
        />
      </Form.Item>

      <Form.Item
        label={<span className="text-sm font-medium text-primary">Password</span>}
        name="password"
        rules={[
          {
            required: true,
            message: "Please input your password!",
          },
        ]}
      >
        <Input.Password
          placeholder="Create a secure password"
          className="input"
          size="large"
          disabled={props.isLoading}
        />
      </Form.Item>

      {props.onSubmit && (
        <Form.Item className="mb-0">
          <motion.button
            whileHover={{ scale: props.isLoading ? 1 : 1.02 }}
            whileTap={{ scale: props.isLoading ? 1 : 0.98 }}
            type="submit"
            disabled={props.isLoading}
            className="w-full btn-primary px-4 py-3 rounded-lg font-medium text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {props.isLoading ? (record ? 'Updating...' : 'Creating account...') : (record ? 'Update Profile' : 'Create Account')}
          </motion.button>
        </Form.Item>
      )}
    </Form>
  );
};

export default UserForm;