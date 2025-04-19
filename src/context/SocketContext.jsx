import { createContext, useContext, useEffect, useState, useRef } from "react";
import io from "socket.io-client";
import { useDispatch, useSelector } from "react-redux";
import { setConversations, addMessage } from "../state";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  //.
    const [peer, setPeer] = useState(null);
    const [peerId, setPeerId] = useState(null);
    const [currentCall, setCurrentCall] = useState(null);
    const [stream, setStream] = useState(null);

      
  const myVideo = useRef();
  const userVideo = useRef();

  const [beingVideoCalledStatus, setBeingVideoCalledStatus] = useState(false)
  const [videoCallStatus, setVideoCallStatus] = useState('')

  const [callerId, setCallerId] = useState(null)
  const [socket, setSocket] = useState(null);
    const [socketConnected, setSocketConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const dispatch = useDispatch();
  const user = useSelector((state) => state.user);
  const conversations = useSelector((state) => state.conversations || []);
  const token = useSelector((state) => state.token);

  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_URL}`,  {
      auth: {
        token: token
      }});
    setSocket(newSocket);

    if (user?._id) {
      console.log('connecting to kgh')
      newSocket.emit("setup", user._id);
    }

    newSocket.on("connected", () => {
      console.log("Socket connected")
      setSocketConnected(true);});
    
    newSocket.on("typing", () => setIsTyping(true));
    newSocket.on("stop typing", () => setIsTyping(false));

    newSocket.on("message received", ({ messageToSend }) => {
      console.log("Received message:", messageToSend);
      const { conversationId, newMessage } = messageToSend;

      if (!newMessage) {
        console.error("newMessage is undefined.");
        return;
      }

      const conversationExists = conversations.some(c => c._id === conversationId);
      if (!conversationExists) {
        fetch(`${import.meta.env.VITE_URL}/chat/conversation/${conversationId}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        })
          .then(res => res.json())
          .then(updatedConversation => {
            dispatch(setConversations([...conversations, updatedConversation]));
          })
          .catch(err => console.error("Error fetching conversation:", err));
      } else {
        dispatch(addMessage({ conversationId, message: newMessage }));
      }
    });

    newSocket.on("incoming-call", (from) => {
      console.log('incoming call djkfbjk')
      setVideoCallStatus('beingCalled')
      setCallerId(from)
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const emitTyping = (conversationId) => {
    socket?.emit("typing", conversationId);
  };

  const stopTyping = (conversationId) => {
    socket?.emit("stop typing", conversationId);
  };

  const sendMessage = (conversation, message, sender) => {
    socket?.emit("new message", { conversation, content: message, sender });
  };
useEffect(()=>{
  console.log('uid is changed', peerId)





}, [peerId])
  return (
    <SocketContext.Provider value={{ socket, emitTyping, stopTyping, sendMessage, myVideo,
      userVideo,
      isTyping, beingVideoCalledStatus, peer, setPeer, videoCallStatus,
      setVideoCallStatus,
      peerId, setPeerId,
      currentCall, setCurrentCall,
      stream, setStream, setCallerId,
      callerId  }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
