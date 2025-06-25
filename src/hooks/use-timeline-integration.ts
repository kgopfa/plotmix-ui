import { useEffect, useCallback, useState } from 'react';
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

  // Enhanced canvas ref setup with automatic timeline building
  const setCanvasRef = useCallback((ref: React.RefObject<CanvasRef | null>) => {
    const state = useTimelineStore.getState();
    const managerType = state.getCurrentManagerType();
    
    // Set canvas ref for both managers
    state.gsapManager.setCanvasRef(ref);
    state.individualManager.setCanvasRef(ref);
    
    // Build initial timeline with all elements based on current manager
    if (managerType === 'individual') {
      // Use Individual Timeline Manager for initial build
      state.individualManager.clearTimeline();
      
      const elementUpdates = elements.map(element => ({
        elementId: element.id,
        animations: element.animations || []
      }));
      
      const groupUpdates = groups.map(group => ({
        groupId: group.id,
        animations: group.animations || [],
        group
      }));
      
      state.individualManager.batchUpdateElements(elementUpdates, elements);
      state.individualManager.batchUpdateGroups(groupUpdates);
      
      console.log(`🎬 Individual Timeline Manager initialized with ${elementUpdates.length} elements and ${groupUpdates.length} groups`);
    } else {
      // Use Enhanced Timeline Manager for initial build
      buildGSAPTimeline();
      console.log(`🎬 Enhanced Timeline Manager initialized with ${elements.length} elements and ${groups.length} groups`);
    }
  }, [elements, groups, buildGSAPTimeline]);

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

  // Force rebuild timeline (supports both managers)
  const rebuildTimeline = useCallback(() => {
    const state = useTimelineStore.getState();
    const managerType = state.getCurrentManagerType();

    if (managerType === 'individual') {
      // Use Individual Timeline Manager for rebuild
      state.individualManager.clearTimeline();
      const elementUpdates = elements.map(element => ({
        elementId: element.id,
        animations: element.animations || []
      }));
      const groupUpdates = groups.map(group => ({
        groupId: group.id,
        animations: group.animations || [],
        group
      }));
      state.individualManager.batchUpdateElements(elementUpdates, elements);
      state.individualManager.batchUpdateGroups(groupUpdates);
    } else {
      updateTracks();
      buildGSAPTimeline();
    }
  }, [elements, groups, updateTracks, buildGSAPTimeline]);

  // Enhanced Phase 2 methods for Individual Timeline Manager
  const updateElementAnimationOptimized = useCallback((
    elementId: string,
    animationId: string,
    updates: Partial<ElementAnimation>
  ) => {
    const state = useTimelineStore.getState();
    const managerType = state.getCurrentManagerType();

    // Update canvas store first
    useCanvasStore.getState().updateElementAnimation(elementId, animationId, updates);

    if (managerType === 'individual') {
      // Get updated element and update only its timeline
      const element = useCanvasStore.getState().elements.find(el => el.id === elementId);
      if (element) {
        state.updateElementAnimations(elementId, element.animations, state.elements);
      }
    } else {
      // Fallback to full rebuild for enhanced manager
      rebuildTimeline();
    }
  }, [rebuildTimeline]);

  const batchUpdateAnimations = useCallback((
    updates: Array<{ elementId: string, animationId: string, updates: Partial<ElementAnimation> }>
  ) => {
    const state = useTimelineStore.getState();
    const managerType = state.getCurrentManagerType();

    // Update canvas store first
    updates.forEach(({ elementId, animationId, updates: animUpdates }) => {
      useCanvasStore.getState().updateElementAnimation(elementId, animationId, animUpdates);
    });

    if (managerType === 'individual') {
      // Batch update timelines efficiently
      const elementUpdates = updates.map(({ elementId }) => {
        const element = useCanvasStore.getState().elements.find(el => el.id === elementId);
        return {
          elementId,
          animations: element?.animations || []
        };
      });

      state.batchUpdateElements(elementUpdates, state.elements);
    } else {
      // Fallback to full rebuild for enhanced manager
      rebuildTimeline();
    }
  }, [rebuildTimeline]);

  // Manager selection and performance monitoring
  const setAnimationManager = useCallback((useIndividual: boolean) => {
    const state = useTimelineStore.getState();
    state.setAnimationManager(useIndividual);
    rebuildTimeline();
  }, [rebuildTimeline]);

  const getAnimationStats = useCallback(() => {
    const state = useTimelineStore.getState();
    return state.getAnimationPerformance();
  }, []);

  const generatePerformanceReport = useCallback(() => {
    const state = useTimelineStore.getState();
    return state.generatePerformanceReport();
  }, []);

  // Performance monitoring hook - updates every second
  const [animationStats, setAnimationStats] = useState<object | null>(null);
  
  useEffect(() => {
    const updateStats = () => {
      const stats = getAnimationStats();
      setAnimationStats(stats);
    };

    // Initial stats
    updateStats();

    // Update stats every second
    const interval = setInterval(updateStats, 1000);

    return () => clearInterval(interval);
  }, [getAnimationStats]);

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

    // Phase 2 Enhanced methods
    updateElementAnimationOptimized,
    batchUpdateAnimations,
    setAnimationManager,
    getAnimationStats,
    generatePerformanceReport,

    // Canvas integration
    setCanvasRef,
    rebuildTimeline,
    
    // Performance monitoring
    animationStats,

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