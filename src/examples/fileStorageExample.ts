import { fileStorage } from '../utils/fileStorage'
import { FileType } from '../types/fileStorage'

/**
 * 文件保存功能使用示例
 */
export class FileStorageExample {
  
  /**
   * 初始化文件存储
   */
  public static async initializeStorage() {
    try {
      const paths = await fileStorage.initialize()
      console.log('文件存储初始化成功:', paths)
      return paths
    } catch (error) {
      console.error('文件存储初始化失败:', error)
      throw error
    }
  }

  /**
   * 保存聊天消息记录示例
   */
  public static async saveMessageExample() {
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
        },
        {
          id: '2',
          type: 'text',
          content: '你好！很高兴认识你。',
          timestamp: new Date().toISOString(),
          sender: 'friend456'
        }
      ]
    }

    const fileName = fileStorage.generateTimestampFileName('chat_user123_friend456', 'json')
    const result = await fileStorage.saveMessage(fileName, messageData)
    
    if (result.success) {
      console.log('聊天记录保存成功:', result.filePath)
    } else {
      console.error('聊天记录保存失败:', result.error)
    }
    
    return result
  }

  /**
   * 保存语音文件示例
   */
  public static async saveAudioExample(audioBlob: Blob) {
    try {
      const audioBuffer = await fileStorage.blobToBuffer(audioBlob)
      const fileName = fileStorage.generateTimestampFileName('voice_message', 'webm')
      
      const result = await fileStorage.saveAudio(fileName, audioBuffer)
      
      if (result.success) {
        console.log('语音文件保存成功:', result.filePath)
      } else {
        console.error('语音文件保存失败:', result.error)
      }
      
      return result
    } catch (error) {
      console.error('语音文件处理失败:', error)
      throw error
    }
  }

  /**
   * 保存图片文件示例
   */
  public static async saveImageExample(imageData: string | Blob) {
    try {
      let data: Buffer | string
      let fileName: string
      
      if (typeof imageData === 'string') {
        // Base64 字符串
        data = fileStorage.base64ToBuffer(imageData)
        fileName = fileStorage.generateTimestampFileName('image', 'png')
      } else {
        // Blob 对象
        data = await fileStorage.blobToBuffer(imageData)
        fileName = fileStorage.generateTimestampFileName('image', 'jpg')
      }
      
      const result = await fileStorage.saveImage(fileName, data)
      
      if (result.success) {
        console.log('图片文件保存成功:', result.filePath)
      } else {
        console.error('图片文件保存失败:', result.error)
      }
      
      return result
    } catch (error) {
      console.error('图片文件处理失败:', error)
      throw error
    }
  }

  /**
   * 保存视频文件示例
   */
  public static async saveVideoExample(videoBlob: Blob) {
    try {
      const videoBuffer = await fileStorage.blobToBuffer(videoBlob)
      const fileName = fileStorage.generateTimestampFileName('video_recording', 'webm')
      
      const result = await fileStorage.saveVideo(fileName, videoBuffer)
      
      if (result.success) {
        console.log('视频文件保存成功:', result.filePath)
      } else {
        console.error('视频文件保存失败:', result.error)
      }
      
      return result
    } catch (error) {
      console.error('视频文件处理失败:', error)
      throw error
    }
  }

  /**
   * 保存普通文件示例
   */
  public static async saveGeneralFileExample(file: File) {
    try {
      const fileBuffer = await fileStorage.blobToBuffer(file)
      const fileName = `${Date.now()}_${file.name}`
      
      const result = await fileStorage.saveGeneralFile(fileName, fileBuffer)
      
      if (result.success) {
        console.log('文件保存成功:', result.filePath)
      } else {
        console.error('文件保存失败:', result.error)
      }
      
      return result
    } catch (error) {
      console.error('文件处理失败:', error)
      throw error
    }
  }

  /**
   * 读取聊天消息记录示例
   */
  public static async readMessageExample(fileName: string) {
    const result = await fileStorage.readMessage(fileName)
    
    if (result.success) {
      console.log('聊天记录读取成功:', JSON.parse(result.data))
    } else {
      console.error('聊天记录读取失败:', result.error)
    }
    
    return result
  }

  /**
   * 列出文件示例
   */
  public static async listFilesExample(fileType: FileType) {
    const result = await fileStorage.listFiles(fileType)
    
    if (result.success) {
      console.log(`${fileType} 文件列表:`, result.files)
    } else {
      console.error('文件列表获取失败:', result.error)
    }
    
    return result
  }

  /**
   * 完整的使用流程示例
   */
  public static async fullExample() {
    try {
      // 1. 初始化存储
      await this.initializeStorage()
      
      // 2. 保存聊天记录
      await this.saveMessageExample()
      
      // 3. 列出所有聊天记录文件
      const messageFiles = await this.listFilesExample('message')
      
      // 4. 读取第一个聊天记录文件（如果存在）
      if (messageFiles.success && messageFiles.files && messageFiles.files.length > 0) {
        await this.readMessageExample(messageFiles.files[0].name)
      }
      
      console.log('文件存储功能演示完成')
    } catch (error) {
      console.error('文件存储功能演示失败:', error)
    }
  }
}

// 在组件中使用的示例
export const useFileStorage = () => {
  const saveMessage = async (messageData: any) => {
    const fileName = fileStorage.generateTimestampFileName('chat', 'json')
    return await fileStorage.saveMessage(fileName, messageData)
  }

  const saveAudio = async (audioBlob: Blob) => {
    const fileName = fileStorage.generateTimestampFileName('voice', 'webm')
    const audioBuffer = await fileStorage.blobToBuffer(audioBlob)
    return await fileStorage.saveAudio(fileName, audioBuffer)
  }

  const saveImage = async (imageBlob: Blob) => {
    const fileName = fileStorage.generateTimestampFileName('image', 'jpg')
    const imageBuffer = await fileStorage.blobToBuffer(imageBlob)
    return await fileStorage.saveImage(fileName, imageBuffer)
  }

  const saveVideo = async (videoBlob: Blob) => {
    const fileName = fileStorage.generateTimestampFileName('video', 'webm')
    const videoBuffer = await fileStorage.blobToBuffer(videoBlob)
    return await fileStorage.saveVideo(fileName, videoBuffer)
  }

  const listMessages = () => fileStorage.listMessageFiles()
  const listAudios = () => fileStorage.listAudioFiles()
  const listImages = () => fileStorage.listImageFiles()
  const listVideos = () => fileStorage.listVideoFiles()

  return {
    saveMessage,
    saveAudio,
    saveImage,
    saveVideo,
    listMessages,
    listAudios,
    listImages,
    listVideos,
    fileStorage
  }
}