// Enhanced Playground - Multi-language code execution interface with file management
import { WebRunnrCore } from '@webrunnr/core';
import type { FileManagerOptions, SupportedFileType, ExportOptions } from './types';

export interface PlaygroundOptions {
  onOutput?: (output: string, isError?: boolean) => void;
  onInputRequest?: (message: string) => Promise<string>;
  onFileImported?: (content: string, fileName: string, filePath: string, language: string) => void;
  onFileExported?: (fileName: string) => void;
  onFileError?: (error: string) => void;
}

export interface FileInfo {
  name: string;
  path: string;
  content: string;
  language: string;
  size: number;
  lastModified: Date;
}

export class FileManager {
  private supportedTypes: SupportedFileType[] = [
    { extension: 'js', language: 'javascript', description: 'JavaScript' },
    { extension: 'ts', language: 'javascript', description: 'TypeScript' },
    { extension: 'py', language: 'python', description: 'Python' },
    { extension: 'go', language: 'go', description: 'Go' },
    { extension: 'java', language: 'java', description: 'Java' },
    { extension: 'c', language: 'c', description: 'C' },
    { extension: 'cpp', language: 'cpp', description: 'C++' },
    { extension: 'cc', language: 'cpp', description: 'C++' },
    { extension: 'rs', language: 'rust', description: 'Rust' },
    { extension: 'txt', language: 'javascript', description: 'Text' },
  ];

  private currentFile: FileInfo | null = null;
  private options: FileManagerOptions;

  constructor(options: FileManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Import file - creates file input and handles selection
   */
  async importFile(): Promise<FileInfo | null> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.getAcceptString();
    input.style.display = 'none';
    
    return new Promise((resolve, reject) => {
      input.onchange = async (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const fileInfo = await this.processFile(file);
            resolve(fileInfo);
          } else {
            resolve(null);
          }
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve(null);
      };
      
      document.body.appendChild(input);
      input.click();
    });
  }

  /**
   * Export current code to file
   */
  exportFile(content: string, options: ExportOptions): void {
    try {
      const extension = this.getExtensionForLanguage(options.language);
      // Use current file name if available, otherwise generate default
      const fileName = options.fileName || 
                     this.currentFile?.name || 
                     `code.${extension}`;
      
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      this.options.onFileExported?.(fileName);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.handleError(`Export failed: ${errorMessage}`);
    }
  }

  /**
   * Process dropped or selected file
   */
  async processFile(file: File): Promise<FileInfo> {
    if (!this.isSupported(file.name)) {
      throw new Error('Unsupported file type');
    }

    try {
      const content = await this.readFile(file);
      const language = this.getLanguage(file.name);
      
      // Create file info object
      const fileInfo: FileInfo = {
        name: file.name,
        path: file.webkitRelativePath || file.name, // Full path if available
        content,
        language,
        size: file.size,
        lastModified: new Date(file.lastModified)
      };
      
      this.currentFile = fileInfo;
      this.options.onFileImported?.(content, file.name, fileInfo.path, language);
      
      return fileInfo;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to read file: ${errorMessage}`);
    }
  }

  /**
   * Handle drag and drop files
   */
  async handleDrop(event: DragEvent): Promise<FileInfo | null> {
    event.preventDefault();
    event.stopPropagation();
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      try {
        return await this.processFile(files[0]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this.handleError(`Drop failed: ${errorMessage}`);
        return null;
      }
    }
    return null;
  }

  /**
   * Read file content as text
   */
  private readFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      reader.onerror = () => reject(new Error('File read error'));
      reader.readAsText(file);
    });
  }

  /**
   * Get file extension for language
   */
  private getExtensionForLanguage(language: string): string {
    const type = this.supportedTypes.find(t => t.language === language);
    return type?.extension || 'txt';
  }

  /**
   * Get language from file name
   */
  private getLanguage(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const type = this.supportedTypes.find(t => t.extension === ext);
    return type?.language || 'javascript';
  }

  /**
   * Check if file type is supported
   */
  private isSupported(fileName: string): boolean {
    const ext = fileName.split('.').pop()?.toLowerCase();
    return this.supportedTypes.some(t => t.extension === ext);
  }

  /**
   * Get accept string for file input
   */
  private getAcceptString(): string {
    return this.supportedTypes.map(t => `.${t.extension}`).join(',');
  }

  /**
   * Handle errors
   */
  private handleError(message: string): void {
    console.error(message);
    this.options.onError?.(message);
  }

  /**
   * Get current file info
   */
  getCurrentFile(): FileInfo | null {
    return this.currentFile;
  }

  /**
   * Clear current file
   */
  clearCurrentFile(): void {
    this.currentFile = null;
  }

  /**
   * Get supported file types
   */
  getSupportedTypes(): SupportedFileType[] {
    return [...this.supportedTypes];
  }
}

export class Playground {
  private core: WebRunnrCore;
  private fileManager: FileManager;
  private options: PlaygroundOptions;
  private isExecuting = false;
  private inputRequestHandler?: (message: string) => Promise<string>;

  constructor(options: PlaygroundOptions = {}) {
    this.core = new WebRunnrCore();
    this.options = options;
    this.fileManager = new FileManager({
      onFileImported: options.onFileImported,
      onFileExported: options.onFileExported,
      onError: options.onFileError
    });
    this.setupCore();
  }

  /**
   * Set up core input handling
   */
  private setupCore(): void {
    this.core.onInputRequest(async (message) => {
      try {
        // Use provided input handler or show browser prompt as fallback
        const input = this.inputRequestHandler 
          ? await this.inputRequestHandler(message)
          : this.options.onInputRequest 
            ? await this.options.onInputRequest(message)
            : await this.showBrowserPrompt(message);
        
        this.core.provideInput(input);
      } catch (error) {
        // If input fails, provide empty string to continue execution
        console.error('Input request failed:', error);
        this.core.provideInput('');
      }
    });
  }

  /**
   * Fallback browser prompt for input requests
   */
  private async showBrowserPrompt(message: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const input = window.prompt(message);
        resolve(input || '');
      }, 0);
    });
  }

  /**
   * Set custom input handler for interactive operations
   * @param handler Function that handles input requests and returns user input
   */
  setInputHandler(handler: (message: string) => Promise<string>): void {
    this.inputRequestHandler = handler;
  }

  /**
   * Import a file using file manager
   */
  async importFile(): Promise<FileInfo | null> {
    return await this.fileManager.importFile();
  }

  /**
   * Export current code to file
   */
  exportFile(content: string, language: string, fileName?: string): void {
    this.fileManager.exportFile(content, { language, fileName });
  }

  /**
   * Handle file drop events
   */
  async handleFileDrop(event: DragEvent): Promise<FileInfo | null> {
    return await this.fileManager.handleDrop(event);
  }

  /**
   * Execute code with full multi-language support
   * @param code The code to execute
   * @param language The programming language
   */
  async runCode(code: string, language: string): Promise<void> {
    if (this.isExecuting) {
      throw new Error('Code is already executing. Please wait for completion.');
    }

    this.isExecuting = true;

    try {
      // Add file info to output if available
      const currentFile = this.fileManager.getCurrentFile();
      if (currentFile && this.options.onOutput) {
        this.options.onOutput(`Executing ${language} code (${currentFile.path})...`, false);
      }

      const result = await this.core.execute({ code, language });
      
      // Output stdout
      if (result.stdout) {
        this.options.onOutput?.(result.stdout, false);
      }
      
      // Output stderr
      if (result.stderr) {
        this.options.onOutput?.(result.stderr, true);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.options.onOutput?.(errorMessage, true);
      throw error;
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Execute code and return the result
   * @param code The code to execute
   * @param language The programming language
   * @returns Promise with execution result
   */
  async execute(code: string, language: string): Promise<{stdout: string, stderr: string}> {
    if (this.isExecuting) {
      throw new Error('Code is already executing. Please wait for completion.');
    }

    this.isExecuting = true;

    try {
      return await this.core.execute({ code, language });
    } finally {
      this.isExecuting = false;
    }
  }

  /**
   * Check if code is currently executing
   */
  isRunning(): boolean {
    return this.isExecuting;
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages(): string[] {
    return this.core.getSupportedLanguages();
  }

  /**
   * Check if a language is supported
   */
  isLanguageSupported(language: string): boolean {
    return this.core.isLanguageSupported(language);
  }

  /**
   * Get current file information
   */
  getCurrentFile(): FileInfo | null {
    return this.fileManager.getCurrentFile();
  }

  /**
   * Clear current file
   */
  clearCurrentFile(): void {
    this.fileManager.clearCurrentFile();
  }

  /**
   * Get file manager instance
   */
  getFileManager(): FileManager {
    return this.fileManager;
  }

  /**
   * Get supported file types for import
   */
  getSupportedFileTypes(): SupportedFileType[] {
    return this.fileManager.getSupportedTypes();
  }
}

export default Playground;