# UI Relay Quick Reference

## Decision Tree: Query vs Fragment?

```
Does this component fetch its own data?
├─ YES → PAGE (use query)
│   └─ Which hook?
│       ├─ Real-time updates? → usePollQuery
│       ├─ CRUD operations? → useNetworkLazyReloadQuery
│       └─ Read-only? → useLazyLoadQuery
│
└─ NO → COMPONENT (use fragment)
    └─ Which pattern?
        ├─ Array? → @relay(plural: true)
        ├─ List item? → React.memo()
        └─ View only? → Simple fragment
```

## Quick Patterns

### Page with Query
```typescript
const MyPageQuery = graphql`
  query MyPageQuery {
    items {
      id
      ...ItemList_items  # Fragment spread
    }
  }
`;

function MyPage() {
  const [data, refreshData] = useNetworkLazyReloadQuery<MyPageQuery>(
    MyPageQuery, {}
  );

  return <ItemList items={data?.items || []} />;
}
```

### Component with Fragment
```typescript
const fragmentSpec = graphql`
  fragment ItemView_item on Item {
    id
    name
    status
  }
`;

interface IItemViewProps {
  item: ItemView_item$key;  // Key type!
}

function ItemView(props: IItemViewProps) {
  const { item: itemKey } = props;
  const item = useFragment(fragmentSpec, itemKey);
  return <div>{item.name}</div>;
}

export default ItemView;
```

### List Component
```typescript
const fragmentSpec = graphql`
  fragment ItemList_items on Item @relay(plural: true) {
    id
    ...ItemView_item  # Nested fragment
  }
`;

interface IItemListProps {
  items: ItemList_items$key;
}

function ItemList(props: IItemListProps) {
  const { items: itemsKey } = props;
  const items = useFragment(fragmentSpec, itemsKey);
  return (
    <div>
      {items.map((item) => (
        <ItemView key={item.id} item={item} />
      ))}
    </div>
  );
}

export default React.memo(ItemList);  // Memoize!
```

### Mutation
```typescript
const CreateMutation = graphql`
  mutation MyPageCreateMutation($input: CreateItemInput!) {
    createItem(input: $input) {
      id
      name
    }
  }
`;

function MyPage() {
  const [data, refreshData] = useNetworkLazyReloadQuery(...);
  const [commitCreate] = useCompatMutation<MyPageCreateMutation>(
    CreateMutation
  );

  const onCreate = (values: any) => {
    commitCreate({
      variables: { input: values },
      onCompleted: () => {
        message.success('Created!');
        refreshData();  // Don't forget!
      }
    });
  };
}
```

## Type Cheat Sheet

| Type | Purpose | Example |
|------|---------|---------|
| `$key` | Props | `item: ItemView_item$key` |
| `$data` | Resolved | `const item: ItemView_item$data` |
| `$data[0]` | Array item | `type Item = Items$data[0]` |
| Query | Page | `useNetworkLazyReloadQuery<MyPageQuery>` |
| Mutation | Commit | `useMutation<MyMutation>` |

## Common Mistakes

| ❌ Wrong | ✅ Right |
|---------|---------|
| Destructure in signature | `props: IProps` + destructure inside |
| `interface Props` | `interface IComponentProps` |
| Props: `$data` | Props: `$key` |
| > 5 props | Max 5 props (use config objects) |
| Inline `export default` | Export at bottom |
| No `@relay(plural: true)` | `@relay(plural: true)` for arrays |
| Mutation without refresh | Call `refreshData()` after |
| Not memoizing list items | `React.memo(Component)` |
| Query in component | Fragment in component |
| Fragment in page | Query in page |

## Hook Reference

```typescript
// Pages
useNetworkLazyReloadQuery<Q>  // Most common (CRUD)
useLazyLoadQuery<Q>            // Read-only
usePollQuery<Q>                // Real-time

// Components
useFragment                    // Always

// Mutations
useMutation<M>                 // Standard
useCompatMutation<M>           // Auto-error UI
```

## Naming Conventions

```typescript
// Queries: PageNameQuery
const ChatListPageQuery = graphql`query ChatListPageQuery { ... }`;

// Fragments: ComponentName_fieldName
const fragmentSpec = graphql`fragment ChatListItem_chat on Chat { ... }`;

// Mutations: PageName<Operation>Mutation
const CreateMutation = graphql`mutation ChatPageCreateMutation { ... }`;
```

## File Organization

```
Pages/
  MyFeature/
    MyFeaturePage.tsx     # Query + CRUD
    MyFeatureList.tsx     # Fragment (plural) + mutations
    MyFeatureView.tsx     # Fragment + view
    MyFeatureForm.tsx     # Fragment + form
```

## Remember

1. **Pages query, components fragment**
2. **Interface: `IComponentProps` with `I` prefix**
3. **Props: Accept `props: IProps`, destructure inside function**
4. **Export: `export default Component` at bottom**
5. **Max 5 props - use config objects if more needed**
6. **Props = $key, Resolved = $data**
7. **Arrays need @relay(plural: true)**
8. **List items need React.memo()**
9. **Always refreshData() after mutations**
10. **Fragment spreads connect parent to child**

---

For full documentation, see `ui-relay.md`
