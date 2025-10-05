import { useCallback } from 'react';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import type { ElementAnimation } from '@/types/canvas';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager-v2';

/**
 * Enhanced Timeline Integration Hook
 * 
 * Provides streamlined integration between canvas and timeline stores
 * using only the Enhanced Timeline Manager for optimal performance.
 */
export function useTimelineIntegration() {
  // Get stores and timeline functions
  const { 
    elements, 
    groups,
    updateTracks,
    buildGSAPTimeline,
    play: timelinePlay,
    pause: timelinePause,
    stop: timelineStop,
    seek: timelineSeek,
    setPlaybackSpeed
  } = useTimelineStore();

  const {
    updateElementAnimation: updateCanvasElementAnimation,
    updateGroupAnimation: updateCanvasGroupAnimation,
    removeElementAnimation,
    removeGroupAnimation
  } = useCanvasStore();

  // Enhanced canvas ref setup with automatic timeline building
  const setCanvasRef = useCallback((ref: React.RefObject<TimelineCanvasRef | null>) => {
    const state = useTimelineStore.getState();
    
    // Set canvas ref for Enhanced Timeline Manager
    state.gsapManager.setCanvasRef(ref);
    
    // Build initial timeline with all elements using Enhanced Timeline Manager
    buildGSAPTimeline();
  }, [elements, groups, buildGSAPTimeline]);

  // Enhanced animation handlers that sync with both stores
  const addElementAnimation = useCallback((elementId: string, animation: ElementAnimation) => {
    // Update canvas store
    useCanvasStore.getState().addElementAnimation(elementId, animation);
    // Timeline store will be updated automatically through subscription
  }, []);

  const addGroupAnimation = useCallback((groupId: string, animation: ElementAnimation) => {
    // Update canvas store
    useCanvasStore.getState().addGroupAnimation(groupId, animation);
    // Timeline store will be updated automatically through subscription
  }, []);

  const updateElementAnimation = useCallback((
    elementId: string,
    animationId: string,
    updates: Partial<ElementAnimation>
  ) => {
    // Update canvas store
    updateCanvasElementAnimation(elementId, animationId, updates);
    // Timeline will rebuild automatically through subscription
  }, [updateCanvasElementAnimation]);

  const updateGroupAnimation = useCallback((
    groupId: string,
    animationId: string,
    updates: Partial<ElementAnimation>
  ) => {
    // Update canvas store
    updateCanvasGroupAnimation(groupId, animationId, updates);
    // Timeline will rebuild automatically through subscription
  }, [updateCanvasGroupAnimation]);

  const deleteElementAnimation = useCallback((elementId: string, animationId: string) => {
    // Update canvas store
    removeElementAnimation(elementId, animationId);
    // Timeline will rebuild automatically through subscription
  }, [removeElementAnimation]);

  const deleteGroupAnimation = useCallback((groupId: string, animationId: string) => {
    // Update canvas store
    removeGroupAnimation(groupId, animationId);
    // Timeline will rebuild automatically through subscription
  }, [removeGroupAnimation]);

  // Enhanced timeline rebuild that syncs both stores first
  const rebuildTimeline = useCallback(() => {
    // Sync Timeline Store with Canvas Store first
    const canvasElements = useCanvasStore.getState().getAllElements();
    const canvasGroups = useCanvasStore.getState().getAllGroups();
    const timelineStore = useTimelineStore.getState();
    
    // Update Timeline Store with latest data
    timelineStore.setElements(canvasElements);
    timelineStore.setGroups(canvasGroups);
    
    // Force rebuild timeline tracks and GSAP timeline
    updateTracks();
    buildGSAPTimeline();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elements, groups, updateTracks, buildGSAPTimeline]);

  // Playback controls
  const playbackControls = {
    play: useCallback(() => {
      timelinePlay();
    }, [timelinePlay]),
    
    pause: useCallback(() => {
      timelinePause();
    }, [timelinePause]),
    
    stop: useCallback(() => {
      timelineStop();
    }, [timelineStop]),
    
    seek: useCallback((time: number) => {
      timelineSeek(time);
    }, [timelineSeek]),
    
    setSpeed: useCallback((speed: number) => {
      setPlaybackSpeed(speed);
    }, [setPlaybackSpeed])
  };

  // Enhanced animation update for optimized performance
  const updateElementAnimationOptimized = useCallback((
    elementId: string,
    animationId: string,
    updates: Partial<ElementAnimation>
  ) => {
    // Update canvas store first
    useCanvasStore.getState().updateElementAnimation(elementId, animationId, updates);
    
    // Enhanced Timeline Manager will rebuild automatically through subscription
    rebuildTimeline();
  }, [rebuildTimeline]);

  const batchUpdateAnimations = useCallback((
    updates: Array<{ elementId: string, animationId: string, updates: Partial<ElementAnimation> }>
  ) => {
    // Update canvas store first
    updates.forEach(({ elementId, animationId, updates: animUpdates }) => {
      useCanvasStore.getState().updateElementAnimation(elementId, animationId, animUpdates);
    });

    // Enhanced Timeline Manager handles batch rebuilds efficiently through caching
    rebuildTimeline();
  }, [rebuildTimeline]);

  return {
    // Canvas integration
    setCanvasRef,
    
    // Animation management
    addElementAnimation,
    addGroupAnimation,
    updateElementAnimation,
    updateGroupAnimation,
    deleteElementAnimation,
    deleteGroupAnimation,
    
    // Timeline operations
    rebuildTimeline,
    
    // Playback controls
    playbackControls,
    
    // Performance optimized methods
    updateElementAnimationOptimized,
    batchUpdateAnimations,
    
    // Timeline state
    elements,
    groups
  };
}

/**
 * Hook for timeline UI operations
 */
export function useTimelineUI() {
  return useTimelineStore((state: any) => ({
    ui: state.ui,
    tracks: state.tracks,
    playback: state.playback,

    // UI controls
    setScale: state.setScale,
    setScrollPosition: state.setScrollPosition,
    toggleTrackSelection: state.toggleTrackSelection,
    toggleAnimationSelection: state.toggleAnimationSelection,
    toggleTrackExpansion: state.toggleTrackExpansion,
    setTimelineCollapsed: state.setTimelineCollapsed,
    toggleGrid: state.toggleGrid,
    toggleSnapToGrid: state.toggleSnapToGrid,
    setGridSize: state.setGridSize,
    clearSelection: state.clearSelection,

    // Utility functions
    getTrackById: state.getTrackById,
    getTrackDuration: state.getTrackDuration,
    getTotalDuration: state.getTotalDuration,
    getTimeAtPosition: state.getTimeAtPosition,
    getPositionAtTime: state.getPositionAtTime,
  }));
}

/**
 * Hook for timeline operations (import/export, reset)
 */
export function useTimelineOperations() {
  return useTimelineStore((state: any) => ({
    exportTimeline: state.exportTimeline,
    importTimeline: state.importTimeline,
    resetTimeline: state.resetTimeline,
    isLoading: state.isLoading,
    error: state.error,
  }));
} 