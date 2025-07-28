// C++ executor - Handles C++ code execution
<<<<<<< HEAD
=======
import { API } from './cpp/api.js';

>>>>>>> a744055 (playground-vite)
export class CppExecutor {
  constructor() {
    // Initialize C++ executor
  }

  initialize(): void {
    // TODO: Setup postMessage communication with core
    // TODO: Setup sandboxed execution environment (likely Emscripten/WASM)
  }

  private executeCode(code: string): void {
    // TODO: Implement C++ code execution logic
  }
}

<<<<<<< HEAD
=======
// Export a singleton API instance and a wrapper for compileLinkRun
const api = new API({ hostWrite: (msg: string) => { /* handle output */ } });

export async function compileLinkRun(contents: string, stdinStr = '') {
  return api.compileLinkRun(contents, stdinStr);
}

>>>>>>> a744055 (playground-vite)
export default CppExecutor;