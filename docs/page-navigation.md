# Page Navigation and Routing System

## Overview

PlotMix AI uses Next.js App Router for client-side navigation with a structured user flow from content creation to editing. The application follows a specific user journey that guides users through chat creation, content generation, and content editing.

## User Flow Architecture

```mermaid
graph TD
    A[Home /] --> B[Learn /learn]
    B --> C[Chat Session /learn/[chatId]]
    C --> D[Content View /content/[contentId]]
    D --> E[Editor /editor/[contentId]]
    
    B --> F[Content Library /content]
    F --> D
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#e8f5e8
    style D fill:#fff3e0
    style E fill:#ffebee
    style F fill:#fce4ec
```

## Route Structure

### Static Routes

| Route | Component | Purpose | Navigation Access |
|-------|-----------|---------|-------------------|
| `/` | `page.tsx` | Landing page with feature overview | Direct URL, navigation cards |
| `/learn` | `learn/page.tsx` | Chat creation and AI learning hub | Navigation sidebar, home page |
| `/content` | `content/page.tsx` | Content library overview | Navigation sidebar |

### Dynamic Routes

| Route Pattern | Component | Purpose | Navigation Access |
|---------------|-----------|---------|-------------------|
| `/learn/[chatId]` | `learn/[chatId]/page.tsx` | Individual chat session | Generated from `/learn` |
| `/content/[contentId]` | `content/[contentId]/page.tsx` | Specific content view | Generated from chat session |
| `/editor/[contentId]` | `editor/[contentId]/page.tsx` | Content editor | "Edit Content" button |

### Special Routes

| Route | Component | Purpose | Access |
|-------|-----------|---------|--------|
| `/not-found` | `not-found.tsx` | 404 error page | Invalid URLs |

## Detailed User Journey

### 1. Home Page (`/`)
**Purpose**: Application introduction and feature discovery
**Components**: 
- Feature cards with navigation links
- Branded header with PlotMix AI logo
- Call-to-action buttons

**Navigation Options**:
- "Start Creating" → `/learn`
- "Learn More" → `/learn`
- Feature cards → Direct to respective sections

### 2. Learn Hub (`/learn`)
**Purpose**: Chat creation and AI interaction
**Components**:
- AI suggestions section
- Prompt input interface
- Content generation triggers

**User Actions**:
- Enter prompt → Creates new chat session
- Click suggestions → Populates prompt
- Submit → Navigates to `/learn/[chatId]`

**Generated Chat ID Format**: `chat-{timestamp}`

### 3. Chat Session (`/learn/[chatId]`)
**Purpose**: AI interaction and content generation
**Components**:
- Chat interface with AI suggestions
- Content generation button
- Loading states and progress indicators

**User Actions**:
- Interact with AI suggestions
- Generate content → Navigates to `/content/[contentId]`
- Content ID Format: `{chatId}-{timestamp}`

### 4. Content View (`/content/[contentId]`)
**Purpose**: Display generated content with editing options
**Components**:
- Video player for content display
- Content metadata (ID, generation time)
- Edit and share controls

**User Actions**:
- View generated content
- "Edit Content" → Navigates to `/editor/[contentId]`
- Share content (future feature)

### 5. Content Editor (`/editor/[contentId]`)
**Purpose**: Edit specific generated content
**Components**:
- Full editor canvas interface
- Content ID overlay indicator
- All editor tools and features

**Context**: Loads with specific content for editing

## Navigation Components

### Navigation Sidebar
**Location**: `src/components/shared/navigation-sidebar.tsx`
**Features**:
- Responsive design (mobile/desktop)
- Hover-only interactions (no active states)
- Consistent branding

**Navigation Items**:
```typescript
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string; // Reserved for future use
}
```

**Current Items**:
- **New Chat** → `/learn` (green hover)
- **Chats** → `/learn` (blue hover)
- **Content** → `/content` (fuchsia hover)

### Navigation Data
**Location**: `src/data/shared-navigation.ts`
**Structure**: Array of navigation items with styling and routing information

## Technical Implementation

### Route Parameters
```typescript
// Chat ID parameter
const chatId = params.chatId as string;

// Content ID parameter  
const contentId = params.contentId as string;
```

### Navigation Methods
```typescript
// Programmatic navigation
window.location.href = `/learn/${chatId}`;

// Next.js Link component
<Link href={`/editor/${contentId}`}>
  Edit Content
</Link>
```

### Dynamic Route Generation
```typescript
// Chat session creation
const chatId = `chat-${Date.now()}`;

// Content generation
const contentId = `${chatId}-${Date.now()}`;
```

## Error Handling

### 404 Page
**Location**: `src/app/not-found.tsx`
**Features**:
- Custom branded 404 page
- Navigation back to main sections
- "Go Home" and "Go Back" options

### Route Protection
- All dynamic routes validate parameter existence
- Graceful fallbacks for invalid IDs
- Consistent error messaging

## Future Enhancements

### Planned Features
1. **Route Protection**: Authentication middleware for protected routes
2. **Loading States**: Route-specific loading indicators
3. **Error Boundaries**: Component-level error handling
4. **Deep Linking**: Direct access to specific content
5. **Breadcrumbs**: Navigation context indicators

### Potential Routes
```
/content/[contentId]/share - Content sharing page
/learn/[chatId]/history - Chat history view
/editor/[contentId]/preview - Content preview mode
```

## Best Practices

### Navigation Guidelines
1. **Contextual Access**: Editor only accessible from content pages
2. **Progressive Disclosure**: Features revealed as needed
3. **Consistent Patterns**: Similar interactions across sections
4. **Clear Hierarchy**: Logical flow from creation to editing

### URL Structure
1. **Descriptive IDs**: Timestamp-based for uniqueness
2. **Hierarchical**: Nested routes for related content
3. **SEO Friendly**: Clean, readable URLs
4. **Scalable**: Supports future content types

### Performance Considerations
1. **Client-Side Navigation**: Next.js Link for fast transitions
2. **Lazy Loading**: Components loaded as needed
3. **State Preservation**: Maintains context across navigation
4. **Caching**: Route-level caching strategies 