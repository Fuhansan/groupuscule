import { useState } from 'react'
import ChatBox from './component/chat_box/ChatBox'
import ChatMessageList from './component/chat_message_list/ChatMessageList'

import './App.css'

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

type PageType = 'empty' | 'profile' | 'chat'

function App() {
  const [pageType, setPageType] = useState<PageType>('empty')
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [user, setUser] = useState<User>({
    name: 'QQ用户',
    avatar: 'https://q1.qlogo.cn/g?b=qq&nk=123456789&s=100',
    signature: '今天也要加油鸭~',
    isOnline: true,
    email: 'user@example.com',
    phone: '138****8888',
    birthday: '1990-01-01',
    gender: '保密'
  })

  const handleUserProfileClick = () => {
    setPageType('profile')
    setSelectedFriend(null)
  }

  const handleFriendClick = (friend: Friend) => {
    setPageType('chat')
    setSelectedFriend(friend)
  }

  const handlePageChange = (newPageType: PageType) => {
    setPageType(newPageType)
    if (newPageType === 'empty') {
      setSelectedFriend(null)
    }
  }

  const handleUserUpdate = (updatedUser: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updatedUser }))
  }

  return (
    <>
      {/*
         设置布局主页面 
          布局方式:左右布局
          左侧: 宽度200px
          右侧: 宽度自适应
     */}
      <div className="App">
        <div className='app-container'>
          <ChatMessageList
            user={user}
            onUserProfileClick={handleUserProfileClick}
            onFriendClick={handleFriendClick}
          />
          <ChatBox
            pageType={pageType}
            selectedFriend={selectedFriend}
            user={user}
            onPageChange={handlePageChange}
            onUserUpdate={handleUserUpdate}
          />
        </div>
      </div>
    </>
  )
}

export default App
