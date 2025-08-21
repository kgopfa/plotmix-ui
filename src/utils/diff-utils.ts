import { DiffPatcher } from 'jsondiffpatch';

export interface DiffResult {
  delta: Record<string, unknown> | null;
  hasChanges: boolean;
  baseline: any;
  current: any;
}

/**
 * Reusable diffing utility that compares two project states
 * and returns a diff delta that can be applied to transform one state to another
 */
export class DiffUtils {
  private static patcher = new DiffPatcher({
    objectHash: (obj: any) => obj?.id ?? JSON.stringify(obj),
    arrays: { detectMove: true, includeValueOnMove: false }
  } as any);

  /**
   * Generate a diff between baseline and current project state
   */
  static generateDiff(
    baseline: any | null,
    current: any
  ): DiffResult {
    if (!baseline) {
      return {
        delta: null,
        hasChanges: true,
        baseline: {},
        current
      };
    }

    // Fast equality check
    const baselineStr = JSON.stringify(baseline);
    const currentStr = JSON.stringify(current);
    const hasChanges = baselineStr !== currentStr;

    if (!hasChanges) {
      return {
        delta: null,
        hasChanges: false,
        baseline,
        current
      };
    }

    // Generate diff delta
    let delta = this.patcher.diff(baseline, current);

    // Last resort: snapshot diff to force persistence
    if (!delta) {
      const snapshotPatcher = new DiffPatcher();
      delta = snapshotPatcher.diff({}, current);
    }

    return {
      delta: delta || null,
      hasChanges: true,
      baseline,
      current
    };
  }

  /**
   * Apply a diff delta to a baseline state to get the new state
   */
  static applyDiff(baseline: any, delta: Record<string, unknown>): any {
    try {
      return this.patcher.patch(JSON.parse(JSON.stringify(baseline)), delta);
    } catch (error) {
      console.error('Failed to apply diff:', error);
      // Fallback: return the baseline if diff application fails
      return baseline;
    }
  }

  /**
   * Check if two states are equal
   */
  static areEqual(state1: any, state2: any): boolean {
    return JSON.stringify(state1) === JSON.stringify(state2);
  }
}
