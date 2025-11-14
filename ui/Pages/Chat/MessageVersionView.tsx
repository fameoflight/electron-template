import React from "react";
import { useFragment, graphql } from "react-relay/hooks";
import { UserOutlined, RobotOutlined } from "@ant-design/icons";

import { MessageVersionView_record$key } from "./__generated__/MessageVersionView_record.graphql";
import MarkdownViewer from "@ui/Components/MarkdownViewer";

const fragmentSpec = graphql`
  fragment MessageVersionView_record on MessageVersion {
    id
    content
    files {
      id
      filename
    }
  }
`;

type MessageVersionRef = MessageVersionView_record$key;

interface IMessageVersionContentProps {
  record: MessageVersionRef;
}

interface IMessageVersionViewProps {
  record: MessageVersionRef;
  role?: "user" | "assistant";
}

interface IMessageViewProps {
  messageVersion: MessageVersionRef;
}

/**
 * Internal: renders files + content (uses relay fragment)
 */
const MessageVersionContent: React.FC<IMessageVersionContentProps> = ({ record }) => {
  const resolved = useFragment(fragmentSpec, record);
  const files = resolved.files || [];

  return (
    <div>
      {files.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {files.map((file) => (
            <div
              key={file?.id}
              className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md border"
            >
              <span className="text-sm truncate max-w-32">{file?.filename}</span>
            </div>
          ))}
        </div>
      )}
      <MarkdownViewer content={resolved.content} />
    </div>
  );
};

/**
 * Unified MessageVersionView accepts a role prop to switch styles/icons/alignment.
 * role defaults to "assistant".
 */
export const MessageVersionView: React.FC<IMessageVersionViewProps> = ({
  record,
  role = "assistant",
}) => {
  const isUser = role === "user";

  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={
          isUser
            ? `relative w-[90%] px-4 py-3 shadow-md bg-blue-600 text-white rounded-2xl rounded-br-sm`
            : `relative w-[90%] px-4 py-3 shadow-md bg-white text-gray-900 rounded-2xl rounded-bl-sm border border-gray-200`
        }
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-1">
            {isUser ? (
              <UserOutlined className="text-xl text-blue-200" />
            ) : (
              <RobotOutlined className="text-xl text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="mb-1">
              <span
                className={
                  isUser
                    ? "font-semibold text-xs tracking-wide uppercase text-blue-100"
                    : "font-semibold text-xs tracking-wide uppercase text-gray-500"
                }
              >
                {isUser ? "You" : "Assistant"}
              </span>
            </div>
            <div
              className={
                isUser
                  ? "mb-2 whitespace-pre-wrap break-words text-white text-right"
                  : "mb-2 whitespace-pre-wrap break-words text-gray-900"
              }
            >
              <MessageVersionContent record={record} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Backwards-compatible small wrappers
 */
export const UserMessageView: React.FC<IMessageViewProps> = ({ messageVersion }) => (
  <MessageVersionView record={messageVersion} role="user" />
);

export const AssistantMessageView: React.FC<IMessageViewProps> = ({ messageVersion }) => (
  <MessageVersionView record={messageVersion} role="assistant" />
);

export default MessageVersionView;