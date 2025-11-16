import React, { useState } from "react";
import _ from "lodash";
import { motion, AnimatePresence } from "@ui/Components/Motion";
import { SparklesIcon } from "@heroicons/react/24/outline";
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

  const commitIsInFlight = commitLoginIsInFlight || commitSignupIsInFlight;
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-[background-primary] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 mb-4 shadow-lg"
          >
            <SparklesIcon className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-primary mb-2"
          >
            Welcome
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-secondary"
          >
            {activeTab === 'login' ? 'Sign in to your account' : 'Create a new account'}
          </motion.p>
        </div>

        {/* Auth Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="surface-elevated p-8 rounded-2xl shadow-lg border border-border-default"
        >
          {/* Tabs */}
          <div className="flex gap-2 mb-6 p-1 bg-background-secondary rounded-lg">
            <button
              type="button"
              onClick={() => setActiveTab('login')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'login'
                  ? 'bg-surface text-primary-600 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('signup')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'signup'
                  ? 'bg-surface text-primary-600 shadow-sm'
                  : 'text-secondary hover:text-primary'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Forms */}
          <AnimatePresence mode="wait">
            {activeTab === 'login' ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
              >
                <LoginForm onSubmit={onLoginSubmit} isLoading={commitIsInFlight} />
              </motion.div>
            ) : (
              <motion.div
                key="signup"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <UserForm record={null} onSubmit={onSignUpSubmit} isLoading={commitIsInFlight} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center text-xs text-tertiary mt-6"
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}

export default AuthPage;