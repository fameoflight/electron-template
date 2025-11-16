import React from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance } from "antd";
import { motion } from "@ui/Components/Motion";

interface ILoginFormProps {
  form?: FormInstance<any>;
  onSubmit?: (values: any) => void;
  isLoading?: boolean;
}

function LoginForm(props: ILoginFormProps) {

  const onFinish = (values: any) => {
    props.onSubmit?.(values);
  };


  return (
    <Form
      form={props.form}
      layout="vertical"
      onFinish={onFinish}
      name="LoginForm"
      className="space-y-4"
    >
      <Form.Item
        label={<span className="text-sm font-medium text-primary">Username</span>}
        name="username"
        rules={[
          {
            required: true,
            message: "Please input your username!",
          },
        ]}
      >
        <Input
          placeholder="Enter your username"
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
          placeholder="Enter your password"
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
            {props.isLoading ? 'Signing in...' : 'Sign In'}
          </motion.button>
        </Form.Item>
      )}
    </Form>
  );
};

export default LoginForm;