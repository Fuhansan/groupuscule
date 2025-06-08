import React, { useState, useRef, useEffect } from 'react'
import MessageInput from './message_input/MessageInput'
import MessageBox from './message_box/MessageBox'
import ImagePreviewModal from '../tools/ImagePreviewModal'
import './ChatWindow.css'

interface Friend {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unreadCount: number
}

interface ChatWindowProps {
    friend: Friend
    onClose?: () => void
}

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

function ChatWindow({ friend }: ChatWindowProps) {
    // 当前用户ID，实际应用中应该从用户状态或认证信息中获取
    const currentUserId = 'current_user_123'
    
    const [messages, setMessages] = useState<Message[]>([
        {
            session_id: 'session_001',
            conversation_id: 'conv_001',
            sender: {
                user_id: friend.id,
                user_name: friend.name,
                avatar: friend.avatar,
                account_id: friend.id
            },
            receiver: {
                user_id: currentUserId,
                user_name: '我',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                account_id: currentUserId
            },
            message: [
                {
                    type: 'text',
                    content: '你好！'
                }
            ],
            timestamp: '14:30',
            id: '1'
        },
        {
            session_id: 'session_002',
            conversation_id: 'conv_001',
            sender: {
                user_id: currentUserId,
                user_name: '我',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                account_id: currentUserId
            },
            receiver: {
                user_id: friend.id,
                user_name: friend.name,
                avatar: friend.avatar,
                account_id: friend.id
            },
            message: [
                {
                    type: 'text',
                    content: '嗨，最近怎么样？'
                }
            ],
            timestamp: '14:31',
            id: '2'
        },
        {
            session_id: 'session_003',
            conversation_id: 'conv_001',
            sender: {
                user_id: friend.id,
                user_name: friend.name,
                avatar: friend.avatar,
                account_id: friend.id
            },
            receiver: {
                user_id: currentUserId,
                user_name: '我',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                account_id: currentUserId
            },
            message: [
                {
                    type: 'text',
                    content: '还不错，你呢？工作忙吗？'
                }
            ],
            timestamp: '14:32',
            id: '3'
        },
        {
            session_id: 'session_004',
            conversation_id: 'conv_001',
            sender: {
                user_id: currentUserId,
                user_name: '我',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                account_id: currentUserId
            },
            receiver: {
                user_id: friend.id,
                user_name: friend.name,
                avatar: friend.avatar,
                account_id: friend.id
            },
            message: [
                {
                    type: 'text',
                    content: '还好，最近在学习新技术'
                }
            ],
            timestamp: '14:33',
            id: '4'
        }
    ])
    
    const [previewImage, setPreviewImage] = useState<string>('')
    const [isPreviewOpen, setIsPreviewOpen] = useState(false)

    const handleSendMessage = (content: string, type: 'text' | 'image' | 'voice' | 'video' | 'file' | 'mixed') => {
        if (content.trim()) {
            let messageContents: MessageContent[] = []
            
            if (type === 'mixed') {
                // 解析复合消息内容
                try {
                    const mixedContent = JSON.parse(content)
                    
                    // 按顺序添加各种类型的内容
                    if (mixedContent.text) {
                        messageContents.push({
                            type: 'text',
                            content: mixedContent.text
                        })
                    }
                    
                    if (mixedContent.images && mixedContent.images.length > 0) {
                        messageContents.push({
                            type: 'image',
                            images: mixedContent.images // 直接使用base64格式的图片数组
                        })
                    }
                    
                    if (mixedContent.files && mixedContent.files.length > 0) {
                        mixedContent.files.forEach((file: any) => {
                            messageContents.push({
                                type: 'file',
                                content: JSON.stringify(file)
                            })
                        })
                    }
                    
                    if (mixedContent.voice) {
                        messageContents.push({
                            type: 'voice',
                            content: JSON.stringify(mixedContent.voice)
                        })
                    }
                } catch (error) {
                    console.error('解析复合消息失败:', error)
                    // 如果解析失败，作为普通文本处理
                    messageContents = [{
                        type: 'text',
                        content: content.trim()
                    }]
                }
            } else {
                // 单一类型消息
                messageContents = [{
                    type: type,
                    content: content.trim()
                }]
            }
            
            const newMessage: Message = {
                session_id: `session_${Date.now()}`,
                conversation_id: 'conv_001',
                sender: {
                    user_id: currentUserId,
                    user_name: '我',
                    avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                    account_id: currentUserId
                },
                receiver: {
                    user_id: friend.id,
                    user_name: friend.name,
                    avatar: friend.avatar,
                    account_id: friend.id
                },
                message: messageContents,
                timestamp: new Date().toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                }),
                id: Date.now().toString()
            }
            setMessages(prev => [...prev, newMessage])
            
            // 模拟对方回复（仅对文本消息回复）
            if (type === 'text') {
                setTimeout(() => {
                    const replyMessage: Message = {
                        session_id: `session_${Date.now() + 1}`,
                        conversation_id: 'conv_001',
                        sender: {
                            user_id: friend.id,
                            user_name: friend.name,
                            avatar: friend.avatar,
                            account_id: friend.id
                        },
                        receiver: {
                            user_id: currentUserId,
                            user_name: '我',
                            avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
                            account_id: currentUserId
                        },
                        message: [
                            {
                                type: 'text',
                                content: '收到！'
                            }
                        ],
                        timestamp: new Date().toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                        }),
                        id: (Date.now() + 1).toString()
                    }
                    setMessages(prev => [...prev, replyMessage])
                }, 1000)
            }
        }
    }

    const handleImageClick = (imageUrl: string) => {
        setPreviewImage(imageUrl)
        setIsPreviewOpen(true)
    }

    const handleClosePreview = () => {
        setIsPreviewOpen(false)
        setPreviewImage('')
    }



    return (
        <div className="chat-window">
            <MessageBox 
                messages={messages}
                currentUserId={currentUserId}
                onImageClick={handleImageClick}
                onVideoClick={(videoUrl) => {
                    // 处理视频点击事件，可以打开视频播放器或全屏播放
                    console.log('Video clicked:', videoUrl)
                }}
            />

            <MessageInput 
                onSendMessage={handleSendMessage} 
                onImagePreview={handleImageClick}
            />
            
            <ImagePreviewModal 
                imageUrl={previewImage}
                isOpen={isPreviewOpen}
                onClose={handleClosePreview}
            />
        </div>
    )
}

export default ChatWindow