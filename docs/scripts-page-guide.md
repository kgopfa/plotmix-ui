# Scripts Page Guide

The Scripts page is a powerful development tool that allows you to write and execute JavaScript functions to manipulate project elements, groups, and animations programmatically. This is particularly useful for bulk operations, automation, and complex transformations that would be tedious to perform manually.

## Accessing the Scripts Page

1. **From the Designer**: Click the "Scripts" button in the main navigation bar (green button with Code icon)
2. **Direct URL**: Navigate to `/scripts` in your browser
3. **Mobile**: Use the mobile menu in the designer and select "Scripts"

## Features

### 1. Script Templates
Pre-built script examples that demonstrate common operations:

- **Move All Elements**: Move all elements by a specified offset
- **Scale Selected Elements**: Scale selected elements by a factor
- **Create Animation Group**: Create staggered animations for multiple elements
- **Group Elements by Type**: Automatically group elements by their type
- **Randomize Colors**: Randomize colors of all elements

### 2. Script Editor
A full-featured code editor with:
- Syntax highlighting
- Large text area for complex scripts
- Real-time error checking
- Auto-completion support

### 3. Script Management
- Save custom scripts with names
- Load previously saved scripts
- Delete unwanted scripts
- Organize scripts by category

### 4. Execution Environment
- Safe JavaScript execution
- Real-time feedback and error reporting
- Auto-save after successful execution
- Console logging integration

## Project API Reference

The Scripts page provides a global `window.projectAPI` object with methods to interact with your project:

### Element Management
```javascript
// Get all elements
const elements = window.projectAPI.getElements();

// Get selected elements only
const selectedElements = window.projectAPI.getSelectedElements();

// Update elements (triggers re-render)
window.projectAPI.updateElements(newElements);
```

### Group Management
```javascript
// Get all groups
const groups = window.projectAPI.getGroups();

// Get selected groups only
const selectedGroups = window.projectAPI.getSelectedGroups();

// Update groups
window.projectAPI.updateGroups(newGroups);
```

### Animation Management
```javascript
// Get current animation states
const animationStates = window.projectAPI.getAnimationStates();

// Update animation states
window.projectAPI.setAnimationStates(newStates);
```

### Project Information
```javascript
// Get project metadata
const projectInfo = window.projectAPI.getProjectInfo();
// Returns: { projectId, name }
```

### Logging
```javascript
// Log messages to the execution result panel
window.projectAPI.log("Your message here");
```

## Element Properties

Elements have the following key properties that can be manipulated:

### Common Properties
- `id`: Unique identifier
- `x`, `y`: Position coordinates
- `width`, `height`: Dimensions
- `fill`: Fill color
- `opacity`: Transparency (0-1)
- `visible`: Boolean visibility
- `zIndex`: Layering order
- `groupId`: Associated group ID

### Text-Specific Properties
- `text`: Text content
- `fontSize`: Font size in pixels
- `fontFamily`: Font family name
- `fontWeight`: Font weight
- `fontStyle`: Font style
- `textAlign`: Text alignment
- `lineHeight`: Line height multiplier

### Animation Properties
- `animations`: Array of animation objects
- `isAnimationPath`: Boolean for path animations

## Group Properties

Groups have these properties:

- `id`: Unique identifier
- `name`: Display name
- `elementIds`: Array of element IDs in the group
- `animations`: Array of group animations

## Animation Structure

Animations follow this structure:

```javascript
{
  id: "unique-animation-id",
  displayName: "Human readable name",
  type: "fade" | "move" | "scale" | "rotate" | "color" | "path",
  startTime: 0, // Start time in seconds
  duration: 1,  // Duration in seconds
  properties: {
    // Animation-specific properties
    alpha: 0,           // For fade animations
    x: 100,            // For move animations
    scaleX: 1.5,       // For scale animations
    rotation: 90        // For rotate animations
  },
  easing: "power2.out", // GSAP easing function
  repeat: 0,            // Repeat count (0 = no repeat)
  repeatDelay: 0,       // Delay between repeats
  yoyo: false           // Whether to reverse animation
}
```

## Common Use Cases

### 1. Bulk Element Operations
```javascript
// Move all elements to the right
function moveAllRight() {
  const elements = window.projectAPI.getElements();
  elements.forEach(element => {
    element.x += 100;
  });
  window.projectAPI.updateElements(elements);
}

moveAllRight();
```

### 2. Conditional Transformations
```javascript
// Scale only text elements
function scaleTextElements(factor = 1.5) {
  const elements = window.projectAPI.getElements();
  const textElements = elements.filter(el => el.type === 'text');
  
  textElements.forEach(element => {
    element.fontSize *= factor;
  });
  
  window.projectAPI.updateElements(elements);
}

scaleTextElements(2);
```

### 3. Animation Creation
```javascript
// Create a wave effect for multiple elements
function createWaveEffect() {
  const elements = window.projectAPI.getElements();
  
  elements.forEach((element, index) => {
    const animation = {
      id: `wave-${element.id}`,
      displayName: `Wave ${index + 1}`,
      type: 'move',
      startTime: index * 0.1,
      duration: 2,
      properties: {
        y: element.y - 20
      },
      easing: 'power2.inOut',
      repeat: -1, // Infinite repeat
      yoyo: true
    };
    
    element.animations.push(animation);
  });
  
  window.projectAPI.updateElements(elements);
}

createWaveEffect();
```

### 4. Smart Grouping
```javascript
// Group elements by proximity
function groupByProximity(threshold = 100) {
  const elements = window.projectAPI.getElements();
  const groups = window.projectAPI.getGroups();
  
  // Simple proximity grouping (can be enhanced)
  const processed = new Set();
  const newGroups = [];
  
  elements.forEach(element => {
    if (processed.has(element.id)) return;
    
    const nearby = elements.filter(other => {
      if (other.id === element.id || processed.has(other.id)) return false;
      const distance = Math.sqrt(
        Math.pow(element.x - other.x, 2) + 
        Math.pow(element.y - other.y, 2)
      );
      return distance < threshold;
    });
    
    if (nearby.length > 0) {
      const groupIds = [element.id, ...nearby.map(e => e.id)];
      const group = {
        id: `proximity-${Date.now()}-${Math.random()}`,
        name: `Proximity Group ${newGroups.length + 1}`,
        elementIds: groupIds,
        animations: []
      };
      
      newGroups.push(group);
      groupIds.forEach(id => processed.add(id));
      
      // Update elements with groupId
      groupIds.forEach(id => {
        const el = elements.find(e => e.id === id);
        if (el) el.groupId = group.id;
      });
    }
  });
  
  groups.push(...newGroups);
  window.projectAPI.updateGroups(groups);
  window.projectAPI.updateElements(elements);
}

groupByProximity(150);
```

## Best Practices

### 1. Always Use the API
```javascript
// ✅ Good - Use the provided API
const elements = window.projectAPI.getElements();
window.projectAPI.updateElements(elements);

// ❌ Bad - Don't manipulate DOM directly
document.querySelectorAll('.element').forEach(el => el.style.left = '100px');
```

### 2. Handle Errors Gracefully
```javascript
function safeElementOperation() {
  try {
    const elements = window.projectAPI.getElements();
    if (!elements || elements.length === 0) {
      window.projectAPI.log("No elements found");
      return;
    }
    
    // Perform operation
    elements.forEach(element => {
      if (element && typeof element.x === 'number') {
        element.x += 50;
      }
    });
    
    window.projectAPI.updateElements(elements);
    window.projectAPI.log("Operation completed successfully");
  } catch (error) {
    window.projectAPI.log(`Error: ${error.message}`);
  }
}
```

### 3. Batch Updates
```javascript
// ✅ Good - Update once after all changes
function batchUpdate() {
  const elements = window.projectAPI.getElements();
  
  elements.forEach(element => {
    element.x += 10;
    element.y += 10;
    element.opacity = 0.8;
  });
  
  // Single update call
  window.projectAPI.updateElements(elements);
}

// ❌ Bad - Multiple update calls
function inefficientUpdate() {
  const elements = window.projectAPI.getElements();
  
  elements.forEach(element => {
    element.x += 10;
    window.projectAPI.updateElements(elements); // Called multiple times
  });
}
```

### 4. Use Descriptive Names
```javascript
// ✅ Good - Clear, descriptive function names
function createStaggeredEntranceAnimation() { /* ... */ }
function groupElementsByVisualHierarchy() { /* ... */ }

// ❌ Bad - Unclear names
function doStuff() { /* ... */ }
function process() { /* ... */ }
```

## Troubleshooting

### Common Issues

1. **Script Not Executing**
   - Check for JavaScript syntax errors
   - Ensure the script calls a function
   - Verify the project is loaded

2. **Elements Not Updating**
   - Make sure to call `window.projectAPI.updateElements()`
   - Check that element properties are valid
   - Verify the element array structure

3. **Performance Issues**
   - Avoid updating elements in loops
   - Batch multiple operations together
   - Use efficient array methods (map, filter, reduce)

4. **Animation Problems**
   - Ensure animation properties are valid
   - Check timing values (startTime, duration)
   - Verify easing function names

### Debug Tips

1. **Use Console Logging**
   ```javascript
   console.log('Elements:', window.projectAPI.getElements());
   console.log('Groups:', window.projectAPI.getGroups());
   ```

2. **Test Small Operations First**
   ```javascript
   // Start with a simple operation
   const elements = window.projectAPI.getElements();
   console.log(`Found ${elements.length} elements`);
   ```

3. **Validate Data Structures**
   ```javascript
   function validateElement(element) {
     console.log('Element structure:', {
       id: element.id,
       type: element.type,
       x: element.x,
       y: element.y
     });
   }
   ```

## Advanced Examples

### Complex Animation Sequence
```javascript
function createComplexAnimation() {
  const elements = window.projectAPI.getElements();
  
  elements.forEach((element, index) => {
    // Entrance animation
    const entrance = {
      id: `entrance-${element.id}`,
      displayName: `Entrance ${index + 1}`,
      type: 'fade',
      startTime: index * 0.2,
      duration: 0.8,
      properties: { alpha: 0 },
      easing: 'power2.out'
    };
    
    // Movement animation
    const movement = {
      id: `movement-${element.id}`,
      displayName: `Movement ${index + 1}`,
      type: 'move',
      startTime: index * 0.2 + 0.8,
      duration: 1.2,
      properties: { x: element.x + 200 },
      easing: 'power2.inOut',
      yoyo: true,
      repeat: 1
    };
    
    element.animations = [entrance, movement];
  });
  
  window.projectAPI.updateElements(elements);
}
```

### Dynamic Layout Generation
```javascript
function createGridLayout(columns = 3, spacing = 100) {
  const elements = window.projectAPI.getElements();
  const canvasWidth = 1920; // Adjust based on your canvas
  const startX = 100;
  const startY = 100;
  
  elements.forEach((element, index) => {
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    element.x = startX + (col * spacing);
    element.y = startY + (row * spacing);
  });
  
  window.projectAPI.updateElements(elements);
}
```

## Security Considerations

- Scripts run in a sandboxed environment
- No access to external APIs or file system
- Limited to project manipulation only
- All changes are logged and can be undone

## Performance Optimization

- Batch multiple operations together
- Use efficient array methods
- Avoid unnecessary DOM queries
- Limit animation complexity for large projects

The Scripts page provides a powerful way to automate complex project operations and experiment with new features. Start with the provided templates and gradually build more sophisticated scripts as you become familiar with the API.
