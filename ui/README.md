# UI Layer Documentation

> A refined, minimalist React-based renderer for the Electron application, featuring an App Store architecture with independent, self-contained apps.

---

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Overview](#architecture-overview)
- [Design System](#design-system)
- [App Store Pattern](#app-store-pattern)
- [Project Structure](#project-structure)
- [Core Technologies](#core-technologies)
- [Getting Started](#getting-started)
- [Creating New Apps](#creating-new-apps)
- [Component Patterns](#component-patterns)
- [Data Fetching with Relay](#data-fetching-with-relay)
- [Routing & Navigation](#routing--navigation)
- [Authentication Flow](#authentication-flow)
- [Styling Guidelines](#styling-guidelines)
- [Hooks Reference](#hooks-reference)
- [Common Recipes](#common-recipes)
- [Best Practices](#best-practices)

---

## Design Philosophy

### Refined Minimalism

Every pixel has purpose. The UI embraces **refined minimalism** — not sparse or sterile, but intentionally designed with:

- **Generous whitespace** for breathing room
- **High contrast typography** (DM Sans, not generic system fonts)
- **Warm color palette** (stone backgrounds, deep indigo accents)
- **Soft shadows** that suggest depth without drama
- **Smooth animations** that feel natural, not showy
- **Thoughtful micro-interactions** that delight without distraction

**Goal:** Create an interface that feels professionally designed, not generic AI output.

### App Store Architecture

Think **macOS Launchpad** or **iOS home screen**, not traditional web app with global navigation:

```
Dashboard = App Store Hub
    ↓ Quick access to primary action (chat)
    ↓ Grid of apps to launch

Each App = Independent & Self-Contained
    ↓ Own navigation (tabs)
    ↓ Own actions (New Chat button)
    ↓ Consistent chrome (AppContainer)
    ↓ Back to Dashboard
```

**Benefits:**
- **Clear mental model**: Users think "I'm in the Chat app" not "I'm on the chat page"
- **No navigation conflicts**: Each app manages its own tabs/sections independently
- **Scalability**: Add new apps without touching global navigation
- **Focus**: When in an app, you're focused on that workflow

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│  Dashboard (App Store Hub)                     │
│  • Welcome hero with user greeting             │
│  • App grid (Chat, Documents, Settings)        │
│  • Quick chat input (primary action)           │
│  • Stats cards                                 │
└────────────────┬────────────────────────────────┘
                 │ Navigate to app
┌────────────────┴────────────────────────────────┐
│  AppContainer (Consistent Chrome)              │
│  • Back to Dashboard button                    │
│  • App icon + name                             │
│  • Tab navigation with animated indicator      │
│  • Action buttons (e.g., "New Chat")           │
│  • User avatar menu                            │
│  • Sticky header with backdrop blur            │
└────────────────┬────────────────────────────────┘
                 │ Outlet
┌────────────────┴────────────────────────────────┐
│  App-Specific Content                          │
│  • Chat: Message list, input, conversations    │
│  • Documents: Upload, manage, search           │
│  • Settings: Connections, models, config       │
└─────────────────────────────────────────────────┘
```

### Component Hierarchy

```
App/index.tsx (AuthRelayProvider, MemoryRouter)
    ↓
Routes.tsx (Route definitions)
    ↓
AppLayout.tsx (Auth guard, page transitions)
    ↓
├─ Dashboard (App Store Hub)
└─ App Containers (Chat, Documents, Settings)
       ↓
   AppContainer.tsx (Reusable chrome)
       ↓
   App-specific routes (via <Outlet />)
```

---

## Design System

### Color Palette

**Not generic grays — warm, refined colors:**

```css
/* Backgrounds - Warm Whites */
--color-background-primary: #FAFAF9   /* Stone-50 */
--color-surface: #FFFFFF               /* Pure white for cards */

/* Text - High Contrast */
--color-text-primary: #0A0A0A         /* Near black */
--color-text-secondary: #525252       /* Neutral-600 */
--color-text-tertiary: #A3A3A3        /* Neutral-400 */

/* Brand - Deep Indigo (Single Source of Truth) */
--color-primary-600: #4F46E5          /* Primary action */
--color-primary-700: #4338CA          /* Primary hover */

/* Accents - Amber for Success, Rose for Errors */
--color-success-600: #D97706          /* Amber, not green */
--color-error-600: #E11D48            /* Rose, not red */

/* Borders & Dividers */
--color-border-default: #E7E5E4       /* Stone-200 */
```

### Typography

```css
/* Fonts - Refined, Not Generic */
--font-sans: "DM Sans"                /* Not Inter/Roboto */
--font-mono: "JetBrains Mono"         /* Elegant monospace */

/* Type Scale - 6 Levels */
--font-size-xs: 0.75rem      /* 12px */
--font-size-sm: 0.875rem     /* 14px */
--font-size-base: 1rem       /* 16px */
--font-size-lg: 1.125rem     /* 18px */
--font-size-xl: 1.25rem      /* 20px */
--font-size-2xl: 1.5rem      /* 24px */
```

### Spacing

```css
/* 8px Grid System */
--spacing-2: 0.5rem    /* 8px */
--spacing-4: 1rem      /* 16px */
--spacing-6: 1.5rem    /* 24px */
--spacing-8: 2rem      /* 32px */
```

### Shadows

```css
/* Soft & Refined - Not Harsh */
--shadow-xs: 0 1px 2px 0 rgb(0 0 0 / 0.03)
--shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.04)
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.06)
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.08)
```

### Animations

```css
/* Durations */
--duration-fast: 150ms      /* Quick interactions */
--duration-normal: 300ms    /* Standard transitions */
--duration-slow: 500ms      /* Deliberate animations */

/* Easing Curves */
--ease-smooth: cubic-bezier(0.4, 0.0, 0.2, 1)
```

**All design tokens defined in `ui/App/index.css` using Tailwind v4 `@theme` directive.**

---

## App Store Pattern

### Dashboard (App Store Hub)

The landing page after login serves as a launcher:

```tsx
// ui/Pages/Dashboard/index.tsx
<div>
  {/* Hero Section */}
  <WelcomeHero userName={user.name} />

  {/* App Grid */}
  <div className="grid grid-cols-3 gap-4">
    <GridItem
      name="Chat"
      description="Start conversations with AI"
      icon={<ChatIcon />}
      onClick={() => navigate('/chat')}
    />
    <GridItem name="Documents" ... />
    <GridItem name="Settings" ... />
  </div>

  {/* Quick Chat Input (Primary Action) */}
  <UnifiedMessageInput onComplete={handleQuickChat} />
</div>
```

### App Container Pattern

Every app uses `AppContainer` for consistent chrome:

```tsx
// ui/Pages/Chat/ChatContainer.tsx
import AppContainer from '@ui/Components/AppContainer';

export default function ChatContainer() {
  return (
    <AppContainer
      appName="Chat"
      appIcon={<ChatIcon />}
      tabs={[
        { id: 'list', label: 'All Chats', href: '/chat' },
      ]}
      activeTabId={activeTabId}
      actions={
        <button onClick={createNewChat}>
          New Chat
        </button>
      }
    >
      <Outlet /> {/* App-specific routes */}
    </AppContainer>
  );
}
```

### Co-located Routes

Each app owns its routes in `Routes.tsx`:

```tsx
// ui/Pages/Chat/Routes.tsx
import ChatListPage from './ChatListPage';
import ChatNodePage from './ChatNodePage';

const ChatRoutes = [
  { index: true, element: <ChatListPage /> },
  { path: ':id', element: <ChatNodePage /> },
];

export default ChatRoutes;
```

```tsx
// ui/App/Routes.tsx (main router)
import ChatContainer from '@ui/Pages/Chat/ChatContainer';
import ChatRoutes from '@ui/Pages/Chat/Routes';

{
  path: 'chat',
  element: <ChatContainer />,
  children: ChatRoutes,  // Co-located!
}
```

---

## Project Structure

```
ui/
├── index.tsx                      # React entry point
├── App/
│   ├── index.tsx                 # App wrapper with providers
│   ├── Routes.tsx                # Main router (imports containers)
│   └── index.css                 # Design system (Tailwind v4 theme)
│
├── Pages/                        # Page-level components
│   ├── Dashboard/
│   │   └── index.tsx             # App Store hub
│   │
│   ├── Chat/                     # Chat App
│   │   ├── ChatContainer.tsx    # App wrapper with AppContainer
│   │   ├── Routes.tsx            # Co-located routes
│   │   ├── ChatListPage.tsx     # All chats view
│   │   ├── ChatNodePage.tsx     # Individual chat
│   │   ├── MessageList.tsx      # Message display
│   │   ├── MessageVersionView.tsx # Message bubbles
│   │   └── UnifiedMessageInput.tsx # Message input
│   │
│   ├── Documents/                # Documents App
│   │   ├── DocumentsContainer.tsx
│   │   ├── Routes.tsx
│   │   ├── DocumentsList.tsx    # Upload & manage
│   │   └── DocumentsSearch.tsx  # Vector search
│   │
│   ├── Settings/                 # Settings App
│   │   ├── SettingsContainer.tsx
│   │   ├── Routes.tsx
│   │   └── [setting pages...]
│   │
│   └── User/
│       ├── AuthPage.tsx          # Login/Register
│       └── UserUpdatePage.tsx    # Profile editing
│
├── Components/                   # Reusable UI components
│   ├── AppContainer.tsx          # App chrome wrapper (NEW)
│   ├── AppLayout.tsx             # Auth guard + transitions
│   ├── GridItem.tsx              # App launcher card
│   ├── Select.tsx                # Dropdown select
│   ├── EmptyState.tsx            # Empty state placeholder
│   └── ...
│
├── hooks/                        # Custom React hooks
│   ├── relay.tsx                 # Relay query/mutation wrappers
│   ├── usePollQuery.tsx          # Polling queries
│   ├── useUploadFiles.tsx        # File upload
│   └── ...
│
├── contexts/
│   └── AuthRelayProvider.tsx     # Auth + Relay environment
│
├── relay/
│   └── environment.ts            # Relay environment factory
│
└── __generated__/                # Relay-generated types (auto)
    └── *.graphql.ts
```

---

## Core Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18 | UI library with Hooks |
| **React Router** | 7 | Navigation (MemoryRouter) |
| **Relay** | 20 | GraphQL client with normalized cache |
| **TypeScript** | 5.9 | Type safety |
| **Tailwind CSS** | v4 | Utility-first styling + design tokens |
| **Ant Design** | 5 | UI component library (themed) |
| **Framer Motion** | 12 | Smooth animations |
| **Headless UI** | 2 | Unstyled accessible components |
| **Heroicons** | 2 | Icon library |

---

## Getting Started

### Running the UI

```bash
# Start dev server (Vite + Relay + Electron)
yarn dev

# Type check only (faster than full build)
yarn type-check

# Build UI for production
yarn build
```

### Design System Reference

All design tokens are in `ui/App/index.css`:

```tsx
// Use CSS variables directly
<div className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
  <h1>Title</h1>
</div>

// Or use Tailwind utilities (automatically mapped)
<div className="bg-white text-gray-900">
  <h1>Title</h1>
</div>

// Predefined component classes
<div className="surface-elevated">
  <button className="btn-primary">Click Me</button>
</div>
```

---

## Creating New Apps

### 1. Create App Container

```tsx
// ui/Pages/MyApp/MyAppContainer.tsx
import AppContainer from '@ui/Components/AppContainer';
import { Outlet, useLocation } from 'react-router-dom';

export default function MyAppContainer() {
  const location = useLocation();

  return (
    <AppContainer
      appName="My App"
      appIcon={<MyIcon />}
      tabs={[
        { id: 'list', label: 'List', href: '/myapp/list' },
        { id: 'settings', label: 'Settings', href: '/myapp/settings' },
      ]}
      activeTabId={determineActiveTab(location)}
      actions={<button>New Item</button>}
    >
      <Outlet />
    </AppContainer>
  );
}
```

### 2. Create Co-located Routes

```tsx
// ui/Pages/MyApp/Routes.tsx
import ListPage from './ListPage';
import DetailPage from './DetailPage';

const MyAppRoutes = [
  { index: true, element: <ListPage /> },
  { path: 'list', element: <ListPage /> },
  { path: ':id', element: <DetailPage /> },
];

export default MyAppRoutes;
```

### 3. Create App Index

```tsx
// ui/Pages/MyApp/index.tsx
export { default } from './MyAppContainer';
```

### 4. Register in Main Router

```tsx
// ui/App/Routes.tsx
import MyAppContainer from '@ui/Pages/MyApp';
import MyAppRoutes from '@ui/Pages/MyApp/Routes';

// Add to routes array:
{
  path: 'myapp',
  element: <MyAppContainer />,
  children: MyAppRoutes,
}
```

### 5. Add to Dashboard

```tsx
// ui/Pages/Dashboard/index.tsx
const items: GridItemType[] = [
  // ...existing apps
  {
    id: 'myapp',
    name: 'My App',
    description: 'Description of your app',
    icon: <MyIcon />,
  },
];
```

---

## Component Patterns

### Page Component Pattern

Pages are top-level route components:

```tsx
import { graphql } from 'relay-runtime';
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';
import { motion } from 'framer-motion';

export default function MyPage() {
  const data = useNetworkLazyLoadQuery(
    graphql`
      query MyPageQuery {
        items { id name }
      }
    `,
    {}
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {data.items.map(item => (
            <div key={item.id} className="surface p-6">
              {item.name}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
```

### Component with Fragment Pattern

```tsx
import { graphql, useFragment } from 'react-relay';

interface ItemCardProps {
  item: any; // Relay fragment ref
}

export default function ItemCard({ item }: ItemCardProps) {
  const data = useFragment(
    graphql`
      fragment ItemCard_item on Item {
        id
        name
        description
      }
    `,
    item
  );

  return (
    <div className="surface-elevated p-6">
      <h3 className="text-xl font-semibold">{data.name}</h3>
      <p className="text-[var(--color-text-secondary)]">{data.description}</p>
    </div>
  );
}
```

### Empty State Pattern

```tsx
import { motion } from 'framer-motion';
import { DocumentIcon } from '@heroicons/react/24/outline';

export default function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-16"
    >
      <div className="relative inline-block">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-[var(--color-primary-100)] rounded-full blur-2xl opacity-40" />

        {/* Icon */}
        <div className="relative flex items-center justify-center w-20 h-20 rounded-full bg-[var(--color-primary-50)] border border-[var(--color-primary-100)]">
          <DocumentIcon className="w-10 h-10 text-[var(--color-primary-600)]" />
        </div>
      </div>

      <h3 className="mt-4 text-lg font-semibold text-[var(--color-text-primary)]">
        No items yet
      </h3>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
        Get started by creating your first item
      </p>
    </motion.div>
  );
}
```

### Card with Animation Pattern

```tsx
import { motion } from 'framer-motion';

export default function ItemCard({ item, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="surface-elevated p-6 cursor-pointer"
      style={{ boxShadow: 'var(--shadow-sm)' }}
    >
      {/* Content */}
    </motion.div>
  );
}
```

---

## Data Fetching with Relay

### Query Pattern

```tsx
import { graphql } from 'relay-runtime';
import { useNetworkLazyLoadQuery } from '@ui/hooks/relay';

const data = useNetworkLazyLoadQuery(
  graphql`
    query MyQuery($first: Int!) {
      items(first: $first) {
        edges {
          node { id name }
        }
      }
    }
  `,
  { first: 10 }
);
```

### Query with Refetch Pattern

```tsx
import { useNetworkLazyReloadQuery } from '@ui/hooks/relay';

const [data, refetch] = useNetworkLazyReloadQuery(
  graphql`query MyQuery { items { id name } }`,
  {}
);

<button onClick={refetch}>Refresh</button>
```

### Mutation Pattern

```tsx
import { useCompatMutation } from '@ui/hooks/relay';

const [commit, isInFlight] = useCompatMutation(
  graphql`
    mutation CreateItemMutation($input: ItemInput!) {
      createItem(input: $input) {
        id name
      }
    }
  `
);

commit({
  variables: { input: { name: 'New Item' } },
  onCompleted: (response) => {
    console.log('Created:', response);
  },
});
```

---

## Routing & Navigation

### Programmatic Navigation

```tsx
import { useNavigate } from 'react-router-dom';

function MyComponent() {
  const navigate = useNavigate();

  return (
    <button onClick={() => navigate('/chat')}>
      Go to Chat
    </button>
  );
}
```

### Link Navigation

```tsx
import { Link } from 'react-router-dom';

<Link to="/documents" className="text-[var(--color-primary-600)]">
  View Documents
</Link>
```

---

## Authentication Flow

### Using Auth in Components

```tsx
import { useAuth } from '@ui/contexts/AuthRelayProvider';

function MyComponent() {
  const { user, loading, logout } = useAuth();

  if (loading) return <Skeleton />;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <p>Welcome, {user.name}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

All routes under `<AppLayout />` are automatically protected.

---

## Styling Guidelines

### Using Design System

```tsx
// CSS Variables
<div className="bg-[var(--color-surface)] text-[var(--color-text-primary)]">
  Content
</div>

// Component Classes
<div className="surface-elevated">
  <button className="btn-primary">Click Me</button>
  <span className="badge-success">Completed</span>
</div>

// Spacing (8px grid)
<div className="p-6 space-y-4">
  <div className="mb-8">Content</div>
</div>
```

### Animations

```tsx
import { motion } from 'framer-motion';

// Page entrance
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.3 }}
>
  Content
</motion.div>

// Staggered list
<div className="fade-in-stagger">
  {items.map(item => <div>{item}</div>)}
</div>
```

### Responsive Design

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Content */}
</div>

<div className="p-4 sm:p-6 lg:p-8">
  <div className="max-w-7xl mx-auto">
    {/* Content */}
  </div>
</div>
```

---

## Hooks Reference

### `useAuth`
Access authentication state:
```tsx
const { user, loading, login, logout, refreshCurrentUser } = useAuth();
```

### `useNetworkLazyLoadQuery`
Fetch data with Relay:
```tsx
const data = useNetworkLazyLoadQuery(graphql`...`, variables);
```

### `useNetworkLazyReloadQuery`
Fetch data with manual refetch:
```tsx
const [data, refetch] = useNetworkLazyReloadQuery(graphql`...`, variables);
```

### `useCompatMutation`
Execute mutations:
```tsx
const [commit, isInFlight] = useCompatMutation(graphql`...`);
```

### `usePollQuery`
Poll queries at intervals:
```tsx
const data = usePollQuery(graphql`...`, variables, { pollInterval: 5000 });
```

---

## Common Recipes

### Add Animation to Cards

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  whileHover={{ y: -4 }}
  className="surface-elevated"
>
  {/* Content */}
</motion.div>
```

### Create Status Badge

```tsx
const statusColors = {
  completed: 'badge-success',
  failed: 'badge-error',
  running: 'badge-primary',
};

<span className={statusColors[status]}>
  {status}
</span>
```

### Add Notification

```tsx
import { message } from 'antd';

message.success('Changes saved!');
message.error('Something went wrong');
```

---

## Best Practices

### Design

1. ✅ Use CSS variables for colors (`var(--color-primary-600)`)
2. ✅ Follow 8px spacing grid
3. ✅ Use `surface` and `surface-elevated` classes for cards
4. ✅ Add entrance animations to pages (`motion.div`)
5. ✅ Include empty states with icons and helpful text
6. ✅ Use generous whitespace (don't cram content)

### Architecture

7. ✅ Keep routes co-located with their app
8. ✅ Use AppContainer for all apps (consistent chrome)
9. ✅ Dashboard is for launching apps, not navigation
10. ✅ Each app is independent and self-contained

### Code

11. ✅ Use Relay fragments for component data requirements
12. ✅ Keep components small (< 200 lines)
13. ✅ Use TypeScript for all components and props
14. ✅ Extract custom hooks for reusable logic
15. ✅ Handle loading states with Skeleton
16. ✅ Show error messages with notifications

---

## Design Patterns Reference

### Warm Colors Over Cold

```tsx
// ❌ Avoid: Cold grays
bg-gray-50 bg-gray-100

// ✅ Use: Warm stone
bg-[var(--color-background-primary)]  /* #FAFAF9 */
bg-[var(--color-surface)]              /* #FFFFFF */
```

### Deep Indigo Over Generic Blue

```tsx
// ❌ Avoid: Generic blue
bg-blue-600

// ✅ Use: Deep indigo
bg-[var(--color-primary-600)]  /* #4F46E5 */
```

### Amber/Rose Over Green/Red

```tsx
// ❌ Avoid: Generic green/red
text-green-600 text-red-600

// ✅ Use: Amber/Rose
text-[var(--color-success-600)]  /* Amber #D97706 */
text-[var(--color-error-600)]    /* Rose #E11D48 */
```

---

## Troubleshooting

### Relay Compiler Errors

```bash
yarn graphql  # Regenerate schema and artifacts
```

### TypeScript Errors

```bash
yarn type-check  # Faster than yarn build
```

### Design System Not Applied

- Check `ui/App/index.css` is imported
- Verify Tailwind v4 `@theme` directive is present
- Restart dev server (`yarn dev`)

---

## Additional Resources

- [React Docs](https://react.dev/)
- [Relay Docs](https://relay.dev/)
- [React Router Docs](https://reactrouter.com/)
- [Tailwind CSS v4 Docs](https://tailwindcss.com/)
- [Framer Motion Docs](https://www.framer.com/motion/)

---

**Philosophy:** Every pixel has purpose. Refined minimalism means every element is intentionally designed, not generic or rushed. The App Store pattern ensures users have clear mental models and focused workflows.

**Happy Building! 🚀**
