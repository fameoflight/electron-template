# UI Development with Relay - Pattern Enforcement Skill

You are an expert at building UI components with React and Relay in this Electron application. Follow these patterns strictly.

## Core Principles

1. **Pages define queries, Components define fragments**
2. **Fragment composition over data prop drilling**
3. **Small, focused components (25-200 lines)**
4. **Type safety via generated Relay types**
5. **Memoization for list items**
6. **Maximum 5 props per component - EVER**
7. **Self-contained, encapsulated components**
8. **Always use `IComponentProps` interface naming**
9. **Always destructure props inside function body**

---

## Component Structure Convention

**ALWAYS follow this exact structure for every component:**

```typescript
// ✅ CORRECT STRUCTURE
interface IMyComponentProps {
  record: MyComponent_record$key;  // Fragment key
  onSave?: (id: string) => void;   // Callback
  className?: string;              // Optional styling
  // Maximum 5 props total!
}

function MyComponent(props: IMyComponentProps) {
  // Destructure props INSIDE function body
  const { record: recordKey, onSave, className } = props;

  // Resolve fragment
  const record = useFragment(fragmentSpec, recordKey);

  // Component logic...

  return <div className={className}>{/* ... */}</div>;
}

export default MyComponent;
```

### Structure Rules

1. **Interface naming**: `IComponentProps` (always prefix with `I`, suffix with `Props`)
2. **Props parameter**: Accept `props: IComponentProps` (don't destructure in signature)
3. **Destructure inside**: Extract values in function body, not parameter list
4. **Export location**: `export default` at the bottom
5. **Self-contained**: All logic inside component, no external dependencies except hooks

### ❌ WRONG Patterns

```typescript
// ❌ WRONG - Destructuring in function signature
function MyComponent({ record, onSave, className }: IMyComponentProps) {
  // Don't do this!
}

// ❌ WRONG - Interface not prefixed with I
interface MyComponentProps {
  record: MyComponent_record$key;
}

// ❌ WRONG - Too many props (> 5)
interface IMyComponentProps {
  record: MyComponent_record$key;
  onSave?: (id: string) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (id: string) => void;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;  // ❌ 7 props - TOO MANY!
}

// ❌ WRONG - Export at top
export default function MyComponent(props: IMyComponentProps) {
  // Don't export inline
}
```

### ✅ CORRECT Full Example

```typescript
import { graphql, useFragment } from 'react-relay';
import type { ChatListItem_chat$key } from '@graphql/ui/__generated__/ChatListItem_chat.graphql';

const fragmentSpec = graphql`
  fragment ChatListItem_chat on Chat {
    id
    title
    status
  }
`;

interface IChatListItemProps {
  chat: ChatListItem_chat$key;
  onClick?: () => void;
  className?: string;
}

function ChatListItem(props: IChatListItemProps) {
  // Destructure inside function body
  const { chat: chatKey, onClick, className } = props;

  // Resolve fragment
  const chat = useFragment(fragmentSpec, chatKey);

  // Component logic
  const handleClick = () => {
    onClick?.();
  };

  return (
    <Card className={className} onClick={handleClick}>
      <Title level={5}>{chat.title}</Title>
      <Tag>{chat.status}</Tag>
    </Card>
  );
}

export default React.memo(ChatListItem);
```

### When You Have Too Many Props

If you find yourself needing more than 5 props, you're doing too much:

```typescript
// ❌ BAD - 8 props!
interface IUserFormProps {
  user: UserForm_user$key;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  showAvatar?: boolean;
  showBio?: boolean;
  allowDelete?: boolean;
  confirmOnCancel?: boolean;
  customValidation?: (values: any) => any;
}
```

**Solutions:**

1. **Group related props into config object:**
```typescript
// ✅ GOOD - Config object reduces prop count
interface IUserFormConfig {
  showAvatar?: boolean;
  showBio?: boolean;
  allowDelete?: boolean;
  confirmOnCancel?: boolean;
}

interface IUserFormProps {
  user: UserForm_user$key;
  config?: IUserFormConfig;  // Grouped settings
  onSave?: (data: any) => void;
  onCancel?: () => void;
  customValidation?: (values: any) => any;
}
```

2. **Extract sub-components:**
```typescript
// ✅ GOOD - Split into smaller components
interface IUserFormProps {
  user: UserForm_user$key;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

function UserForm(props: IUserFormProps) {
  const { user, onSave, onCancel } = props;

  return (
    <div>
      <UserFormAvatar user={user} />
      <UserFormBio user={user} />
      <UserFormActions onSave={onSave} onCancel={onCancel} />
    </div>
  );
}
```

3. **Use context for deep configuration:**
```typescript
// ✅ GOOD - Context for app-wide settings
const FormConfigContext = createContext<FormConfig>({
  confirmOnCancel: false,
  customValidation: undefined
});

interface IUserFormProps {
  user: UserForm_user$key;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

function UserForm(props: IUserFormProps) {
  const { user, onSave, onCancel } = props;
  const config = useContext(FormConfigContext);  // Get from context

  // Use config.confirmOnCancel, config.customValidation
}
```

---

## Pattern 1: PAGE COMPONENTS (Query Orchestrators)

**When to use:** Top-level route components that fetch and coordinate data

### Basic Page Query Pattern

```typescript
// ✅ GOOD - ChatListPage.tsx pattern
import { graphql, useLazyLoadQuery } from 'react-relay';
import { useNetworkLazyReloadQuery } from '@ui/hooks/relay';

const ChatListPageQuery = graphql`
  query ChatListPageQuery {
    currentUser { id }
    myChats {
      id
      title
      status
      ...ChatListItem_chat  # Fragment spread for child component
    }
  }
`;

function ChatListPage() {
  const [data, refreshData] = useNetworkLazyReloadQuery<ChatListPageQuery>(
    ChatListPageQuery,
    {}
  );

  const chats = data?.myChats || [];

  return (
    <div>
      {chats.map((chat) => (
        <ChatListItem key={chat.id} chat={chat} />
      ))}
    </div>
  );
}
```

**Key Requirements:**
- Query defined with `graphql` template literal
- Use `useNetworkLazyReloadQuery` for CRUD pages (returns `[data, refreshData]`)
- Use `useLazyLoadQuery` for simple read-only pages
- Fragment spreads (`...ComponentName_fieldName`) for child components
- Handle loading/error states
- Keep business logic in services, not pages

---

### Page with Real-Time Polling

```typescript
// ✅ GOOD - ChatNodePage.tsx pattern (real-time updates)
import { usePollQuery } from '@ui/hooks/usePollQuery';

const ChatNodePageQuery = graphql`
  query ChatNodePageQuery($id: String!) {
    chat(id: $id) {
      id
      title
      status
    }
    chatMessages(chatId: $id) {
      id
      role
      currentVersion { id, status, content }
      ...MessageList_messages  # Fragment for list component
    }
  }
`;

function ChatNodePage() {
  const { id } = useParams();

  const [chatData, refreshChatData, isAutoRefreshing] = usePollQuery<ChatNodePageQuery>(
    ChatNodePageQuery,
    { id: id! },
    {
      enabled: !!id,
      deriveRefreshInterval: (data) => {
        // Adaptive polling: faster when streaming
        const hasStreamingMessage = data.chatMessages?.some(
          (msg) => msg.currentVersion?.status === 'streaming'
        );
        return hasStreamingMessage ? 100 : 1000;
      },
    }
  );

  return (
    <div>
      <MessageList messages={chatData?.chatMessages || []} />
    </div>
  );
}
```

**When to use polling:**
- Real-time data requirements (chat messages, streaming status)
- Adaptive intervals based on data state
- User actively viewing the data

---

### Page with CRUD Operations

```typescript
// ✅ GOOD - LLMModelPage.tsx pattern (full CRUD)
import { useCompatMutation } from '@ui/hooks/relay';

const LLMModelPageQuery = graphql`
  query LLMModelPageQuery {
    currentUser { id }
    connectionsArray {
      id
      name
      ...LLMModelForm_connections  # Fragment for form
    }
    lLMModelsArray {
      id
      name
      ...LLMModelList_records      # Fragment for list
      ...LLMModelForm_record       # Fragment for form edit mode
    }
  }
`;

const CreateUpdateMutation = graphql`
  mutation LLMModelPageCreateUpdateMutation($input: CreateUpdateLLMModelInput!) {
    createUpdateLLMModel(input: $input) {
      id
      name
      connectionId
      temperature
    }
  }
`;

const DestroyMutation = graphql`
  mutation LLMModelPageDestroyMutation($id: String!) {
    destroyLLMModel(id: $id)
  }
`;

function LLMModelPage() {
  const [data, refreshData] = useNetworkLazyReloadQuery<LLMModelPageQuery>(
    LLMModelPageQuery,
    {}
  );

  const [mode, setMode] = useState<'list' | 'create' | 'edit'>('list');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form] = Form.useForm();

  const [commitCreateUpdate] = useCompatMutation<LLMModelPageCreateUpdateMutation>(
    CreateUpdateMutation
  );

  const [commitDestroy] = useCompatMutation<LLMModelPageDestroyMutation>(
    DestroyMutation
  );

  const onSubmitForm = (values: any) => {
    commitCreateUpdate({
      variables: { input: values },
      onCompleted: (response, errors) => {
        if (!errors || errors.length === 0) {
          message.success('Model saved successfully');
          setMode('list');
          form.resetFields();
          refreshData();  // Refresh after mutation
        }
      }
    });
  };

  const onEdit = (recordId: string) => {
    setSelectedId(recordId);
    setMode('edit');
    const record = data?.lLMModelsArray?.find((r) => r.id === recordId);
    if (record) {
      form.setFieldsValue(record);
    }
  };

  const onDelete = (recordId: string) => {
    commitDestroy({
      variables: { id: recordId },
      onCompleted: () => {
        message.success('Model deleted successfully');
        refreshData();
      }
    });
  };

  return (
    <div>
      {mode === 'list' && (
        <LLMModelList
          records={data?.lLMModelsArray || []}
          connections={data?.connectionsArray || []}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      {(mode === 'create' || mode === 'edit') && (
        <LLMModelForm
          record={selectedId ? data?.lLMModelsArray?.find(r => r.id === selectedId) : null}
          connections={data?.connectionsArray || []}
          onSubmit={onSubmitForm}
          form={form}
        />
      )}
    </div>
  );
}
```

**CRUD Page Requirements:**
- **Query:** Fetch data for both list and form
- **State:** Manage UI mode (`list | create | edit`)
- **Mutations:** Define all mutations at page level
- **Refresh:** Call `refreshData()` after mutations
- **Callbacks:** Pass `onEdit`, `onDelete` to list components
- **Fragment Spreads:** Multiple spreads for list/form/view

---

## Pattern 2: COMPONENT FRAGMENTS (Data Consumers)

**When to use:** Reusable components that receive data via fragments

### Single Item Fragment

```typescript
// ✅ GOOD - ChatListItem.tsx pattern
import { graphql, useFragment } from 'react-relay';
import type { ChatListItem_chat$key } from '@graphql/ui/__generated__/ChatListItem_chat.graphql';

const fragmentSpec = graphql`
  fragment ChatListItem_chat on Chat {
    id
    title
    status
    createdAt
    llmModel {
      id
      name
      modelIdentifier
    }
  }
`;

interface IChatListItemProps {
  chat: ChatListItem_chat$key;  // Fragment KEY, not data
  onClick?: () => void;
  className?: string;
}

function ChatListItem(props: IChatListItemProps) {
  // Destructure inside function body
  const { chat: chatKey, onClick, className } = props;

  // Resolve fragment key to actual data
  const chat = useFragment(fragmentSpec, chatKey);

  // Memoized computed values
  const statusColor = useMemo(() => getStatusColor(chat?.status), [chat?.status]);
  const titleText = useMemo(() => chat?.title || 'New Chat', [chat?.title]);

  return (
    <Card hoverable onClick={onClick} className={className}>
      <Title level={5}>{titleText}</Title>
      <Tag color={statusColor}>{chat?.status}</Tag>
      <Text type="secondary">{chat?.llmModel?.name}</Text>
    </Card>
  );
}

// Memoize for performance in lists
export default React.memo(ChatListItem);
```

**Single Fragment Requirements:**
- Fragment defined with `graphql` template literal
- Props accept `ComponentName_fieldName$key` type
- Use `useFragment(fragmentSpec, keyProp)` to resolve
- Export with `React.memo()` for list performance
- Keep helper functions outside component
- Use `useMemo` for computed values

---

### Array/List Fragment (Plural)

```typescript
// ✅ GOOD - MessageList.tsx pattern
const fragmentSpec = graphql`
  fragment MessageList_messages on Message @relay(plural: true) {
    id
    role
    createdAt
    currentVersion {
      id
      content
      ...MessageVersionView_record  # Nested fragment spread
    }
  }
`;

type MessageItem = MessageList_messages$data[0];  // Extract single item type

interface IMessageListProps {
  messages: MessageList_messages$key;  // Array fragment key
}

function MessageList(props: IMessageListProps) {
  const messages = useFragment(fragmentSpec, props.messages);

  return (
    <div>
      {messages.map((message: MessageItem) => (
        <div key={message.id}>
          {message.role === 'user' ? (
            <UserMessageView messageVersion={message.currentVersion} />
          ) : (
            <AssistantMessageView messageVersion={message.currentVersion} />
          )}
        </div>
      ))}
    </div>
  );
}
```

**Array Fragment Requirements:**
- Use `@relay(plural: true)` directive
- Extract item type: `type Item = FragmentName$data[0]`
- Fragment key is array type: `FragmentName$key`
- Spread nested fragments for sub-components
- Map over resolved array

---

### Component with Nested Fragments

```typescript
// ✅ GOOD - LLMModelList.tsx pattern (list with nested view fragments)
const fragmentSpec = graphql`
  fragment LLMModelList_records on LLMModel @relay(plural: true) {
    id
    name
    default
    connectionId
    ...LLMModelView_record  # Nested fragment for view component
  }
`;

const SetDefaultMutation = graphql`
  mutation LLMModelListSetDefaultMutation($id: String!) {
    setDefaultLLMModel(id: $id) {
      id
      default
    }
  }
`;

interface ILLMModelListProps {
  records: LLMModelList_records$key;
  connections: any[];
  onEdit?: (recordId: string) => void;
  onDelete?: (recordId: string) => void;
}

function LLMModelList(props: ILLMModelListProps) {
  const records = useFragment(fragmentSpec, props.records);
  const [setDefaultCommit, isInFlight] = useMutation(SetDefaultMutation);

  const handleSetDefault = (id: string) => {
    setDefaultCommit({
      variables: { id },
      onCompleted: () => {
        message.success('Default model updated');
      }
    });
  };

  const getConnectionName = (connectionId: string) => {
    return props.connections.find((c) => c.id === connectionId)?.name || 'Unknown';
  };

  return (
    <List
      dataSource={records as any[]}
      renderItem={(item) => (
        <List.Item
          key={item.id}
          actions={[
            <Button onClick={() => handleSetDefault(item.id)} disabled={isInFlight}>
              Set Default
            </Button>,
            <Button onClick={() => props.onEdit?.(item.id)}>Edit</Button>,
            <Button onClick={() => props.onDelete?.(item.id)} danger>Delete</Button>,
          ]}
        >
          <LLMModelView
            record={item}  // Pass fragment key to child
            connectionName={getConnectionName(item.connectionId)}
          />
        </List.Item>
      )}
    />
  );
}
```

**Nested Fragment Pattern:**
- Parent fragment includes `...ChildComponent_fieldName`
- Pass fragment key to child component
- Child resolves with `useFragment`
- Mutations can live in list components for action buttons
- Non-GraphQL props (callbacks, lookups) passed separately

---

### View-Only Fragment Component

```typescript
// ✅ GOOD - LLMModelView.tsx pattern (pure view)
const fragmentSpec = graphql`
  fragment LLMModelView_record on LLMModel {
    id
    name
    modelIdentifier
    temperature
    contextLength
    capabilities
  }
`;

interface ILLMModelViewProps {
  record: LLMModelView_record$key;
  connectionName: string;  // Non-GraphQL prop
}

function LLMModelView(props: ILLMModelViewProps) {
  const record = useFragment(fragmentSpec, props.record);

  return (
    <div className="p-4 space-y-4">
      <h4>{record.name || record.modelIdentifier}</h4>
      <div className="flex space-x-2">
        <span>{props.connectionName}</span>
        <span>Temp: {record.temperature}</span>
        <span>Context: {record.contextLength}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {record.capabilities.map((cap: string) => (
          <Badge key={cap}>{cap.toLowerCase()}</Badge>
        ))}
      </div>
    </div>
  );
}

export default LLMModelView;
```

**View Component Requirements:**
- Fragment for GraphQL data
- Additional props for non-GraphQL data (callbacks, lookups)
- No mutations (view only)
- Small and focused (< 100 lines)
- Used by list or page components

---

## Pattern 3: MUTATION PATTERNS

### Inline Mutation (Simple)

```typescript
// ✅ GOOD - UserUpdatePage.tsx pattern
function UserUpdatePage() {
  const [commitUpdate, isInFlight] = useMutation<UserUpdatePageMutation>(
    graphql`
      mutation UserUpdatePageMutation($input: UpdateUserInput!) {
        updateUser(input: $input) {
          id
          name
          username
          sessionKey
        }
      }
    `
  );

  const onSubmit = (values: any) => {
    commitUpdate({
      variables: { input: values },
      onCompleted: (response, errors) => {
        if (errors && errors.length > 0) {
          console.error(errors);
          return;
        }
        navigate('/');
      },
      updater: (store) => {
        // Manual Relay store update
        const updatedUser = store.getRootField('updateUser');
        if (updatedUser) {
          store.getRoot()?.setLinkedRecord(updatedUser, 'currentUser');
        }
      },
    });
  };

  return <UserForm onSubmit={onSubmit} />;
}
```

**When to use inline mutations:**
- Simple pages with 1-2 mutations
- Mutation only used in this component
- Less than 50 lines total

---

### Standalone Mutation (Reusable)

```typescript
// ✅ GOOD - Page-level mutations for CRUD
const CreateUpdateMutation = graphql`
  mutation LLMModelPageCreateUpdateMutation($input: CreateUpdateLLMModelInput!) {
    createUpdateLLMModel(input: $input) {
      id
      name
      connectionId
    }
  }
`;

const DestroyMutation = graphql`
  mutation LLMModelPageDestroyMutation($id: String!) {
    destroyLLMModel(id: $id)
  }
`;

function LLMModelPage() {
  const [commitCreateUpdate] = useCompatMutation<LLMModelPageCreateUpdateMutation>(
    CreateUpdateMutation
  );

  const [commitDestroy] = useCompatMutation<LLMModelPageDestroyMutation>(
    DestroyMutation
  );

  // Use in handlers...
}
```

**When to use standalone mutations:**
- Multiple mutations in same file
- Clearer separation of concerns
- Easier to test
- Most CRUD pages

---

### Component-Level Mutation (Actions)

```typescript
// ✅ GOOD - Action button in list component
const SetDefaultMutation = graphql`
  mutation LLMModelListSetDefaultMutation($id: String!) {
    setDefaultLLMModel(id: $id) {
      id
      default
    }
  }
`;

function LLMModelList(props: ILLMModelListProps) {
  const records = useFragment(fragmentSpec, props.records);
  const [setDefaultCommit, isInFlight] = useMutation(SetDefaultMutation);

  const handleSetDefault = (id: string) => {
    setDefaultCommit({
      variables: { id },
      onCompleted: () => {
        message.success('Default set');
      }
    });
  };

  return (
    <List
      renderItem={(item) => (
        <List.Item
          actions={[
            <Button onClick={() => handleSetDefault(item.id)}>
              Set Default
            </Button>
          ]}
        >
          {/* ... */}
        </List.Item>
      )}
    />
  );
}
```

**When to use component mutations:**
- Action buttons in list items
- Quick toggle/update operations
- No form involved
- Component handles success/error

---

## Pattern 4: RELAY HOOKS REFERENCE

### Query Hooks

```typescript
// 1. Basic query (read-only pages)
import { useLazyLoadQuery } from 'react-relay';
const data = useLazyLoadQuery<MyPageQuery>(MyPageQuery, {});

// 2. Query with refresh (CRUD pages) - MOST COMMON
import { useNetworkLazyReloadQuery } from '@ui/hooks/relay';
const [data, refreshData, fetchKey] = useNetworkLazyReloadQuery<MyPageQuery>(
  MyPageQuery,
  {}
);

// 3. Polling query (real-time pages)
import { usePollQuery } from '@ui/hooks/usePollQuery';
const [data, forceFetch, isAutoRefreshing] = usePollQuery<MyPageQuery>(
  MyPageQuery,
  { id },
  {
    enabled: !!id,
    deriveRefreshInterval: (data) => {
      // Return interval in ms based on data state
      return data.hasActiveJob ? 100 : 1000;
    }
  }
);
```

### Mutation Hooks

```typescript
// 1. Standard mutation
import { useMutation } from 'react-relay';
const [commit, isInFlight] = useMutation<MyMutation>(MyMutation);

// 2. Mutation with auto-error handling
import { useCompatMutation } from '@ui/hooks/relay';
const [commit, isInFlight] = useCompatMutation<MyMutation>(MyMutation);
// Automatically shows error notifications
```

### Fragment Hook

```typescript
// Always use for components
import { useFragment } from 'react-relay';
const data = useFragment(fragmentSpec, props.fragmentKey);
```

---

## Pattern 5: TYPE SAFETY

### Generated Types

```typescript
// Query types
import type { MyPageQuery } from '@graphql/ui/__generated__/MyPageQuery.graphql';
const [data, refresh] = useNetworkLazyReloadQuery<MyPageQuery>(query, {});

// Fragment key types (for props)
import type { MyComponent_record$key } from '@graphql/ui/__generated__/MyComponent_record.graphql';
interface Props {
  record: MyComponent_record$key;  // Accept key
}

// Fragment data types (for resolved data)
import type { MyComponent_record$data } from '@graphql/ui/__generated__/MyComponent_record.graphql';
const data: MyComponent_record$data = useFragment(fragmentSpec, props.record);

// Array item types
import type { MyList_items$data } from '@graphql/ui/__generated__/MyList_items.graphql';
type ItemType = MyList_items$data[0];  // Extract single item type
```

### Type Patterns

```typescript
// ✅ GOOD - Props accept keys, internals resolve to data
interface IMyComponentProps {
  record: MyComponent_record$key;      // Key type for prop
  items: MyComponent_items$key;        // Key type for array prop
  onClick?: (id: string) => void;      // Non-GraphQL props
}

function MyComponent(props: IMyComponentProps) {
  const record = useFragment(recordFragment, props.record);  // Resolves to $data
  const items = useFragment(itemsFragment, props.items);     // Resolves to $data[]

  // record is typed as MyComponent_record$data
  // items is typed as MyComponent_items$data[]
}
```

---

## Pattern 6: COMMON ANTI-PATTERNS

### ❌ BAD: Destructuring in Function Signature

```typescript
// ❌ BAD - Destructuring props in function signature
interface IChatListItemProps {
  chat: ChatListItem_chat$key;
  onClick?: () => void;
  className?: string;
}

function ChatListItem({ chat, onClick, className }: IChatListItemProps) {
  // ❌ Don't destructure in signature!
  const chatData = useFragment(fragmentSpec, chat);
  return <Card onClick={onClick}>{chatData.title}</Card>;
}
```

```typescript
// ✅ GOOD - Accept props parameter, destructure inside
interface IChatListItemProps {
  chat: ChatListItem_chat$key;
  onClick?: () => void;
  className?: string;
}

function ChatListItem(props: IChatListItemProps) {
  // ✅ Destructure inside function body
  const { chat: chatKey, onClick, className } = props;

  const chat = useFragment(fragmentSpec, chatKey);
  return <Card onClick={onClick} className={className}>{chat.title}</Card>;
}

export default ChatListItem;
```

**Why this matters:**
- **Consistency**: All components follow the same pattern
- **Refactoring**: Easier to add/remove props without changing signature
- **Clarity**: Clear separation between external API (props) and internal logic
- **Self-contained**: Component owns its destructuring logic

---

### ❌ BAD: Wrong Interface Naming

```typescript
// ❌ BAD - Missing I prefix
interface ChatListItemProps {
  chat: ChatListItem_chat$key;
}

// ❌ BAD - Wrong suffix
interface ChatListItemInterface {
  chat: ChatListItem_chat$key;
}

// ❌ BAD - Inline type
function ChatListItem(props: { chat: ChatListItem_chat$key }) {
  // Don't use inline types!
}
```

```typescript
// ✅ GOOD - Always use IComponentProps
interface IChatListItemProps {
  chat: ChatListItem_chat$key;
}

function ChatListItem(props: IChatListItemProps) {
  const { chat } = props;
  // ...
}

export default ChatListItem;
```

---

### ❌ BAD: Too Many Props (> 5)

```typescript
// ❌ BAD - 7 props violates the rule
interface IUserFormProps {
  user: UserForm_user$key;
  onSave?: (data: any) => void;
  onCancel?: () => void;
  showAvatar?: boolean;
  showBio?: boolean;
  allowDelete?: boolean;
  customValidation?: (values: any) => any;
}

function UserForm(props: IUserFormProps) {
  // ❌ Too complex - doing too much!
}
```

```typescript
// ✅ GOOD - Config object reduces to 4 props
interface IUserFormConfig {
  showAvatar?: boolean;
  showBio?: boolean;
  allowDelete?: boolean;
}

interface IUserFormProps {
  user: UserForm_user$key;
  config?: IUserFormConfig;
  onSave?: (data: any) => void;
  onCancel?: () => void;
}

function UserForm(props: IUserFormProps) {
  const { user, config, onSave, onCancel } = props;
  // ✅ Simplified interface!
}
```

---

### ❌ BAD: Inline Export

```typescript
// ❌ BAD - Export at function declaration
export default function ChatListItem(props: IChatListItemProps) {
  // Don't export inline!
}

// ❌ BAD - Named export for default component
export function ChatListItem(props: IChatListItemProps) {
  // Should be default export at bottom!
}
```

```typescript
// ✅ GOOD - Export at bottom
function ChatListItem(props: IChatListItemProps) {
  const { chat } = props;
  // ...
}

export default React.memo(ChatListItem);
```

---

### ❌ BAD: Prop Drilling Instead of Fragments

```typescript
// ❌ BAD - Passing raw data, no fragments
const ChatListPageQuery = graphql`
  query ChatListPageQuery {
    myChats {
      id
      title
      status
      createdAt
    }
  }
`;

function ChatListPage() {
  const data = useLazyLoadQuery(query, {});
  return (
    <div>
      {data.myChats.map((chat) => (
        <ChatListItem
          id={chat.id}
          title={chat.title}
          status={chat.status}
          createdAt={chat.createdAt}
        />  // ❌ Too many props!
      ))}
    </div>
  );
}
```

```typescript
// ✅ GOOD - Fragment composition
const ChatListPageQuery = graphql`
  query ChatListPageQuery {
    myChats {
      id
      ...ChatListItem_chat  # Single fragment spread
    }
  }
`;

function ChatListPage() {
  const data = useLazyLoadQuery(query, {});
  return (
    <div>
      {data.myChats.map((chat) => (
        <ChatListItem chat={chat} />  // ✅ Single prop!
      ))}
    </div>
  );
}
```

---

### ❌ BAD: Queries in Components

```typescript
// ❌ BAD - Component defining query
function ChatListItem() {
  const data = useLazyLoadQuery(graphql`
    query ChatListItemQuery($id: String!) {
      chat(id: $id) { ... }
    }
  `, { id });

  return <div>{data.chat.title}</div>;
}
```

```typescript
// ✅ GOOD - Component uses fragment, page defines query
const fragmentSpec = graphql`
  fragment ChatListItem_chat on Chat {
    id
    title
  }
`;

function ChatListItem(props: { chat: ChatListItem_chat$key }) {
  const chat = useFragment(fragmentSpec, props.chat);
  return <div>{chat.title}</div>;
}
```

---

### ❌ BAD: Missing Plural Directive

```typescript
// ❌ BAD - Array fragment without @relay(plural: true)
const fragmentSpec = graphql`
  fragment MessageList_messages on Message {
    id
    content
  }
`;

// Type errors! Fragment expects single item, received array
const messages = useFragment(fragmentSpec, props.messages);
```

```typescript
// ✅ GOOD - Explicit plural directive
const fragmentSpec = graphql`
  fragment MessageList_messages on Message @relay(plural: true) {
    id
    content
  }
`;

const messages = useFragment(fragmentSpec, props.messages);  // Typed as array ✅
```

---

### ❌ BAD: Not Memoizing List Items

```typescript
// ❌ BAD - List items re-render on every parent update
function ChatListItem(props: IChatListItemProps) {
  const chat = useFragment(fragmentSpec, props.chat);
  return <Card>{chat.title}</Card>;
}

export default ChatListItem;  // ❌ Not memoized!
```

```typescript
// ✅ GOOD - Memoized list items
function ChatListItem(props: IChatListItemProps) {
  const chat = useFragment(fragmentSpec, props.chat);
  return <Card>{chat.title}</Card>;
}

export default React.memo(ChatListItem);  // ✅ Prevents unnecessary re-renders
```

---

### ❌ BAD: Forgetting to Refresh After Mutations

```typescript
// ❌ BAD - Mutation completes but UI doesn't update
function MyPage() {
  const [data] = useNetworkLazyReloadQuery(query, {});  // ❌ Not using refreshData!
  const [commitCreate] = useMutation(CreateMutation);

  const onCreate = (values: any) => {
    commitCreate({
      variables: { input: values },
      onCompleted: () => {
        message.success('Created!');
        // ❌ No refresh! UI shows stale data
      }
    });
  };
}
```

```typescript
// ✅ GOOD - Refresh after mutation
function MyPage() {
  const [data, refreshData] = useNetworkLazyReloadQuery(query, {});  // ✅ Get refresh
  const [commitCreate] = useMutation(CreateMutation);

  const onCreate = (values: any) => {
    commitCreate({
      variables: { input: values },
      onCompleted: () => {
        message.success('Created!');
        refreshData();  // ✅ Refresh query to show new item
      }
    });
  };
}
```

---

### ❌ BAD: Mixing $data and $key Types

```typescript
// ❌ BAD - Props accept data instead of key
import type { MyComponent_record$data } from '...';  // ❌ Wrong type!

interface IMyComponentProps {
  record: MyComponent_record$data;  // ❌ Should be $key
}

function MyComponent(props: IMyComponentProps) {
  const record = useFragment(fragmentSpec, props.record);  // ❌ Type error!
}
```

```typescript
// ✅ GOOD - Props accept key, resolve to data internally
import type { MyComponent_record$key } from '...';  // ✅ Key type!

interface IMyComponentProps {
  record: MyComponent_record$key;  // ✅ Accept key
}

function MyComponent(props: IMyComponentProps) {
  const record = useFragment(fragmentSpec, props.record);  // ✅ Resolves to $data
  // record is typed as MyComponent_record$data
}
```

---

## Decision Tree: Which Pattern?

```
Start: I need to build a UI component
│
├─ Does it fetch data directly?
│  ├─ YES → PAGE COMPONENT
│  │   ├─ Need real-time updates? → usePollQuery
│  │   ├─ Need refresh button? → useNetworkLazyReloadQuery
│  │   └─ Read-only? → useLazyLoadQuery
│  │
│  └─ NO → COMPONENT (uses fragment)
│      ├─ Receives array? → @relay(plural: true)
│      ├─ List item? → React.memo()
│      └─ View only? → Simple fragment
│
├─ Does it have mutations?
│  ├─ YES
│  │   ├─ Single mutation? → Inline mutation
│  │   ├─ CRUD page? → Standalone mutations
│  │   └─ Action button? → Component-level mutation
│  │
│  └─ NO → Pure view component
│
└─ File size > 200 lines?
    ├─ YES → Extract sub-components with fragments
    └─ NO → Keep as-is
```

---

## Checklist for New UI Components

### Page Component Checklist
- [ ] Query defined with `graphql` template literal
- [ ] Correct hook: `usePollQuery` / `useNetworkLazyReloadQuery` / `useLazyLoadQuery`
- [ ] Fragment spreads for all child components
- [ ] Mutations defined (inline or standalone)
- [ ] Call `refreshData()` after mutations
- [ ] Handle loading/error states
- [ ] State management for UI modes (list/create/edit)
- [ ] Callbacks passed to child components (onEdit, onDelete)

### Component Checklist
- [ ] Fragment defined with `graphql` template literal
- [ ] Interface named `IComponentProps` (with `I` prefix)
- [ ] Props parameter: `props: IComponentProps` (not destructured)
- [ ] Destructure inside function body: `const { field1, field2 } = props;`
- [ ] Maximum 5 props (use config objects or extract sub-components if more)
- [ ] Props accept `$key` type (not `$data`)
- [ ] Use `useFragment(fragmentSpec, keyProp)` to resolve
- [ ] Export with `export default ComponentName` at bottom
- [ ] Export with `React.memo()` if used in lists
- [ ] Helper functions outside component
- [ ] `useMemo` for computed values
- [ ] Nested fragment spreads for sub-components
- [ ] File size < 200 lines
- [ ] Self-contained and encapsulated

### Fragment Checklist
- [ ] Named: `ComponentName_fieldName` (e.g., `ChatListItem_chat`)
- [ ] Type: On correct GraphQL type (e.g., `on Chat`)
- [ ] Plural: Include `@relay(plural: true)` for arrays
- [ ] Nested: Include `...ChildComponent_fieldName` for sub-components
- [ ] Fields: Only include fields actually used by component

### Mutation Checklist
- [ ] Defined with `graphql` template literal
- [ ] Named: `PageNameMutationName` (e.g., `LLMModelPageCreateUpdateMutation`)
- [ ] Returns updated fields needed by UI
- [ ] `onCompleted` handler with success message
- [ ] `onError` handler or use `useCompatMutation`
- [ ] Call `refreshData()` to update list
- [ ] Disable submit button with `isInFlight`

---

## File Organization

```
ui/
├── Pages/
│   ├── Chat/
│   │   ├── ChatListPage.tsx          # Query + list rendering
│   │   ├── ChatNodePage.tsx          # Query + polling + detail view
│   │   ├── ChatListItem.tsx          # Fragment + list item view
│   │   └── MessageList.tsx           # Fragment (plural) + rendering
│   │
│   └── Settings/
│       └── LLMModels/
│           ├── LLMModelPage.tsx      # Query + CRUD orchestration
│           ├── LLMModelList.tsx      # Fragment (plural) + mutation
│           ├── LLMModelView.tsx      # Fragment + view
│           └── LLMModelForm.tsx      # Fragment + form
│
└── Components/
    ├── CodeBlock.tsx                 # No GraphQL (pure presentational)
    └── MarkdownViewer.tsx            # No GraphQL (pure presentational)
```

**Organization Rules:**
- **Pages/**: Route-level components with queries
- **Components/**: Reusable components (fragments or pure)
- Group related pages in subdirectories
- Keep forms/lists/views in same directory as page

---

## When to Use Each Hook

| Hook | Use Case | Returns | Example |
|------|----------|---------|---------|
| `useLazyLoadQuery` | Simple read-only pages | `data` | Documentation page |
| `useNetworkLazyReloadQuery` | CRUD pages needing refresh | `[data, refresh]` | LLMModelPage |
| `usePollQuery` | Real-time updates | `[data, refresh, isPolling]` | ChatNodePage |
| `useFragment` | ALL components | `data` | ChatListItem |
| `useMutation` | Standard mutations | `[commit, isInFlight]` | Any mutation |
| `useCompatMutation` | Mutations with auto-error UI | `[commit, isInFlight]` | CRUD pages |

---

## Summary

**Always remember:**
1. Pages define queries with fragment spreads
2. Components define fragments and accept `$key` props
3. Use `@relay(plural: true)` for arrays
4. Memoize list items with `React.memo()`
5. Call `refreshData()` after mutations
6. Keep components small (< 200 lines)
7. Extract sub-components when needed
8. Type safety: Props = `$key`, Resolved = `$data`

**The Golden Rule:**
> "Data flows down as fragment keys, resolves locally with useFragment"

Now go build UI components with confidence! 🚀
