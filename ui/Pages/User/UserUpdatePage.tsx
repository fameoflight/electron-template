import React from "react";
import _ from "lodash";
import { graphql, useLazyLoadQuery, useMutation } from 'react-relay/hooks';

import { UserUpdatePageQuery } from "./__generated__/UserUpdatePageQuery.graphql";
import UserForm from "@ui/Pages/User/UserForm";
import { UserUpdatePageMutation } from "./__generated__/UserUpdatePageMutation.graphql";
import { Spin } from "antd";
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <Spin spinning={commitUpdateIsInFlight}>
          <UserForm record={data?.currentUser!} onSubmit={onSubmit} />
        </Spin>
      </div>
    </div>
  );
};

export default UserUpdatePage;
