import React, { useState, useRef, useCallback, useEffect } from 'react'
import './MessageInput.css'

// 扩展MediaTrackSettings接口以包含额外的属性
interface ExtendedMediaTrackSettings extends MediaTrackSettings {
    cursor?: string;
    displaySurface?: string;
}

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
    const [isVideoRecording, setIsVideoRecording] = useState(false)
    const [videoRecordingTime, setVideoRecordingTime] = useState(0)
    const [actualVideoRecordingDuration, setActualVideoRecordingDuration] = useState(0)
    const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
    const [isVideoPlaying, setIsVideoPlaying] = useState(false)
    const [videoUrl, setVideoUrl] = useState<string | null>(null)
    const [videoRecordingType, setVideoRecordingType] = useState<'camera' | 'screen' | 'camera_and_screen' | null>(null)

    const inputRef = useRef<HTMLTextAreaElement>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const imageInputRef = useRef<HTMLInputElement>(null)
    const emojiPickerRef = useRef<HTMLDivElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const recordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const audioRef = useRef<HTMLAudioElement | null>(null)
    const videoMediaRecorderRef = useRef<MediaRecorder | null>(null)
    const videoRecordingTimerRef = useRef<NodeJS.Timeout | null>(null)
    const videoRef = useRef<HTMLVideoElement | null>(null)


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
        const hasVideo = videoBlob && videoUrl
        
        if (!hasText && !hasImages && !hasFiles && !hasVoice && !hasVideo) {
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
            } : null,
            video: hasVideo ? {
                url: videoUrl,
                duration: actualVideoRecordingDuration
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
        
        // 清理视频相关状态
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl)
            setVideoUrl(null)
        }
        setVideoBlob(null)
        setVideoRecordingTime(0)
        setActualVideoRecordingDuration(0)
        setIsVideoPlaying(false)
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
    
    // 处理视频点击
    const handleVideoClick = async () => {
        if (isVideoRecording) {
            await stopVideoRecording()
        } else {
            await showRecordingOptions()
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
    
    // 开始录制视频（摄像头）
    const startCameraRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            videoMediaRecorderRef.current = mediaRecorder
            
            const videoChunks: Blob[] = []
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunks.push(event.data)
                }
            }
            
            mediaRecorder.onstop = () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
                setVideoBlob(videoBlob)
                
                // 创建视频URL用于播放
                const url = URL.createObjectURL(videoBlob)
                setVideoUrl(url)
                
                // 停止所有轨道
                stream.getTracks().forEach(track => track.stop())
            }
            
            mediaRecorder.start()
            setIsVideoRecording(true)
            setVideoRecordingTime(0)
            
            // 开始计时
            videoRecordingTimerRef.current = setInterval(() => {
                setVideoRecordingTime(prev => prev + 1)
            }, 1000)
            
        } catch (error) {
            console.error('无法访问摄像头和麦克风:', error)
            alert('无法访问摄像头和麦克风，请检查权限设置')
        }
    }

    // 获取浏览器信息
    const getBrowserInfo = () => {
        const userAgent = navigator.userAgent
        let browserName = 'Unknown'
        let browserVersion = 'Unknown'
        
        if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
            browserName = 'Chrome'
            const match = userAgent.match(/Chrome\/(\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgent.includes('Firefox')) {
            browserName = 'Firefox'
            const match = userAgent.match(/Firefox\/(\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
            browserName = 'Safari'
            const match = userAgent.match(/Version\/(\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        } else if (userAgent.includes('Edg')) {
            browserName = 'Edge'
            const match = userAgent.match(/Edg\/(\d+)/)
            browserVersion = match ? match[1] : 'Unknown'
        }
        
        return { browserName, browserVersion: parseInt(browserVersion) }
    }

    // 检查屏幕录制权限和浏览器支持
    const checkScreenRecordingSupport = async () => {
        // 优先检查Electron环境
        if (typeof window !== 'undefined' && window.electronAPI) {
            try {
                const isSupported = await window.electronAPI.isScreenRecordingSupported()
                if (isSupported) {
                    return { supported: true, isElectron: true }
                }
            } catch (error) {
                console.warn('Electron屏幕录制检查失败:', error)
            }
        }
        
        // 回退到浏览器API检查
        const { browserName, browserVersion } = getBrowserInfo()
        
        // 检查基本API支持
        if (!navigator.mediaDevices) {
            return {
                supported: false,
                message: '您的浏览器不支持媒体设备API。',
                browserInfo: { browserName, browserVersion },
                needsUpdate: true
            }
        }
        
        if (!navigator.mediaDevices.getDisplayMedia) {
            return {
                supported: false,
                message: '您的浏览器不支持屏幕录制功能。',
                browserInfo: { browserName, browserVersion },
                needsUpdate: true
            }
        }
        
        // 检查MediaRecorder支持
        if (!window.MediaRecorder) {
            return {
                supported: false,
                message: '您的浏览器不支持媒体录制功能。',
                browserInfo: { browserName, browserVersion },
                needsUpdate: true
            }
        }
        
        // 检查是否在安全上下文中（HTTPS或localhost）
        if (!window.isSecureContext) {
            return {
                supported: false,
                message: '屏幕录制功能需要在安全环境下运行。',
                browserInfo: { browserName, browserVersion },
                needsUpdate: false,
                securityIssue: true
            }
        }
        
        // 检查具体浏览器版本要求
        const minVersions = {
            'Chrome': 72,
            'Firefox': 66,
            'Safari': 13,
            'Edge': 79
        }
        
        const minVersion = minVersions[browserName as keyof typeof minVersions]
        if (minVersion && browserVersion < minVersion) {
            return {
                supported: false,
                message: `您的${browserName}版本过低，不支持屏幕录制功能。`,
                browserInfo: { browserName, browserVersion },
                needsUpdate: true,
                currentVersion: browserVersion,
                requiredVersion: minVersion
            }
        }
        
        return { supported: true, browserInfo: { browserName, browserVersion } }
    }

    // 显示浏览器升级指导
    const showBrowserUpdateGuide = (supportInfo: any) => {
        const dialog = document.createElement('div')
        dialog.className = 'browser-update-dialog'
        
        const content = document.createElement('div')
        content.className = 'browser-update-content'
        content.style.textAlign = 'center'
        
        const { browserName, browserVersion } = supportInfo.browserInfo
        
        let updateInstructions = ''
        let downloadLinks = ''
        
        if (supportInfo.securityIssue) {
            content.innerHTML = `
                <div class="browser-update-header">
                    <div class="browser-update-icon">🔒</div>
                    <h2 class="browser-update-title">需要安全连接</h2>
                </div>
                <div class="browser-update-message">屏幕录制功能需要在安全环境下运行：</div>
                <div class="security-notice">
                    <p>✓ 使用 HTTPS 协议访问网站</p>
                    <p>✓ 或在 localhost 环境下运行</p>
                </div>
                <div class="dialog-buttons">
                    <button id="tryCamera" class="dialog-btn primary">尝试摄像头录制</button>
                    <button id="closeDialog" class="dialog-btn secondary">我知道了</button>
                </div>
            `
        } else {
            // 根据浏览器类型提供具体的更新指导
            switch (browserName) {
                case 'Chrome':
                    updateInstructions = `
                        <div class="update-steps">
                            <h4>请按以下步骤更新Chrome浏览器：</h4>
                            <ol>
                                <li>点击浏览器右上角的三个点菜单</li>
                                <li>选择"帮助" → "关于Google Chrome"</li>
                                <li>Chrome会自动检查并下载更新</li>
                                <li>重启浏览器完成更新</li>
                            </ol>
                        </div>
                    `
                    downloadLinks = '<div class="download-links"><a href="https://www.google.com/chrome/" target="_blank" class="download-link">📥 下载最新版Chrome</a></div>'
                    break
                case 'Firefox':
                    updateInstructions = `
                        <div class="update-steps">
                            <h4>请按以下步骤更新Firefox浏览器：</h4>
                            <ol>
                                <li>点击浏览器右上角的菜单按钮</li>
                                <li>选择"帮助" → "关于Firefox"</li>
                                <li>Firefox会自动检查并下载更新</li>
                                <li>重启浏览器完成更新</li>
                            </ol>
                        </div>
                    `
                    downloadLinks = '<div class="download-links"><a href="https://www.mozilla.org/firefox/" target="_blank" class="download-link">🦊 下载最新版Firefox</a></div>'
                    break
                case 'Safari':
                    updateInstructions = `
                        <div class="update-steps">
                            <h4>请按以下步骤更新Safari浏览器：</h4>
                            <ol>
                                <li>打开"系统偏好设置"</li>
                                <li>点击"软件更新"</li>
                                <li>安装可用的macOS更新（包含Safari更新）</li>
                                <li>重启Mac完成更新</li>
                            </ol>
                        </div>
                    `
                    downloadLinks = '<div class="security-notice"><p>Safari随macOS系统更新</p></div>'
                    break
                case 'Edge':
                    updateInstructions = `
                        <div class="update-steps">
                            <h4>请按以下步骤更新Edge浏览器：</h4>
                            <ol>
                                <li>点击浏览器右上角的三个点菜单</li>
                                <li>选择"帮助和反馈" → "关于Microsoft Edge"</li>
                                <li>Edge会自动检查并下载更新</li>
                                <li>重启浏览器完成更新</li>
                            </ol>
                        </div>
                    `
                    downloadLinks = '<div class="download-links"><a href="https://www.microsoft.com/edge" target="_blank" class="download-link">🌐 下载最新版Edge</a></div>'
                    break
                default:
                    updateInstructions = `
                        <div class="browser-list">
                            <h4>建议使用以下现代浏览器：</h4>
                            <div class="browser-item">
                                <span class="browser-name">Chrome</span>
                                <span class="browser-version">72+</span>
                            </div>
                            <div class="browser-item">
                                <span class="browser-name">Firefox</span>
                                <span class="browser-version">66+</span>
                            </div>
                            <div class="browser-item">
                                <span class="browser-name">Safari</span>
                                <span class="browser-version">13+</span>
                            </div>
                            <div class="browser-item">
                                <span class="browser-name">Edge</span>
                                <span class="browser-version">79+</span>
                            </div>
                        </div>
                    `
                    downloadLinks = `
                        <div class="download-links">
                            <a href="https://www.google.com/chrome/" target="_blank" class="download-link">📥 下载Chrome</a>
                            <a href="https://www.mozilla.org/firefox/" target="_blank" class="download-link">🦊 下载Firefox</a>
                            <a href="https://www.microsoft.com/edge" target="_blank" class="download-link">🌐 下载Edge</a>
                        </div>
                    `
            }
            
            content.innerHTML = `
                <div class="browser-update-header">
                    <div class="browser-update-icon">🔄</div>
                    <h2 class="browser-update-title">需要更新浏览器</h2>
                </div>
                <div class="browser-update-message">
                    当前浏览器：${browserName} ${browserVersion}<br>
                    需要版本：${browserName} ${supportInfo.requiredVersion || '最新版'}+
                </div>
                ${updateInstructions}
                ${downloadLinks}
                <div class="dialog-buttons">
                    <button id="tryCamera" class="dialog-btn primary">尝试摄像头录制</button>
                    <button id="closeDialog" class="dialog-btn secondary">我知道了</button>
                </div>
            `
        }
        
        dialog.appendChild(content)
        document.body.appendChild(dialog)
        
        // 添加事件监听器
        const closeBtn = content.querySelector('#closeDialog')
        const cameraBtn = content.querySelector('#tryCamera')
        
        closeBtn?.addEventListener('click', () => {
            document.body.removeChild(dialog)
        })
        
        cameraBtn?.addEventListener('click', () => {
            document.body.removeChild(dialog)
            startCameraRecording()
        })
        
        // 点击背景关闭
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) {
                document.body.removeChild(dialog)
            }
        })
    }

    // 显示权限帮助对话框
    const showPermissionHelp = () => {
        const helpDialog = document.createElement('div')
        helpDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `
        
        const helpContent = document.createElement('div')
        helpContent.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 500px;
            margin: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `
        
        helpContent.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #333;">如何开启屏幕录制权限</h3>
            <div style="margin-bottom: 16px; line-height: 1.6; color: #666;">
                <p><strong>Chrome 浏览器：</strong></p>
                <ol style="margin: 8px 0; padding-left: 20px;">
                    <li>点击地址栏左侧的锁形图标或摄像头图标</li>
                    <li>在弹出菜单中找到"屏幕共享"或"显示器"选项</li>
                    <li>选择"允许"</li>
                    <li>刷新页面后重试</li>
                </ol>
                
                <p><strong>Firefox 浏览器：</strong></p>
                <ol style="margin: 8px 0; padding-left: 20px;">
                    <li>点击地址栏左侧的盾牌图标</li>
                    <li>关闭"增强型跟踪保护"</li>
                    <li>或在权限设置中允许屏幕共享</li>
                </ol>
                
                <p><strong>注意事项：</strong></p>
                <ul style="margin: 8px 0; padding-left: 20px;">
                    <li>确保网站使用 HTTPS 协议</li>
                    <li>某些企业网络可能限制屏幕录制功能</li>
                    <li>如果仍无法使用，请尝试重启浏览器</li>
                </ul>
            </div>
            <div style="text-align: right;">
                <button id="helpOkBtn" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 8px;
                ">我知道了</button>
                <button id="helpRetryBtn" style="
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                ">重试录制</button>
            </div>
        `
        
        helpDialog.appendChild(helpContent)
        document.body.appendChild(helpDialog)
        
        // 绑定事件
        const okBtn = helpContent.querySelector('#helpOkBtn')
        const retryBtn = helpContent.querySelector('#helpRetryBtn')
        
        okBtn?.addEventListener('click', () => {
            if (helpDialog.parentNode === document.body) {
                document.body.removeChild(helpDialog)
            }
        })
        
        retryBtn?.addEventListener('click', () => {
            if (helpDialog.parentNode === document.body) {
                document.body.removeChild(helpDialog)
            }
            startScreenRecording()
        })
        
        // 点击背景关闭
        helpDialog.addEventListener('click', (e) => {
            if (e.target === helpDialog) {
                if (helpDialog.parentNode === document.body) {
                    document.body.removeChild(helpDialog)
                }
            }
        })
    }

    // 开始录制屏幕
    const startScreenRecording = async (mediaSourceType: 'screen' | 'window' | 'monitor' | 'browser' = 'screen') => {
        // 检查浏览器支持
        const supportCheck = await checkScreenRecordingSupport()
        if (!supportCheck.supported) {
            // 如果是浏览器版本问题或安全问题，显示升级指导
            if (supportCheck.needsUpdate || supportCheck.securityIssue) {
                showBrowserUpdateGuide(supportCheck)
            } else {
                // 其他错误使用原有的错误对话框
                showErrorDialog(supportCheck.message || '不支持屏幕录制功能', true)
            }
            return
        }
        
        // Electron环境下的屏幕录制
        if (supportCheck.isElectron && window.electronAPI) {
            try {
                // 使用Electron专用的屏幕录制API
                let stream: MediaStream
                
                try {
                    // 获取屏幕源列表
                    const sources = await window.electronAPI.getScreenSources()
                    if (sources.length === 0) {
                        throw new Error('没有可用的屏幕源')
                    }
                    
                    // 根据mediaSourceType选择合适的屏幕源
                    let targetSource
                    if (mediaSourceType === 'screen') {
                        targetSource = sources.find(source => source.name.includes('Screen') || source.name.includes('屏幕')) || sources[0]
                    } else {
                        targetSource = sources[0] // 默认选择第一个
                    }
                    
                    // 使用Electron的屏幕录制API
                    stream = await window.electronAPI.startScreenRecording(targetSource.id, {
                        audio: true,
                        video: {
                            width: 1920,
                            height: 1080,
                            frameRate: 30
                        }
                    })
                } catch (electronError) {
                    console.warn('Electron屏幕录制失败，回退到浏览器API:', electronError)
                    // 回退到浏览器API
                    await window.electronAPI.setupMediaAccess()
                    
                    const constraints = {
                        audio: true,
                        video: {
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        }
                    }
                    
                    stream = await navigator.mediaDevices.getDisplayMedia(constraints)
                }
                const mediaRecorder = new MediaRecorder(stream)
                videoMediaRecorderRef.current = mediaRecorder
                
                const videoChunks: Blob[] = []
                
                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        videoChunks.push(event.data)
                    }
                }
                
                mediaRecorder.onstop = async () => {
                    const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
                    setVideoBlob(videoBlob)
                    
                    // 创建视频URL用于播放
                    const url = URL.createObjectURL(videoBlob)
                    setVideoUrl(url)
                    
                    // 停止所有轨道
                    stream.getTracks().forEach(track => track.stop())
                    
                    // 如果使用了Electron的屏幕录制API，需要调用停止方法
                    if (typeof window !== 'undefined' && window.electronAPI) {
                        try {
                            await window.electronAPI.stopScreenRecording()
                        } catch (error) {
                            console.warn('停止Electron屏幕录制失败:', error)
                        }
                    }
                }
                
                // 开始录制
                mediaRecorder.start()
                setIsVideoRecording(true)
                setVideoRecordingTime(0)
                
                // 开始计时
                videoRecordingTimerRef.current = setInterval(() => {
                    setVideoRecordingTime(prev => prev + 1)
                }, 1000)
                
                console.log('Electron环境下开始屏幕录制')
                return
            } catch (electronError) {
                console.error('Electron屏幕录制失败，回退到浏览器API:', electronError)
                // 继续执行浏览器API录制
            }
        }
        
        try {
            // 简化约束配置，提高兼容性
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: 1920, max: 1920 },
                    height: { ideal: 1080, max: 1080 },
                    frameRate: { ideal: 30, max: 30 }
                },
                audio: true
            }
            
            // 如果指定了特定的显示表面类型，尝试添加（但不强制）
            if (mediaSourceType !== 'screen') {
                try {
                    const videoConstraints = constraints.video as MediaTrackConstraints
                    const validDisplaySurfaces = ['monitor', 'window', 'browser'] as const
                    if (validDisplaySurfaces.includes(mediaSourceType as any)) {
                        videoConstraints.displaySurface = mediaSourceType as 'monitor' | 'window' | 'browser'
                    }
                } catch (e) {
                    console.warn('设置displaySurface失败，使用默认设置:', e)
                }
            }
            
            const stream = await navigator.mediaDevices.getDisplayMedia(constraints)
            const mediaRecorder = new MediaRecorder(stream)
            videoMediaRecorderRef.current = mediaRecorder
            
            const videoChunks: Blob[] = []
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunks.push(event.data)
                }
            }
            
            mediaRecorder.onstop = () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
                setVideoBlob(videoBlob)
                
                // 创建视频URL用于播放
                const url = URL.createObjectURL(videoBlob)
                setVideoUrl(url)
                
                // 停止所有轨道
                stream.getTracks().forEach(track => track.stop())
            }
            
            // 监听用户停止共享屏幕
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.addEventListener('ended', () => {
                    stopVideoRecording().catch(error => {
                        console.error('停止视频录制失败:', error)
                    })
                })
                
                // 获取实际选择的录制源信息
                const settings = videoTrack.getSettings() as ExtendedMediaTrackSettings
                console.log('录制源信息:', {
                    displaySurface: settings.displaySurface,
                    width: settings.width,
                    height: settings.height,
                    frameRate: settings.frameRate,
                    cursor: settings.cursor || 'unknown'
                })
                
                // 显示录制源类型提示
                const sourceTypeMap: Record<string, string> = {
                    'monitor': '🖥️ 整个屏幕',
                    'window': '🪟 应用窗口', 
                    'browser': '🌐 浏览器标签页'
                }
                const sourceType = sourceTypeMap[settings.displaySurface || ''] || '📺 屏幕'
                
                // 可以在这里添加一个小提示显示当前录制的源类型
                if (settings.displaySurface) {
                    console.log(`正在录制: ${sourceType}`)
                }
            }
            
            mediaRecorder.start()
            setIsVideoRecording(true)
            setVideoRecordingTime(0)
            
            // 开始计时
            videoRecordingTimerRef.current = setInterval(() => {
                setVideoRecordingTime(prev => prev + 1)
            }, 1000)
            
        } catch (error: any) {
            console.error('屏幕录制失败:', error)
            
            // 根据错误类型提供不同的帮助和解决方案
            let errorMessage = ''
            let showAlternative = true
            
            switch (error?.name) {
                case 'NotAllowedError':
                    errorMessage = '用户拒绝了屏幕录制权限。请点击浏览器地址栏的权限图标，允许屏幕共享权限。'
                    showPermissionHelp()
                    return // 显示权限帮助后直接返回
                    
                case 'NotSupportedError':
                    errorMessage = '您的浏览器版本不支持屏幕录制功能。\n\n请更新到以下版本：\n• Chrome 72+\n• Firefox 66+\n• Safari 13+\n• Edge 79+'
                    break
                    
                case 'NotFoundError':
                    errorMessage = '未找到可用的屏幕录制设备或显示器。请检查您的显示器连接。'
                    break
                    
                case 'NotReadableError':
                    errorMessage = '无法访问屏幕录制设备，可能被其他应用程序占用。请关闭其他录屏软件后重试。'
                    break
                    
                case 'OverconstrainedError':
                    errorMessage = '录制参数设置过高，您的设备无法满足。正在尝试使用较低的设置重新录制...'
                    // 尝试使用更低的设置重新录制
                    setTimeout(() => {
                        startScreenRecordingWithLowerSettings(mediaSourceType)
                    }, 1000)
                    return
                    
                case 'SecurityError':
                    errorMessage = '安全限制阻止了屏幕录制。请确保：\n• 网站使用 HTTPS 协议\n• 在用户交互后调用录制功能'
                    showAlternative = false
                    break
                    
                case 'AbortError':
                    // 用户取消了录制选择，不显示错误
                    console.log('用户取消了屏幕录制选择')
                    return
                    
                default:
                    errorMessage = `屏幕录制失败：${error?.message || '未知错误'}\n\n可能的原因：\n• 浏览器权限被拒绝\n• 网络连接问题\n• 设备兼容性问题`
                    break
            }
            
            // 显示错误对话框
            showErrorDialog(errorMessage, showAlternative)
        }
    }
    
    // 使用较低设置重新尝试录制
    const startScreenRecordingWithLowerSettings = async (mediaSourceType: 'screen' | 'window' | 'monitor' | 'browser' = 'screen') => {
        try {
            const constraints: MediaStreamConstraints = {
                video: {
                    width: { ideal: 1280, max: 1280 },
                    height: { ideal: 720, max: 720 },
                    frameRate: { ideal: 15, max: 15 }
                },
                audio: true // 简化音频设置
            }
            
            const stream = await navigator.mediaDevices.getDisplayMedia(constraints)
            const mediaRecorder = new MediaRecorder(stream)
            videoMediaRecorderRef.current = mediaRecorder
            
            const videoChunks: Blob[] = []
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunks.push(event.data)
                }
            }
            
            mediaRecorder.onstop = () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
                setVideoBlob(videoBlob)
                
                const url = URL.createObjectURL(videoBlob)
                setVideoUrl(url)
                
                stream.getTracks().forEach(track => track.stop())
            }
            
            const videoTrack = stream.getVideoTracks()[0]
            if (videoTrack) {
                videoTrack.addEventListener('ended', () => {
                    stopVideoRecording().catch(error => {
                        console.error('停止视频录制失败:', error)
                    })
                })
            }
            
            mediaRecorder.start()
            setIsVideoRecording(true)
            setVideoRecordingTime(0)
            setActualVideoRecordingDuration(0)
            
            videoRecordingTimerRef.current = setInterval(() => {
                setVideoRecordingTime(prev => {
                    const newTime = prev + 1
                    setActualVideoRecordingDuration(newTime)
                    return newTime
                })
            }, 1000)
            
            console.log('使用较低设置成功开始录制')
            
        } catch (lowError: any) {
            console.error('低设置录制也失败:', lowError)
            showErrorDialog('即使使用较低设置也无法开始录制。建议尝试摄像头录制作为替代方案。', true)
        }
    }
    
    // 显示错误对话框
    const showErrorDialog = (message: string, showAlternative: boolean = true) => {
        const errorDialog = document.createElement('div')
        errorDialog.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `
        
        const errorContent = document.createElement('div')
        errorContent.style.cssText = `
            background: white;
            padding: 24px;
            border-radius: 12px;
            max-width: 500px;
            margin: 20px;
            box-shadow: 0 8px 32px rgba(0,0,0,0.3);
        `
        
        const alternativeButton = showAlternative ? `
            <button id="tryAlternativeBtn" style="
                background: #28a745;
                color: white;
                border: none;
                padding: 8px 16px;
                border-radius: 4px;
                cursor: pointer;
            ">尝试摄像头录制</button>
        ` : ''
        
        errorContent.innerHTML = `
            <h3 style="margin: 0 0 16px 0; color: #dc3545;">❌ 录制失败</h3>
            <div style="margin-bottom: 16px; line-height: 1.6; color: #666; white-space: pre-line;">${message}</div>
            <div style="text-align: right;">
                <button id="errorOkBtn" style="
                    background: #007bff;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 4px;
                    cursor: pointer;
                    margin-right: 8px;
                ">我知道了</button>
                ${alternativeButton}
            </div>
        `
        
        errorDialog.appendChild(errorContent)
        document.body.appendChild(errorDialog)
        
        // 绑定事件
        const okBtn = errorContent.querySelector('#errorOkBtn')
        const altBtn = errorContent.querySelector('#tryAlternativeBtn')
        
        okBtn?.addEventListener('click', () => {
            if (errorDialog.parentNode === document.body) {
                document.body.removeChild(errorDialog)
            }
        })
        
        if (altBtn) {
            altBtn.addEventListener('click', () => {
                if (errorDialog.parentNode === document.body) {
                    document.body.removeChild(errorDialog)
                }
                startCameraRecording()
            })
        }
        
        // 点击背景关闭
        errorDialog.addEventListener('click', (e) => {
            if (e.target === errorDialog && errorDialog.parentNode === document.body) {
                document.body.removeChild(errorDialog)
            }
        })
    }

    // 录制摄像头加桌面
    const startCameraAndScreenRecording = async () => {
        try {
            // 获取摄像头流
            const cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            })
            
            // 获取屏幕流
            let screenStream
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron环境 - 使用专用的屏幕录制API
                try {
                    // 获取屏幕源列表
                    const sources = await window.electronAPI.getScreenSources()
                    if (sources.length === 0) {
                        throw new Error('没有可用的屏幕源')
                    }
                    
                    // 使用第一个屏幕源（通常是主屏幕）
                    const primaryScreen = sources.find(source => source.name.includes('Screen') || source.name.includes('屏幕')) || sources[0]
                    
                    // 使用Electron的屏幕录制API
                    screenStream = await window.electronAPI.startScreenRecording(primaryScreen.id, {
                        audio: true,
                        video: {
                            width: 1920,
                            height: 1080,
                            frameRate: 30
                        }
                    })
                } catch (electronError) {
                    console.warn('Electron屏幕录制失败，回退到浏览器API:', electronError)
                    // 回退到浏览器API
                    await window.electronAPI.setupMediaAccess()
                    screenStream = await navigator.mediaDevices.getDisplayMedia({
                        audio: true,
                        video: {
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        }
                    })
                }
            } else {
                // 浏览器环境
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: true,
                    video: true
                })
            }
            
            // 创建画布来合成视频
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = 1920
            canvas.height = 1080
            
            // 创建视频元素
            const screenVideo = document.createElement('video')
            const cameraVideo = document.createElement('video')
            
            // 设置静音以避免录制时播放声音影响用户体验
            screenVideo.muted = true
            cameraVideo.muted = true
            
            screenVideo.srcObject = screenStream
            cameraVideo.srcObject = cameraStream
            
            // 等待视频元素加载完成
            await Promise.all([
                new Promise<void>((resolve) => {
                    screenVideo.onloadedmetadata = () => {
                        screenVideo.play().then(() => resolve())
                    }
                }),
                new Promise<void>((resolve) => {
                    cameraVideo.onloadedmetadata = () => {
                        cameraVideo.play().then(() => resolve())
                    }
                })
            ])
            
            // 获取画布流
            const canvasStream = canvas.captureStream(30)
            
            // 添加音频轨道（摄像头音频和屏幕音频）
            const cameraAudioTracks = cameraStream.getAudioTracks()
            const screenAudioTracks = screenStream.getAudioTracks()
            
            // 添加摄像头音频
            cameraAudioTracks.forEach(track => canvasStream.addTrack(track))
            
            // 添加屏幕音频
            screenAudioTracks.forEach(track => canvasStream.addTrack(track))
            
            const mediaRecorder = new MediaRecorder(canvasStream)
            videoMediaRecorderRef.current = mediaRecorder
            
            const videoChunks: Blob[] = []
            
            // 绘制合成视频
            let animationId: number
            const drawFrame = () => {
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                
                // 绘制屏幕（背景）
                if (screenVideo.readyState >= 2 && screenVideo.videoWidth > 0) {
                    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
                }
                
                // 绘制摄像头（右下角小窗口）
                if (cameraVideo.readyState >= 2 && cameraVideo.videoWidth > 0) {
                    const cameraWidth = 320
                    const cameraHeight = 240
                    const x = canvas.width - cameraWidth - 20
                    const y = canvas.height - cameraHeight - 20
                    
                    // 绘制摄像头边框
                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 3
                    ctx.strokeRect(x - 2, y - 2, cameraWidth + 4, cameraHeight + 4)
                    
                    // 绘制摄像头视频
                    ctx.drawImage(cameraVideo, x, y, cameraWidth, cameraHeight)
                }
                
                // 持续绘制直到录制停止
                animationId = requestAnimationFrame(drawFrame)
            }
            
            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    videoChunks.push(event.data)
                }
            }
            
            mediaRecorder.onstop = async () => {
                const videoBlob = new Blob(videoChunks, { type: 'video/webm' })
                setVideoBlob(videoBlob)
                
                const url = URL.createObjectURL(videoBlob)
                setVideoUrl(url)
                
                // 停止所有轨道
                cameraStream.getTracks().forEach(track => track.stop())
                screenStream.getTracks().forEach(track => track.stop())
                canvasStream.getTracks().forEach(track => track.stop())
                
                // 如果使用了Electron的屏幕录制API，需要调用停止方法
                if (typeof window !== 'undefined' && window.electronAPI) {
                    try {
                        await window.electronAPI.stopScreenRecording()
                    } catch (error) {
                        console.warn('停止Electron屏幕录制失败:', error)
                    }
                }
            }
            
            // 开始录制
            mediaRecorder.start()
            setIsVideoRecording(true)
            setVideoRecordingType('camera_and_screen')
            
            // 开始绘制
            drawFrame()
            
            // 停止录制时清理动画
            const originalStop = mediaRecorder.stop.bind(mediaRecorder)
            mediaRecorder.stop = () => {
                if (animationId) {
                    cancelAnimationFrame(animationId)
                }
                originalStop()
            }
            
            // 开始计时
            videoRecordingTimerRef.current = setInterval(() => {
                setVideoRecordingTime(prev => prev + 1)
            }, 1000)
            
        } catch (error) {
            console.error('无法录制摄像头和屏幕:', error)
            alert('无法录制摄像头和屏幕，请检查权限设置')
        }
    }
    
    // 显示桌面录制预览
    const showScreenPreview = async () => {
        try {
            // 检查浏览器支持
            const supportCheck = await checkScreenRecordingSupport()
            if (!supportCheck.supported) {
                showErrorDialog(supportCheck.message || '不支持屏幕录制功能', true)
                return
            }
            
            let stream: MediaStream
            
            // Electron环境下的屏幕预览
            if (supportCheck.isElectron && window.electronAPI) {
                try {
                    await window.electronAPI.setupMediaAccess()
                    const constraints = {
                        audio: false, // 预览时不需要音频
                        video: {
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        }
                    }
                    stream = await navigator.mediaDevices.getDisplayMedia(constraints)
                } catch (electronError) {
                    console.error('Electron屏幕预览失败，回退到浏览器API:', electronError)
                    // 回退到浏览器API
                    const constraints: MediaStreamConstraints = {
                        video: {
                            width: { ideal: 1920, max: 1920 },
                            height: { ideal: 1080, max: 1080 },
                            frameRate: { ideal: 30, max: 30 }
                        },
                        audio: false // 预览时不需要音频
                    }
                    stream = await navigator.mediaDevices.getDisplayMedia(constraints)
                }
            } else {
                // 浏览器环境
                const constraints: MediaStreamConstraints = {
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 }
                    },
                    audio: false // 预览时不需要音频
                }
                stream = await navigator.mediaDevices.getDisplayMedia(constraints)
            }
            
            // 显示预览窗口
            showPreviewWindow(stream, '桌面录制预览', () => startScreenRecording('screen'))
            
        } catch (error: any) {
            console.error('桌面预览失败:', error)
            if (error?.name === 'AbortError') {
                console.log('用户取消了屏幕选择')
                return
            }
            showErrorDialog('无法启动桌面预览，请检查权限设置', true)
        }
    }
    
    // 显示摄像头+桌面录制预览
    const showCameraAndScreenPreview = async () => {
        try {
            // 获取摄像头流
            const cameraStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false // 预览时不需要音频
            })
            
            // 获取屏幕流
            let screenStream: MediaStream
            if (typeof window !== 'undefined' && window.electronAPI) {
                // Electron环境
                await window.electronAPI.setupMediaAccess()
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: false, // 预览时不需要音频
                    video: {
                        width: { ideal: 1920, max: 1920 },
                        height: { ideal: 1080, max: 1080 },
                        frameRate: { ideal: 30, max: 30 }
                    }
                })
            } else {
                // 浏览器环境
                screenStream = await navigator.mediaDevices.getDisplayMedia({
                    audio: false, // 预览时不需要音频
                    video: true
                })
            }
            
            // 创建画布来合成预览
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')!
            canvas.width = 1920
            canvas.height = 1080
            
            // 创建视频元素
            const screenVideo = document.createElement('video')
            const cameraVideo = document.createElement('video')
            
            // 设置静音以避免录制时播放声音影响用户体验
            screenVideo.muted = true
            cameraVideo.muted = true
            
            screenVideo.srcObject = screenStream
            cameraVideo.srcObject = cameraStream
            
            // 等待视频元素加载完成
            await Promise.all([
                new Promise<void>((resolve) => {
                    screenVideo.onloadedmetadata = () => {
                        screenVideo.play().then(() => resolve())
                    }
                }),
                new Promise<void>((resolve) => {
                    cameraVideo.onloadedmetadata = () => {
                        cameraVideo.play().then(() => resolve())
                    }
                })
            ])
            
            // 获取画布流
            const canvasStream = canvas.captureStream(30)
            
            let isPreviewActive = true
            
            // 绘制合成预览
            const drawPreviewFrame = () => {
                if (!isPreviewActive) return
                
                // 清空画布
                ctx.clearRect(0, 0, canvas.width, canvas.height)
                
                // 绘制屏幕（背景）
                if (screenVideo.readyState >= 2 && screenVideo.videoWidth > 0) {
                    ctx.drawImage(screenVideo, 0, 0, canvas.width, canvas.height)
                }
                
                // 绘制摄像头（右下角小窗口）
                if (cameraVideo.readyState >= 2 && cameraVideo.videoWidth > 0) {
                    const cameraWidth = 320
                    const cameraHeight = 240
                    const x = canvas.width - cameraWidth - 20
                    const y = canvas.height - cameraHeight - 20
                    
                    // 绘制摄像头边框
                    ctx.strokeStyle = '#ffffff'
                    ctx.lineWidth = 3
                    ctx.strokeRect(x - 2, y - 2, cameraWidth + 4, cameraHeight + 4)
                    
                    // 绘制摄像头视频
                    ctx.drawImage(cameraVideo, x, y, cameraWidth, cameraHeight)
                }
                
                requestAnimationFrame(drawPreviewFrame)
            }
            
            drawPreviewFrame()
            
            // 显示预览窗口
            showPreviewWindow(canvasStream, '摄像头+桌面录制预览', () => {
                // 停止预览绘制
                isPreviewActive = false
                // 停止预览流
                cameraStream.getTracks().forEach(track => track.stop())
                screenStream.getTracks().forEach(track => track.stop())
                canvasStream.getTracks().forEach(track => track.stop())
                // 开始录制
                startCameraAndScreenRecording()
            }, () => {
                // 停止预览绘制
                isPreviewActive = false
                // 清理预览流
                cameraStream.getTracks().forEach(track => track.stop())
                screenStream.getTracks().forEach(track => track.stop())
                canvasStream.getTracks().forEach(track => track.stop())
            })
            
        } catch (error) {
            console.error('摄像头+桌面预览失败:', error)
            showErrorDialog('无法启动摄像头+桌面预览，请检查权限设置', true)
        }
    }
    
    // 显示预览窗口
    const showPreviewWindow = (stream: MediaStream, title: string, onStartRecording: () => void, onClose?: () => void) => {
        // 创建预览窗口
        const previewOverlay = document.createElement('div')
        previewOverlay.className = 'preview-overlay'
        previewOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            backdrop-filter: blur(4px);
        `
        
        const previewContainer = document.createElement('div')
        previewContainer.style.cssText = `
            background: white;
            border-radius: 12px;
            padding: 20px;
            max-width: 90vw;
            max-height: 90vh;
            display: flex;
            flex-direction: column;
            gap: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        `
        
        // 标题
        const titleElement = document.createElement('h3')
        titleElement.textContent = title
        titleElement.style.cssText = `
            margin: 0;
            color: #333;
            font-size: 18px;
            text-align: center;
        `
        
        // 视频预览
        const video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true
        video.muted = true
        video.style.cssText = `
            width: 640px;
            height: 360px;
            border-radius: 8px;
            background: #000;
            object-fit: contain;
        `
        
        // 按钮容器
        const buttonContainer = document.createElement('div')
        buttonContainer.style.cssText = `
            display: flex;
            gap: 12px;
            justify-content: center;
        `
        
        // 开始录制按钮
        const startButton = document.createElement('button')
        startButton.textContent = '🔴 开始录制'
        startButton.style.cssText = `
            padding: 10px 20px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        `
        
        startButton.addEventListener('mouseenter', () => {
            startButton.style.backgroundColor = '#c82333'
        })
        startButton.addEventListener('mouseleave', () => {
            startButton.style.backgroundColor = '#dc3545'
        })
        
        startButton.addEventListener('click', () => {
            // 停止预览流
            stream.getTracks().forEach(track => track.stop())
            // 移除预览窗口
            document.body.removeChild(previewOverlay)
            // 开始录制
            onStartRecording()
        })
        
        // 取消按钮
        const cancelButton = document.createElement('button')
        cancelButton.textContent = '❌ 取消'
        cancelButton.style.cssText = `
            padding: 10px 20px;
            background: #6c757d;
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        `
        
        cancelButton.addEventListener('mouseenter', () => {
            cancelButton.style.backgroundColor = '#5a6268'
        })
        cancelButton.addEventListener('mouseleave', () => {
            cancelButton.style.backgroundColor = '#6c757d'
        })
        
        cancelButton.addEventListener('click', () => {
            // 停止预览流
            stream.getTracks().forEach(track => track.stop())
            // 执行清理回调
            if (onClose) onClose()
            // 移除预览窗口
            document.body.removeChild(previewOverlay)
        })
        
        // 组装预览窗口
        buttonContainer.appendChild(startButton)
        buttonContainer.appendChild(cancelButton)
        
        previewContainer.appendChild(titleElement)
        previewContainer.appendChild(video)
        previewContainer.appendChild(buttonContainer)
        
        previewOverlay.appendChild(previewContainer)
        
        // 点击背景关闭
        previewOverlay.addEventListener('click', (e) => {
            if (e.target === previewOverlay) {
                // 停止预览流
                stream.getTracks().forEach(track => track.stop())
                // 执行清理回调
                if (onClose) onClose()
                // 移除预览窗口
                document.body.removeChild(previewOverlay)
            }
        })
        
        // ESC键关闭
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // 停止预览流
                stream.getTracks().forEach(track => track.stop())
                // 执行清理回调
                if (onClose) onClose()
                // 移除预览窗口
                document.body.removeChild(previewOverlay)
                document.removeEventListener('keydown', handleEscape)
            }
        }
        document.addEventListener('keydown', handleEscape)
        
        document.body.appendChild(previewOverlay)
    }

    // 显示录制选项菜单
    const showRecordingOptions = async () => {
        // 检查各种录制方式的支持情况
        const supportCheck = await checkScreenRecordingSupport()
        
        const options = [
            { 
                label: '🖥️ 录制桌面', 
                description: '录制桌面屏幕和声音',
                action: () => startScreenRecording('screen'),
                preview: () => showScreenPreview(),
                supported: supportCheck.supported
            },
            { 
                label: '📹 录制摄像头+桌面', 
                description: '同时录制摄像头、桌面屏幕和声音',
                action: startCameraAndScreenRecording,
                preview: () => showCameraAndScreenPreview(),
                supported: supportCheck.supported && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
            }
        ]
        
        // 创建选项菜单
        const menu = document.createElement('div')
        menu.className = 'recording-options-menu'
        menu.style.cssText = `
            position: absolute;
            bottom: 50px;
            right: 10px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            z-index: 1000;
            min-width: 200px;
            max-height: 300px;
            overflow-y: auto;
            backdrop-filter: blur(10px);
        `
        
        // 添加菜单标题
        const title = document.createElement('div')
        title.textContent = '选择录制方式'
        title.style.cssText = `
            padding: 12px 16px 8px 16px;
            font-weight: 600;
            font-size: 14px;
            color: #333;
            border-bottom: 1px solid #eee;
            background: #f8f9fa;
            border-radius: 12px 12px 0 0;
        `
        menu.appendChild(title)
        
        options.forEach((option, index) => {
            const optionContainer = document.createElement('div')
            
            // 根据支持状态设置不同的样式和内容
            const isSupported = option.supported
            const statusIcon = isSupported ? '✅' : '❌'
            const statusText = isSupported ? '' : ' (不支持)'
            
            optionContainer.innerHTML = `
                <div style="padding: 12px 16px; border-bottom: ${index === options.length - 1 ? 'none' : '1px solid #f0f0f0'};">
                    <div style="display: flex; flex-direction: column; gap: 8px;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span style="font-size: 14px; font-weight: 500; color: ${isSupported ? '#333' : '#999'};">${option.label}${statusText}</span>
                            <span style="font-size: 12px;">${statusIcon}</span>
                        </div>
                        <div style="font-size: 12px; color: #666; line-height: 1.3; margin-bottom: 8px;">${option.description}</div>
                        <div style="display: flex; gap: 8px;">
                            <button class="preview-btn" style="
                                flex: 1;
                                padding: 6px 12px;
                                border: 1px solid #007bff;
                                background: white;
                                color: #007bff;
                                border-radius: 4px;
                                cursor: ${isSupported ? 'pointer' : 'not-allowed'};
                                font-size: 12px;
                                transition: all 0.2s ease;
                                opacity: ${isSupported ? '1' : '0.5'};
                            ">📺 预览</button>
                            <button class="record-btn" style="
                                flex: 1;
                                padding: 6px 12px;
                                border: none;
                                background: #007bff;
                                color: white;
                                border-radius: 4px;
                                cursor: ${isSupported ? 'pointer' : 'not-allowed'};
                                font-size: 12px;
                                transition: all 0.2s ease;
                                opacity: ${isSupported ? '1' : '0.5'};
                            ">🔴 开始录制</button>
                        </div>
                    </div>
                </div>
            `
            
            if (isSupported) {
                const previewBtn = optionContainer.querySelector('.preview-btn') as HTMLButtonElement
                const recordBtn = optionContainer.querySelector('.record-btn') as HTMLButtonElement
                
                // 预览按钮事件
                previewBtn.addEventListener('mouseenter', () => {
                    previewBtn.style.backgroundColor = '#007bff'
                    previewBtn.style.color = 'white'
                })
                previewBtn.addEventListener('mouseleave', () => {
                    previewBtn.style.backgroundColor = 'white'
                    previewBtn.style.color = '#007bff'
                })
                previewBtn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    option.preview()
                })
                
                // 录制按钮事件
                recordBtn.addEventListener('mouseenter', () => {
                    recordBtn.style.backgroundColor = '#0056b3'
                })
                recordBtn.addEventListener('mouseleave', () => {
                    recordBtn.style.backgroundColor = '#007bff'
                })
                recordBtn.addEventListener('click', (e) => {
                    e.stopPropagation()
                    option.action()
                    // 移除菜单和事件监听器
                    if (menu.parentNode === document.body) {
                        document.body.removeChild(menu)
                    }
                    document.removeEventListener('click', closeMenu)
                })
            } else {
                const previewBtn = optionContainer.querySelector('.preview-btn') as HTMLButtonElement
                const recordBtn = optionContainer.querySelector('.record-btn') as HTMLButtonElement
                
                const showUnsupportedError = (e: Event) => {
                    e.preventDefault()
                    e.stopPropagation()
                    // 显示不支持的原因
                    const reason = option.label.includes('摄像头') 
                        ? '您的浏览器不支持摄像头访问，或摄像头权限被拒绝。'
                        : supportCheck.message || '您的浏览器不支持此录制功能。'
                    
                    showErrorDialog(reason, option.label.includes('摄像头') ? false : true)
                    
                    // 关闭菜单
                    if (menu.parentNode === document.body) {
                        document.body.removeChild(menu)
                    }
                    document.removeEventListener('click', closeMenu)
                }
                
                previewBtn.addEventListener('click', showUnsupportedError)
                recordBtn.addEventListener('click', showUnsupportedError)
            }
            
            menu.appendChild(optionContainer)
        })
        
        // 点击外部关闭菜单
        const closeMenu = (e: MouseEvent) => {
            if (!menu.contains(e.target as Node)) {
                if (menu.parentNode === document.body) {
                    document.body.removeChild(menu)
                    document.removeEventListener('click', closeMenu)
                }
            }
        }
        
        document.body.appendChild(menu)
        setTimeout(() => {
            document.addEventListener('click', closeMenu)
        }, 100)
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
    
    // 停止录制视频
    const stopVideoRecording = async () => {
        if (videoMediaRecorderRef.current && isVideoRecording) {
            // 先保存当前录制时间
            const finalRecordingTime = videoRecordingTime
            
            // 停止录制
            videoMediaRecorderRef.current.stop()
            setIsVideoRecording(false)
            
            // 清除计时器
            if (videoRecordingTimerRef.current) {
                clearInterval(videoRecordingTimerRef.current)
                videoRecordingTimerRef.current = null
            }
            
            // 立即设置实际录制时长
            setActualVideoRecordingDuration(finalRecordingTime)
            
            // 如果使用了Electron的屏幕录制API，需要调用停止方法
            if (typeof window !== 'undefined' && window.electronAPI) {
                try {
                    await window.electronAPI.stopScreenRecording()
                } catch (error) {
                    console.warn('停止Electron屏幕录制失败:', error)
                }
            }
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
    
    // 取消录制视频
    const cancelVideoRecording = async () => {
        if (isVideoRecording) {
            await stopVideoRecording()
        }
        
        // 清理视频资源
        if (videoUrl) {
            URL.revokeObjectURL(videoUrl)
            setVideoUrl(null)
        }
        
        setVideoBlob(null)
        setVideoRecordingTime(0)
        setActualVideoRecordingDuration(0)
        setIsVideoPlaying(false)
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
    
    // 播放/暂停视频
    const toggleVideoPlayback = () => {
        if (!videoRef.current || !videoUrl) return
        
        if (isVideoPlaying) {
            videoRef.current.pause()
            setIsVideoPlaying(false)
        } else {
            videoRef.current.play()
            setIsVideoPlaying(true)
        }
    }
    
    // 清理定时器和音频/视频资源
    useEffect(() => {
        return () => {
            if (recordingTimerRef.current) {
                clearInterval(recordingTimerRef.current)
            }
            if (videoRecordingTimerRef.current) {
                clearInterval(videoRecordingTimerRef.current)
            }
            if (audioUrl) {
                URL.revokeObjectURL(audioUrl)
            }
            if (videoUrl) {
                URL.revokeObjectURL(videoUrl)
            }
        }
    }, [audioUrl, videoUrl])

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
                    className={`toolbar-btn ${isVideoRecording ? 'recording' : ''}`}
                    onClick={handleVideoClick}
                    title={isVideoRecording ? '停止录制视频' : '录制视频'}
                    disabled={disabled}
                >
                    {isVideoRecording ? (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>
                        </svg>
                    ) : (
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none">
                            <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
                            <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                        </svg>
                    )}
                </button>
                
                {/* 视频录制状态显示 */}
                {isVideoRecording && (
                    <div className="recording-indicator">
                        <span className="recording-dot"></span>
                        <span className="recording-time">{formatRecordingTime(videoRecordingTime)}</span>
                        <button className="cancel-recording" onClick={cancelVideoRecording} title="取消录制">
                            ×
                        </button>
                    </div>
                )}
                
              
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
                
                {/* 视频消息预览 */}
                {videoBlob && (
                    <div className="video-preview">
                        <div className="video-info">
                            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                                <path d="M23 7l-7 5 7 5V7z" stroke="currentColor" strokeWidth="1.5" fill="currentColor"/>
                                <rect x="1" y="5" width="15" height="14" rx="2" ry="2" stroke="currentColor" strokeWidth="1.5"/>
                            </svg>
                            <span>视频消息 ({formatRecordingTime(actualVideoRecordingDuration)})</span>
                        </div>
                        
                        {/* 视频预览窗口 */}
                        {videoUrl && (
                            <div className="video-preview-container">
                                <video
                                    ref={videoRef}
                                    src={videoUrl}
                                    controls
                                    playsInline
                                    onEnded={() => setIsVideoPlaying(false)}
                                    onPause={() => setIsVideoPlaying(false)}
                                    onPlay={() => setIsVideoPlaying(true)}
                                    style={{ 
                                        width: '100%', 
                                        maxWidth: '300px', 
                                        height: 'auto',
                                        borderRadius: '8px',
                                        backgroundColor: '#000'
                                    }}
                                />
                            </div>
                        )}
                        
                        <div className="video-controls">
                            <button className="video-btn play" onClick={toggleVideoPlayback}>
                                {isVideoPlaying ? (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                        <rect x="6" y="4" width="4" height="16" fill="currentColor"/>
                                        <rect x="14" y="4" width="4" height="16" fill="currentColor"/>
                                    </svg>
                                ) : (
                                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none">
                                        <polygon points="5,3 19,12 5,21" fill="currentColor"/>
                                    </svg>
                                )}
                                {isVideoPlaying ? '暂停' : '播放'}
                            </button>
                            <button className="video-btn cancel" onClick={cancelVideoRecording}>
                                删除
                            </button>
                        </div>
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
                disabled={(!inputValue.trim() && selectedFiles.length === 0 && selectedImages.length === 0 && !audioBlob && !videoBlob) || disabled}
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