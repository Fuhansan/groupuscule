// 配置文件类型定义

export interface AppConfig {
  // 文件存储配置
  fileStorage: {
    // 自定义存储路径，如果为空则使用默认路径
    customPath?: string
    // 是否使用自定义路径
    useCustomPath: boolean
    // 各类型文件的子文件夹名称
    folders: {
      messages: string
      audio: string
      images: string
      videos: string
      files: string
    }
  }
  // 应用设置
  app: {
    // 应用名称
    name: string
    // 版本
    version: string
    // 语言设置
    language: string
    // 主题设置
    theme: 'light' | 'dark' | 'auto'
  }
  // 聊天设置
  chat: {
    // 消息保存设置
    saveMessages: boolean
    // 自动保存间隔（分钟）
    autoSaveInterval: number
    // 最大保存消息数量
    maxSavedMessages: number
  }
}

// 默认配置
export const defaultConfig: AppConfig = {
  fileStorage: {
    useCustomPath: false,
    folders: {
      messages: 'messages',
      audio: 'audio',
      images: 'images',
      videos: 'videos',
      files: 'files'
    }
  },
  app: {
    name: 'HdSome',
    version: '1.0.0',
    language: 'zh-CN',
    theme: 'auto'
  },
  chat: {
    saveMessages: true,
    autoSaveInterval: 5,
    maxSavedMessages: 10000
  }
}

// 配置操作结果
export interface ConfigOperationResult {
  success: boolean
  message: string
  error?: string
  config?: AppConfig
}