// Type definitions for WebRunnr Playground File Management

export interface FileManagerOptions {
  onFileImported?: (content: string, fileName: string, filePath: string, language: string) => void;
  onFileExported?: (fileName: string) => void;
  onError?: (error: string) => void;
}

export interface SupportedFileType {
  extension: string;
  language: string;
  description: string;
}

export interface FileData {
  name: string;
  content: string;
  size: number;
  language: string;
}

export interface ExportOptions {
  fileName?: string;
  language: string;
}

export interface PlaygroundOptions {
  onOutput?: (output: string, isError?: boolean) => void;
  onInputRequest?: (message: string) => Promise<string>;
  fileManager?: FileManagerOptions;
}