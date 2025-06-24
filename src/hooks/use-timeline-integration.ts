import { useEffect, useCallback } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { 
  useTimelineStore, 
  useTimelineSync, 
  useTimelinePlayback, 
  useTimelineTracks,
  useTimelineAnimations 
} from '@/stores/useTimelineStore';
import { ElementAnimation } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';

/**
 * Integration hook that connects the timeline store with the canvas store
 * and provides a unified interface for timeline operations
 */
export function useTimelineIntegration() {
  const { elements, groups } = useCanvasStore();
  const { 
    initializeSubscriptions, 
    cleanupSubscriptions, 
    buildGSAPTimeline,
    isLoading,
    error 
  } = useTimelineSync();
  
  const playbackControls = useTimelinePlayback();
  const { setElements, setGroups, updateTracks } = useTimelineTracks();
  const animationControls = useTimelineAnimations();

  // Initialize timeline subscriptions when the hook mounts
  useEffect(() => {
    initializeSubscriptions();
    
    // Cleanup subscriptions on unmount
    return () => {
      cleanupSubscriptions();
    };
  }, [initializeSubscriptions, cleanupSubscriptions]);

  // Sync canvas store data with timeline store
  useEffect(() => {
    setElements(elements);
    setGroups(groups);
  }, [elements, groups, setElements, setGroups]);

  // Canvas ref integration
  const setCanvasRef = useCallback((ref: React.RefObject<CanvasRef | null>) => {
    const gsapManager = useTimelineStore.getState().gsapManager;
    gsapManager.setCanvasRef(ref);
    buildGSAPTimeline();
  }, [buildGSAPTimeline]);

  // Enhanced animation handlers that sync with both stores
  const addElementAnimation = useCallback((elementId: string, animation: ElementAnimation) => {
    // Update canvas store
    useCanvasStore.getState().addElementAnimation(elementId, animation);
    // Timeline store will be updated automatically through subscription
  }, []);

  const updateElementAnimation = useCallback((
    elementId: string, 
    animationId: string, 
    updates: Partial<ElementAnimation>
  ) => {
    // Update canvas store
    useCanvasStore.getState().updateElementAnimation(elementId, animationId, updates);
    // Timeline store will be updated automatically through subscription
  }, []);

  const removeElementAnimation = useCallback((elementId: string, animationId: string) => {
    // Update canvas store
    useCanvasStore.getState().removeElementAnimation(elementId, animationId);
    // Timeline store will be updated automatically through subscription
  }, []);

  const addGroupAnimation = useCallback((groupId: string, animation: ElementAnimation) => {
    // Update canvas store
    useCanvasStore.getState().addGroupAnimation(groupId, animation);
    // Timeline store will be updated automatically through subscription
  }, []);

  const updateGroupAnimation = useCallback((
    groupId: string, 
    animationId: string, 
    updates: Partial<ElementAnimation>
  ) => {
    // Update canvas store
    useCanvasStore.getState().updateGroupAnimation(groupId, animationId, updates);
    // Timeline store will be updated automatically through subscription
  }, []);

  const removeGroupAnimation = useCallback((groupId: string, animationId: string) => {
    // Update canvas store
    useCanvasStore.getState().removeGroupAnimation(groupId, animationId);
    // Timeline store will be updated automatically through subscription
  }, []);

  // Timeline-specific animation operations
  const duplicateElementAnimation = useCallback((elementId: string, animationId: string) => {
    animationControls.duplicateAnimation(elementId, animationId, 'element');
  }, [animationControls]);

  const duplicateGroupAnimation = useCallback((groupId: string, animationId: string) => {
    animationControls.duplicateAnimation(groupId, animationId, 'group');
  }, [animationControls]);

  // Playback control wrappers that ensure GSAP timeline is built
  const play = useCallback(() => {
    buildGSAPTimeline();
    playbackControls.play();
  }, [buildGSAPTimeline, playbackControls]);

  const pause = useCallback(() => {
    playbackControls.pause();
  }, [playbackControls]);

  const stop = useCallback(() => {
    playbackControls.stop();
  }, [playbackControls]);

  const seek = useCallback((time: number) => {
    playbackControls.seek(time);
  }, [playbackControls]);

  // Force rebuild GSAP timeline (useful after major changes)
  const rebuildTimeline = useCallback(() => {
    updateTracks();
    buildGSAPTimeline();
  }, [updateTracks, buildGSAPTimeline]);

  return {
    // Playback controls
    playback: playbackControls.playback,
    play,
    pause,
    stop,
    seek,
    setPlaybackSpeed: playbackControls.setPlaybackSpeed,

    // Animation management (enhanced with canvas store sync)
    addElementAnimation,
    updateElementAnimation,
    removeElementAnimation,
    addGroupAnimation,
    updateGroupAnimation,
    removeGroupAnimation,
    duplicateElementAnimation,
    duplicateGroupAnimation,

    // Canvas integration
    setCanvasRef,
    rebuildTimeline,

    // State
    isLoading,
    error,

    // Direct access to timeline store actions
    timelineStore: {
      addAnimation: animationControls.addAnimation,
      updateAnimation: animationControls.updateAnimation,
      removeAnimation: animationControls.removeAnimation,
      duplicateAnimation: animationControls.duplicateAnimation,
      getAnimationById: animationControls.getAnimationById,
    },
  };
}

/**
 * Hook for timeline UI operations
 */
export function useTimelineUI() {
  return useTimelineStore((state) => ({
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
  return useTimelineStore((state) => ({
    exportTimeline: state.exportTimeline,
    importTimeline: state.importTimeline,
    resetTimeline: state.resetTimeline,
    isLoading: state.isLoading,
    error: state.error,
  }));
} 