import './index.css'

/**
 * 
 * @returns 小弹窗的消息框
 */

interface Message {
    msgId: string,
    msgType: string,
    userName: string,
    time: string,
    shortTime: string,
    avatar: string,
    showContent: string
}


function ChatItem(props: Message & { highLight: boolean }) {
    return (
            <div className="chat-list">
                <div className={
                    'chat-item' + (props.highLight ? ' chat-item--highlight' : '')
                }>
                    <div className="chat-item-avatar">
                        <img src={props.avatar} alt="" />
                    </div>
                    <div className="chat-item-content">
                        <div className="chat-item-content-header">
                            <div className="chat-item-content-header-userName">
                                {props.userName}
                            </div>
                            <div className="chat-item-content-header-time">
                                {props.shortTime}
                            </div>
                        </div>
                        <div className="chat-item-content-content">
                            {props.showContent}
                        </div>
                    </div>
                </div>
            </div>
    )
}

export default ChatItem
export type { Message }
