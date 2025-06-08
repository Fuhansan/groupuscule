import React, { useState, useEffect } from 'react'
import { configManager } from '../../utils/configManager'
import { fileStorage } from '../../utils/fileStorage'
import type { AppConfig } from '../../types/config'

interface ConfigSettingsProps {
  onClose?: () => void
}

export const ConfigSettings: React.FC<ConfigSettingsProps> = ({ onClose }) => {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [customPath, setCustomPath] = useState('')
  const [useCustomPath, setUseCustomPath] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      setLoading(true)
      const result = await configManager.initialize()
      if (result.success && result.config) {
        setConfig(result.config)
        setCustomPath(result.config.fileStorage.customPath || '')
        setUseCustomPath(result.config.fileStorage.useCustomPath)
      } else {
        setError(result.message || '加载配置失败')
      }
    } catch (err) {
      setError('加载配置时发生错误')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!config) return

    try {
      setSaving(true)
      setError('')
      setMessage('')

      // 更新配置
      const updatedConfig = {
        ...config,
        fileStorage: {
          ...config.fileStorage,
          customPath: useCustomPath ? customPath : undefined,
          useCustomPath
        }
      }

      const result = await configManager.saveConfig(updatedConfig)
      if (result.success) {
        setConfig(updatedConfig)
        setMessage('配置保存成功！')
        
        // 重新初始化文件存储以应用新配置
        await fileStorage.initialize()
      } else {
        setError(result.message || '保存配置失败')
      }
    } catch (err) {
      setError('保存配置时发生错误')
    } finally {
      setSaving(false)
    }
  }

  const handleSelectFolder = async () => {
    try {
      // 这里可以添加文件夹选择对话框的逻辑
      // 目前先让用户手动输入路径
      const path = prompt('请输入自定义存储路径:', customPath)
      if (path) {
        setCustomPath(path)
      }
    } catch (err) {
      setError('选择文件夹时发生错误')
    }
  }

  const handleReset = async () => {
    if (!config) return

    try {
      setSaving(true)
      setError('')
      setMessage('')

      const result = await configManager.resetToDefaultStoragePath()
      if (result.success && result.config) {
        setConfig(result.config)
        setCustomPath('')
        setUseCustomPath(false)
        setMessage('已重置为默认存储路径')
        
        // 重新初始化文件存储
        await fileStorage.initialize()
      } else {
        setError(result.message || '重置失败')
      }
    } catch (err) {
      setError('重置时发生错误')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="config-settings">
        <div className="loading">加载配置中...</div>
      </div>
    )
  }

  return (
    <div className="config-settings">
      <div className="config-header">
        <h2>应用设置</h2>
        {onClose && (
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        )}
      </div>

      <div className="config-content">
        {/* 文件存储设置 */}
        <div className="config-section">
          <h3>文件存储设置</h3>
          
          <div className="config-item">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={useCustomPath}
                onChange={(e) => setUseCustomPath(e.target.checked)}
                disabled={saving}
              />
              使用自定义存储路径
            </label>
          </div>

          {useCustomPath && (
            <div className="config-item">
              <label>自定义存储路径:</label>
              <div className="path-input-group">
                <input
                  type="text"
                  value={customPath}
                  onChange={(e) => setCustomPath(e.target.value)}
                  placeholder="请输入存储路径"
                  disabled={saving}
                />
                <button
                  type="button"
                  onClick={handleSelectFolder}
                  disabled={saving}
                  className="select-folder-btn"
                >
                  选择文件夹
                </button>
              </div>
            </div>
          )}

          <div className="config-item">
            <small className="help-text">
              {useCustomPath
                ? '文件将保存到指定的自定义路径'
                : '文件将保存到默认的应用数据目录'}
            </small>
          </div>
        </div>

        {/* 应用信息 */}
        {config && (
          <div className="config-section">
            <h3>应用信息</h3>
            <div className="config-item">
              <label>应用名称:</label>
              <span>{config.app.name}</span>
            </div>
            <div className="config-item">
              <label>版本:</label>
              <span>{config.app.version}</span>
            </div>
            <div className="config-item">
              <label>语言:</label>
              <span>{config.app.language}</span>
            </div>
          </div>
        )}

        {/* 消息提示 */}
        {message && (
          <div className="message success">{message}</div>
        )}
        {error && (
          <div className="message error">{error}</div>
        )}

        {/* 操作按钮 */}
        <div className="config-actions">
          <button
            onClick={handleSave}
            disabled={saving || !config}
            className="save-btn"
          >
            {saving ? '保存中...' : '保存设置'}
          </button>
          <button
            onClick={handleReset}
            disabled={saving || !config}
            className="reset-btn"
          >
            重置为默认
          </button>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .config-settings {
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .config-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }

        .config-header h2 {
          margin: 0;
          color: #333;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: #999;
          padding: 0;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .close-btn:hover {
          color: #666;
        }

        .config-content {
          space-y: 20px;
        }

        .config-section {
          margin-bottom: 30px;
        }

        .config-section h3 {
          margin: 0 0 15px 0;
          color: #555;
          font-size: 18px;
        }

        .config-item {
          margin-bottom: 15px;
        }

        .config-item label {
          display: block;
          margin-bottom: 5px;
          font-weight: 500;
          color: #333;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          cursor: pointer;
        }

        .checkbox-label input {
          margin-right: 8px;
        }

        .path-input-group {
          display: flex;
          gap: 10px;
        }

        .path-input-group input {
          flex: 1;
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .select-folder-btn {
          padding: 8px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }

        .select-folder-btn:hover {
          background: #0056b3;
        }

        .select-folder-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .help-text {
          color: #666;
          font-size: 12px;
        }

        .message {
          padding: 10px;
          border-radius: 4px;
          margin: 10px 0;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .config-actions {
          display: flex;
          gap: 10px;
          justify-content: flex-end;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }

        .save-btn, .reset-btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
        }

        .save-btn {
          background: #28a745;
          color: white;
        }

        .save-btn:hover {
          background: #218838;
        }

        .reset-btn {
          background: #6c757d;
          color: white;
        }

        .reset-btn:hover {
          background: #545b62;
        }

        .save-btn:disabled, .reset-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .loading {
          text-align: center;
          padding: 40px;
          color: #666;
        }
        `
      }} />
    </div>
  )
}

export default ConfigSettings