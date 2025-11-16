import React from "react";
import _ from "lodash";
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay/hooks';
import { motion } from "@ui/Components/Motion";
import { UserCircleIcon, ArrowLeftIcon } from "@heroicons/react/24/outline";

import { UserUpdatePageQuery } from "./__generated__/UserUpdatePageQuery.graphql";
import UserForm from "@ui/Pages/User/UserForm";
import { UserUpdatePageMutation } from "./__generated__/UserUpdatePageMutation.graphql";
import { useNavigate } from "react-router-dom";

const UserUpdatePagePageQuery = graphql`
  query UserUpdatePageQuery {
    currentUser {
      id
      name
      username
      ...UserForm_record
    }
  }
`

function UserUpdatePage() {
  const navigate = useNavigate();
  const data = useLazyLoadQuery<UserUpdatePageQuery>(
    UserUpdatePagePageQuery,
    {}
  );

  const [commitUpdate, commitUpdateIsInFlight] = useMutation<
    UserUpdatePageMutation
  >(graphql`
      mutation UserUpdatePageMutation(
        $input: UpdateUserInput!
      ) {
        updateUser(input: $input) {
          id
          name
          username
          sessionKey
        }
      }
    `);

  const onSubmit = (values: any) => {
    commitUpdate({
      variables: {
        input: values,
      },
      onCompleted: (response, errors) => {
        if (errors && errors.length > 0) {
          console.error(errors);
          return;
        }

        navigate('/');
      },
      updater: (store) => {
        const updatedUser = store.getRootField('updateUser');
        if (updatedUser) {
          store.getRoot()?.setLinkedRecord(updatedUser, 'currentUser');
        }
      },
    });
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[background-primary] p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => navigate('/')}
            className="p-2 rounded-lg text-secondary hover:text-primary-600 hover:bg-primary-50 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </motion.button>
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 shadow-md"
            >
              <UserCircleIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-2xl font-bold text-primary"
              >
                Edit Profile
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-sm text-secondary"
              >
                Update your account information
              </motion.p>
            </div>
          </div>
        </div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="surface-elevated p-8 rounded-2xl shadow-lg border border-border-default"
        >
          <UserForm
            record={data?.currentUser!}
            onSubmit={onSubmit}
            isLoading={commitUpdateIsInFlight}
          />
        </motion.div>
      </motion.div>
    </div>
  );
};

export default UserUpdatePage;
