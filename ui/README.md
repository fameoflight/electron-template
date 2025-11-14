# UI Layer Documentation

> The React-based renderer process for the Electron application, featuring Relay GraphQL, React Router, and Tailwind CSS.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Core Technologies](#core-technologies)
- [Getting Started](#getting-started)
- [Component Patterns](#component-patterns)
- [Data Fetching with Relay](#data-fetching-with-relay)
- [Routing & Navigation](#routing--navigation)
- [Authentication Flow](#authentication-flow)
- [Styling Guidelines](#styling-guidelines)
- [Hooks Reference](#hooks-reference)
- [IPC Communication](#ipc-communication)
- [Testing UI Components](#testing-ui-components)
- [Common Recipes](#common-recipes)
- [Performance Tips](#performance-tips)

---

## Architecture Overview

The UI layer follows a **component-based architecture** with:

```
┌────────────────────────────────────────────────┐
│  Entry Point (index.tsx)                      │
│  • Hides loading screen                       │
│  • Mounts React app                           │
└───────────────────┬────────────────────────────┘
                    │
┌───────────────────┴────────────────────────────┐
│  App Provider (App/index.tsx)                 │
│  • AuthRelayProvider (auth + Relay env)       │
│  • MemoryRouter (Electron-compatible routing) │
│  • AnimatePresence (Framer Motion)            │
└───────────────────┬────────────────────────────┘
                    │
┌───────────────────┴────────────────────────────┐
│  Routes (App/Routes.tsx)                      │
│  • AppLayout (auth guard)                     │
│  • Page-level routes                          │
└───────────────────┬────────────────────────────┘
                    │
┌───────────────────┴────────────────────────────┐
│  Pages (Pages/*)                              │
│  • Dashboard, Settings, User pages            │
│  • Relay queries/mutations                    │
└───────────────────┬────────────────────────────┘
                    │
┌───────────────────┴────────────────────────────┐
│  Components (Components/*)                    │
│  • Reusable UI primitives                     │
│  • Relay fragments                            │
└────────────────────────────────────────────────┘
```

### Key Design Principles

1. **Fragment Colocation**: Components request their own data via Relay fragments
2. **Auth-First**: All routes protected by default via `AppLayout`
3. **Type Safety**: TypeScript + Relay generated types
4. **Electron-Aware**: Uses `MemoryRouter` (no browser history) and IPC bridge

---

## Project Structure

```
ui/
├── index.tsx                    # React entry point
├── App/
│   ├── index.tsx               # App wrapper with providers
│   ├── Routes.tsx              # Route definitions
│   └── index.css               # Global styles (Tailwind)
│
├── Pages/                      # Page-level components
│   ├── Dashboard/
│   │   └── index.tsx           # Dashboard home
│   ├── User/
│   │   ├── AuthPage.tsx        # Login/Register
│   │   ├── LoginForm.tsx       # Login form
│   │   ├── UserForm.tsx        # Reusable user form
│   │   └── UserUpdatePage.tsx  # Update profile page
│   └── Settings/
│       ├── index.tsx           # Settings layout
│       ├── Profile.tsx         # Profile settings
│       └── Support.tsx         # Support page
│
├── Components/                 # Reusable UI components
│   ├── AppLayout.tsx           # Auth guard + layout wrapper
│   ├── PageContainer.tsx       # Standard page wrapper
│   ├── LinkButton.tsx          # Router-aware button
│   ├── Tabs.tsx                # Tab navigation
│   ├── Select.tsx              # Dropdown select
│   ├── EmptyState.tsx          # Empty state placeholder
│   ├── FilterSearch/           # Advanced search/filter
│   │   ├── index.tsx
│   │   ├── FilterDropdown.tsx
│   │   └── FilterTags.tsx
│   └── ...                     # More components
│
├── hooks/                      # Custom React hooks
│   ├── relay.tsx               # Relay query/mutation wrappers
│   ├── usePollQuery.tsx        # Polling queries
│   ├── useFetchKey.tsx         # Force refetch hook
│   ├── useHistory.ts           # Router history helper
│   └── useFormRecordState.tsx  # Form state management
│
├── contexts/                   # React contexts
│   └── AuthRelayProvider.tsx   # Auth + Relay environment
│
├── relay/                      # Relay configuration
│   ├── index.ts                # Public API
│   └── environment.ts          # Relay environment factory
│
├── HotKey/                     # Keyboard shortcuts
│   ├── HotKeyComponent.tsx     # Global hotkey handler
│   ├── HotKeyHelp.tsx          # Hotkey help modal
│   ├── hotkeys.ts              # Hotkey definitions
│   └── helpers.tsx             # Hotkey utilities
│
├── __generated__/              # Relay-generated types (auto)
│   └── *.graphql.ts            # Query/mutation types
│
├── types/                      # Type definitions
│   └── electron.d.ts           # Electron API types
│
└── vite-env.d.ts               # Vite environment types
```

---

## Core Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI library with Hooks |
| **React Router** | 7 | Navigation (MemoryRouter) |
| **Relay** | 20 | GraphQL client with normalized cache |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | v4 | Utility-first styling |
| **Ant Design** | 5 | UI component library |
| **Framer Motion** | 12 | Animations |
| **Headless UI** | 2 | Unstyled accessible components |
| **Heroicons** | 2 | Icon library |

---

## Getting Started

### Running the UI

```bash
# Start dev server (Vite + Relay + Electron)
yarn dev

# Build UI for production
yarn build

# Type check only (faster than build)
yarn tsc
```

### Creating a New Page

1. **Create the page component:**

```typescript
// ui/Pages/Post/PostList.tsx
import React from 'react';
import { graphql } from 'relay-runtime';
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';

export default function PostList() {
  const data = useNetworkLazyLoadQuery(
    graphql`
      query PostListQuery {
        posts(first: 20) {
          edges {
            node {
              id
              title
              createdAt
            }
          }
        }
      }
    `,
    {}
  );

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Posts</h1>
      <div className="space-y-2">
        {data.posts.edges.map(({ node }) => (
          <div key={node.id} className="p-4 bg-white rounded shadow">
            <h2>{node.title}</h2>
          </div>
        ))}
      </div>
    </div>
  );
}
```

2. **Add route to `App/Routes.tsx`:**

```typescript
import PostList from '@ui/Pages/Post/PostList';

// Inside routes array:
{
  path: 'posts',
  element: <PostList />,
}
```

3. **Regenerate Relay artifacts:**

```bash
yarn graphql  # or yarn relay
```

4. **Navigate to the page:**

```typescript
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/posts');
```

---

## Component Patterns

### 1. Page Component Pattern

**Pages** are top-level route components that:
- Fetch data via Relay queries
- Handle page-level state
- Compose smaller components

```typescript
// ui/Pages/Post/PostDetail.tsx
import React from 'react';
import { graphql } from 'relay-runtime';
import { useParams } from 'react-router-dom';
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';

export default function PostDetail() {
  const { id } = useParams();

  const data = useNetworkLazyLoadQuery(
    graphql`
      query PostDetailQuery($id: ID!) {
        post(id: $id) {
          id
          title
          content
          author {
            name
          }
        }
      }
    `,
    { id }
  );

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold">{data.post.title}</h1>
      <p className="text-gray-600">By {data.post.author.name}</p>
      <div className="mt-4 prose">{data.post.content}</div>
    </div>
  );
}
```

### 2. Component with Fragment Pattern

**Components** request data via Relay fragments:

```typescript
// ui/Components/PostCard.tsx
import React from 'react';
import { graphql, useFragment } from 'react-relay';

interface PostCardProps {
  post: any; // Relay fragment ref
}

export default function PostCard({ post }: PostCardProps) {
  const data = useFragment(
    graphql`
      fragment PostCard_post on Post {
        id
        title
        excerpt
        createdAt
      }
    `,
    post
  );

  return (
    <div className="p-4 bg-white rounded shadow">
      <h3 className="text-xl font-semibold">{data.title}</h3>
      <p className="text-gray-600">{data.excerpt}</p>
      <time className="text-sm text-gray-400">{data.createdAt}</time>
    </div>
  );
}
```

### 3. Layout Component Pattern

**Layouts** provide consistent page structure:

```typescript
// ui/Components/ContentLayout.tsx
import React from 'react';

interface ContentLayoutProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export default function ContentLayout({ title, actions, children }: ContentLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">{title}</h1>
          {actions && <div>{actions}</div>}
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
```

### 4. Form Component Pattern

**Forms** use controlled inputs + Relay mutations:

```typescript
// ui/Pages/Post/PostForm.tsx
import React, { useState } from 'react';
import { graphql } from 'relay-runtime';
import { useCompatMutation } from '@ui/hooks/relay';
import { Button, Input } from 'antd';

export default function PostForm() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [commit, isInFlight] = useCompatMutation(graphql`
    mutation PostFormMutation($input: PostInput!) {
      createPost(input: $input) {
        id
        title
      }
    }
  `);

  const handleSubmit = () => {
    commit({
      variables: { input: { title, content } },
      onCompleted: () => {
        setTitle('');
        setContent('');
      },
    });
  };

  return (
    <div className="space-y-4">
      <Input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <Input.TextArea
        placeholder="Content"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
      />
      <Button type="primary" onClick={handleSubmit} loading={isInFlight}>
        Create Post
      </Button>
    </div>
  );
}
```

---

## Data Fetching with Relay

### Query Pattern

```typescript
import { graphql } from 'relay-runtime';
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';

const data = useNetworkLazyLoadQuery(
  graphql`
    query MyQuery($first: Int!) {
      posts(first: $first) {
        edges {
          node {
            id
            title
          }
        }
      }
    }
  `,
  { first: 10 }
);
```

### Query with Refetch Pattern

```typescript
import { useNetworkLazyReloadQuery } from '@ui/hooks/relay';

const [data, refetch, fetchKey] = useNetworkLazyReloadQuery(
  graphql`
    query MyQuery {
      posts {
        edges {
          node { id title }
        }
      }
    }
  `,
  {}
);

// Call refetch() to reload data
<Button onClick={refetch}>Refresh</Button>
```

### Mutation Pattern

```typescript
import { useCompatMutation } from '@ui/hooks/relay';

const [commit, isInFlight] = useCompatMutation(
  graphql`
    mutation CreatePostMutation($input: PostInput!) {
      createPost(input: $input) {
        id
        title
      }
    }
  `
);

commit({
  variables: { input: { title: 'Hello' } },
  onCompleted: (response, errors) => {
    if (!errors) {
      console.log('Success:', response);
    }
  },
});
```

### Polling Pattern

```typescript
import { usePollQuery } from '@ui/hooks/usePollQuery';

const data = usePollQuery(
  graphql`
    query JobStatusQuery {
      jobs(first: 10) {
        edges {
          node {
            id
            status
          }
        }
      }
    }
  `,
  {},
  {
    pollInterval: 5000, // Poll every 5 seconds
  }
);
```

### Pagination Pattern

```typescript
const data = useNetworkLazyLoadQuery(
  graphql`
    query PostsQuery($first: Int!, $after: String) {
      posts(first: $first, after: $after) {
        edges {
          node {
            id
            title
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `,
  { first: 20 }
);

// Load more
const loadMore = () => {
  if (data.posts.pageInfo.hasNextPage) {
    // Refetch with new cursor
    refetch({ after: data.posts.pageInfo.endCursor });
  }
};
```

---

## Routing & Navigation

### Route Configuration

Routes are defined in `App/Routes.tsx`:

```typescript
import { useRoutes } from 'react-router-dom';

function Routes() {
  const routes = useRoutes([
    {
      path: '/',
      element: <AppLayout />, // Auth guard
      children: [
        { index: true, element: <Dashboard /> },
        { path: 'posts', element: <PostList /> },
        { path: 'posts/:id', element: <PostDetail /> },
        { path: 'settings', element: <Settings /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ]);

  return routes;
}
```

### Programmatic Navigation

```typescript
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  const goToPosts = () => {
    navigate('/posts');
  };

  const goToPostDetail = (id: string) => {
    navigate(`/posts/${id}`);
  };

  const goBack = () => {
    navigate(-1);
  };
}
```

### Link Navigation

```typescript
import { Link } from 'react-router-dom';

<Link to="/posts" className="text-blue-600 hover:underline">
  View Posts
</Link>
```

### LinkButton Component

Use `LinkButton` for button-styled links:

```typescript
import LinkButton from '@ui/Components/LinkButton';

<LinkButton to="/posts" type="primary">
  View Posts
</LinkButton>
```

---

## Authentication Flow

### How Auth Works

1. **Login/Register** → Sets `sessionKey` in localStorage
2. **AuthRelayProvider** → Reads `sessionKey` and creates Relay environment
3. **AppLayout** → Guards routes, redirects to `/auth` if not authenticated
4. **Logout** → Clears `sessionKey` and redirects to `/auth`

### Using Auth in Components

```typescript
import { useAuth } from '@ui/contexts/AuthRelayProvider';

function MyComponent() {
  const { user, loading, login, logout, refreshCurrentUser } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Not logged in</div>;
  }

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

All routes under `<AppLayout />` are automatically protected:

```typescript
// App/Routes.tsx
{
  path: '/',
  element: <AppLayout />, // ← Auth guard
  children: [
    { index: true, element: <Dashboard /> }, // Protected
    { path: 'posts', element: <PostList /> }, // Protected
  ],
}
```

### Login Flow Example

```typescript
// Pages/User/AuthPage.tsx
import { useAuth } from '@ui/contexts/AuthRelayProvider';
import { useCompatMutation } from '@ui/hooks/relay';

function LoginForm() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const [commitLogin, isInFlight] = useCompatMutation(graphql`
    mutation AuthPageLoginMutation($input: LoginInput!) {
      login(input: $input) {
        id
        name
        username
        sessionKey
      }
    }
  `);

  const handleLogin = () => {
    commitLogin({
      variables: { input: { username, password } },
      onCompleted: (response) => {
        login(response.login); // Sets user in context
        navigate('/'); // Redirects to dashboard
      },
    });
  };

  return (
    <form>
      <input value={username} onChange={(e) => setUsername(e.target.value)} />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <button onClick={handleLogin} disabled={isInFlight}>Login</button>
    </form>
  );
}
```

---

## Styling Guidelines

### Tailwind CSS Usage

Use Tailwind utility classes for styling:

```typescript
<div className="p-6 bg-white rounded-lg shadow-md">
  <h1 className="text-2xl font-bold text-gray-900">Title</h1>
  <p className="mt-2 text-gray-600">Description</p>
</div>
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>
```

### Dark Mode (Future)

Tailwind v4 supports dark mode:

```typescript
<div className="bg-white dark:bg-gray-900">
  <p className="text-gray-900 dark:text-white">Text</p>
</div>
```

### Ant Design Components

Use Ant Design for complex UI components:

```typescript
import { Button, Input, Modal, notification, Skeleton } from 'antd';

<Button type="primary" size="large">Click Me</Button>
<Input placeholder="Enter text" />
<Modal title="Confirm" open={visible} onOk={handleOk}>
  Are you sure?
</Modal>
```

### Framer Motion Animations

```typescript
import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>
```

---

## Hooks Reference

### `useNetworkLazyLoadQuery`

Fetch data with Relay (always hits network):

```typescript
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';

const data = useNetworkLazyLoadQuery(graphql`...`, variables, {
  fetchPolicy: 'store-and-network', // Default
});
```

### `useNetworkLazyReloadQuery`

Fetch data with manual refetch:

```typescript
import { useNetworkLazyReloadQuery } from '@ui/hooks/relay';

const [data, refetch, fetchKey] = useNetworkLazyReloadQuery(graphql`...`, variables);

// Call refetch() to reload
<Button onClick={refetch}>Refresh</Button>
```

### `useCompatMutation`

Execute GraphQL mutations with error handling:

```typescript
import { useCompatMutation } from '@ui/hooks/relay';

const [commit, isInFlight] = useCompatMutation(graphql`...`);

commit({
  variables: { input: {} },
  onCompleted: (response, errors) => {
    // Errors are automatically shown via notification.error
  },
});
```

### `usePollQuery`

Poll GraphQL queries at intervals:

```typescript
import { usePollQuery } from '@ui/hooks/usePollQuery';

const data = usePollQuery(graphql`...`, variables, {
  pollInterval: 5000, // 5 seconds
});
```

### `useAuth`

Access authentication state:

```typescript
import { useAuth } from '@ui/contexts/AuthRelayProvider';

const { user, loading, login, logout, refreshCurrentUser } = useAuth();
```

### `useFetchKey`

Force refetch queries:

```typescript
import useFetchKey from '@ui/hooks/useFetchKey';

const [fetchKey, updateFetchKey] = useFetchKey();

// Use fetchKey in query options
const data = useNetworkLazyLoadQuery(graphql`...`, variables, { fetchKey });

// Call updateFetchKey() to refetch
<Button onClick={updateFetchKey}>Refresh</Button>
```

### `useFormRecordState`

Manage form state for records:

```typescript
import { useFormRecordState } from '@ui/hooks/useFormRecordState';

const [formState, setFormState] = useFormRecordState(initialRecord);

<Input
  value={formState.name}
  onChange={(e) => setFormState({ name: e.target.value })}
/>
```

---

## IPC Communication

### Using IPC from Renderer

The `window.electron` API provides type-safe IPC:

```typescript
// Type definitions in ui/electron.d.ts
interface ElectronAPI {
  'graphql-query': (args: { query: string; variables: any; context?: any }) => Promise<any>;
  'file-dialog:open': (options: any) => Promise<string[]>;
  'file-dialog:save': (options: any) => Promise<string>;
}

declare global {
  interface Window {
    electron: ElectronAPI;
  }
}
```

### Example: Opening File Dialog

```typescript
const openFile = async () => {
  const files = await window.electron['file-dialog:open']({
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg'] }],
  });

  console.log('Selected files:', files);
};
```

### Example: GraphQL Query via IPC

```typescript
const result = await window.electron['graphql-query']({
  query: `
    query GetUser($id: ID!) {
      user(id: $id) { id name }
    }
  `,
  variables: { id: '123' },
  context: { sessionKey: 'abc' },
});
```

---

## Testing UI Components

### Test Setup

```typescript
// __tests__/ui/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '@ui/Components/MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Hello" />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Testing with Relay

```typescript
import { createMockEnvironment, MockPayloadGenerator } from 'relay-test-utils';
import { RelayEnvironmentProvider } from 'react-relay';

const environment = createMockEnvironment();

render(
  <RelayEnvironmentProvider environment={environment}>
    <MyComponent />
  </RelayEnvironmentProvider>
);

// Resolve query
environment.mock.resolveMostRecentOperation((operation) =>
  MockPayloadGenerator.generate(operation, {
    User: () => ({ id: '1', name: 'Alice' }),
  })
);
```

### Testing User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should submit form', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  await user.type(screen.getByPlaceholderText('Username'), 'alice');
  await user.type(screen.getByPlaceholderText('Password'), 'secret');
  await user.click(screen.getByRole('button', { name: 'Login' }));

  expect(mockLogin).toHaveBeenCalled();
});
```

---

## Common Recipes

### 1. Add a New Page with Data

```bash
# 1. Create GraphQL resolver (main/graphql/resolvers/)
# 2. Generate schema
yarn graphql

# 3. Create page component
mkdir ui/Pages/Post
touch ui/Pages/Post/PostList.tsx

# 4. Add query to component
# 5. Add route to Routes.tsx
# 6. Test with yarn dev
```

### 2. Create a Reusable Component

```typescript
// ui/Components/Card.tsx
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export default function Card({ title, children }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-bold mb-4">{title}</h3>
      {children}
    </div>
  );
}
```

### 3. Add a Modal

```typescript
import { Modal } from 'antd';
import { useState } from 'react';

function MyComponent() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible(true)}>Open Modal</Button>
      <Modal
        title="Confirm"
        open={visible}
        onOk={() => setVisible(false)}
        onCancel={() => setVisible(false)}
      >
        Are you sure?
      </Modal>
    </>
  );
}
```

### 4. Add a Notification

```typescript
import { notification } from 'antd';

notification.success({
  message: 'Success',
  description: 'Your changes have been saved.',
});

notification.error({
  message: 'Error',
  description: 'Something went wrong.',
});
```

### 5. Add Keyboard Shortcuts

```typescript
// ui/HotKey/hotkeys.ts
export const hotkeys = [
  {
    key: 'cmd+k',
    description: 'Open command palette',
    handler: () => {
      // Handle shortcut
    },
  },
];
```

---

## Performance Tips

### 1. Use Relay Fragments

Fragment colocation improves performance and maintainability:

```typescript
// Instead of fetching all fields in parent:
const data = useNetworkLazyLoadQuery(graphql`
  query MyQuery {
    user {
      id
      name
      email
      avatar
      bio
      # ... 20 more fields
    }
  }
`);

// Use fragments:
const data = useNetworkLazyLoadQuery(graphql`
  query MyQuery {
    user {
      ...UserCard_user
    }
  }
`);

// Component requests only what it needs:
function UserCard({ user }) {
  const data = useFragment(graphql`
    fragment UserCard_user on User {
      id
      name
      avatar
    }
  `, user);
}
```

### 2. Lazy Load Routes

```typescript
import { lazy, Suspense } from 'react';

const PostList = lazy(() => import('@ui/Pages/Post/PostList'));

<Suspense fallback={<div>Loading...</div>}>
  <PostList />
</Suspense>
```

### 3. Optimize Re-renders

```typescript
import { memo } from 'react';

const ExpensiveComponent = memo(({ data }) => {
  // Only re-renders if data changes
  return <div>{data}</div>;
});
```

### 4. Use Relay Cache

```typescript
// Store-and-network: Render cached data immediately, then fetch
const data = useNetworkLazyLoadQuery(graphql`...`, variables, {
  fetchPolicy: 'store-and-network',
});

// Store-only: Only use cached data
const data = useNetworkLazyLoadQuery(graphql`...`, variables, {
  fetchPolicy: 'store-only',
});
```

### 5. Debounce Search Inputs

```typescript
import { useMemo } from 'react';
import { debounce } from 'lodash';

const debouncedSearch = useMemo(
  () => debounce((value: string) => {
    // Perform search
  }, 300),
  []
);

<Input onChange={(e) => debouncedSearch(e.target.value)} />
```

---

## Troubleshooting

### Relay Compiler Errors

If you see `Unknown fragment` errors:

```bash
# Regenerate schema and Relay artifacts
yarn graphql
```

### TypeScript Errors

If you see type errors:

```bash
# Type check
yarn tsc
```

### HMR Not Working

If hot module replacement stops working:

```bash
# Restart dev server
yarn dev
```

### IPC Errors

If `window.electron` is undefined:

- Check that `preload.ts` is loaded correctly
- Verify `contextIsolation: true` in `BrowserWindow`
- Check that handlers are registered in `main/handlers/registry.ts`

---

## Best Practices

1. ✅ **Use Relay fragments** for component data requirements
2. ✅ **Colocate queries** with the component that uses them
3. ✅ **Use TypeScript** for all components and props
4. ✅ **Follow naming conventions** (PascalCase for components)
5. ✅ **Use Tailwind** for styling (avoid inline styles)
6. ✅ **Keep components small** (< 200 lines)
7. ✅ **Extract custom hooks** for reusable logic
8. ✅ **Use `useAuth`** instead of direct localStorage access
9. ✅ **Handle loading states** with Skeleton or Spin
10. ✅ **Show error messages** with notification.error

---

## Additional Resources

- [React Docs](https://react.dev/)
- [Relay Docs](https://relay.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Ant Design Docs](https://ant.design/)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**Happy Building! 🚀**
