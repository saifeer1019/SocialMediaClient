import React from 'react'
import { useEffect, useState, useRef } from "react";
import {
    setConversations,
    setActiveConversation,
    setChatOpen,
    addMessage,
  } from "../src/state";
const Jump = () => {
    
  const dispatch = useDispatch();
  const chatOpen = useSelector((state) => state.chatOpen);
  return (
    <div>
      









    jump
    </div>
  )
}

export default Jump
