# Practical Examples: State Management, Rendering, and Z-Index

## Table of Contents

1. [Element Creation and Management](#element-creation-and-management)
2. [State Updates and Re-rendering](#state-updates-and-re-rendering)
3. [Z-Index Operations](#z-index-operations)
4. [Selection and Interaction](#selection-and-interaction)
5. [Performance Optimization](#performance-optimization)
6. [Debugging and Troubleshooting](#debugging-and-troubleshooting)

## Element Creation and Management

### Creating a New Element

```typescript
// 1. Create element using factory
const newElement = createCanvasObject('rectangle', {
  x: 100,
  y: 100,
  width: 200,
  height: 150,
  fill: '#ff0000'
});

// 2. Add to store (automatically creates group and assigns z-index)
addElement(newElement);

// Result: Element appears on canvas with:
// - Unique ID
// - Default group created
// - zIndex = max(existing zIndex) + 1
// - Automatic re-render triggered
```

### Creating Multiple Elements

```typescript
// Create multiple elements efficiently
const elements = [
  createCanvasObject('rectangle', { x: 50, y: 50, width: 100, height: 100 }),
  createCanvasObject('circle', { x: 200, y: 50, width: 100, height: 100 }),
  createCanvasObject('text', { x: 350, y: 50, text: 'Hello World' })
];

// Add all at once
elements.forEach(element => addElement(element));

// Each element gets:
// - Incremental z-index values
// - Individual default groups
// - Single re-render batch
```

### Element Updates

```typescript
// Single property update
updateElement('element-id', { fill: '#00ff00' });

// Multiple property update
updateElement('element-id', {
  x: 150,
  y: 200,
  rotation: 45,
  fill: '#0000ff'
});

// Bulk updates for multiple elements
updateMultipleElements([
  { id: 'element1', updates: { x: 100, y: 100 } },
  { id: 'element2', updates: { fill: '#ff0000' } },
  { id: 'element3', updates: { rotation: 90 } }
]);
```

## State Updates and Re-rendering

### Understanding Re-render Triggers

```typescript
// These operations trigger re-renders:

// 1. Element property changes
updateElement(id, { x: 100 });           // ✅ Re-render
updateElement(id, { fill: '#ff0000' });  // ✅ Re-render
updateElement(id, { zIndex: 10 });       // ✅ Re-render + z-index resort

// 2. Selection changes
select('element-id');                    // ✅ Re-render (shows handles)
deselect('element-id');                  // ✅ Re-render (hides handles)
clearSelection();                        // ✅ Re-render (hides all handles)

// 3. Hover changes
setHoveredId('element-id');              // ✅ Re-render (shows hover outline)
setHoveredId(null);                      // ✅ Re-render (hides hover outline)

// 4. Animation state changes
setIsPlaying(true);                      // ✅ Re-render (hides handles)
setIsPlaying(false);                     // ✅ Re-render (shows handles)

// 5. Tool changes
setTool('select');                       // ✅ Re-render (enables interaction)
setTool('draw');                         // ✅ Re-render (disables interaction)
```

### Optimizing Re-renders

```typescript
// ❌ Bad: Causes unnecessary re-renders
const { elements, groups, selectedIds, hoveredId } = useCanvasStore();

// ✅ Good: Selective subscriptions
const elements = useCanvasStore(state => state.elements);
const selectedIds = useSelectionStore(state => state.selectedIds);
const hoveredId = useUIStore(state => state.hoveredId);

// ✅ Better: Use shallow comparison for objects
const { elements, groups } = useCanvasStore(
  useShallow(state => ({ 
    elements: state.elements, 
    groups: state.groups 
  }))
);
```

### Batch Updates

```typescript
// ❌ Bad: Multiple individual updates
elements.forEach((element, index) => {
  updateElement(element.id, { x: element.x + index * 10 });
});

// ✅ Good: Single batch update
const updates = elements.map((element, index) => ({
  id: element.id,
  updates: { x: element.x + index * 10 }
}));
updateMultipleElements(updates);
```

## Z-Index Operations

### Basic Z-Index Management

```typescript
// Bring element to front
bringElementToFront('element-id');

// Send element to back
sendElementToBack('element-id');

// Custom z-index assignment
updateElement('element-id', { zIndex: 50 });

// Check current z-index values
const elements = useCanvasStore.getState().elements;
elements.forEach(el => {
  console.log(`${el.name}: zIndex = ${el.zIndex}`);
});
```

### Group Z-Index Operations

```typescript
// Create group from elements
const group = createGroupFromElements(['element1', 'element2', 'element3']);

// Bring entire group to front
bringGroupToFront(group.id);

// Send entire group to back
sendGroupToBack(group.id);

// Group z-index is automatically calculated as max of children
const groupElements = getElementsInGroup(group.id);
const groupZIndex = Math.max(...groupElements.map(el => el.zIndex || 0));
```

### Z-Index Ranges and Organization

```typescript
// Define z-index ranges for different element types
const Z_INDEX_RANGES = {
  BACKGROUND: { min: 0, max: 99 },
  SHAPES: { min: 100, max: 499 },
  TEXT: { min: 500, max: 699 },
  IMAGES: { min: 700, max: 899 },
  OVERLAYS: { min: 900, max: 999 }
};

// Assign elements to specific ranges
const assignToRange = (elementId: string, range: keyof typeof Z_INDEX_RANGES) => {
  const { min, max } = Z_INDEX_RANGES[range];
  const currentZIndex = getElementById(elementId)?.zIndex || 0;
  
  if (currentZIndex < min || currentZIndex > max) {
    updateElement(elementId, { zIndex: min });
  }
};

// Usage
assignToRange('text-element', 'TEXT');
assignToRange('shape-element', 'SHAPES');
```

### Complex Z-Index Scenarios

```typescript
// Scenario: Create a layered design with specific ordering
const createLayeredDesign = () => {
  // 1. Background elements (z-index: 0-99)
  const background = createCanvasObject('rectangle', {
    x: 0, y: 0, width: 800, height: 600, fill: '#f0f0f0'
  });
  addElement(background);
  updateElement(background.id, { zIndex: 0 });

  // 2. Main content (z-index: 100-499)
  const mainShape = createCanvasObject('rectangle', {
    x: 100, y: 100, width: 200, height: 200, fill: '#ff0000'
  });
  addElement(mainShape);
  updateElement(mainShape.id, { zIndex: 100 });

  // 3. Text overlay (z-index: 500-699)
  const text = createCanvasObject('text', {
    x: 150, y: 150, text: 'Overlay Text', fill: '#ffffff'
  });
  addElement(text);
  updateElement(text.id, { zIndex: 500 });

  // 4. Bring text to front if needed
  bringElementToFront(text.id);
};
```

## Selection and Interaction

### Selection Management

```typescript
// Single selection
select('element-id');

// Multi-selection
select('element-id-1');
select('element-id-2', true); // isMultiSelect = true

// Clear selection
clearSelection();

// Get selected elements
const selectedIds = useSelectionStore(state => state.selectedIds);
const selectedElements = elements.filter(el => selectedIds.includes(el.id));

// Check if element is selected
const isSelected = selectedIds.includes('element-id');
```

### Interactive Element Handling

```typescript
// Handle element click
const handleElementClick = (elementId: string) => {
  if (isMultiSelect) {
    // Toggle selection
    if (selectedIds.includes(elementId)) {
      deselect(elementId);
    } else {
      select(elementId, true);
    }
  } else {
    // Single selection
    select(elementId);
  }
};

// Handle element hover
const handleElementHover = (elementId: string) => {
  setHoveredId(elementId);
};

const handleElementLeave = () => {
  setHoveredId(null);
};
```

### Context Menu Integration

```typescript
// Handle right-click context menu
const handleContextMenu = (e: React.MouseEvent, elementId: string) => {
  e.preventDefault();
  
  const element = getElementById(elementId);
  if (!element) return;

  // Show context menu with z-index options
  showContextMenu({
    x: e.clientX,
    y: e.clientY,
    items: [
      { label: 'Bring to Front', action: () => bringElementToFront(elementId) },
      { label: 'Send to Back', action: () => sendElementToBack(elementId) },
      { label: 'Duplicate', action: () => duplicateElement(elementId) },
      { label: 'Delete', action: () => removeElement(elementId) }
    ]
  });
};
```

## Performance Optimization

### Memoization Examples

```typescript
// Memoize expensive computations
const groupedElements = useMemo(() => {
  return elements.filter(el => el.groupId === groupId);
}, [elements, groupId]);

// Memoize sorted elements
const sortedElements = useMemo(() => {
  return [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
}, [elements]);

// Memoize filtered elements
const visibleElements = useMemo(() => {
  return elements.filter(el => el.visible !== false);
}, [elements]);
```

### Event Handler Optimization

```typescript
// Debounced updates for dragging
const debouncedUpdate = useMemo(
  () => debounce((updates) => {
    updateMultipleElements(updates);
  }, 16), // ~60fps
  [updateMultipleElements]
);

// Throttled mouse move handler
const throttledMouseMove = useMemo(
  () => throttle((e) => {
    handleMouseMove(e);
  }, 16),
  [handleMouseMove]
);

// Stable callback references
const handleElementSelect = useCallback((elementId: string) => {
  select(elementId);
}, [select]);
```

### Batch Operations

```typescript
// Batch element creation
const createMultipleElements = (count: number) => {
  const newElements = Array.from({ length: count }, (_, i) =>
    createCanvasObject('rectangle', {
      x: i * 50,
      y: i * 50,
      width: 40,
      height: 40
    })
  );

  // Add all at once
  newElements.forEach(element => addElement(element));
};

// Batch property updates
const updateAllElementsProperty = (property: keyof AnimatedCanvasObject, value: any) => {
  const updates = elements.map(element => ({
    id: element.id,
    updates: { [property]: value }
  }));
  updateMultipleElements(updates);
};
```

## Debugging and Troubleshooting

### State Inspection

```typescript
// Log current state
const logCurrentState = () => {
  const canvasState = useCanvasStore.getState();
  const selectionState = useSelectionStore.getState();
  const uiState = useUIStore.getState();
  
  console.log('Canvas State:', canvasState);
  console.log('Selection State:', selectionState);
  console.log('UI State:', uiState);
};

// Log element details
const logElementDetails = (elementId: string) => {
  const element = getElementById(elementId);
  if (element) {
    console.log('Element Details:', {
      id: element.id,
      name: element.name,
      type: element.type,
      position: { x: element.x, y: element.y },
      size: { width: element.width, height: element.height },
      zIndex: element.zIndex,
      groupId: element.groupId,
      visible: element.visible
    });
  }
};
```

### Z-Index Debugging

```typescript
// Debug z-index issues
const debugZIndex = () => {
  const elements = useCanvasStore.getState().elements;
  
  console.log('Z-Index Analysis:');
  elements.forEach(el => {
    console.log(`${el.name}: zIndex = ${el.zIndex}`);
  });
  
  const zIndexValues = elements.map(el => el.zIndex || 0);
  const minZ = Math.min(...zIndexValues);
  const maxZ = Math.max(...zIndexValues);
  
  console.log(`Z-Index Range: ${minZ} to ${maxZ}`);
  console.log(`Total Elements: ${elements.length}`);
};

// Find z-index conflicts
const findZIndexConflicts = () => {
  const elements = useCanvasStore.getState().elements;
  const zIndexMap = new Map<number, string[]>();
  
  elements.forEach(el => {
    const zIndex = el.zIndex || 0;
    if (!zIndexMap.has(zIndex)) {
      zIndexMap.set(zIndex, []);
    }
    zIndexMap.get(zIndex)!.push(el.name);
  });
  
  // Find duplicates
  zIndexMap.forEach((names, zIndex) => {
    if (names.length > 1) {
      console.warn(`Z-Index ${zIndex} conflict:`, names);
    }
  });
};
```

### Performance Monitoring

```typescript
// Monitor re-render frequency
const useRenderMonitor = (componentName: string) => {
  const renderCount = useRef(0);
  
  useEffect(() => {
    renderCount.current += 1;
    console.log(`${componentName} rendered ${renderCount.current} times`);
  });
};

// Monitor state change frequency
const useStateChangeMonitor = () => {
  useEffect(() => {
    const unsubscribe = useCanvasStore.subscribe((state) => {
      console.log('Canvas state changed:', state.elements.length, 'elements');
    });
    
    return unsubscribe;
  }, []);
};

// Usage
const DesignCanvas = () => {
  useRenderMonitor('DesignCanvas');
  useStateChangeMonitor();
  // ... component logic
};
```

### Common Issues and Solutions

```typescript
// Issue: Elements not appearing
const debugElementVisibility = (elementId: string) => {
  const element = getElementById(elementId);
  if (!element) {
    console.error('Element not found:', elementId);
    return;
  }
  
  console.log('Element visibility check:', {
    exists: !!element,
    visible: element.visible,
    zIndex: element.zIndex,
    position: { x: element.x, y: element.y },
    size: { width: element.width, height: element.height }
  });
};

// Issue: Z-index not working
const debugZIndexRendering = () => {
  const container = document.querySelector('[data-pixi-container]');
  if (container) {
    console.log('PIXI Container:', container);
    console.log('sortableChildren:', container.sortableChildren);
  }
};

// Issue: Performance problems
const debugPerformance = () => {
  const elements = useCanvasStore.getState().elements;
  console.log('Performance metrics:', {
    totalElements: elements.length,
    visibleElements: elements.filter(el => el.visible !== false).length,
    groupedElements: elements.filter(el => el.groupId).length,
    ungroupedElements: elements.filter(el => !el.groupId).length
  });
};
```

These practical examples demonstrate real-world usage patterns for managing state, handling rendering, and working with z-index in the canvas application. 