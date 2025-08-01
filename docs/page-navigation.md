# Page Navigation and Routing System

## Overview

PlotMix AI uses Next.js App Router for client-side navigation with a structured user flow from content creation to editing. The application follows a specific user journey that guides users through chat creation, content generation, and content editing.

## User Flow Architecture

```mermaid
graph TD
    A[Home /] --> B[Learn /learn]
    B --> C[Content Generated /content/[contentId]]
    C --> D[Editor /editor/[contentId]]
    C --> E[Continue Chat in Sidebar]
    
    B --> F[Content Library /content]
    F --> C
    
    style A fill:#e1f5fe
    style B fill:#f3e5f5
    style C fill:#fff3e0
    style D fill:#ffebee
    style E fill:#e8f5e8
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
| `/content/[contentId]` | `content/[contentId]/page.tsx` | Generated content view with chat sidebar | Generated from `/learn` |
| `/editor/[contentId]` | `editor/[contentId]/page.tsx` | Canvas editor (source of content) | "Open in Editor" button |

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
**Purpose**: Chat creation and content generation
**Components**:
- AI suggestions section
- Prompt input interface
- Content generation triggers

**User Actions**:
- Enter prompt → Generates content directly
- Click suggestions → Populates prompt
- Submit → Navigates to `/content/[contentId]`

**Generated Content ID Format**: `content-{timestamp}`

### 3. Content View (`/content/[contentId]`)
**Purpose**: Display generated content with continued chat interaction
**Components**:
- Video player for content display (created by editor)
- Chat sidebar with "Activity" and "Content" tabs
- Edit and share controls
- Content metadata (ID, generation time)

**User Actions**:
- View generated video content
- Continue chatting via sidebar → Updates content
- "Edit Content" → Navigates to `/editor/[contentId]` (source editor)
- Share content (future feature)

### 4. Content Editor (`/editor/[contentId]`)
**Purpose**: Canvas editor that creates the video content
**Components**:
- Full editor canvas interface
- Content ID overlay indicator
- All editor tools and features
- Real-time content creation

**Context**: This is the source editor that generates the video content shown on the content page

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
// Content ID parameter  
const contentId = params.contentId as string;
```

### Navigation Methods
```typescript
// Programmatic navigation to content
window.location.href = `/content/${contentId}`;

// Next.js Link component for editor
<Link href={`/editor/${contentId}`}>
  Open in Editor
</Link>
```

### Dynamic Route Generation
```typescript
// Content generation from learn page
const contentId = `content-${Date.now()}`;
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