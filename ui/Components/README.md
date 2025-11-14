# UI Components Library

> Reusable React components for building consistent, accessible interfaces in the Electron app.

## Quick Start

```tsx
import Select from '@ui/Components/Select';
import Tabs from '@ui/Components/Tabs';
import EmptyState from '@ui/Components/EmptyState';

// Ready to use!
<Select options={[...]} onChange={...} />
```

---

## Component Index

### 🎯 **Core Components**
High-level components for app structure and navigation.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[AppLayout](#applayout)** | Auth-aware layout wrapper | Root-level routing protection |
| **[Tabs](#tabs)** | Animated navigation tabs | Multi-section pages |
| **[TabLayout](#tablayout)** | Tab container with content area | Complex tabbed interfaces |
| **[ContentLayout](#contentlayout)** | Page content wrapper | Standard page structure |
| **[PageContainer](#pagecontainer)** | Full-page layout container | Top-level page wrapper |

### 📝 **Form Components**
Input controls and form utilities.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[Select](#select)** | Enhanced dropdown with search & help text | Choosing from options |
| **[DictionaryInput](#dictionaryinput)** | Key-value pair editor | Headers, metadata, config |
| **[SliderInput](#sliderinput)** | Numeric range selector | Settings, filters |
| **[ConfirmInputModal](#confirminputmodal)** | Confirmation dialog with input | Destructive actions |
| **[RadioCard](#radiocard)** | Visual radio button cards | Exclusive choices with descriptions |

### 🔍 **Search & Filter**
Components for data discovery.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[FilterSearch](#filtersearch)** | Search bar + multi-filter UI | Complex data tables |
| **[FilterDropdown](#filterdropdown)** | Single filter dropdown | Individual filter controls |
| **[SearchList](#searchlist)** | Searchable list with results | In-memory data filtering |
| **[SearchResultItem](#searchresultitem)** | Single search result card | Search result rendering |

### 🎨 **Display Components**
Visual presentation and feedback.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[EmptyState](#emptystate)** | Empty state with action | No data scenarios |
| **[JSONViewer](#jsonviewer)** | Formatted JSON display | Debugging, API responses |
| **[DateView](#dateview)** | Formatted date display | Timestamps |
| **[FileThumbnail](#filethumbnail)** | File type icon/preview | File lists |
| **[GridItem](#griditem)** | Card-style grid item | Dashboard cards |
| **[Errors](#errors)** | Error message display | Form validation |

### 🎭 **UI Enhancements**
Animation and interaction helpers.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[Motion](#motion)** | Animation utilities | Transitions |
| **[TailwindTabs](#tailwindtabs)** | Styled tab navigation | Alternative tab style |
| **[TailwindList](#tailwindlist)** | Styled list component | Data lists |
| **[TailwindSimpleSteps](#tailwindsimplesteps)** | Step indicator | Multi-step workflows |
| **[AdvanceTabs](#advancetabs)** | Advanced tab features | Complex tab requirements |

### 📄 **Utility Components**
Special-purpose components.

| Component | Purpose | When to Use |
|-----------|---------|-------------|
| **[NotFoundPage](#notfoundpage)** | 404 error page | Route not found |
| **[ErrorPage](#errorpage)** | Error boundary fallback | Unhandled errors |
| **[DropdownAction](#dropdownaction)** | Action menu dropdown | Contextual actions |
| **[LinkButton](#linkbutton)** | Button styled as link | Navigation actions |

---

## Component Details

### AppLayout

**Purpose:** Root layout component with authentication routing logic.

**Features:**
- ✅ Automatic auth redirects
- ✅ Loading states
- ✅ Protected route wrapper
- ✅ Hotkey integration

```tsx
import AppLayout from '@ui/Components/AppLayout';

// In your router setup:
<Route element={<AppLayout />}>
  <Route path="/" element={<Dashboard />} />
  <Route path="/settings" element={<Settings />} />
</Route>

// Automatically handles:
// - Unauthenticated → /auth redirect
// - Authenticated on /auth → / redirect
// - Loading state skeleton
```

**Props:** None (uses React Router's `<Outlet />`)

---

### Select

**Purpose:** Enhanced Ant Design Select with inline help text and better TypeScript support.

**Features:**
- ✅ Generic type support `<T>`
- ✅ Built-in search
- ✅ Optional help text per option
- ✅ Keyboard navigation

```tsx
import Select, { SelectOption } from '@ui/Components/Select';

const options: SelectOption<string>[] = [
  {
    label: 'Production',
    value: 'prod',
    help: 'Live environment - use with caution'
  },
  {
    label: 'Staging',
    value: 'staging',
    help: 'Pre-production testing'
  },
  {
    label: 'Development',
    value: 'dev',
    disabled: true
  }
];

<Select<string>
  options={options}
  value={environment}
  onChange={(value) => setEnvironment(value)}
  placeholder="Select environment"
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `options` | `SelectOption<T>[]` | Array of options with label, value, help, disabled |
| `value` | `T` | Selected value |
| `onChange` | `(value: T) => void` | Change handler |
| `className` | `string` | Additional CSS classes |
| ...rest | `AntdSelectProps<T>` | All Ant Design Select props |

**Tips:**
- Help text only shows when dropdown is open
- Use generic `<T>` for type-safe values (string, number, enum, etc.)
- `showSearch` is enabled by default

---

### Tabs

**Purpose:** Animated navigation tabs with React Router integration.

**Features:**
- ✅ URL-based active state
- ✅ Smooth transitions (Framer Motion)
- ✅ Automatic active tab detection
- ✅ Child content animations

```tsx
import Tabs from '@ui/Components/Tabs';

const tabItems = [
  { key: 'overview', label: 'Overview', path: '/settings/overview' },
  { key: 'security', label: 'Security', path: '/settings/security' },
  { key: 'advanced', label: 'Advanced', path: '/settings/advanced' }
];

<Tabs items={tabItems}>
  <Outlet /> {/* React Router renders matched route */}
</Tabs>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `items` | `TabItem[]` | Array of `{ key, label, path }` |
| `className` | `string` | Additional CSS classes |
| `children` | `ReactNode` | Content to render below tabs (animates on route change) |

**TabItem Type:**
```tsx
interface TabItem {
  key: string;      // Unique identifier
  label: string;    // Display text
  path: string;     // React Router path
}
```

---

### EmptyState

**Purpose:** Consistent empty state UI with configurable types and actions.

**Features:**
- ✅ 5 pre-configured types
- ✅ Optional action button
- ✅ Custom descriptions
- ✅ Loading state support

```tsx
import EmptyState from '@ui/Components/EmptyState';

// No documents scenario
<EmptyState
  type="no-documents"
  onAction={() => navigate('/upload')}
  actionText="Upload Document"
/>

// Search with no results
<EmptyState
  type="no-results"
  onAction={clearFilters}
  actionText="Clear Filters"
  description="No items match your current filters"
/>

// Error state
<EmptyState
  type="error"
  onAction={retry}
  description="Failed to load data. Check your connection."
/>
```

**Props:**
| Prop | Type | Options | Description |
|------|------|---------|-------------|
| `type` | `string` | `'no-documents'` \| `'no-results'` \| `'no-folders'` \| `'error'` \| `'loading'` | Visual style |
| `onAction` | `() => void` | Optional | Button click handler |
| `actionText` | `string` | Optional | Override default button text |
| `description` | `string` | Optional | Override default description |
| `className` | `string` | Optional | Additional CSS classes |

**Type Defaults:**

| Type | Icon | Default Description | Default Button |
|------|------|---------------------|----------------|
| `no-documents` | 📄 | "No documents yet..." | "Add Your First Document" |
| `no-results` | 🔍 | "No documents match..." | "Clear Filters" |
| `no-folders` | 📁 | "No synced folders..." | "Add Your First Folder" |
| `error` | 🐛 | "Something went wrong..." | "Try Again" |
| `loading` | ⏳ | "Loading your documents..." | None |

---

### FilterSearch

**Purpose:** Complete search + filtering UI with tags and dropdowns.

**Features:**
- ✅ Search input with submit button
- ✅ Multiple filter dropdowns
- ✅ Active filter tags
- ✅ "All" option support
- ✅ Loading states

```tsx
import FilterSearch, { FilterConfig } from '@ui/Components/FilterSearch';

const filters: Record<string, FilterConfig> = {
  status: {
    label: 'Status',
    multiple: true,
    showAllOption: true,
    items: [
      { label: 'Active', value: 'active' },
      { label: 'Archived', value: 'archived' }
    ],
    initialValue: ['active'] // Pre-select active
  },
  priority: {
    label: 'Priority',
    multiple: false,
    items: [
      { label: 'High', value: 'high' },
      { label: 'Medium', value: 'medium' },
      { label: 'Low', value: 'low' }
    ]
  }
};

<FilterSearch
  filters={filters}
  onSubmit={(query, selectedFilters) => {
    console.log('Search:', query);
    console.log('Filters:', selectedFilters);
    // selectedFilters = { status: ['active'], priority: ['high'] }
  }}
  loading={isSearching}
  placeholder="Search items..."
/>
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `filters` | `Record<string, FilterConfig>` | Filter definitions |
| `onSubmit` | `(query: string, filters: Record<string, string[]>) => void` | Submit handler |
| `loading` | `boolean` | Show loading state |
| `placeholder` | `string` | Search input placeholder |

**FilterConfig Type:**
```tsx
interface FilterConfig {
  label: string;              // Display name
  multiple?: boolean;         // Allow multiple selections
  items: FilterOption[];      // Available options
  showAllOption?: boolean;    // Add "All" option (omits filter when selected)
  initialValue?: string[];    // Pre-selected values
}

interface FilterOption {
  label: string;
  value: string;
}
```

**Tips:**
- Filters with `showAllOption` + `"all"` selected are omitted from submit (means "no filter")
- Empty filters are automatically removed before submit
- Tags show all active filters with individual clear buttons

---

### DictionaryInput

**Purpose:** Key-value pair editor (headers, environment variables, metadata).

**Features:**
- ✅ Add/remove pairs dynamically
- ✅ Auto-filters empty pairs
- ✅ Trimmed output
- ✅ Controlled component

```tsx
import DictionaryInput from '@ui/Components/DictionaryInput';

const [headers, setHeaders] = useState<Record<string, string>>({
  'Authorization': 'Bearer token123',
  'Content-Type': 'application/json'
});

<DictionaryInput
  value={headers}
  onChange={setHeaders}
  placeholder={{
    key: 'Header name',
    value: 'Header value'
  }}
/>

// Output: { "Authorization": "Bearer token123", "Content-Type": "application/json" }
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `value` | `Record<string, string>` | Current key-value pairs |
| `onChange` | `(value: Record<string, string>) => void` | Change handler |
| `placeholder` | `{ key?: string, value?: string }` | Input placeholders |

**Behavior:**
- Empty keys/values are filtered out on change
- Values are trimmed automatically
- Each pair has a delete button
- "Add Header" button adds new empty pair

---

### JSONViewer

**Purpose:** Pretty-print JSON data with syntax highlighting.

**Features:**
- ✅ Auto-detects JSON strings
- ✅ Handles objects and primitives
- ✅ 4-space indentation
- ✅ Scrollable container

```tsx
import JSONViewer from '@ui/Components/JSONViewer';

const apiResponse = {
  user: { id: 1, name: 'Alice' },
  timestamp: '2024-01-15T10:30:00Z'
};

<JSONViewer
  data={apiResponse}
  className="bg-slate-900 text-green-400 p-4 rounded"
/>

// Also accepts JSON strings:
<JSONViewer data='{"foo": "bar"}' />
```

**Props:**
| Prop | Type | Description |
|------|------|-------------|
| `data` | `unknown` | Any JSON-serializable data or JSON string |
| `className` | `string` | CSS classes (default: `bg-slate-100 p-2`) |

---

### Motion

**Purpose:** Reusable animation patterns with Framer Motion.

**Features:**
- ✅ Shift animations (slide + fade)
- ✅ Customizable transitions
- ✅ Key-based re-animations

```tsx
import Motion from '@ui/Components/Motion';

// Animate on data change
<Motion.shift
  motionKey={user.id} // Re-animate when ID changes
  values={{ x: 20, y: 0 }} // Slide from right
  transition={{ duration: 0.5 }}
>
  <UserProfile user={user} />
</Motion.shift>

// Slide from bottom
<Motion.shift values={{ x: 0, y: 50 }}>
  <Notification message="Saved successfully!" />
</Motion.shift>
```

**Motion.shift Props:**
| Prop | Type | Description |
|------|------|-------------|
| `motionKey` | `string \| number` | Trigger re-animation on change |
| `values` | `{ x?: number \| string, y?: number \| string }` | Initial offset (exit goes opposite direction) |
| `transition` | `Transition` | Framer Motion transition config |
| `children` | `ReactNode` | Content to animate |

**Animation Flow:**
1. **Initial:** Offset by `values` + opacity 0
2. **Animate:** Move to 0,0 + opacity 1
3. **Exit:** Opposite offset + opacity 0

---

### DateView

**Purpose:** Consistent date formatting across the app.

```tsx
import DateView from '@ui/Components/DateView';

<DateView date={user.createdAt} format="PPpp" />
// Output: "Jan 15, 2024, 10:30:00 AM"
```

---

### ConfirmInputModal

**Purpose:** Modal dialog for confirming destructive actions with text input.

```tsx
import ConfirmInputModal from '@ui/Components/ConfirmInputModal';

<ConfirmInputModal
  visible={showModal}
  title="Delete Project"
  description="Type 'DELETE' to confirm"
  expectedInput="DELETE"
  onConfirm={() => deleteProject()}
  onCancel={() => setShowModal(false)}
  danger
/>
```

---

## Development Patterns

### 1. **Creating New Components**

Follow this structure:

```tsx
// ui/Components/MyComponent.tsx
import React from 'react';

interface MyComponentProps {
  required: string;
  optional?: number;
  className?: string;
  children?: React.ReactNode;
}

/**
 * MyComponent - Brief description
 *
 * @example
 * <MyComponent required="foo" optional={42} />
 */
function MyComponent(props: MyComponentProps) {
  const { required, optional = 0, className = '', children } = props;

  return (
    <div className={`my-component ${className}`}>
      {/* Implementation */}
    </div>
  );
}

export default MyComponent;
```

### 2. **Composition Over Props**

Prefer composing small components:

```tsx
// ❌ Avoid: Component with 15 props
<DataTable
  data={data}
  columns={columns}
  filters={filters}
  pagination={pagination}
  sorting={sorting}
  onRowClick={...}
  onSort={...}
  // etc...
/>

// ✅ Better: Compose smaller components
<DataTable data={data}>
  <DataTable.Filters>
    <FilterSearch filters={filters} onSubmit={...} />
  </DataTable.Filters>
  <DataTable.Columns>
    {columns.map(col => <DataTable.Column key={col.key} {...col} />)}
  </DataTable.Columns>
</DataTable>
```

### 3. **Type-Safe Props**

Use TypeScript generics for reusable components:

```tsx
// Generic component
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

function List<T>(props: ListProps<T>) {
  return (
    <div>
      {props.items.map(item => (
        <div key={props.keyExtractor(item)}>
          {props.renderItem(item)}
        </div>
      ))}
    </div>
  );
}

// Usage - fully typed!
<List<User>
  items={users}
  renderItem={user => <UserCard user={user} />}
  keyExtractor={user => user.id}
/>
```

### 4. **Controlled vs Uncontrolled**

Most form components should be **controlled**:

```tsx
// ✅ Controlled (React manages state)
const [value, setValue] = useState('');
<Input value={value} onChange={e => setValue(e.target.value)} />

// ❌ Uncontrolled (DOM manages state)
<Input defaultValue="initial" ref={inputRef} />
```

### 5. **Component Documentation**

Add JSDoc comments for IDE hints:

```tsx
/**
 * FilterSearch - Search bar with multi-filter UI
 *
 * @param filters - Record of filter configurations
 * @param onSubmit - Called when search is submitted with query and selected filters
 * @param loading - Shows loading state on search button
 * @param placeholder - Search input placeholder text
 *
 * @example
 * ```tsx
 * <FilterSearch
 *   filters={{ status: { label: 'Status', items: [...] } }}
 *   onSubmit={(query, filters) => console.log(query, filters)}
 * />
 * ```
 */
function FilterSearch(props: FilterSearchProps) { ... }
```

---

## Testing Components

### Unit Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import Select from '@ui/Components/Select';

describe('Select', () => {
  it('should render options', () => {
    const options = [
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' }
    ];

    render(<Select options={options} />);

    // Test implementation
  });
});
```

### Integration Testing

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Tabs from '@ui/Components/Tabs';

describe('Tabs', () => {
  it('should highlight active tab based on route', () => {
    const items = [
      { key: 'home', label: 'Home', path: '/' },
      { key: 'about', label: 'About', path: '/about' }
    ];

    render(
      <MemoryRouter initialEntries={['/about']}>
        <Tabs items={items} />
      </MemoryRouter>
    );

    // Verify active state
  });
});
```

---

## Styling Conventions

### 1. **Tailwind CSS First**

Use Tailwind utility classes for styling:

```tsx
// ✅ Preferred
<div className="flex items-center gap-4 p-4 bg-white rounded-lg shadow-sm">

// ❌ Avoid inline styles
<div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
```

### 2. **Conditional Classes**

Use `classNames` utility for dynamic classes:

```tsx
import { classNames } from '@ui/Components/utils';

<button
  className={classNames(
    'px-4 py-2 rounded transition-colors',
    isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700',
    disabled && 'opacity-50 cursor-not-allowed'
  )}
/>
```

### 3. **Consistent Spacing**

Follow Tailwind spacing scale:
- `gap-2` (8px) - Tight spacing (icon + text)
- `gap-4` (16px) - Default spacing (form fields)
- `gap-8` (32px) - Section spacing
- `gap-12` (48px) - Major sections

### 4. **Responsive Design**

Use Tailwind breakpoint prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* 1 column mobile, 2 tablet, 3 desktop */}
</div>
```

---

## Accessibility Guidelines

### 1. **Semantic HTML**

```tsx
// ✅ Good
<button onClick={...}>Submit</button>
<nav><a href="...">Home</a></nav>

// ❌ Bad
<div onClick={...}>Submit</div>
<div><span onClick={...}>Home</span></div>
```

### 2. **Keyboard Navigation**

Ensure all interactive elements are keyboard accessible:

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
>
  Custom Button
</div>
```

### 3. **ARIA Labels**

Add labels for screen readers:

```tsx
<button aria-label="Close modal" onClick={onClose}>
  <XIcon />
</button>

<input
  type="text"
  aria-label="Search documents"
  placeholder="Search..."
/>
```

---

## Performance Tips

### 1. **Memoize Expensive Computations**

```tsx
const filteredItems = useMemo(
  () => items.filter(item => item.status === 'active'),
  [items]
);
```

### 2. **Lazy Load Heavy Components**

```tsx
const JSONViewer = lazy(() => import('@ui/Components/JSONViewer'));

<Suspense fallback={<Skeleton />}>
  <JSONViewer data={largeData} />
</Suspense>
```

### 3. **Avoid Inline Functions**

```tsx
// ❌ Creates new function on every render
<button onClick={() => handleClick(id)}>Click</button>

// ✅ Stable reference
const handleButtonClick = useCallback(() => handleClick(id), [id]);
<button onClick={handleButtonClick}>Click</button>
```

---

## Common Pitfalls

### 1. **Missing Key Props**

```tsx
// ❌ React will warn
{items.map(item => <Item {...item} />)}

// ✅ Always add key
{items.map(item => <Item key={item.id} {...item} />)}
```

### 2. **State Updates on Unmounted Components**

```tsx
useEffect(() => {
  let mounted = true;

  fetchData().then(data => {
    if (mounted) {
      setData(data); // Only update if still mounted
    }
  });

  return () => { mounted = false; };
}, []);
```

### 3. **Prop Drilling**

```tsx
// ❌ Passing props through many levels
<Parent>
  <Child config={config}>
    <GrandChild config={config}>
      <GreatGrandChild config={config} />

// ✅ Use Context for deeply nested props
const ConfigContext = createContext();

<ConfigContext.Provider value={config}>
  <Parent>
    <Child>
      <GrandChild>
        <GreatGrandChild />
```

---

## File Organization

```
ui/Components/
├── README.md              # This file
├── utils.ts               # Shared utilities (classNames, etc.)
│
├── AppLayout.tsx          # Core layouts
├── ContentLayout.tsx
├── PageContainer.tsx
│
├── Select.tsx             # Form controls
├── DictionaryInput.tsx
├── SliderInput.tsx
│
├── FilterSearch/          # Complex multi-file components
│   ├── index.tsx          # Main export
│   ├── FilterDropdown.tsx # Sub-components
│   └── FilterTags.tsx
│
├── Tabs.tsx               # Navigation
├── TailwindTabs.tsx
├── TabLayout.tsx
│
├── EmptyState.tsx         # Display components
├── JSONViewer.tsx
├── DateView.tsx
│
└── Motion.tsx             # Animation utilities
```

---

## Contributing

When adding new components:

1. ✅ Follow existing naming conventions (PascalCase)
2. ✅ Add TypeScript interfaces for props
3. ✅ Include JSDoc comments with examples
4. ✅ Use Tailwind CSS for styling
5. ✅ Make components accessible (ARIA, keyboard nav)
6. ✅ Update this README with component details
7. ✅ Add to appropriate category in Component Index

---

## Resources

- **[Ant Design Components](https://ant.design/components/overview/)** - Base component library
- **[Tailwind CSS Docs](https://tailwindcss.com/docs)** - Utility classes
- **[Framer Motion API](https://www.framer.com/motion/)** - Animation library
- **[React Router](https://reactrouter.com/)** - Navigation
- **[Headless UI](https://headlessui.com/)** - Unstyled accessible components

---

## Questions?

For questions about components or patterns:
1. Check this README
2. Look at existing component implementations
3. See project's main `CLAUDE.md` for architecture overview
4. Check component source code for inline documentation

---

**Happy Building! 🎨**

_Last updated: 2025-01-15_
