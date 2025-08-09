// File Manager - Clean file import/export functionality
import type { FileManagerOptions, SupportedFileType, FileData, ExportOptions } from './types';

export class FileManager {
  private options: FileManagerOptions;
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

  constructor(options: FileManagerOptions = {}) {
    this.options = options;
  }

  /**
   * Import file - creates file input and handles selection
   */
  async importFile(): Promise<void> {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = this.getAcceptString();
    input.style.display = 'none';
    
    return new Promise((resolve, reject) => {
      input.onchange = async (e) => {
        try {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            await this.processFile(file);
          }
          resolve();
        } catch (error) {
          reject(error);
        } finally {
          document.body.removeChild(input);
        }
      };
      
      input.oncancel = () => {
        document.body.removeChild(input);
        resolve();
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
      const fileName = options.fileName || `code.${extension}`;
      
      const blob = new Blob([content], { type: 'text/plain' });
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
      this.handleError(`Export failed: ${error}`);
    }
  }

  /**
   * Process dropped or selected file
   */
  async processFile(file: File): Promise<void> {
    if (!this.isSupported(file.name)) {
      this.handleError('Unsupported file type');
      return;
    }

    try {
      const content = await this.readFile(file);
      const language = this.getLanguage(file.name);
      
      this.options.onFileImported?.(content, file.name, file.name, language);
    } catch (error) {
      this.handleError(`Failed to read file: ${error}`);
    }
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
          reject('Failed to read file');
        }
      };
      reader.onerror = () => reject('File read error');
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
   * Get supported file types
   */
  getSupportedTypes(): SupportedFileType[] {
    return [...this.supportedTypes];
  }
}