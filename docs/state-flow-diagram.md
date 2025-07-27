# State Flow and Rendering Pipeline Diagram

## State Management Flow

```mermaid
graph TB
    subgraph "User Actions"
        A[User Interaction] --> B[Event Handler]
        B --> C[Store Action]
    end
    
    subgraph "State Stores"
        C --> D[Canvas Store]
        C --> E[Selection Store]
        C --> F[UI Store]
        C --> G[Timeline Store]
    end
    
    subgraph "State Updates"
        D --> H[Elements Array]
        D --> I[Groups Array]
        E --> J[Selected IDs]
        F --> K[Hovered ID]
        G --> L[Animation State]
    end
    
    subgraph "Component Updates"
        H --> M[DesignCanvas]
        I --> M
        J --> M
        K --> M
        L --> M
    end
    
    subgraph "PIXI.js Rendering"
        M --> N[PIXI Container]
        N --> O[Element Containers]
        O --> P[Graphics/Text]
        P --> Q[Screen Display]
    end
    
    subgraph "Z-Index Sorting"
        R[sortableChildren=true] --> N
        S[zIndex Properties] --> O
        T[PIXI.js Internal Sort] --> Q
    end
```

## Element Rendering Hierarchy

```mermaid
graph TD
    subgraph "Main Canvas Container"
        A[pixiContainer<br/>sortableChildren=true<br/>zIndex: N/A]
    end
    
    subgraph "Canvas Elements (zIndex: 0-999)"
        B[Group Container<br/>zIndex: max(child zIndex)]
        C[Element Container<br/>zIndex: element.zIndex]
        D[Element Container<br/>zIndex: element.zIndex]
        E[Element Container<br/>zIndex: element.zIndex]
    end
    
    subgraph "Drawing Layers (zIndex: 1000-1999)"
        F[Drawing Preview<br/>zIndex: 1000]
        G[Line Preview<br/>zIndex: 1001]
    end
    
    subgraph "Selection UI (zIndex: 2000-2999)"
        H[Resize Handles<br/>zIndex: 2000]
        I[Radius Handles<br/>zIndex: 2001]
        J[Group Selection<br/>zIndex: 2002]
        K[Rotation Handles<br/>zIndex: 2003]
    end
    
    subgraph "Snap Guides (zIndex: 3000+)"
        L[Snap Guides<br/>zIndex: 3000]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> G
    A --> H
    A --> I
    A --> J
    A --> K
    A --> L
    
    B --> C
    B --> D
```

## Re-render Trigger Flow

```mermaid
graph LR
    subgraph "State Changes"
        A[Element Properties] --> B[Canvas Store]
        C[Selection State] --> D[Selection Store]
        E[Hover State] --> F[UI Store]
        G[Animation State] --> H[Timeline Store]
    end
    
    subgraph "Component Subscriptions"
        B --> I[DesignCanvas]
        D --> I
        F --> I
        H --> I
    end
    
    subgraph "Re-render Triggers"
        I --> J[Element Position Change]
        I --> K[Element Style Change]
        I --> L[Selection Change]
        I --> M[Hover Change]
        I --> N[Z-Index Change]
        I --> O[Animation State Change]
    end
    
    subgraph "PIXI.js Updates"
        J --> P[Container Position]
        K --> Q[Graphics Redraw]
        L --> R[Selection Handles]
        M --> S[Hover Outline]
        N --> T[Z-Index Resort]
        O --> U[Handle Visibility]
    end
```

## Z-Index Management Flow

```mermaid
graph TD
    subgraph "Z-Index Operations"
        A[bringElementToFront] --> B[Find Max Z-Index]
        C[sendElementToBack] --> D[Find Min Z-Index]
        E[bringGroupToFront] --> F[Update All Group Elements]
        G[sendGroupToBack] --> H[Update All Group Elements]
    end
    
    subgraph "Z-Index Calculation"
        B --> I[Max Z-Index + 1]
        D --> J[Min Z-Index - 1]
        F --> K[Max Z-Index + 1]
        H --> L[Min Z-Index - 1]
    end
    
    subgraph "State Update"
        I --> M[Update Element Z-Index]
        J --> M
        K --> N[Update Group Elements]
        L --> N
    end
    
    subgraph "PIXI.js Rendering"
        M --> O[PIXI Container zIndex]
        N --> O
        O --> P[Automatic Resort]
        P --> Q[Visual Update]
    end
```

## Performance Optimization Flow

```mermaid
graph TB
    subgraph "React Optimization"
        A[Selective Subscriptions] --> B[Minimal Re-renders]
        C[useMemo] --> D[Cached Computations]
        E[useCallback] --> F[Stable References]
    end
    
    subgraph "PIXI.js Optimization"
        G[GPU Acceleration] --> H[Hardware Rendering]
        I[Batch Rendering] --> J[Efficient Draw Calls]
        K[Culling] --> L[Skip Off-screen Elements]
        M[Z-Index Sorting] --> N[Internal Optimization]
    end
    
    subgraph "Event Optimization"
        O[Debounced Updates] --> P[Reduced State Changes]
        Q[Event Delegation] --> R[Efficient Event Handling]
        S[Throttled Events] --> T[Controlled Update Rate]
    end
    
    subgraph "Memory Management"
        U[Object Pooling] --> V[Reduced GC Pressure]
        W[Lazy Loading] --> X[On-demand Resources]
        Y[Cleanup Handlers] --> Z[Memory Leak Prevention]
    end
```

## State Synchronization Flow

```mermaid
graph LR
    subgraph "Multiple Stores"
        A[Canvas Store] --> B[Elements & Groups]
        C[Selection Store] --> D[Selected IDs]
        E[UI Store] --> F[Hover & Tool State]
        G[Timeline Store] --> H[Animation State]
    end
    
    subgraph "Component Integration"
        B --> I[DesignCanvas]
        D --> I
        F --> I
        H --> I
    end
    
    subgraph "Cross-Store Dependencies"
        I --> J[Element Selection]
        I --> K[Element Hover]
        I --> L[Animation Playback]
        I --> M[Tool Interactions]
    end
    
    subgraph "State Consistency"
        J --> N[Selection Handles]
        K --> O[Hover Outlines]
        L --> P[Handle Visibility]
        M --> Q[Event Handling]
    end
```

## Element Lifecycle Flow

```mermaid
graph TD
    subgraph "Element Creation"
        A[User Action] --> B[createCanvasObject]
        B --> C[Generate ID & Properties]
        C --> D[Assign Default Z-Index]
        D --> E[Create Default Group]
        E --> F[addElement]
    end
    
    subgraph "Element Updates"
        F --> G[State Update]
        G --> H[Component Re-render]
        H --> I[PIXI.js Update]
        I --> J[Visual Change]
    end
    
    subgraph "Element Interaction"
        J --> K[User Selection]
        K --> L[Selection Handles]
        L --> M[User Modification]
        M --> N[Property Updates]
        N --> G
    end
    
    subgraph "Element Removal"
        N --> O[removeElement]
        O --> P[Cleanup Group]
        P --> Q[Remove from State]
        Q --> R[Component Cleanup]
    end
```

These diagrams provide a visual understanding of how state flows through the system, how elements are rendered, and how the z-index system operates in the canvas application. 