# 配置管理和文件存储系统

本文档介绍了应用的配置管理和文件存储系统，包括如何通过界面配置文件存储路径以及如何使用相关功能。

## 功能特性

### 配置管理
- ✅ 自动配置文件管理
- ✅ 支持自定义存储路径
- ✅ 区分开发和生产环境
- ✅ 配置热更新
- ✅ 类型安全的配置操作

### 文件存储
- ✅ 多种文件类型支持（消息、语音、图片、视频、文件）
- ✅ 智能路径管理
- ✅ 配置驱动的存储位置
- ✅ 自动目录创建
- ✅ 文件操作结果反馈

## 系统架构

### 配置文件结构

配置文件位置：
- **开发环境**: `用户数据目录/config.json`
- **生产环境**: `安装目录/AppData/config.json`

```json
{
  "fileStorage": {
    "useCustomPath": false,
    "customPath": "/path/to/custom/storage",
    "folders": {
      "messages": "messages",
      "audio": "audio",
      "images": "images",
      "videos": "videos",
      "files": "files"
    }
  },
  "app": {
    "name": "HdSome",
    "version": "1.0.0",
    "language": "zh-CN",
    "theme": "auto"
  },
  "chat": {
    "saveMessages": true,
    "autoSaveInterval": 5,
    "maxSavedMessages": 10000
  }
}
```

### 存储目录结构

```
存储根目录/
├── messages/          # 聊天消息记录
├── audio/            # 语音文件
├── images/           # 图片文件
├── videos/           # 视频文件
└── files/            # 其他文件
```

## 快速开始

### 1. 初始化配置管理器

```typescript
import { configManager } from '../utils/configManager'

// 初始化配置管理器
const result = await configManager.initialize()
if (result.success) {
  console.log('配置初始化成功', result.config)
} else {
  console.error('配置初始化失败', result.error)
}
```

### 2. 初始化文件存储

```typescript
import { fileStorage } from '../utils/fileStorage'

// 初始化文件存储（会自动读取配置）
const result = await fileStorage.initialize()
if (result.success) {
  console.log('文件存储初始化成功')
} else {
  console.error('文件存储初始化失败', result.error)
}
```

### 3. 保存文件

```typescript
// 保存消息
const messageResult = await fileStorage.saveMessage(
  JSON.stringify({ content: '消息内容', timestamp: new Date() }),
  'message_001.json'
)

// 保存图片
const imageResult = await fileStorage.saveImage(
  imageBlob,
  'screenshot_001.png'
)

// 保存语音
const audioResult = await fileStorage.saveAudio(
  audioBuffer,
  'recording_001.wav'
)
```

### 4. 读取文件

```typescript
// 读取消息
const messageResult = await fileStorage.readFile({
  fileName: 'message_001.json',
  fileType: 'message'
})

if (messageResult.success) {
  const message = JSON.parse(messageResult.data)
  console.log('消息内容:', message)
}
```

### 5. 列出文件

```typescript
// 列出所有消息文件
const listResult = await fileStorage.listFiles({ fileType: 'message' })
if (listResult.success && listResult.files) {
  console.log('消息文件列表:', listResult.files)
}
```

## 配置管理 API

### ConfigManager 类

#### 主要方法

```typescript
// 获取单例实例
const configManager = ConfigManager.getInstance()

// 初始化配置管理器
await configManager.initialize(): Promise<ConfigOperationResult>

// 加载配置文件
await configManager.loadConfig(): Promise<ConfigOperationResult>

// 保存配置文件
await configManager.saveConfig(config?: AppConfig): Promise<ConfigOperationResult>

// 获取当前配置
configManager.getConfig(): AppConfig | null

// 更新配置
await configManager.updateConfig(updates: Partial<AppConfig>): Promise<ConfigOperationResult>

// 获取文件存储路径
await configManager.getFileStoragePath(): Promise<string>

// 设置自定义存储路径
await configManager.setCustomStoragePath(path: string): Promise<ConfigOperationResult>

// 重置为默认存储路径
await configManager.resetToDefaultStoragePath(): Promise<ConfigOperationResult>
```

## 文件存储 API

### FileStorageManager 类

#### 主要方法

```typescript
// 获取单例实例
const fileStorage = FileStorageManager.getInstance()

// 初始化文件存储
await fileStorage.initialize(): Promise<FileOperationResult>

// 获取应用数据路径
fileStorage.getAppDataPaths(): AppDataPaths | null

// 保存不同类型的文件
await fileStorage.saveMessage(data: string, fileName: string): Promise<FileOperationResult>
await fileStorage.saveAudio(data: Buffer | Uint8Array, fileName: string): Promise<FileOperationResult>
await fileStorage.saveImage(data: Blob | Buffer | Uint8Array, fileName: string): Promise<FileOperationResult>
await fileStorage.saveVideo(data: Blob | Buffer | Uint8Array, fileName: string): Promise<FileOperationResult>
await fileStorage.saveFile(data: any, fileName: string): Promise<FileOperationResult>

// 通用保存方法
await fileStorage.save(options: SaveFileOptions): Promise<FileOperationResult>

// 读取文件
await fileStorage.readFile(options: ReadFileOptions): Promise<FileOperationResult>

// 列出文件
await fileStorage.listFiles(options: ListFilesOptions): Promise<FileOperationResult>
```

## 在 React 组件中使用

### 配置设置组件

```typescript
import React from 'react'
import ConfigSettings from '../components/settings/ConfigSettings'

const MyComponent: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false)

  return (
    <div>
      <button onClick={() => setShowSettings(true)}>
        打开设置
      </button>
      
      {showSettings && (
        <ConfigSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  )
}
```

### 使用 Hook 示例

```typescript
import { useState, useEffect } from 'react'
import { configManager } from '../utils/configManager'
import { fileStorage } from '../utils/fileStorage'

const useFileStorage = () => {
  const [initialized, setInitialized] = useState(false)
  const [storagePath, setStoragePath] = useState<string>('')

  useEffect(() => {
    const init = async () => {
      // 初始化配置
      await configManager.initialize()
      
      // 初始化文件存储
      const result = await fileStorage.initialize()
      if (result.success) {
        const paths = fileStorage.getAppDataPaths()
        if (paths) {
          setStoragePath(paths.basePath)
        }
        setInitialized(true)
      }
    }
    
    init()
  }, [])

  return {
    initialized,
    storagePath,
    saveMessage: fileStorage.saveMessage.bind(fileStorage),
    saveImage: fileStorage.saveImage.bind(fileStorage),
    saveAudio: fileStorage.saveAudio.bind(fileStorage),
    listFiles: fileStorage.listFiles.bind(fileStorage)
  }
}
```

## 界面配置功能

### ConfigSettings 组件特性

- ✅ 可视化配置编辑
- ✅ 自定义存储路径设置
- ✅ 实时配置验证
- ✅ 配置保存和重置
- ✅ 错误处理和用户反馈

### 使用配置界面

1. **打开设置界面**
   ```typescript
   <ConfigSettings onClose={() => setShowSettings(false)} />
   ```

2. **设置自定义路径**
   - 勾选"使用自定义存储路径"
   - 输入或选择存储路径
   - 点击"保存设置"

3. **重置为默认路径**
   - 点击"重置为默认"按钮
   - 确认操作

## 注意事项

### 路径管理
- 自定义路径必须是有效的文件系统路径
- 应用会自动创建不存在的目录
- 路径更改后需要重新初始化文件存储

### 配置文件
- 配置文件使用 JSON 格式
- 配置更改会立即保存到磁盘
- 损坏的配置文件会自动重置为默认配置

### 错误处理
- 所有操作都返回结果对象，包含成功状态和错误信息
- 建议在 UI 中显示操作结果给用户
- 关键操作失败时应提供重试机制

### 性能考虑
- 文件操作是异步的，避免阻塞 UI
- 大文件保存时考虑显示进度
- 定期清理过期文件以节省存储空间

## 故障排除

### 常见问题

1. **配置文件加载失败**
   - 检查配置文件是否存在
   - 验证 JSON 格式是否正确
   - 尝试删除配置文件让应用重新创建

2. **文件保存失败**
   - 检查存储路径是否有写入权限
   - 确认磁盘空间是否充足
   - 验证文件名是否包含非法字符

3. **自定义路径无效**
   - 确保路径格式正确
   - 检查目录是否存在或可创建
   - 验证应用是否有访问权限

### 调试技巧

```typescript
// 启用详细日志
const result = await fileStorage.save(options)
console.log('保存结果:', result)

// 检查当前配置
const config = configManager.getConfig()
console.log('当前配置:', config)

// 检查存储路径
const paths = fileStorage.getAppDataPaths()
console.log('存储路径:', paths)
```

## 更新日志

### v1.0.0
- ✅ 初始版本发布
- ✅ 基础配置管理功能
- ✅ 文件存储系统
- ✅ 配置界面组件
- ✅ 完整的 TypeScript 支持