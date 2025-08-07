# Canvas State Storage Overview

## Introduction

This document provides a comprehensive overview of how canvas state (elements, groups, properties, and animations) is stored and managed in the PlotMix application. The system uses a multi-layered approach with Zustand stores for state management and comprehensive persistence capabilities.

## Architecture Overview

The canvas state storage system consists of several interconnected layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    Project Manager                          │
│              (Save/Load/Persistence)                        │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Scene Store                              │
│              (Multi-scene Management)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                    Canvas Store                             │
│              (Elements & Groups)                            │
└─────────────────────┬───────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────┐
│                   Timeline Store                            │
│              (Animation & Playback)                         │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Canvas Store (`use-canvas-store.ts`)
- **Purpose**: Primary storage for canvas elements and groups
- **Data**: Elements, groups, history, clipboard, optimistic updates
- **Location**: `src/stores/use-canvas-store.ts`

### 2. Timeline Store (`use-timeline-store.ts`)
- **Purpose**: Animation timeline and playback state management
- **Data**: Animation tracks, playback state, timeline UI, animation states
- **Location**: `src/stores/use-timeline-store.ts`

### 3. Scene Store (`use-scene-store.ts`)
- **Purpose**: Multi-scene project management
- **Data**: Scene list, active scene, scene metadata
- **Location**: `src/stores/use-scene-store.ts`

### 4. Project Manager (`project-manager.ts`)
- **Purpose**: Project persistence and scene switching
- **Data**: Save/load operations, scene caching, project validation
- **Location**: `src/lib/project-manager.ts`

## Data Flow

### State Updates
1. User interaction triggers state change
2. Canvas store updates element/group data
3. Timeline store syncs animation data
4. Scene store tracks modifications
5. Project manager caches current scene

### Persistence
1. Project manager collects data from all stores
2. Serializes to JSON format
3. Saves to file or exports data
4. Loads and validates on project open

### Scene Switching
1. Project manager saves current scene to cache
2. Loads target scene data into stores
3. Updates active scene reference
4. Rebuilds timeline and UI state

## Key Features

- **Comprehensive State**: All visual properties, animations, and relationships stored
- **Multi-scene Support**: Multiple scenes per project with independent state
- **Real-time Sync**: Stores stay synchronized during operations
- **Optimistic Updates**: Immediate UI feedback with rollback capability
- **History Support**: Undo/redo structure in place
- **Persistence**: Full project save/load functionality
- **Validation**: Data integrity checks during load operations

## Related Documentation

- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
- [Canvas Groups Data Structure](./canvas-groups-data-structure.md)
- [Animation Storage System](./animation-storage-system.md)
- [Project Persistence Guide](./project-persistence-guide.md)
- [Scene Management System](./scene-management-system.md)
- [Timeline State Management](./timeline-state-management.md)
