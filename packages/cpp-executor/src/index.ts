// import { LanguageExecutor, ExecutionResult } from '@webrunnr/core'
import { API } from './api'

interface LanguageExecutor {
  initialize(): Promise<void>;
  execute(
    code: string,
    inputCallback: (message: string) => void
  ): Promise<ExecutionResult>;
  provideInput(input: string): void;
  destroy?(): void;
}

interface ExecutionResult {
  stdout: string;
  stderr: string;
}

function extractProgramOutput(log: string) {
  // Remove ANSI escape codes
  const cleanLog = log.replace(/\x1b\[[0-9;]*m/g, '');

  // Match everything that comes *after* "> test.wasm"
  const match = cleanLog.match(/> *test\.wasm(.*)/s);
  if (!match) return '';

  // Clean up extra whitespace and return only the actual program output
  return match[1].trim();
}




export class CppExecutor implements LanguageExecutor {
  private api?: API
  private stdinQueue: string[] = []
  private stdoutBuffer = ''
  private stderrBuffer = ''

  constructor() {}

  async initialize(): Promise<void> {
    this.api = new API({
      hostWrite: (msg: string) => {
        this.stdoutBuffer += msg
      },
      showTiming: false,
    })
    // Wait for memfs + sysroot to be ready
    await this.api.ready
  }

  provideInput(input: string): void {
    this.stdinQueue.push(input + '\n')
  }

  async execute(
    code: string,
    inputCallback: (message: string) => void
  ): Promise<ExecutionResult> {
    if (!this.api) throw new Error('CppExecutor not initialized')

    // Combine all queued input
    const stdinStr = this.stdinQueue.join('')
    this.stdinQueue = []

    this.stdoutBuffer = ''
    this.stderrBuffer = ''

    try {
      const app = await this.api.compileLinkRun(code, stdinStr)
      if (!app) {
        return { stdout: extractProgramOutput(this.stdoutBuffer), stderr: this.stderrBuffer }
      }

      // Optionally, handle runtime errors if app exposes them
      return { stdout: extractProgramOutput(this.stdoutBuffer), stderr: this.stderrBuffer }
    } catch (err) {
      return {
        stdout: extractProgramOutput(this.stdoutBuffer),
        stderr: err instanceof Error ? err.message : String(err),
      }
    }
  }

  destroy(): void {
    this.api = undefined
    this.stdinQueue = []
    this.stdoutBuffer = ''
    this.stderrBuffer = ''
  }
}

export default CppExecutor
