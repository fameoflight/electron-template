# Tabs Component System

A flexible, composable tab system built with React and Framer Motion.

## Architecture

```
Tabs/
├── Tab.tsx          # Reusable UI component with variants
├── RouterTabs.tsx   # Router-based tabs (uses React Router)
├── StateTabs.tsx    # State-based tabs (internal state + slide animations)
├── variants.ts      # Visual style configurations
├── index.ts         # Main exports
└── README.md        # This file
```

## Components

### `Tab.tsx`
The core UI component that handles:
- Visual rendering with icons and badges
- Multiple visual variants
- Hover and tap animations
- Disabled states

### `RouterTabs.tsx`
For navigation between routes:
- Uses React Router's `<Link>` components
- Animated page transitions
- URL-based active state detection
- Support for nested routes

### `StateTabs.tsx`
For content switching within a single page:
- Internal state management
- Slide animations with Framer Motion
- Mobile dropdown support
- Custom content rendering

## Visual Variants

### `bordered`
Classic router tabs with bottom border accent.
- Perfect for navigation between pages
- Clean, traditional tab appearance

### `pills`
Rounded background with smooth color transitions.
- Great for content switching within pages
- Modern, pill-shaped appearance
- Uses Framer Motion for smooth animations

### `underline`
Simple underline accent with minimal styling.
- Subtle and professional
- Good for dashboards and interfaces

### `minimal`
Text-only styling with weight changes.
- Most subtle option
- Perfect for simple interfaces

## Usage Examples

### Router Tabs (Navigation)
```tsx
import { RouterTabs } from '@ui/Components/Tabs';

const tabs = [
  { key: 'dashboard', label: 'Dashboard', path: '/dashboard' },
  { key: 'users', label: 'Users', path: '/users', badge: 5 },
];

<RouterTabs tabs={tabs} />
```

### State Tabs (Content Switching)
```tsx
import { StateTabs } from '@ui/Components/Tabs';

const tabs = [
  {
    key: 'profile',
    label: 'Profile',
    render: () => <ProfileContent />
  },
  {
    key: 'settings',
    label: 'Settings',
    render: () => <SettingsContent />
  },
];

<StateTabs tabs={tabs} />
```

### Custom Tab with Specific Variant
```tsx
import { Tab } from '@ui/Components/Tabs';

<Tab
  key="custom"
  label="Custom Tab"
  icon={<Icon />}
  variant="pills"
  isActive={true}
  onClick={() => console.log('clicked')}
/>
```

## Features

- ✅ **4 Visual Variants**: bordered, pills, underline, minimal
- ✅ **Router & State Modes**: Navigation vs content switching
- ✅ **Motion Animations**: Smooth transitions and micro-interactions
- ✅ **Mobile Responsive**: Dropdown for mobile views
- ✅ **Icons & Badges**: Support for icons and notification badges
- ✅ **Accessibility**: Proper ARIA attributes and keyboard navigation
- ✅ **TypeScript**: Full type safety
- ✅ **Customizable**: Easy to extend with new variants and styles

## Migration from Old Components

- `Tabs.tsx` → `RouterTabs.tsx` with `variant="bordered"`
- `AdvanceTabs.tsx` → `StateTabs.tsx` with `variant="pills"`
- `TailwindTabs.tsx` → `Tab.tsx` with `variant="pills"`