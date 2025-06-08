import './index.css'
import { useEffect, useState } from 'react'

interface Friend {
    id: string
    name: string
    avatar: string
    lastMessage: string
    timestamp: string
    unreadCount: number
}

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

interface ChatMessageListProps {
    user: User
    onUserProfileClick?: () => void
    onFriendClick?: (friend: Friend) => void
}

function ChatMessageList({ user, onUserProfileClick, onFriendClick }: ChatMessageListProps) {
    const [friends, setFriends] = useState<Friend[]>([])
    const [selectedId, setSelectedId] = useState<string | null>(null)
    const [searchText, setSearchText] = useState('')

    useEffect(() => {
        // 模拟好友数据
        setFriends([
            {
                id: '1',
                name: '老腊肉保全市场务...',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456&s=100',
                lastMessage: '51套信息化夜跑技术：[...]',
                timestamp: '17:11',
                unreadCount: 2
            },
            {
                id: '2', 
                name: '湖南攻坚队',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=789012&s=100',
                lastMessage: '国下一些夜：[图片]',
                timestamp: '16:59',
                unreadCount: 0
            },
            {
                id: '3',
                name: 'DNF战斗小组, 你...',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=345678&s=100', 
                lastMessage: '大初不可强求-快乐长存：...',
                timestamp: '14:47',
                unreadCount: 5
            },
            {
                id: '4',
                name: '潘诚',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=901234&s=100',
                lastMessage: 'OK',
                timestamp: '星期五',
                unreadCount: 0
            },
            {
                id: '5',
                name: '彭清源',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=567890&s=100',
                lastMessage: '[公告]（接受邀请）DNF群聊',
                timestamp: '05/02',
                unreadCount: 1
            },
            {
                id: '6',
                name: '傅汉三',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=234567&s=100',
                lastMessage: '[图片]',
                timestamp: '05/27',
                unreadCount: 0
            },
            {
                id: '7',
                name: '彭清源',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=678901&s=100',
                lastMessage: '好吧...',
                timestamp: '05/23',
                unreadCount: 0
            },
            {
                id: '8',
                name: '田阳',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=890123&s=100',
                lastMessage: '(音音通话)通话时长 0:27',
                timestamp: '03/24',
                unreadCount: 0
            },
            {
                id: '9',
                name: '吴俊杰',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=456789&s=100',
                lastMessage: 'okok',
                timestamp: '03/15',
                unreadCount: 0
            },
            {
                id: '10',
                name: '去你吗',
                avatar: 'https://q1.qlogo.cn/g?b=qq&nk=012345&s=100',
                lastMessage: '请注一下通过',
                timestamp: '03/14',
                unreadCount: 3
            }
        ])
    }, [])

    const filteredFriends = friends.filter(friend => 
        friend.name.toLowerCase().includes(searchText.toLowerCase())
    )

    return (
        <div className='chat-message-container'>
            {/* 顶部用户信息区域 */}
            <div className="user-header">
                <div className="user-info">
                    <div className="user-avatar" onClick={onUserProfileClick}>
                        <img src={user.avatar} alt={user.name} />
                        {user.isOnline && <div className="online-status"></div>}
                    </div>
                    <div className="user-details">
                        <span className="user-name" onClick={onUserProfileClick}>{user.name}</span>
                        <span className="user-signature">{user.signature}</span>
                    </div>
                </div>
            </div>

            {/* 搜索框 */}
            <div className="search-container">
                <div className="search-box">
                    <svg className="search-icon" viewBox="0 0 24 24" width="16" height="16">
                        <path fill="currentColor" d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                    </svg>
                    <input 
                        type="text" 
                        placeholder="搜索"
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                    />
                    <button className="add-btn">+</button>
                </div>
            </div>

            {/* 好友列表 */}
            <div className="friends-list">
                {filteredFriends.map(friend => (
                    <div 
                        key={friend.id} 
                        className={`friend-item ${selectedId === friend.id ? 'selected' : ''}`}
                        onClick={() => {
                            setSelectedId(friend.id)
                            onFriendClick?.(friend)
                        }}
                    >
                        <div className="friend-avatar">
                            <img src={friend.avatar} alt={friend.name} />
                            {/* 在线状态指示器已移除 */}
                        </div>
                        <div className="friend-info">
                            <div className="friend-header">
                                <span className="friend-name">{friend.name}</span>
                                <span className="message-time">{friend.timestamp}</span>
                            </div>
                            <div className="last-message">{friend.lastMessage}</div>
                        </div>
                        {friend.unreadCount && (
                            <div className="unread-badge">{friend.unreadCount}</div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}

export default ChatMessageList