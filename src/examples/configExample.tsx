import React, { useState, useEffect } from 'react'
import { configManager } from '../utils/configManager'
import { fileStorage } from '../utils/fileStorage'
import ConfigSettings from '../components/settings/ConfigSettings'
import type { AppConfig } from '../types/config'

/**
 * 配置管理使用示例组件
 */
export const ConfigExample: React.FC = () => {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [showSettings, setShowSettings] = useState(false)
  const [status, setStatus] = useState<string>('')
  const [storagePath, setStoragePath] = useState<string>('')

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    try {
      setStatus('正在初始化应用...')
      
      // 1. 初始化配置管理器
      const configResult = await configManager.initialize()
      if (configResult.success && configResult.config) {
        setConfig(configResult.config)
        setStatus('配置加载成功')
      } else {
        setStatus(`配置加载失败: ${configResult.message}`)
        return
      }

      // 2. 初始化文件存储
      const storageResult = await fileStorage.initialize()
      if (storageResult.success) {
        const paths = await fileStorage.getAppDataPaths()
        if (paths) {
          setStoragePath(paths.basePath)
        }
        setStatus('应用初始化完成')
      } else {
        setStatus(`文件存储初始化失败: ${storageResult.message}`)
      }
    } catch (error) {
      setStatus(`初始化失败: ${error}`)
    }
  }

  const handleSaveTestMessage = async () => {
    try {
      const testMessage = {
        id: Date.now().toString(),
        content: '这是一条测试消息',
        timestamp: new Date().toISOString(),
        sender: 'user'
      }

      const result = await fileStorage.saveMessage(
        JSON.stringify(testMessage),
        `test_message_${Date.now()}.json`
      )

      if (result.success) {
        setStatus(`消息保存成功: ${result.filePath}`)
      } else {
        setStatus(`消息保存失败: ${result.message}`)
      }
    } catch (error) {
      setStatus(`保存消息时发生错误: ${error}`)
    }
  }

  const handleListMessages = async () => {
    try {
      const result = await fileStorage.listMessageFiles()
      if (result.success && result.files) {
        setStatus(`找到 ${result.files.length} 个消息文件`)
        console.log('消息文件列表:', result.files)
      } else {
        setStatus(`获取消息列表失败: ${result.message}`)
      }
    } catch (error) {
      setStatus(`获取消息列表时发生错误: ${error}`)
    }
  }

  const handleChangeStoragePath = async () => {
    const newPath = prompt('请输入新的存储路径:', storagePath)
    if (newPath && newPath !== storagePath) {
      try {
        const result = await configManager.setCustomStoragePath(newPath)
        if (result.success) {
          setConfig(result.config!)
          // 重新初始化文件存储以应用新路径
          await fileStorage.initialize()
          const paths = await fileStorage.getAppDataPaths()
          if (paths) {
            setStoragePath(paths.basePath)
          }
          setStatus('存储路径更新成功')
        } else {
          setStatus(`更新存储路径失败: ${result.message}`)
        }
      } catch (error) {
        setStatus(`更新存储路径时发生错误: ${error}`)
      }
    }
  }

  const handleResetStoragePath = async () => {
    try {
      const result = await configManager.resetToDefaultStoragePath()
      if (result.success) {
        setConfig(result.config!)
        // 重新初始化文件存储以应用默认路径
        await fileStorage.initialize()
        const paths = await fileStorage.getAppDataPaths()
        if (paths) {
          setStoragePath(paths.basePath)
        }
        setStatus('已重置为默认存储路径')
      } else {
        setStatus(`重置存储路径失败: ${result.message}`)
      }
    } catch (error) {
      setStatus(`重置存储路径时发生错误: ${error}`)
    }
  }

  return (
    <div className="config-example">
      <h1>配置管理和文件存储示例</h1>
      
      <div className="status-section">
        <h2>状态信息</h2>
        <p><strong>状态:</strong> {status}</p>
        <p><strong>当前存储路径:</strong> {storagePath || '未设置'}</p>
        {config && (
          <div>
            <p><strong>使用自定义路径:</strong> {config.fileStorage.useCustomPath ? '是' : '否'}</p>
            {config.fileStorage.customPath && (
              <p><strong>自定义路径:</strong> {config.fileStorage.customPath}</p>
            )}
          </div>
        )}
      </div>

      <div className="actions-section">
        <h2>操作示例</h2>
        <div className="button-group">
          <button onClick={handleSaveTestMessage}>
            保存测试消息
          </button>
          <button onClick={handleListMessages}>
            列出消息文件
          </button>
          <button onClick={handleChangeStoragePath}>
            更改存储路径
          </button>
          <button onClick={handleResetStoragePath}>
            重置为默认路径
          </button>
          <button onClick={() => setShowSettings(true)}>
            打开设置界面
          </button>
        </div>
      </div>

      {config && (
        <div className="config-info">
          <h2>当前配置</h2>
          <pre>{JSON.stringify(config, null, 2)}</pre>
        </div>
      )}

      {showSettings && (
        <div className="settings-modal">
          <div className="modal-backdrop" onClick={() => setShowSettings(false)} />
          <div className="modal-content">
            <ConfigSettings onClose={() => setShowSettings(false)} />
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        .config-example {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: Arial, sans-serif;
        }

        .status-section, .actions-section, .config-info {
          margin-bottom: 30px;
          padding: 20px;
          border: 1px solid #ddd;
          border-radius: 8px;
          background: #f9f9f9;
        }

        .status-section h2, .actions-section h2, .config-info h2 {
          margin-top: 0;
          color: #333;
        }

        .button-group {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }

        .button-group button {
          padding: 10px 15px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .button-group button:hover {
          background: #0056b3;
        }

        .config-info pre {
          background: white;
          padding: 15px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }

        .settings-modal {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .modal-backdrop {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
        }

        .modal-content {
          position: relative;
          z-index: 1001;
          max-width: 90vw;
          max-height: 90vh;
          overflow: auto;
        }
        `
      }} />
    </div>
  )
}

export default ConfigExample