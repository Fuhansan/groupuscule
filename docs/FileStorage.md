# 文件保存功能使用指南

本项目提供了完整的文件保存功能，支持保存聊天消息记录、语音、图片、视频和普通文件到本地存储。

## 功能特性

- 🗂️ **分类存储**: 自动将不同类型的文件保存到对应的文件夹
- 📁 **智能路径**: 根据安装状态自动选择合适的存储路径
- 🔒 **类型安全**: 完整的 TypeScript 类型定义
- 🛠️ **易于使用**: 提供简洁的 API 接口
- 📊 **文件管理**: 支持文件列表、读取等操作

## 存储结构

### 安装版本
```
%APPDATA%/[应用名称]/
├── messages/     # 聊天消息记录
├── audio/        # 语音文件
├── images/       # 图片文件
├── videos/       # 视频文件
└── files/        # 普通文件
```

### 开发版本
```
%USERPROFILE%/AppData/HdSome/
├── messages/     # 聊天消息记录
├── audio/        # 语音文件
├── images/       # 图片文件
├── videos/       # 视频文件
└── files/        # 普通文件
```

## 快速开始

### 1. 导入文件存储工具

```typescript
import { fileStorage } from '../utils/fileStorage'
import { useFileStorage } from '../examples/fileStorageExample'
```

### 2. 初始化存储

```typescript
// 在应用启动时初始化
const initStorage = async () => {
  try {
    const paths = await fileStorage.initialize()
    console.log('存储路径:', paths)
  } catch (error) {
    console.error('初始化失败:', error)
  }
}
```

### 3. 保存文件

#### 保存聊天消息记录

```typescript
const saveMessage = async () => {
  const messageData = {
    timestamp: new Date().toISOString(),
    sender: 'user123',
    receiver: 'friend456',
    messages: [
      {
        id: '1',
        type: 'text',
        content: '你好！',
        timestamp: new Date().toISOString(),
        sender: 'user123'
      }
    ]
  }

  const fileName = fileStorage.generateTimestampFileName('chat_user123_friend456', 'json')
  const result = await fileStorage.saveMessage(fileName, messageData)
  
  if (result.success) {
    console.log('保存成功:', result.filePath)
  }
}
```

#### 保存语音文件

```typescript
const saveAudio = async (audioBlob: Blob) => {
  const fileName = fileStorage.generateTimestampFileName('voice_message', 'webm')
  const audioBuffer = await fileStorage.blobToBuffer(audioBlob)
  
  const result = await fileStorage.saveAudio(fileName, audioBuffer)
  
  if (result.success) {
    console.log('语音保存成功:', result.filePath)
  }
}
```

#### 保存图片文件

```typescript
// 从 Base64 保存
const saveImageFromBase64 = async (base64Data: string) => {
  const imageBuffer = fileStorage.base64ToBuffer(base64Data)
  const fileName = fileStorage.generateTimestampFileName('image', 'png')
  
  const result = await fileStorage.saveImage(fileName, imageBuffer)
  return result
}

// 从 Blob 保存
const saveImageFromBlob = async (imageBlob: Blob) => {
  const imageBuffer = await fileStorage.blobToBuffer(imageBlob)
  const fileName = fileStorage.generateTimestampFileName('image', 'jpg')
  
  const result = await fileStorage.saveImage(fileName, imageBuffer)
  return result
}
```

#### 保存视频文件

```typescript
const saveVideo = async (videoBlob: Blob) => {
  const fileName = fileStorage.generateTimestampFileName('video_recording', 'webm')
  const videoBuffer = await fileStorage.blobToBuffer(videoBlob)
  
  const result = await fileStorage.saveVideo(fileName, videoBuffer)
  
  if (result.success) {
    console.log('视频保存成功:', result.filePath)
  }
}
```

#### 保存普通文件

```typescript
const saveFile = async (file: File) => {
  const fileBuffer = await fileStorage.blobToBuffer(file)
  const fileName = `${Date.now()}_${file.name}`
  
  const result = await fileStorage.saveGeneralFile(fileName, fileBuffer)
  return result
}
```

### 4. 读取文件

```typescript
// 读取聊天记录
const readMessage = async (fileName: string) => {
  const result = await fileStorage.readMessage(fileName)
  
  if (result.success) {
    const messageData = JSON.parse(result.data)
    console.log('聊天记录:', messageData)
  }
}

// 读取其他文件
const readFile = async (fileName: string, fileType: FileType) => {
  const result = await fileStorage.readFile({
    fileName,
    fileType,
    encoding: 'utf8' // 文本文件使用 utf8，二进制文件可以省略
  })
  
  return result
}
```

### 5. 列出文件

```typescript
// 列出所有聊天记录
const listMessages = async () => {
  const result = await fileStorage.listMessageFiles()
  
  if (result.success) {
    console.log('聊天记录文件:', result.files)
  }
}

// 列出所有语音文件
const listAudios = async () => {
  const result = await fileStorage.listAudioFiles()
  return result
}

// 列出指定类型的文件
const listFilesByType = async (fileType: FileType) => {
  const result = await fileStorage.listFiles(fileType)
  return result
}
```

## 在 React 组件中使用

```typescript
import React, { useEffect, useState } from 'react'
import { useFileStorage } from '../examples/fileStorageExample'
import { FileInfo } from '../types/fileStorage'

const FileManagerComponent: React.FC = () => {
  const { saveMessage, saveAudio, listMessages, fileStorage } = useFileStorage()
  const [messageFiles, setMessageFiles] = useState<FileInfo[]>([])

  useEffect(() => {
    // 初始化并加载文件列表
    const init = async () => {
      await fileStorage.initialize()
      const result = await listMessages()
      if (result.success && result.files) {
        setMessageFiles(result.files)
      }
    }
    
    init()
  }, [])

  const handleSaveMessage = async () => {
    const messageData = {
      timestamp: new Date().toISOString(),
      content: '测试消息'
    }
    
    const result = await saveMessage(messageData)
    
    if (result.success) {
      // 重新加载文件列表
      const listResult = await listMessages()
      if (listResult.success && listResult.files) {
        setMessageFiles(listResult.files)
      }
    }
  }

  return (
    <div>
      <button onClick={handleSaveMessage}>保存消息</button>
      
      <h3>聊天记录文件</h3>
      <ul>
        {messageFiles.map((file, index) => (
          <li key={index}>
            {file.name} - {file.size} bytes - {file.modified.toLocaleString()}
          </li>
        ))}
      </ul>
    </div>
  )
}

export default FileManagerComponent
```

## API 参考

### FileStorageManager 类

#### 方法

- `initialize()`: 初始化文件存储
- `getAppDataPaths()`: 获取应用数据路径
- `saveMessage(fileName, messageData)`: 保存聊天消息
- `saveAudio(fileName, audioData)`: 保存语音文件
- `saveImage(fileName, imageData)`: 保存图片文件
- `saveVideo(fileName, videoData)`: 保存视频文件
- `saveGeneralFile(fileName, fileData)`: 保存普通文件
- `readFile(options)`: 读取文件
- `listFiles(fileType)`: 列出指定类型的文件
- `generateTimestampFileName(prefix, extension)`: 生成带时间戳的文件名
- `blobToBuffer(blob)`: 将 Blob 转换为 Buffer
- `base64ToBuffer(base64)`: 将 Base64 转换为 Buffer

### 类型定义

```typescript
type FileType = 'message' | 'audio' | 'image' | 'video' | 'file'

interface SaveFileOptions {
  data: string | Buffer | Uint8Array | any
  fileName: string
  fileType: FileType
  encoding?: string
}

interface FileOperationResult {
  success: boolean
  message: string
  error?: string
  filePath?: string
  data?: any
  files?: FileInfo[]
}
```

## 注意事项

1. **文件名**: 建议使用 `generateTimestampFileName()` 生成唯一的文件名
2. **编码**: 文本文件使用 UTF-8 编码，二进制文件直接保存 Buffer
3. **错误处理**: 所有操作都会返回结果对象，包含成功状态和错误信息
4. **路径管理**: 系统会自动创建必要的文件夹结构
5. **性能**: 大文件操作可能需要时间，建议添加加载状态

## 故障排除

### 常见问题

1. **权限错误**: 确保应用有写入目标目录的权限
2. **路径不存在**: 系统会自动创建目录，如果失败请检查磁盘空间
3. **文件格式**: 确保传入正确的数据格式（Buffer、Uint8Array 或字符串）
4. **编码问题**: 文本文件使用 UTF-8 编码，二进制文件不需要指定编码

### 调试技巧

```typescript
// 启用详细日志
const result = await fileStorage.saveFile(options)
console.log('保存结果:', result)

// 检查存储路径
const paths = await fileStorage.getAppDataPaths()
console.log('存储路径:', paths)
```