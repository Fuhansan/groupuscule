import { useState } from 'react'
import ChatBox from './component/chat_box/ChatBox'
import ChatMessageList from './component/chat_message_list/ChatMessageList'

import './App.css'

function App() {
  const [count, setCount] = useState(0)
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
          <ChatMessageList/>
          <ChatBox/>
        </div>
      </div>
    </>
  )
}

export default App
