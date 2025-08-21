export interface CodeExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  executionTime: number;
}

export interface ProjectData {
  groups: any[];
  elements: any[];
  timeline: {
    scale: number;
    duration: number;
    currentTime: number;
    animationStates: Record<string, any>;
  };
}

/**
 * Safe code execution utility that runs JavaScript code
 * with access to project data in a controlled environment
 */
export class CodeExecutor {
  /**
   * Execute JavaScript code with access to project data
   */
  static execute(
    code: string,
    projectData: ProjectData,
    setResult: (result: any) => void,
    setError: (error: string | null) => void
  ): CodeExecutionResult {
    const startTime = performance.now();
    
    try {
      // Create a safe execution environment
      const safeProjectData = JSON.parse(JSON.stringify(projectData));
      
      // Create the execution function with access to project data and result setters
      const executeFunction = new Function(
        'project',
        'setResult', 
        'setError',
        'console',
        code
      );

      // Execute the code
      executeFunction(
        safeProjectData,
        setResult,
        setError,
        console
      );

      const executionTime = performance.now() - startTime;

      return {
        success: true,
        executionTime
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        executionTime
      };
    }
  }

  /**
   * Validate JavaScript code syntax without executing it
   */
  static validateSyntax(code: string): { isValid: boolean; error?: string } {
    try {
      new Function(code);
      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Invalid syntax'
      };
    }
  }

  /**
   * Sanitize code to remove potentially dangerous patterns
   */
  static sanitizeCode(code: string): string {
    // Remove any import/require statements
    let sanitized = code.replace(/import\s+.*?from\s+['"][^'"]*['"];?/g, '');
    sanitized = sanitized.replace(/require\s*\([^)]*\);?/g, '');
    
    // Remove eval calls
    sanitized = sanitized.replace(/eval\s*\(/g, '/* eval removed */(');
    
    // Remove Function constructor calls
    sanitized = sanitized.replace(/new\s+Function\s*\(/g, '/* Function constructor removed */(');
    
    return sanitized.trim();
  }
}
