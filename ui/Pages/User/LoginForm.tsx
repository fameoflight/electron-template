import React from "react";
import _ from "lodash";
import { Form, Input, Button, FormInstance } from "antd";

interface ILoginFormProps {
  form?: FormInstance<any>;
  onSubmit?: (values: any) => void;
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
    >

      <Form.Item
        label="Username"
        name="username"
        rules={[
          {
            required: true,
            message: "Please input your username!",
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
            Login
          </Button>
        </Form.Item> : null
      }
    </Form>
  );
};

export default LoginForm;