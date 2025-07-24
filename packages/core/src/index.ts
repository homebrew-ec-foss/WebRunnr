// Core package - Main API facade
export interface ExecutionRequest {
  code: string;
  language: string;
}

export interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
}

export class WebRunnrCore {
  constructor() {
    // Initialize core
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // TODO: Implement execution logic
    return {
      success: false,
      error: 'Not implemented yet',
    };
  }
}

export default WebRunnrCore;