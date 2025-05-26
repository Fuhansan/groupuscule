import './index.css'
import { useEffect, useState } from 'react'
import { Message } from './ChatItem'
import ChatItem from './ChatItem'

function ChatMessageList() {
    const [messages, setMessages] = useState<Message[]>([])
    const [highlightId, setHighlightId] = useState<string | null>(null)

    useEffect(() => {
        // 假设接口为 /api/friends/messages，实际请替换为真实接口
        fetch('/api/friends/messages')
            .then(res => res.json())
            .then((data: Message[]) => {
                setMessages(data)
            })
            .catch(() => {
                // 失败时可设置默认数据或提示
                setMessages([
                    {
                        msgId: '1',
                        msgType: 'text',
                        userName: '张三',
                        time: '2021-01-01 00:00:00',
                        shortTime: '18:11',
                        avatar: 'https://tse1-mm.cn.bing.net/th/id/OIP-C.DtW0r6AMdvCJqYcPmzYHCwHaEK?w=316&h=180&c=7&r=0&o=5&pid=1.7',
                        showContent: '你好！'
                    },
                    {
                        msgId: '2',
                        msgType: 'text',
                        userName: '李四',
                        time: '2021-01-01 00:00:00',
                        shortTime: '18:11',
                        avatar: 'https://tse1-mm.cn.bing.net/th/id/OIP-C.DtW0r6AMdvCJqYcPmzYHCwHaEK?w=316&h=180&c=7&r=0&o=5&pid=1.7',
                        showContent: '你好！'
                    }
                ])
            })
    }, [])

    return (
        <div className='chat-message'>
            <div className="chat-messsage-header">

            </div>
            <div className="chat-message-list">
            {messages.map(msg => (
                <div key={msg.msgId} onClick={() => setHighlightId(msg.msgId)}>
                    <ChatItem {...msg} highLight={highlightId === msg.msgId} />
                </div>
            ))}
        </div>
        </div>
    )
}

export default ChatMessageList