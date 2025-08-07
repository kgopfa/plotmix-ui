# Canvas Groups Data Structure

## Overview

Canvas groups are containers that organize multiple elements together, allowing for collective operations like moving, scaling, and animating multiple elements as a single unit. Groups can also have their own properties and animations independent of their contained elements.

## Core Group Structure

```typescript
interface CanvasGroup {
  // Basic identification
  id: string;
  name: string;
  
  // Element membership
  elementIds: string[];
  
  // Position and transform
  x: number;
  y: number;
  rotation?: number;
  
  // Visual properties
  visible?: boolean;
  opacity?: number;
  
  // Group classification
  type: 'text' | 'custom' | 'polygon';
  isDefaultGroup: boolean;
  isAnimationPath?: boolean;
  
  // Animations
  animations: ElementAnimation[];
  
  // Hierarchy
  parent?: string | null;
}
```

## Detailed Property Reference

### Basic Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `id` | `string` | Unique identifier for the group | Required |
| `name` | `string` | Human-readable name for the group | Required |

### Element Membership

| Property | Type | Description |
|----------|------|-------------|
| `elementIds` | `string[]` | Array of element IDs that belong to this group |

### Position and Transform

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `x` | `number` | Group center X coordinate | Required |
| `y` | `number` | Group center Y coordinate | Required |
| `rotation` | `number` | Group rotation in degrees | `0` |

### Visual Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `visible` | `boolean` | Whether the group is visible | `true` |
| `opacity` | `number` | Group opacity (0-1) | `1` |

### Group Classification

| Property | Type | Description |
|----------|------|-------------|
| `type` | `'text' \| 'custom' \| 'polygon'` | Determines group behavior and presentation |
| `isDefaultGroup` | `boolean` | True for auto-created single-object groups |
| `isAnimationPath` | `boolean` | True for groups that serve as animation paths |

### Animation Properties

| Property | Type | Description |
|----------|------|-------------|
| `animations` | `ElementAnimation[]` | Array of animations applied to the group |

### Hierarchy

| Property | Type | Description |
|----------|------|-------------|
| `parent` | `string \| null` | ID of parent group (for nested groups) |

## Group Types

### Custom Groups (`'custom'`)
- **Purpose**: General-purpose grouping of elements
- **Behavior**: Standard group operations (move, scale, rotate)
- **Use Case**: Organizing related elements, collective editing

### Text Groups (`'text'`)
- **Purpose**: Specialized groups for text content
- **Properties**: Text-specific properties for character-level control
- **Use Case**: Text animations, character-by-character effects

#### Text Group Properties
```typescript
// Text-specific properties (when type === 'text')
characters?: string[]; // Individual characters
fontSize?: number;
fontFamily?: string;
fontWeight?: string;
fontStyle?: string;
textAlign?: string;
letterSpacing?: number;
```

### Polygon Groups (`'polygon'`)
- **Purpose**: Groups that form polygon shapes
- **Properties**: Polygon-specific properties
- **Use Case**: Complex shapes, path-based animations

#### Polygon Group Properties
```typescript
// Polygon-specific properties (when type === 'polygon')
isClosed?: boolean; // Whether the polygon path is closed
```

## Group Creation and Management

### Default Groups
When elements are created without an explicit group, the system automatically creates a default group:

```typescript
// Auto-created when element has no groupId
const defaultGroup: CanvasGroup = {
  id: crypto.randomUUID(),
  name: `${element.name} Group`,
  elementIds: [element.id],
  x: element.x,
  y: element.y,
  rotation: 0,
  visible: true,
  opacity: 1,
  type: 'custom',
  isDefaultGroup: true,
  animations: []
};
```

### Manual Group Creation
Groups can be created manually to organize multiple elements:

```typescript
const customGroup: CanvasGroup = {
  id: "group-1",
  name: "My Custom Group",
  elementIds: ["element-1", "element-2", "element-3"],
  x: 150, // Center of the group
  y: 150,
  rotation: 0,
  visible: true,
  opacity: 1,
  type: 'custom',
  isDefaultGroup: false,
  animations: []
};
```

## Group Operations

### Finding Elements in Groups
```typescript
// Get all elements in a group
const getElementsInGroup = (groupId: string) => {
  const group = groups.find(g => g.id === groupId);
  if (!group) return [];
  
  return elements.filter(el => group.elementIds.includes(el.id));
};
```

### Group Transformations
Groups support collective transformations:
- **Move**: All elements move relative to group center
- **Scale**: All elements scale from group center
- **Rotate**: All elements rotate around group center

### Group Animations
Groups can have animations that affect all contained elements:
- **Stagger**: Elements animate with delays between them
- **Collective**: All elements animate together
- **Path**: Elements follow a path as a group

## Example Group Objects

### Simple Custom Group
```typescript
{
  id: "group-1",
  name: "Button Group",
  elementIds: ["rect-1", "text-1"],
  x: 200,
  y: 100,
  rotation: 0,
  visible: true,
  opacity: 1,
  type: "custom",
  isDefaultGroup: false,
  isAnimationPath: false,
  animations: [],
  parent: null
}
```

### Text Group with Characters
```typescript
{
  id: "text-group-1",
  name: "Animated Text",
  elementIds: ["char-1", "char-2", "char-3", "char-4"],
  x: 300,
  y: 200,
  rotation: 0,
  visible: true,
  opacity: 1,
  type: "text",
  isDefaultGroup: false,
  isAnimationPath: false,
  characters: ["H", "e", "l", "l"],
  fontSize: 24,
  fontFamily: "Arial",
  fontWeight: "bold",
  textAlign: "left",
  letterSpacing: 2,
  animations: [
    {
      id: "text-anim-1",
      displayName: "Typewriter",
      type: "typewriter",
      startTime: 0,
      duration: 2,
      properties: {},
      easing: "power2.out"
    }
  ],
  parent: null
}
```

### Polygon Group
```typescript
{
  id: "polygon-group-1",
  name: "Triangle Shape",
  elementIds: ["line-1", "line-2", "line-3"],
  x: 400,
  y: 300,
  rotation: 45,
  visible: true,
  opacity: 1,
  type: "polygon",
  isDefaultGroup: false,
  isAnimationPath: false,
  isClosed: true,
  animations: [],
  parent: null
}
```

## Storage Location

Groups are stored in the Canvas Store:
- **File**: `src/stores/use-canvas-store.ts`
- **Property**: `groups: CanvasGroup[]`
- **Access**: `useCanvasStore.getState().groups`

## Group-Element Relationships

### Element to Group Reference
Elements reference their group via the `groupId` property:
```typescript
// Element belongs to a group
{
  id: "element-1",
  name: "My Element",
  // ... other properties
  groupId: "group-1" // References the group
}
```

### Group to Elements Reference
Groups maintain a list of element IDs:
```typescript
// Group contains elements
{
  id: "group-1",
  name: "My Group",
  elementIds: ["element-1", "element-2"], // References elements
  // ... other properties
}
```

## Best Practices

1. **Group Naming**: Use descriptive names for groups
2. **Default Groups**: Let the system create default groups for single elements
3. **Group Types**: Use appropriate group types for different use cases
4. **Hierarchy**: Consider parent-child relationships for complex structures
5. **Animations**: Apply group animations for collective effects

## Related Documentation

- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
- [Animation Storage System](./animation-storage-system.md)
- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
