import React from "react";
import _ from "lodash";
import { Spin, Tabs } from "antd";
import LoginForm from "@ui/Pages/User/LoginForm";
import UserForm from "@ui/Pages/User/UserForm";
import { graphql } from "react-relay";
import { useCompatMutation } from "@ui/hooks/relay";
import { useAuth } from "@ui/contexts/AuthRelayProvider";
import { AuthPageLoginMutation } from "./__generated__/AuthPageLoginMutation.graphql";
import { AuthPageSignupMutation } from "./__generated__/AuthPageSignupMutation.graphql";
import { useNavigate } from "react-router-dom";

interface IAuthPageProps { }

function AuthPage(props: IAuthPageProps) {
  const navigate = useNavigate();

  const { login } = useAuth();

  const onUserChange = (user: any) => {
    if (!user) return;
    login(user);
    navigate('/');
  }

  const [commitLogin, commitLoginIsInFlight] = useCompatMutation<
    AuthPageLoginMutation
  >(graphql`
    mutation AuthPageLoginMutation(
      $input: LoginInput!
    ) {
      login(input: $input) {
        id
        name
        username
        sessionKey

      }
    }
  `);

  const [commitSignUp, commitSignupIsInFlight] = useCompatMutation<
    AuthPageSignupMutation
  >(graphql`
    mutation AuthPageSignupMutation(
      $input: CreateUserInput!
    ) {
      createUser(input: $input) {
        id
        name
        username
        sessionKey
      }
    }
  `);



  const onLoginSubmit = (values: any) => {
    commitLogin({
      variables: {
        input: values
      },
      onCompleted: (response, errors) => {
        // useCompatMutation automatically shows error notifications
        // Only proceed if there are no errors
        if (!errors || errors.length === 0) {
          onUserChange(response.login);
        }
      }
    });
  }

  const onSignUpSubmit = (values: any) => {
    commitSignUp({
      variables: {
        input: values
      },
      onCompleted: (response, errors) => {
        // useCompatMutation automatically shows error notifications
        // Only proceed if there are no errors
        if (!errors || errors.length === 0) {
          onUserChange(response.createUser);
        }
      }
    });
  }

  const commitIsInFlight = commitLoginIsInFlight;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <Spin spinning={commitIsInFlight}>
          <Tabs defaultActiveKey="login" centered>
            <Tabs.TabPane tab="Login" key="login">
              <LoginForm onSubmit={onLoginSubmit} />
            </Tabs.TabPane>
            <Tabs.TabPane tab="Sign Up" key="signup">
              <UserForm record={null} onSubmit={onSignUpSubmit} />
            </Tabs.TabPane>
          </Tabs>
        </Spin>
      </div>
    </div>
  )
}

export default AuthPage;