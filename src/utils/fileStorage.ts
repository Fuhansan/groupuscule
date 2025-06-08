import type { 
  FileType, 
  SaveFileOptions, 
  ReadFileOptions, 
  ListFilesOptions, 
  FileInfo, 
  FileOperationResult, 
  AppDataPaths 
} from '../types/fileStorage'

// 注意：在浏览器环境中，我们不能直接使用 Node.js 的 path 模块
// 这里我们创建一个简单的 path.join 实现
const path = {
  join: (...paths: string[]) => {
    return paths.join('/').replace(/\/+/g, '/').replace(/\/$/, '') || '/'
  }
}

/**
 * 文件保存工具类
 * 提供聊天消息记录、语音、图片、视频、文件的保存和读取功能
 */
export class FileStorageManager {
  private static instance: FileStorageManager
  private appDataPaths: AppDataPaths | null = null

  private constructor() {}

  public static getInstance(): FileStorageManager {
    if (!FileStorageManager.instance) {
      FileStorageManager.instance = new FileStorageManager()
    }
    return FileStorageManager.instance
  }

  /**
   * 初始化应用数据路径
   */
  public async initialize(): Promise<FileOperationResult> {
    try {
      // 首先尝试从配置文件读取自定义路径
      const configResult = await window.electronAPI.readConfig()
      let customPath: string | undefined
      let useCustomPath = false
      
      if (configResult.success && configResult.config) {
        const config = configResult.config
        if (config.fileStorage?.useCustomPath && config.fileStorage?.customPath) {
          customPath = config.fileStorage.customPath
          useCustomPath = true
        }
      }
      
      if (useCustomPath && customPath) {
        // 使用自定义路径
        this.appDataPaths = {
          basePath: customPath,
          folders: {
            messages: path.join(customPath, 'messages'),
            audio: path.join(customPath, 'audio'),
            images: path.join(customPath, 'images'),
            videos: path.join(customPath, 'videos'),
            files: path.join(customPath, 'files')
          }
        }
      } else {
        // 使用默认路径
        const result = await window.electronAPI.getAppDataPath()
        if (!result.success) {
          return {
            success: false,
            message: '获取默认存储路径失败',
            error: result.error
          }
        }
        this.appDataPaths = result
      }
      
      return {
        success: true,
        message: '文件存储初始化成功'
      }
    } catch (error) {
      return {
        success: false,
        message: '文件存储初始化失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取应用数据路径
   */
  public async getAppDataPaths(): Promise<AppDataPaths> {
    if (!this.appDataPaths) {
      await this.initialize()
    }
    return this.appDataPaths!
  }

  /**
   * 保存聊天消息记录
   */
  public async saveMessage(fileName: string, messageData: any): Promise<FileOperationResult> {
    const data = typeof messageData === 'string' ? messageData : JSON.stringify(messageData, null, 2)
    return this.saveFile({
      data,
      fileName: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
      fileType: 'message'
    })
  }

  /**
   * 保存语音文件
   */
  public async saveAudio(fileName: string, audioData: Buffer | Uint8Array): Promise<FileOperationResult> {
    return this.saveFile({
      data: audioData,
      fileName,
      fileType: 'audio'
    })
  }

  /**
   * 保存图片文件
   */
  public async saveImage(fileName: string, imageData: Buffer | Uint8Array | string): Promise<FileOperationResult> {
    return this.saveFile({
      data: imageData,
      fileName,
      fileType: 'image'
    })
  }

  /**
   * 保存视频文件
   */
  public async saveVideo(fileName: string, videoData: Buffer | Uint8Array): Promise<FileOperationResult> {
    return this.saveFile({
      data: videoData,
      fileName,
      fileType: 'video'
    })
  }

  /**
   * 保存普通文件
   */
  public async saveGeneralFile(fileName: string, fileData: Buffer | Uint8Array | string): Promise<FileOperationResult> {
    return this.saveFile({
      data: fileData,
      fileName,
      fileType: 'file'
    })
  }

  /**
   * 通用保存文件方法
   */
  public async saveFile(options: SaveFileOptions): Promise<FileOperationResult> {
    try {
      return await window.electronAPI.saveFile(options)
    } catch (error) {
      console.error('Failed to save file:', error)
      return {
        success: false,
        message: '文件保存失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 读取聊天消息记录
   */
  public async readMessage(fileName: string): Promise<FileOperationResult> {
    return this.readFile({
      fileName: fileName.endsWith('.json') ? fileName : `${fileName}.json`,
      fileType: 'message'
    })
  }

  /**
   * 读取文件
   */
  public async readFile(options: ReadFileOptions): Promise<FileOperationResult> {
    try {
      return await window.electronAPI.readFile(options)
    } catch (error) {
      console.error('Failed to read file:', error)
      return {
        success: false,
        message: '文件读取失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 列出指定类型的所有文件
   */
  public async listFiles(fileType: FileType): Promise<FileOperationResult> {
    try {
      return await window.electronAPI.listFiles({ fileType })
    } catch (error) {
      console.error('Failed to list files:', error)
      return {
        success: false,
        message: '文件列表获取失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 列出所有聊天消息记录文件
   */
  public async listMessageFiles(): Promise<FileOperationResult> {
    return this.listFiles('message')
  }

  /**
   * 列出所有语音文件
   */
  public async listAudioFiles(): Promise<FileOperationResult> {
    return this.listFiles('audio')
  }

  /**
   * 列出所有图片文件
   */
  public async listImageFiles(): Promise<FileOperationResult> {
    return this.listFiles('image')
  }

  /**
   * 列出所有视频文件
   */
  public async listVideoFiles(): Promise<FileOperationResult> {
    return this.listFiles('video')
  }

  /**
   * 列出所有普通文件
   */
  public async listGeneralFiles(): Promise<FileOperationResult> {
    return this.listFiles('file')
  }

  /**
   * 生成带时间戳的文件名
   */
  public generateTimestampFileName(prefix: string, extension: string): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    return `${prefix}_${timestamp}.${extension}`
  }

  /**
   * 将 Blob 转换为 Buffer
   */
  public async blobToBuffer(blob: Blob): Promise<Buffer> {
    const arrayBuffer = await blob.arrayBuffer()
    return Buffer.from(arrayBuffer)
  }

  /**
   * 将 Base64 字符串转换为 Buffer
   */
  public base64ToBuffer(base64: string): Buffer {
    // 移除 data URL 前缀（如果存在）
    const base64Data = base64.replace(/^data:[^;]+;base64,/, '')
    return Buffer.from(base64Data, 'base64')
  }
}

// 导出单例实例
export const fileStorage = FileStorageManager.getInstance()