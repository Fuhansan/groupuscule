import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MessageInput.css'

interface MessageInputProps {
    onSendMessage: (content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'mixed') => void
    disabled?: boolean
    onImagePreview?: (imageUrl: string) => void
}

function MessageInput({ onSendMessage, disabled = false, onImagePreview }: MessageInputProps) {
    const [inputValue, setInputValue] = useState('')
    const [selectedFiles, setSelectedFiles] = useState<File[]>([])
    const [selectedImages, setSelectedImages] = useState<string[]>([])
    const [isDragOver, setIsDragOver] = useState(false)
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [isRecording, setIsRecording] = useState(false)
    const [recordingTime, setRecordingTime] = useState(0)
    const [actualRecordingDuration, setActualRecordingDuration] = useState(0)
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [audioUrl, setAudioUrl] = useState<string | null>(null)
    const [audioDuration, setAudioDuration] = useState(0)
    const [currentTime, setCurrentTime] = useState(0)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)

    // 自动调整输入框高度
    const adjustTextareaHeight = () => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto'
            const newHeight = Math.min(inputRef.current.scrollHeight, 120)
            inputRef.current.style.height = newHeight + 'px'
            
            if (inputRef.current.scrollHeight > 120) {
                inputRef.current.style.overflowY = 'auto'
            } else {
                inputRef.current.style.overflowY = 'hidden'
            }
        }
    }

    useEffect(() => {
        adjustTextareaHeight()
    }, [inputValue])

    // 处理输入变化
    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputValue(e.target.value)
    }

    // 处理键盘事件
    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    // 处理粘贴事件
    const handlePaste = async (e: React.ClipboardEvent) => {
        e.preventDefault()
        const clipboardData = e.clipboardData
        
        // 首先检查是否有文本数据
        const text = clipboardData.getData('text/plain')
        
        // 处理粘贴的文件（图片）
        const items = Array.from(clipboardData.items)
        const imageItems = items.filter(item => item.type.startsWith('image/'))
        
        // 去重：截图工具可能会放置多种格式的相同图片，我们只取第一个
        const uniqueImageItems = imageItems.length > 0 ? [imageItems[0]] : []
        
        // 如果同时有图片和文本，优先处理文本（除非文本为空或只是图片的路径）
        if (text && text.trim() && !text.startsWith('data:image/') && !text.match(/\.(jpg|jpeg|png|gif|bmp|webp)$/i)) {
            // 处理粘贴的文本
            const textarea = inputRef.current
            if (textarea) {
                const start = textarea.selectionStart
                const end = textarea.selectionEnd
                const newValue = inputValue.substring(0, start) + text + inputValue.substring(end)
                setInputValue(newValue)
                
                // 设置光标位置
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + text.length
                    textarea.focus()
                }, 0)
            }
            return
        }
        
        // 如果没有有效文本，则处理图片
        if (uniqueImageItems.length > 0) {
            // 检查剩余槽位
            const currentCount = selectedImages.length
            const remainingSlots = 10 - currentCount
            if (remainingSlots <= 0) {
             
                return
            }
            
            const itemsToProcess = uniqueImageItems.slice(0, remainingSlots)
            if (uniqueImageItems.length > remainingSlots) {
              
            }
            
            // 处理粘贴的图片
            const newImages: string[] = []
            let processedCount = 0
            
            itemsToProcess.forEach(item => {
                const file = item.getAsFile()
                if (file) {
                    const reader = new FileReader()
                    reader.onload = (event) => {
                        if (event.target?.result) {
                            newImages.push(event.target.result as string)
                            processedCount++
                            
                            // 当所有图片都处理完成时，一次性更新状态
                            if (processedCount === itemsToProcess.length) {
                                setSelectedImages(current => {
                                    const finalRemainingSlots = 10 - current.length
                                    const imagesToAdd = newImages.slice(0, finalRemainingSlots)
                                    return [...current, ...imagesToAdd]
                                })
                            }
                        }
                    }
                    reader.readAsDataURL(file)
                }
            })
        }
    }

    // 处理拖拽事件
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(true)
    }

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
    }

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragOver(false)
        
        const files = Array.from(e.dataTransfer.files)
        const imageFiles = files.filter(file => file.type.startsWith('image/'))
        const otherFiles = files.filter(file => !file.type.startsWith('image/'))
        
        // 处理图片文件
        if (imageFiles.length > 0) {
            const remainingSlots = 10 - selectedImages.length
            if (remainingSlots <= 0) {
                return
            }
            
            const filesToProcess = imageFiles.slice(0, remainingSlots)
            if (imageFiles.length > remainingSlots) {
                // 可以在这里添加提示信息
            }
            
            // 批量处理图片文件
            const newImages: string[] = []
            let processedCount = 0
            
            filesToProcess.forEach(file => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    if (event.target?.result) {
                        newImages.push(event.target.result as string)
                        processedCount++
                        
                        // 当所有图片都处理完成时，一次性更新状态
                        if (processedCount === filesToProcess.length) {
                            setSelectedImages(current => {
                                const finalRemainingSlots = 10 - current.length
                                const imagesToAdd = newImages.slice(0, finalRemainingSlots)
                                return [...current, ...imagesToAdd]
                            })
                        }
                    }
                }
                reader.readAsDataURL(file)
            })
        }
        
        // 处理其他文件
        if (otherFiles.length > 0) {
            setSelectedFiles(prev => [...prev, ...otherFiles])
        }
    }

    // 发送复合消息（包含文本、图片、文件等所有内容）
    const handleSendMessage = () => {
        if (disabled) return
        
        // 检查是否有任何内容可以发送
        const hasText = inputValue.trim()
        const hasImages = selectedImages.length > 0
        const hasFiles = selectedFiles.length > 0
        const hasVoice = audioBlob && audioUrl
        
        if (!hasText && !hasImages && !hasFiles && !hasVoice) {
            return
        }
        
        // 创建复合消息内容对象
        const messageContent = {
            text: hasText ? inputValue.trim() : '',
            images: hasImages ? [...selectedImages] : [], // selectedImages已经是base64格式
            files: hasFiles ? selectedFiles.map(file => ({
                name: file.name,
                size: file.size,
                type: file.type,
                url: URL.createObjectURL(file)
            })) : [],
            voice: hasVoice ? {
                url: audioUrl,
                duration: actualRecordingDuration
            } : null
        }
        
        // 发送复合消息
        onSendMessage(JSON.stringify(messageContent), 'mixed')
        
        // 清理所有状态
        setInputValue('')
        setSelectedImages([])
        setSelectedFiles([])
        
        // 清理语音相关状态
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
            setAudioUrl(null)
        }
        setAudioBlob(null)
        setRecordingTime(0)
        setActualRecordingDuration(0)
        setIsPlaying(false)
        setAudioDuration(0)
        setCurrentTime(0)
    }

    // 工具栏按钮处理函数
    const handleEmojiClick = () => {
        setShowEmojiPicker(!showEmojiPicker)
    }

    // 选择表情
    const handleEmojiSelect = (emoji: string) => {
        const textarea = inputRef.current;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newValue = inputValue.substring(0, start) + emoji + inputValue.substring(end);
            setInputValue(newValue);
            
            // 设置光标位置
            setTimeout(() => {
                textarea.selectionStart = textarea.selectionEnd = start + emoji.length;
                textarea.focus();
            }, 0);
        }
        setShowEmojiPicker(false);
    }

    // 点击外部关闭表情选择器
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // 常用表情列表
    const commonEmojis = [
        '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
        '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
        '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
        '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣',
        '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬',
        '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗',
        '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯',
        '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐',
        '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈',
        '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾'
    ]

    const handleFileClick = () => {
        fileInputRef.current?.click()
    }

    const handleImageClick = () => {
        imageInputRef.current?.click()
    }


    const handleRegionScreenshotClick = async () => {
        try {
            // 检查是否在Electron环境中
            if (typeof window !== 'undefined' && window.electronAPI) {
                const screenshotDataUrl = await window.electronAPI.captureRegionScreenshot()
                
                // 检查图片槽位是否已满
                if (selectedImages.length >= 10) {
                    console.warn('图片数量已达上限')
                    return
                }
                
                // 将截图添加到选中的图片列表
                setSelectedImages(prev => [...prev, screenshotDataUrl])
            } else {
                console.warn('区域截图功能仅在Electron环境中可用')
            }
        } catch (error) {
            if (error instanceof Error && error.message === 'Region selection cancelled') {
                console.log('用户取消了区域选择')
            } else {
                console.error('区域截图失败:', error)
            }
        }
    }

    const handleVoiceClick = async () => {
        if (isRecording) {
            // 停止录制
            stopRecording()
        } else {
            // 开始录制
            await startRecording()
        }
    }

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            
            const audioChunks: Blob[] = []
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunks.push(event.data)
                }
            }
            
            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/wav' })
                setAudioBlob(audioBlob)
                
                // 创建音频URL用于播放
                const url = URL.createObjectURL(audioBlob)
                setAudioUrl(url)
                
                // 停止所有音频轨道
                stream.getTracks().forEach(track => track.stop())
            }
            
            mediaRecorder.start()
            setIsRecording(true)
            setRecordingTime(0)
            
            // 开始计时
            recordingTimerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1)
            }, 1000)
            
        } catch (error) {
            console.error('无法访问麦克风:', error)
            alert('无法访问麦克风，请检查权限设置')
        }
    }
    
    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // 先保存当前录制时间
            const finalRecordingTime = recordingTime
            
            // 停止录制
            mediaRecorderRef.current.stop()
            setIsRecording(false)
            
            // 清除计时器
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
                recordingTimerRef.current = null
            }
            
            // 立即设置实际录制时长
            setActualRecordingDuration(finalRecordingTime)
        }
    }
    
    const cancelRecording = () => {
        if (isRecording) {
            stopRecording()
        }
        
        // 清理音频资源
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl)
            setAudioUrl(null)
        }
        
        setAudioBlob(null)
        setRecordingTime(0)
        setActualRecordingDuration(0)
        setIsPlaying(false)
        setAudioDuration(0)
        setCurrentTime(0)
    }
    
    const sendVoiceMessage = () => {
        if (audioBlob && audioUrl) {
            // 使用统一的发送逻辑发送语音消息
            handleSendMessage()
        }
    }
    
    // 格式化录制时间
    const formatRecordingTime = (seconds: number) => {
        // 检查数值是否有效
        if (!isFinite(seconds) || isNaN(seconds) || seconds < 0) {
            return '00:00'
        }
        
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    
    // 播放/暂停音频
    const togglePlayback = () => {
        if (!audioRef.current || !audioUrl) return
        
        if (isPlaying) {
            audioRef.current.pause()
            setIsPlaying(false)
        } else {
            audioRef.current.play()
            setIsPlaying(true)
        }
    }
    
    // 清理定时器和音频资源
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
        }
    }, [audioUrl])

    const handleFolderClick = () => {
        // TODO: 实现文件夹功能
        console.log('文件夹功能')
    }

    // 处理文件选择
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        setSelectedFiles(prev => [...prev, ...files])
        // TODO: 处理文件上传和显示
    }

    // 处理图片选择
    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || [])
        
        setSelectedImages(prev => {
            const remainingSlots = 10 - prev.length
            if (remainingSlots <= 0) {
           
                return prev
            }
            
            const filesToProcess = files.slice(0, remainingSlots)
            if (files.length > remainingSlots) {
               
            }
            
            filesToProcess.forEach(file => {
                const reader = new FileReader()
                reader.onload = (event) => {
                    if (event.target?.result) {
                        setSelectedImages(current => {
                            if (current.length >= 10) {
                                return current
                            }
                            return [...current, event.target!.result as string]
                        })
                    }
                }
                reader.readAsDataURL(file)
            })
            
            return prev
        })
    }

    // 移除选中的图片
    const removeImage = (index: number) => {
        setSelectedImages(prev => prev.filter((_, i) => i !== index))
    }

    // 移除选中的文件
    const removeFile = (index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    }

    return (
        <div className="message-input-container">
            {/* 第一个区域：工具栏 */}
            <div className="toolbar-section">
                {/* 表情选择器 */}
                {showEmojiPicker && (
                    <div className="emoji-picker" ref={emojiPickerRef}>
                        <div className="emoji-picker-header">
                            <span>选择表情</span>
                            <button 
                                className="emoji-picker-close"
                                onClick={() => setShowEmojiPicker(false)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="emoji-grid">
                            {commonEmojis.map((emoji, index) => (
                                <button
                                    key={index}
                                    className="emoji-item"
                                    onClick={() => handleEmojiSelect(emoji)}
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
                <button 
                    className="toolbar-btn" 
                    onClick={handleEmojiClick}
                    title="表情包"
                    disabled={disabled}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="8.5" cy="9.5" r="1.5" fill="currentColor"/>
                        <circle cx="15.5" cy="9.5" r="1.5" fill="currentColor"/>
                        <path d="M8 15s1.5 2 4 2 4-2 4-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
                
                <button 
                    className="toolbar-btn" 
                    onClick={handleFileClick}
                    title="选择文件"
                    disabled={disabled}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                        <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" stroke="currentColor" strokeWidth="1.5"/>
                        <polyline points="13,2 13,9 20,9" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                        <line x1="9" y1="13" x2="15" y2="13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <line x1="9" y1="17" x2="15" y2="17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
                
                <button 
                    className="toolbar-btn" 
                    onClick={handleImageClick}
                    title="选择图片"
                    disabled={disabled}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M14 10l2.5-2.5a2 2 0 0 1 2.828 0L21 9.172" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
    
                
                <button 
                    className="toolbar-btn" 
                    onClick={handleRegionScreenshotClick}
                    title="区域截图"
                    disabled={disabled}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                        <rect x="3" y="3" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
                        <rect x="14" y="14" width="7" height="7" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 2"/>
                        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <circle cx="12" cy="12" r="1" fill="currentColor"/>
                    </svg>
                </button>
                
                <button 
                    className={`toolbar-btn ${isRecording ? 'recording' : ''}`}
                    onClick={handleVoiceClick}
                    title={isRecording ? '停止录制' : '语音消息'}
                    disabled={disabled}
                >
                    {isRecording ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    )}
                </button>
                
                {/* 录制状态显示 */}
                {isRecording && (
                    <div className="recording-indicator">
                        <span className="recording-dot"></span>
                        <span className="recording-time">{formatRecordingTime(recordingTime)}</span>
                        <button className="cancel-recording" onClick={cancelRecording} title="取消录制">
                            ×
                        </button>
                    </div>
                )}
                
                <button 
                    className="toolbar-btn" 
                    onClick={handleFolderClick}
                    title="文件夹"
                    disabled={disabled}
                >
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M2 11h20" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    </svg>
                </button>
            </div>

            {/* 第二个区域：消息输入区域 */}
            <div className="message-section">
                {/* 显示选中的图片预览 */}
                {selectedImages.length > 0 && (
                    <div className="selected-images">
                        {selectedImages.map((image, index) => (
                            <div key={index} className="image-preview">
                                <img 
                                    src={image} 
                                    alt={`预览 ${index + 1}`} 
                                    onClick={() => onImagePreview?.(image)}
                                    style={{ cursor: 'pointer' }}
                                />
                                <button 
                                    className="remove-btn"
                                    onClick={() => removeImage(index)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* 显示选中的文件列表 */}
                {selectedFiles.length > 0 && (
                    <div className="selected-files">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="file-item">
                                <span className="file-name">{file.name}</span>
                                <button 
                                    className="remove-btn"
                                    onClick={() => removeFile(index)}
                                >
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* 语音消息预览 */}
                {audioBlob && (
                    <div className="voice-preview">
                        <div className="voice-info">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <path d="M12 1a3 3 0 0 1 3 3v8a3 3 0 0 1-6 0V4a3 3 0 0 1 3-3z" stroke="currentColor" strokeWidth="1.5"/>
                                <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            </svg>
                            <span>语音消息 ({isPlaying ? `${formatRecordingTime(Math.floor(currentTime))} / ${formatRecordingTime(Math.floor(audioDuration > 0 ? audioDuration : actualRecordingDuration))}` : formatRecordingTime(Math.floor(audioDuration > 0 ? audioDuration : actualRecordingDuration))})</span>
                        </div>
                        <div className="voice-controls">
                            <button className="voice-btn play" onClick={togglePlayback}>
                                {isPlaying ? (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                        <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                                        <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                        <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                                    </svg>
                                )}
                                {isPlaying ? '暂停' : '试听'}
                            </button>
                            <button className="voice-btn send" onClick={sendVoiceMessage}>
                                发送
                            </button>
                            <button className="voice-btn cancel" onClick={cancelRecording}>
                                删除
                            </button>
                        </div>
                        {/* 隐藏的音频元素 */}
                        {audioUrl && (
                            <audio
                                ref={audioRef}
                                src={audioUrl}
                                onLoadedMetadata={() => {
                                    if (audioRef.current) {
                                        const duration = audioRef.current.duration
                                        // 检查时长是否有效
                                        if (isFinite(duration) && !isNaN(duration) && duration > 0) {
                                            setAudioDuration(duration)
                                        } else {
                                            // 如果无法获取音频时长，使用实际录制时长作为备用
                                            setAudioDuration(actualRecordingDuration)
                                        }
                                    }
                                }}
                                onTimeUpdate={() => {
                                    if (audioRef.current) {
                                        const currentTime = audioRef.current.currentTime
                                        // 检查当前时间是否有效
                                        if (isFinite(currentTime) && !isNaN(currentTime) && currentTime >= 0) {
                                            setCurrentTime(currentTime)
                                        }
                                    }
                                }}
                                onEnded={() => {
                                    setIsPlaying(false)
                                    setCurrentTime(0)
                                }}
                                onPause={() => setIsPlaying(false)}
                                style={{ display: 'none' }}
                            />
                        )}
                    </div>
                )}
                
                {/* 文本输入框 */}
                <div 
                    className={`input-wrapper ${isDragOver ? 'drag-over' : ''}`}
                    onDragOver={handleDragOver}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <textarea
                        ref={inputRef}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyPress={handleKeyPress}
                        onPaste={handlePaste}
                        placeholder="输入消息...（支持粘贴图片和拖拽文件）"
                        className="message-textarea"
                        rows={1}
                        disabled={disabled}
                    />
                </div>
            </div>

            {/* 第三个区域：发送按钮区域 */}
            <div className="send-section">
                <button 
                    className="send-btn" 
                    onClick={handleSendMessage}
                    disabled={(!inputValue.trim() && selectedFiles.length === 0 && selectedImages.length === 0 && !audioBlob) || disabled}
                >
                    <span>发送</span>
                </button>
            </div>

            {/* 隐藏的文件输入 */}
            <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: 'none' }}
                onChange={handleFileSelect}
            />
            
            <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={handleImageSelect}
            />
        </div>
    )
}

export default MessageInput