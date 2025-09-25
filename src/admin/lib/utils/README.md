# Blane Visibility System

This document explains how the blane visibility system works and how to use it.

## Overview

The blane visibility system allows blanes (offers) to have three different visibility levels:

1. **Private** - Only the owner can see the blane
2. **Public** - Anyone can see the blane
3. **Link** - Only people with a valid share token can see the blane

## Visibility Types

```typescript
type VisibilityType = 'private' | 'public' | 'link';
```

## Database Schema

The blane table includes these fields:
- `visibility` (ENUM): 'private', 'public', 'link'
- `share_token` (UUID): Generated when visibility is set to 'link'

## API Endpoints

### Generate Share Link
```typescript
POST /api/blanes/{id}/share
// Generates a new share token and returns share_url
```

### Revoke Share Link
```typescript
DELETE /api/blanes/{id}/share
// Removes the share token, making the link invalid
```

### Update Visibility
```typescript
PUT /api/blanes/{id}
// Updates visibility and handles share token generation/revocation
```

## Frontend Components

### BlaneVisibilitySelector
A React component that allows users to select visibility and manage share links.

```tsx
import { BlaneVisibilitySelector } from './BlaneVisibilitySelector';

<BlaneVisibilitySelector
  blaneId={blane.id}
  currentVisibility={blane.visibility}
  shareToken={blane.share_token}
  onVisibilityChange={(newVisibility) => {
    // Handle visibility change
  }}
/>
```

### BlaneVisibilityBadge
A component to display the current visibility status.

```tsx
import { BlaneVisibilityBadge } from './BlaneVisibilityBadge';

<BlaneVisibilityBadge visibility={blane.visibility} />
```

### BlaneVisibilityGuard
A wrapper component that checks visibility before rendering content.

```tsx
import { BlaneVisibilityGuard } from './BlaneVisibilityGuard';

<BlaneVisibilityGuard
  blane={blane}
  userToken={token}
  isOwner={isOwner}
  onNavigateHome={() => navigate('/')}
>
  {/* Protected content */}
</BlaneVisibilityGuard>
```

## Utility Functions

### checkBlaneVisibility
Checks if a blane is visible to a user.

```typescript
import { checkBlaneVisibility } from './blaneVisibility';

const result = checkBlaneVisibility(blane, userToken, isOwner);
// Returns: { isVisible: boolean, reason?: string, requiresToken?: boolean }
```

### canAccessViaSharedLink
Checks if a blane can be accessed with a specific token.

```typescript
import { canAccessViaSharedLink } from './blaneVisibility';

const canAccess = canAccessViaSharedLink(blane, providedToken);
// Returns: boolean
```

### getBlaneShareUrl
Generates the share URL for a blane.

```typescript
import { getBlaneShareUrl } from './blaneVisibility';

const shareUrl = getBlaneShareUrl(blane);
// Returns: string | null
```

## Usage Examples

### 1. Creating a Blane with Link Visibility

```tsx
const handleCreateBlane = async (formData: FormData) => {
  formData.append('visibility', 'link');
  
  const response = await blaneApi.createBlane(formData);
  
  if (response.data.share_url) {
    // Show the share link to the user
    setShareUrl(response.data.share_url);
  }
};
```

### 2. Checking Access in Shared Blane Page

```tsx
const SharedBlane = () => {
  const { slug, token } = useParams();
  const { blane } = useBlaneDetail(slug);
  
  const canAccess = canAccessViaSharedLink(blane, token);
  
  if (!canAccess) {
    return <AccessDenied />;
  }
  
  return <BlaneContent blane={blane} />;
};
```

### 3. Filtering Public Blanes in Lists

```tsx
import { shouldShowInPublicLists } from './blaneVisibility';

const publicBlanes = allBlanes.filter(shouldShowInPublicLists);
```

### 4. Protecting Content with Visibility Guard

```tsx
<BlaneVisibilityGuard
  blane={blane}
  userToken={userToken}
  isOwner={isOwner}
  onNavigateHome={() => navigate('/')}
>
  <BlaneDetail blane={blane} />
</BlaneVisibilityGuard>
```

## Security Considerations

1. **Token Validation**: Always validate share tokens on both frontend and backend
2. **Token Expiration**: Consider implementing token expiration for enhanced security
3. **Rate Limiting**: Implement rate limiting on share link generation
4. **Access Logging**: Log access attempts for audit purposes

## Error Handling

The system provides clear error messages for different scenarios:

- "Share link has been revoked" - When a link visibility blane has no share token
- "Invalid share token" - When the provided token doesn't match
- "Share token required" - When link visibility is set but no token provided
- "This blane is private" - When visibility is private

## Testing

Test the following scenarios:

1. **Private blanes**: Should not be accessible without owner permissions
2. **Public blanes**: Should be accessible to everyone
3. **Link blanes**: Should only be accessible with valid tokens
4. **Token revocation**: Should invalidate existing share links
5. **Token regeneration**: Should create new tokens and invalidate old ones 