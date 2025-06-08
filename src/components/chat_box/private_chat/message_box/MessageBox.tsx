import React, { useRef, useEffect, useState } from 'react'
import './MessageBox.css'

interface MessageContent {
    type: 'text' | 'image' | 'voice' | 'video' | 'file'
    content?: string
    images?: string[]
    voices?: string[]
    videos?: string[]
    files?: string[]
}

interface Sender {
    user_id: string
    user_name: string
    avatar: string
    account_id: string
}

interface Receiver {
    user_id: string
    user_name: string
    avatar: string
    account_id: string
}

interface Message {
    session_id: string
    conversation_id: string
    sender: Sender
    receiver: Receiver
    message: MessageContent[]
    timestamp?: string
    id?: string
}

interface Friend {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unreadCount: number
}

export interface MessageBoxProps {
    messages: Message[]
    currentUserId: string
    onImageClick: (imageUrl: string) => void
    onVideoClick?: (videoUrl: string) => void
}

function MessageBox({ messages, currentUserId, onImageClick, onVideoClick }: MessageBoxProps) {
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const [contextMenu, setContextMenu] = useState<{
        visible: boolean
        x: number
        y: number
        messageIndex: number
        contentIndex: number
        content: string
    }>({ visible: false, x: 0, y: 0, messageIndex: -1, contentIndex: -1, content: '' })

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // 点击其他地方隐藏菜单
    useEffect(() => {
        const handleClick = (e: MouseEvent) => {
            // 检查点击的目标是否在右键菜单内
            const target = e.target as HTMLElement
            const contextMenuElement = document.querySelector('.context-menu')
            
            if (contextMenuElement && contextMenuElement.contains(target)) {
                return // 点击菜单内部，不隐藏
            }
            
            hideContextMenu()
        }
        
        if (contextMenu.visible) {
            // 延迟添加事件监听器，避免立即触发
            const timer = setTimeout(() => {
                document.addEventListener('click', handleClick)
            }, 50)
            
            return () => {
                clearTimeout(timer)
                document.removeEventListener('click', handleClick)
            }
        }
    }, [contextMenu.visible])

    // 处理右键菜单
    const handleContextMenu = (e: React.MouseEvent, messageIndex: number, contentIndex: number, content: string) => {
        e.preventDefault()
        e.stopPropagation()
        
        console.log('右键菜单触发:', { 
            messageIndex, 
            contentIndex, 
            content, 
            x: e.clientX, 
            y: e.clientY,
            target: e.target,
            currentTarget: e.currentTarget
        })
        
        // 先隐藏之前的菜单
        if (contextMenu.visible) {
            hideContextMenu()
        }
        
        // 计算菜单位置，确保不超出视窗
        const menuWidth = 120
        const menuHeight = 40
        const x = e.clientX + menuWidth > window.innerWidth ? e.clientX - menuWidth : e.clientX
        const y = e.clientY + menuHeight > window.innerHeight ? e.clientY - menuHeight : e.clientY
        
        // 延迟设置菜单状态，确保之前的菜单完全隐藏
        setTimeout(() => {
            setContextMenu({
                visible: true,
                x,
                y,
                messageIndex,
                contentIndex,
                content
            })
            console.log('右键菜单状态已设置:', { visible: true, x, y })
        }, 10)
    }

    // 隐藏右键菜单
    const hideContextMenu = () => {
        setContextMenu(prev => ({ ...prev, visible: false }))
    }

    // 复制文本
    const copyText = async () => {
        try {
            await navigator.clipboard.writeText(contextMenu.content)
            console.log('文本已复制到剪贴板')
        } catch (err) {
            console.error('复制失败:', err)
            // 降级方案
            const textArea = document.createElement('textarea')
            textArea.value = contextMenu.content
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
        }
        hideContextMenu()
    }


    const renderMessageContent = (messageContent: MessageContent, messageIndex: number, contentIndex: number) => {
        switch (messageContent.type) {
            case 'text':
                return (
                    <span 
                        className="message-text"
                        onContextMenu={(e) => handleContextMenu(e, messageIndex, contentIndex, messageContent.content || '')}
                    >
                        {messageContent.content}
                    </span>
                )
            
            case 'image':
                return (
                    <div className="message-images">
                        {messageContent.images?.map((imageUrl, index) => (
                            <div key={index} className="message-image-container">
                                <img 
                                    src={imageUrl} 
                                    alt="图片消息" 
                                    className="message-image"
                                    onClick={() => onImageClick(imageUrl)}
                                />
                            </div>
                        ))}
                    </div>
                )
            
            case 'voice':
                return (
                    <div className="message-voice">
                        {messageContent.voices?.map((voiceUrl, index) => (
                            <div key={index} className="voice-player">
                                <div className="voice-icon">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" stroke="currentColor" strokeWidth="2"/>
                                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                                        <line x1="8" y1="23" x2="16" y2="23" stroke="currentColor" strokeWidth="2"/>
                                    </svg>
                                </div>
                                <audio controls className="voice-audio">
                                    <source src={voiceUrl} type="audio/wav" />
                                    <source src={voiceUrl} type="audio/mp3" />
                                    您的浏览器不支持音频播放
                                </audio>
                            </div>
                        ))}
                    </div>
                )
            
            case 'video':
                return (
                    <div className="message-video">
                        {messageContent.videos?.map((videoUrl, index) => (
                            <div key={index} className="video-container">
                                <video 
                                    controls 
                                    playsInline
                                    className="message-video-player"
                                    onClick={() => onVideoClick?.(videoUrl)}
                                >
                                    <source src={videoUrl} type="video/mp4" />
                                    <source src={videoUrl} type="video/webm" />
                                    您的浏览器不支持视频播放
                                </video>
                            </div>
                        ))}
                    </div>
                )
            
            case 'file':
                return (
                    <div className="message-files">
                        {messageContent.files?.map((fileUrl, index) => {
                            const fileName = fileUrl.split('/').pop() || '未知文件'
                            return (
                                <div key={index} className="message-file">
                                    <div className="file-icon">
                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <polyline points="14,2 14,8 20,8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </div>
                                    <a href={fileUrl} download className="file-name">{fileName}</a>
                                </div>
                            )
                        })}
                    </div>
                )
            
            default:
                return <span className="message-text">不支持的消息类型</span>
        }
    }

    return (
        <div className="messages-container">
            <div className="messages-wrapper">
                {messages.map((message, messageIndex) => {
                    const isSelf = message.sender.user_id === currentUserId
                    const hasMedia = message.message.some(content => 
                        content.type === 'image' || content.type === 'video'
                    )
                    
                    return (
                        <div 
                            key={`${message.session_id}-${messageIndex}`}
                            className={`message-item ${isSelf ? 'message-self' : 'message-other'}`}
                        >
                            {!isSelf && (
                                <div className="message-avatar">
                                    <img src={message.sender.avatar} alt={message.sender.user_name} />
                                </div>
                            )}
                            <div className="message-content">
                                <div className={`message-bubble ${hasMedia ? 'media-bubble' : ''}`}>
                                    <div className="message-contents">
                                        {message.message.map((messageContent, contentIndex) => (
                                            <div key={contentIndex} className={`content-item content-${messageContent.type}`}>
                                                {renderMessageContent(messageContent, messageIndex, contentIndex)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <div className="message-time">
                                    {message.timestamp || new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                            {isSelf && (
                                <div className="message-avatar">
                                    <img src={message.sender.avatar} alt={message.sender.user_name} />
                                </div>
                            )}
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>
            
            {/* 右键菜单 */}
            {contextMenu.visible && (
                <div 
                    className="context-menu"
                    style={{
                        position: 'fixed',
                        left: contextMenu.x,
                        top: contextMenu.y,
                        zIndex: 1000
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="context-menu-item" onClick={copyText}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" stroke="currentColor" strokeWidth="2"/>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        复制
                    </div>
                </div>
            )}
        </div>
    )
}

export default MessageBox