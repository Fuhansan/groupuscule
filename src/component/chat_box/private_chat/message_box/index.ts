export { default } from './MessageBox'
export type { MessageBoxProps } from './MessageBox'

// 导出消息相关的类型定义
export interface MessageContent {
    type: 'text' | 'image' | 'voice' | 'video' | 'file'
    content?: string
    images?: string[]
    voices?: string[]
    videos?: string[]
    files?: string[]
}

export interface Sender {
    user_id: string
    user_name: string
    avatar: string
    account_id: string
}

export interface Receiver {
    user_id: string
    user_name: string
    avatar: string
    account_id: string
}

export interface Message {
    session_id: string
    conversation_id: string
    sender: Sender
    receiver: Receiver
    message: MessageContent[]
    timestamp?: string
    id?: string
}