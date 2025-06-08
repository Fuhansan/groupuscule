import { useState, useRef, useEffect } from 'react'
import './UserProfile.css'

interface UserInfo {
    name: string
    signature: string
    avatar: string
    email: string
    phone: string
    birthday: string
    gender: string
    isOnline: boolean
}

interface UserProfileProps {
    user: UserInfo
    onClose: () => void
    onUserUpdate?: (updatedUser: Partial<UserInfo>) => void
}

function UserProfile({ user, onClose, onUserUpdate }: UserProfileProps) {
    const [isEditing, setIsEditing] = useState(false)
    const [editForm, setEditForm] = useState(user)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleEdit = () => {
        setIsEditing(true)
        setEditForm(user)
    }

    const handleSave = () => {
        onUserUpdate?.(editForm)
        setIsEditing(false)
    }

    const handleCancel = () => {
        setEditForm(user)
        setIsEditing(false)
    }

    // 当用户数据更新时，同步editForm
    useEffect(() => {
        if (!isEditing) {
            setEditForm(user)
        }
    }, [user, isEditing])

    const handleInputChange = (field: keyof UserInfo, value: string) => {
        setEditForm(prev => ({ ...prev, [field]: value }))
    }

    const handleAvatarChange = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            const reader = new FileReader()
            reader.onload = (e) => {
                const result = e.target?.result as string
                setEditForm(prev => ({ ...prev, avatar: result }))
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="user-profile">
            <div className="profile-header">
                <button className="close-btn" onClick={onClose}>
                    <svg viewBox="0 0 24 24" width="20" height="20">
                        <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                    </svg>
                </button>
                <h2>个人信息</h2>
                <div className="header-actions">
                    <button 
                        className="edit-btn" 
                        onClick={isEditing ? handleSave : handleEdit}
                    >
                        {isEditing ? (
                            <>
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                                </svg>
                                保存
                            </>
                        ) : (
                            <>
                                <svg viewBox="0 0 24 24" width="16" height="16">
                                    <path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                </svg>
                                编辑
                            </>
                        )}
                    </button>
                    {isEditing && (
                        <button className="cancel-btn" onClick={handleCancel}>
                            <svg viewBox="0 0 24 24" width="16" height="16">
                                <path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                            </svg>
                            取消
                        </button>
                    )}
                </div>
            </div>

            <div className="profile-content">
                <div className="profile-main">
                    <div className="avatar-card">
                        <div className="avatar-container">
                            <img src={isEditing ? editForm.avatar : user.avatar} alt="头像" className="profile-avatar" />
                            <div className="online-indicator"></div>
                            {isEditing && (
                                <div className="avatar-overlay" onClick={handleAvatarChange}>
                                    <svg viewBox="0 0 24 24" width="24" height="24">
                                        <path fill="currentColor" d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                                    </svg>
                                    <span>更换头像</span>
                                </div>
                            )}
                        </div>
                        <div className="user-basic-info">
                            <h3 className="user-name">{isEditing ? editForm.name : user.name}</h3>
                            <p className="user-signature">{isEditing ? editForm.signature : user.signature}</p>
                        </div>
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept="image/*" 
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                        />
                    </div>

                    <div className="info-cards">
                        <div className="info-card">
                            <h4>基本信息</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                                        </svg>
                                        昵称
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            value={editForm.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="edit-input"
                                            placeholder="请输入昵称"
                                        />
                                    ) : (
                                        <span className="info-value">{user.name}</span>
                                    )}
                                </div>

                                <div className="info-item">
                                    <label>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                        </svg>
                                        性别
                                    </label>
                                    {isEditing ? (
                                        <select 
                                            value={editForm.gender}
                                            onChange={(e) => handleInputChange('gender', e.target.value)}
                                            className="edit-select"
                                        >
                                            <option value="男">男</option>
                                            <option value="女">女</option>
                                            <option value="保密">保密</option>
                                        </select>
                                    ) : (
                                        <span className="info-value">{user.gender}</span>
                                    )}
                                </div>

                                <div className="info-item">
                                    <label>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3v18h18V4zm-2 16H5V8h14v12z"/>
                                        </svg>
                                        生日
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="date" 
                                            value={editForm.birthday}
                                            onChange={(e) => handleInputChange('birthday', e.target.value)}
                                            className="edit-input"
                                        />
                                    ) : (
                                        <span className="info-value">{user.birthday}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="info-card">
                            <h4>联系方式</h4>
                            <div className="info-grid">
                                <div className="info-item">
                                    <label>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                                        </svg>
                                        邮箱
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="email" 
                                            value={editForm.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="edit-input"
                                            placeholder="请输入邮箱地址"
                                        />
                                    ) : (
                                        <span className="info-value">{user.email}</span>
                                    )}
                                </div>

                                <div className="info-item">
                                    <label>
                                        <svg viewBox="0 0 24 24" width="16" height="16">
                                            <path fill="currentColor" d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                        </svg>
                                        手机号
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="tel" 
                                            value={editForm.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="edit-input"
                                            placeholder="请输入手机号码"
                                        />
                                    ) : (
                                        <span className="info-value">{user.phone}</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="info-card signature-card">
                            <h4>个性签名</h4>
                            <div className="signature-content">
                                {isEditing ? (
                                    <textarea 
                                        value={editForm.signature}
                                        onChange={(e) => handleInputChange('signature', e.target.value)}
                                        className="edit-textarea"
                                        placeholder="写下你的个性签名..."
                                        rows={3}
                                    />
                                ) : (
                                    <p className="signature-text">{user.signature}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default UserProfile