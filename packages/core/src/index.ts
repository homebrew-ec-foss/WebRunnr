// Core package - Main API facade
export interface ExecutionRequest {
  code: string;
  language: string;
}

export interface ExecutionResult {
  stdout: string;
  stderr: string;
}

export class WebRunnrCore {
  constructor() {
    // Initialize core
  }

  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // TODO: Implement execution logic
    return {
      stdout: 'Not implemented yet',
      stderr: 'Execution not implemented',
    };
  }
}

export default WebRunnrCore;