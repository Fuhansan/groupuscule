// 文件保存相关的类型定义

export type FileType = 'message' | 'audio' | 'image' | 'video' | 'file'

export interface SaveFileOptions {
  data: string | Buffer | Uint8Array | any
  fileName: string
  fileType: FileType
  encoding?: string
}

export interface ReadFileOptions {
  fileName: string
  fileType: FileType
  encoding?: string
}

export interface ListFilesOptions {
  fileType: FileType
}

export interface FileInfo {
  name: string
  path: string
  size: number
  created: Date
  modified: Date
  isDirectory: boolean
}

export interface FileOperationResult {
  success: boolean
  message: string
  error?: string
  filePath?: string
  data?: any
  files?: FileInfo[]
}

export interface AppDataPaths {
  basePath: string
  folders: {
    messages: string
    audio: string
    images: string
    videos: string
    files: string
  }
}

// 扩展现有的 ElectronAPI 接口
declare global {
  interface ElectronAPI {
    // 配置文件功能
    getConfigPath: () => Promise<{ success: boolean; configPath?: string; message: string; error?: string }>
    readConfig: () => Promise<{ success: boolean; config?: any; message: string; error?: string }>
    saveConfig: (config: any) => Promise<{ success: boolean; message: string; error?: string }>
    
    // 文件保存功能
    getAppDataPath: () => Promise<{ success: boolean; basePath?: string; folders?: { messages: string; audio: string; images: string; videos: string; files: string }; message: string; error?: string } & AppDataPaths>
    saveFile: (options: SaveFileOptions) => Promise<FileOperationResult>
    readFile: (options: ReadFileOptions) => Promise<FileOperationResult>
    listFiles: (options: ListFilesOptions) => Promise<FileOperationResult>
  }
}