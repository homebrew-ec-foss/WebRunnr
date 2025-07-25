// Playground - Demo UI for WebRunnr
import WebRunnrCore from '@webrunnr/core';

export class Playground {
  private core: WebRunnrCore;

  constructor() {
    this.core = new WebRunnrCore();
  }

  initialize(): void {
    // TODO: Setup UI components
    // TODO: Setup code editor
    // TODO: Setup file system interface
  }

  private async runCode(code: string, language: string): Promise<void> {
    // TODO: Use core.execute() to run code
    const result = await this.core.execute({ code, language });
    // TODO: Display result in UI
  }
}

export default Playground;