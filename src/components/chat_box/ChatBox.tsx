import './index.css'
import React, { useState } from 'react'
import UserProfile from './UserProfile'
import ChatWindow from './private_chat/ChatWindow'

interface Friend {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unreadCount: number
}

type PageType = 'empty' | 'profile' | 'chat'

interface User {
    name: string
    avatar: string
    signature: string
    isOnline: boolean
    email: string
    phone: string
    birthday: string
    gender: string
}

interface ChatBoxProps {
    pageType: PageType
    selectedFriend?: Friend | null
    user: User
    onPageChange?: (type: PageType) => void
    onUserUpdate?: (updatedUser: Partial<User>) => void
}

function ChatBox({ pageType = 'empty', selectedFriend, user, onPageChange, onUserUpdate }: ChatBoxProps) {
    const handleMinimize = () => {
        // 最小化窗口
        if (window.electronAPI) {
            window.electronAPI.minimize();
        }
    };

    const handleMaximize = () => {
        // 最大化/还原窗口
        if (window.electronAPI) {
            window.electronAPI.maximize();
        }
    };

    const handleClose = () => {
        // 关闭窗口（隐藏到系统托盘）
        if (window.electronAPI) {
            window.electronAPI.close();
        }
    };

    return (
        <div className="chat-box">
            <div className="window-controls" onContextMenu={(e) => e.preventDefault()}>
                    <button className="control-btn minimize-btn" onClick={handleMinimize} title="最小化">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect x="2" y="5" width="8" height="2" fill="currentColor"/>
                        </svg>
                    </button>
                    <button className="control-btn maximize-btn" onClick={handleMaximize} title="最大化">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <rect x="2" y="2" width="8" height="8" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                        </svg>
                    </button>
                    <button className="control-btn close-btn" onClick={handleClose} title="关闭">
                        <svg width="12" height="12" viewBox="0 0 12 12">
                            <path d="M2 2L10 10M10 2L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        </svg>
                    </button>
            </div>
            <div className="header-left" onContextMenu={(e) => e.preventDefault()}>
                {pageType === 'chat' && selectedFriend && (
                    <div className="chat-title">
                        <span className="chat-name">{selectedFriend.name}</span>
                    </div>
                )}
                {pageType === 'profile' && (
                    <div className="chat-title">
                        <span className="page-title">个人信息</span>
                    </div>
                )}
            </div>
            <div className='chat-box-container'>
                {pageType === 'empty' && (
                    <div className="empty-state">
                        <div className="empty-content">
                            <svg className="empty-icon" viewBox="0 0 24 24" width="64" height="64">
                                <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            <h3>Welcome to HdSome</h3>
                            <p>Your taste is particularly unique, Let‘s go...</p>
                        </div>
                    </div>
                )}
                {pageType === 'profile' && (
                    <UserProfile 
                        user={user}
                        onClose={() => onPageChange?.('empty')} 
                        onUserUpdate={onUserUpdate}
                    />
                )}
                {pageType === 'chat' && selectedFriend && (
                    <ChatWindow friend={selectedFriend} onClose={() => onPageChange?.('empty')} />
                )}
            </div>
        </div>
    )
}


export default ChatBox