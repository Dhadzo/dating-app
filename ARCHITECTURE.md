# ZimConnect - Refactored Architecture

## Overview

This document describes the refactored architecture using **Zustand** for state management and **React Query** for data fetching, replacing the previous direct Supabase calls with a scalable, maintainable structure.

## Architecture Components

### 1. State Management (Zustand)

#### `useAuthStore`

- **Purpose**: Authentication state management
- **Features**: User session, loading states, persistence
- **Storage**: Local storage persistence for user sessions

#### `useUIStore`

- **Purpose**: UI state management (modals, tabs, selections)
- **Features**: Modal states, active tabs, selected items, search/filter state
- **Benefits**: Centralized UI state, easy modal management

#### `useProfileStore`

- **Purpose**: Profile data management
- **Features**: Current user profile, discovered profiles, caching
- **Benefits**: Persistent profile data, optimistic updates

### 2. Data Fetching (React Query)

#### `useProfiles.ts`

- **`useCurrentProfile`**: Fetch current user profile
- **`useDiscoverProfiles`**: Fetch discoverable profiles with filters
- **`useLikeProfile`**: Like a profile with optimistic updates
- **`usePassProfile`**: Pass a profile

#### `useMatches.ts`

- **`useMatches`**: Fetch user's matches
- **`useMatchMessages`**: Fetch messages for a specific match
- **`useSendMessage`**: Send a message with optimistic updates
- **`useMarkMessagesAsRead`**: Mark messages as read

#### `useUserSettings.ts`

- **`useUserSettings`**: Fetch user preferences
- **`useUpdateUserSettings`**: Update user settings
- **`useCreateUserSettings`**: Create default settings

### 3. Real-time Features

#### `useRealtime.ts`

- **`useProfilesRealtime`**: Real-time profile updates
- **`useMatchesRealtime`**: Real-time match updates
- **`useMessagesRealtime`**: Real-time message updates
- **`useLikesRealtime`**: Real-time like updates
- **`useRealtimeSubscriptions`**: Combined real-time hook

## Key Benefits

### 1. **Performance**

- **Automatic Caching**: React Query caches data for 5-10 minutes
- **Background Updates**: Data refreshes automatically
- **Optimistic Updates**: Instant UI feedback for actions

### 2. **Developer Experience**

- **Type Safety**: Full TypeScript support
- **DevTools**: React Query DevTools for debugging
- **Error Handling**: Built-in error boundaries and retry logic

### 3. **Scalability**

- **Centralized State**: All state in Zustand stores
- **Reusable Hooks**: Data fetching logic separated from components
- **Real-time Sync**: WebSocket subscriptions for live updates

### 4. **Maintainability**

- **Separation of Concerns**: UI state vs server state
- **Predictable Updates**: Clear data flow patterns
- **Easy Testing**: Hooks can be tested independently

## Data Flow

```
User Action → Zustand Store → React Query Hook → Supabase → Cache Update → UI Update
     ↓
Real-time Subscription → Cache Invalidation → Automatic Re-render
```

## Usage Examples

### Using Zustand Store

```typescript
import { useUIStore } from '../stores/useUIStore';

const { showModal, setShowModal } = useUIStore();
```

### Using React Query Hook

```typescript
import { useCurrentProfile } from '../hooks/useProfiles';

const { data: profile, isLoading, error } = useCurrentProfile(userId);
```

### Using Real-time Features

```typescript
import { useRealtimeSubscriptions } from '../hooks/useRealtime';

// Automatically subscribes to all real-time updates
useRealtimeSubscriptions(userId);
```

## Migration Guide

### From Old Architecture

1. **Replace useState**: Use Zustand stores for UI state
2. **Replace useEffect**: Use React Query hooks for data
3. **Replace direct Supabase calls**: Use custom hooks
4. **Add real-time**: Use real-time subscription hooks

### Example Migration

```typescript
// OLD WAY
const [profiles, setProfiles] = useState([]);
useEffect(() => {
  supabase.from('profiles').select('*').then(setProfiles);
}, []);

// NEW WAY
const { data: profiles, isLoading } = useDiscoverProfiles(filters, userId);
```

## File Structure

```
src/
├── stores/           # Zustand stores
│   ├── useAuthStore.ts
│   ├── useUIStore.ts
│   └── useProfileStore.ts
├── hooks/            # React Query hooks
│   ├── useProfiles.ts
│   ├── useMatches.ts
│   ├── useUserSettings.ts
│   └── useRealtime.ts
├── contexts/         # React contexts
│   └── AuthContext.tsx
└── pages/            # Components using new architecture
    └── HomeRefactored.tsx
```

## Best Practices

### 1. **State Management**

- Use Zustand for UI state, React Query for server state
- Keep stores focused and single-purpose
- Use persistence for important state (auth, user preferences)

### 2. **Data Fetching**

- Always use React Query hooks instead of direct API calls
- Set appropriate stale times for different data types
- Use optimistic updates for better UX

### 3. **Real-time**

- Subscribe to real-time updates at the component level
- Use cache invalidation for automatic updates
- Handle connection states gracefully

### 4. **Error Handling**

- Use React Query's built-in error handling
- Provide fallback UI for error states
- Log errors for debugging

## Performance Optimizations

### 1. **Caching Strategy**

- **Profiles**: 5 minutes stale time, 10 minutes cache
- **Matches**: 2 minutes stale time, 5 minutes cache
- **Messages**: 1 minute stale time, 5 minutes cache
- **Settings**: 10 minutes stale time, 30 minutes cache

### 2. **Background Updates**

- Disable refetch on window focus for better UX
- Use appropriate retry strategies
- Implement smart cache invalidation

### 3. **Real-time Efficiency**

- Subscribe only to necessary channels
- Use filters to reduce unnecessary updates
- Implement connection pooling

## Future Enhancements

1. **Offline Support**: React Query offline capabilities
2. **Advanced Caching**: Custom cache strategies
3. **Performance Monitoring**: Query performance metrics
4. **Advanced Real-time**: Presence indicators, typing indicators
5. **State Persistence**: More granular persistence strategies

## Troubleshooting

### Common Issues

1. **Cache not updating**: Check query keys and invalidation
2. **Real-time not working**: Verify Supabase real-time setup
3. **State persistence issues**: Check storage configuration
4. **Performance problems**: Review cache times and query optimization

### Debug Tools

- React Query DevTools for data debugging
- Browser DevTools for state inspection
- Supabase Dashboard for real-time monitoring
