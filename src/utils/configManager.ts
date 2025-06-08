import type { AppConfig, ConfigOperationResult } from '../types/config'
import { defaultConfig } from '../types/config'

// 引入 ElectronAPI 类型声明
import '../types/fileStorage'

/**
 * 配置管理器
 * 负责应用配置的读取、保存和管理
 */
export class ConfigManager {
  private static instance: ConfigManager
  private config: AppConfig | null = null
  private configPath: string = ''

  private constructor() {}

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  /**
   * 初始化配置管理器
   */
  public async initialize(): Promise<ConfigOperationResult> {
    try {
      // 获取配置文件路径
      const pathResult = await window.electronAPI.getConfigPath()
      if (!pathResult.success) {
        return {
          success: false,
          message: '获取配置文件路径失败',
          error: pathResult.error
        }
      }
      
      this.configPath = pathResult.configPath!
      
      // 尝试加载配置
      const loadResult = await this.loadConfig()
      if (!loadResult.success) {
        // 如果加载失败，创建默认配置
        const createResult = await this.createDefaultConfig()
        if (!createResult.success) {
          return createResult
        }
      }
      
      return {
        success: true,
        message: '配置管理器初始化成功',
        config: this.config!
      }
    } catch (error) {
      return {
        success: false,
        message: '配置管理器初始化失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 加载配置文件
   */
  public async loadConfig(): Promise<ConfigOperationResult> {
    try {
      const result = await window.electronAPI.readConfig()
      if (result.success && result.config) {
        this.config = result.config
        return {
          success: true,
          message: '配置加载成功',
          config: this.config || undefined
        }
      } else {
        return {
          success: false,
          message: '配置文件不存在或格式错误',
          error: result.error
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '加载配置失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 保存配置文件
   */
  public async saveConfig(config?: AppConfig): Promise<ConfigOperationResult> {
    try {
      const configToSave = config || this.config
      if (!configToSave) {
        return {
          success: false,
          message: '没有可保存的配置',
          error: '配置对象为空'
        }
      }

      const result = await window.electronAPI.saveConfig(configToSave)
      if (result.success) {
        this.config = configToSave
        return {
          success: true,
          message: '配置保存成功',
          config: this.config
        }
      } else {
        return {
          success: false,
          message: '配置保存失败',
          error: result.error
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '保存配置失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 创建默认配置文件
   */
  private async createDefaultConfig(): Promise<ConfigOperationResult> {
    try {
      const result = await window.electronAPI.saveConfig(defaultConfig)
      if (result.success) {
        this.config = defaultConfig
        return {
          success: true,
          message: '默认配置创建成功',
          config: this.config
        }
      } else {
        return {
          success: false,
          message: '创建默认配置失败',
          error: result.error
        }
      }
    } catch (error) {
      return {
        success: false,
        message: '创建默认配置失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取当前配置
   */
  public getConfig(): AppConfig | null {
    return this.config
  }

  /**
   * 更新配置
   */
  public async updateConfig(updates: Partial<AppConfig>): Promise<ConfigOperationResult> {
    try {
      if (!this.config) {
        return {
          success: false,
          message: '配置未初始化',
          error: '请先初始化配置管理器'
        }
      }

      // 深度合并配置
      const newConfig = this.deepMerge(this.config, updates)
      return await this.saveConfig(newConfig)
    } catch (error) {
      return {
        success: false,
        message: '更新配置失败',
        error: error instanceof Error ? error.message : String(error)
      }
    }
  }

  /**
   * 获取文件存储路径
   */
  public async getFileStoragePath(): Promise<string> {
    if (!this.config) {
      throw new Error('配置未初始化')
    }

    if (this.config.fileStorage.useCustomPath && this.config.fileStorage.customPath) {
      return this.config.fileStorage.customPath
    }

    // 使用默认路径
    const pathResult = await window.electronAPI.getAppDataPath()
    if (!pathResult.success) {
      throw new Error('获取默认存储路径失败')
    }

    return pathResult.basePath!
  }

  /**
   * 设置自定义存储路径
   */
  public async setCustomStoragePath(path: string): Promise<ConfigOperationResult> {
    if (!this.config) {
      return {
        success: false,
        message: '配置未初始化',
        error: '请先初始化配置管理器'
      }
    }
    
    return await this.updateConfig({
      fileStorage: {
        ...this.config.fileStorage,
        customPath: path,
        useCustomPath: true
      }
    })
  }

  /**
   * 重置为默认存储路径
   */
  public async resetToDefaultStoragePath(): Promise<ConfigOperationResult> {
    if (!this.config) {
      return {
        success: false,
        message: '配置未初始化',
        error: '请先初始化配置管理器'
      }
    }
    
    return await this.updateConfig({
      fileStorage: {
        ...this.config.fileStorage,
        useCustomPath: false,
        customPath: undefined
      }
    })
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    const result = { ...target }
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key])
      } else {
        result[key] = source[key]
      }
    }
    
    return result
  }
}

// 导出单例实例
export const configManager = ConfigManager.getInstance()