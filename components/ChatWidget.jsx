import { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  useTheme,
  TextField,
  IconButton,
  InputAdornment,
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Paper,
} from "@mui/material";
import {
  Send,
  Close,
  ArrowBack,
  Message as MessageIcon,
  ChatBubble,
  KeyboardArrowUp,
} from "@mui/icons-material";
import PhoneIcon from '@mui/icons-material/Phone';
import { Peer } from 'peerjs';
import VideocamRoundedIcon from '@mui/icons-material/VideocamRounded';
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  setChatOpen,
  addMessage,
} from "../src/state";
import FlexBetween from "./FlexBetween";
import { useSocket } from "../src/context/SocketContext";
import {  openChat } from "../src/state";

const ChatWidget = () => {
  const { emitTyping, stopTyping, isTyping, socket, videoCallStatus, setVideoCallStatus, setPeerId, setStream, setPeer } = useSocket();
  const dispatch = useDispatch();

  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const conversations = useSelector((state) => state.conversations || []);
  const activeConversation = useSelector((state) => state.activeConversation);
  const [friends, setFriends] = useState(null)
  const stateFriends = useSelector((state) => state.user.friends);

  const chatOpen = useSelector((state) => state.chatOpen);
  const [message, setMessage] = useState("");
  const [showConversations, setShowConversations] = useState(true);
  const [typingTimeout, setTypingTimeout] = useState(null);
  const messagesEndRef = useRef(null);

  
  useEffect(() => {
    if (stateFriends) {
      console.log(stateFriends)
      setFriends(stateFriends)
    }
  }, [stateFriends]);
  // Debug when conversations become empty
  useEffect(() => {
    if (conversations && conversations.length === 0) {
      console.warn("Conversations became empty. Stack trace:", new Error().stack);
    }
  }, [conversations]);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      const handleMessageReceived = ({ messageToSend }) => {
        console.log("Received message data:", messageToSend);
        const { conversationId, newMessage } = messageToSend;
        
        if (!newMessage) {
          console.error("newMessage is undefined. Check the payload structure.");
          return;
        }
        
        // Check if the conversation exists in our state
        const conversationExists = conversations.some(c => c._id === conversationId);
        
        if (!conversationExists) {
          // Fetch the updated conversation from the server
          fetch(`${import.meta.env.VITE_URL}/chat/conversation/${conversationId}`, {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then(response => response.json())
          .then(updatedConversation => {
            dispatch(setConversations([...conversations, updatedConversation]));
          })
          .catch(error => {
            console.error("Error fetching conversation:", error);
          });
        } else {
          // Add the message to the existing conversation
          dispatch(
            addMessage({
              conversationId,
              message: newMessage,
            })
          );
        }
      };
  
      socket.on("message received", handleMessageReceived);
  
      socket.on("update conversation", (updatedConversation) => {
        // Update the conversation in our list
        const existingIndex = conversations.findIndex(c => c._id === updatedConversation._id);
        
        if (existingIndex >= 0) {
          const updatedConversations = [...conversations];
          updatedConversations[existingIndex] = updatedConversation;
          dispatch(setConversations(updatedConversations));
        } else {
          dispatch(setConversations([...conversations, updatedConversation]));
        }
      });
  
      // Clean up event listeners when the component unmounts
      return () => {
        socket.off("connected");
        socket.off("typing");
        socket.off("stop typing");
        socket.off("message received", handleMessageReceived);
        socket.off("update conversation");
      };
    }
  }, [socket, conversations, dispatch, token, user?._id]);

  // Fetch all conversations for the user
  useEffect(() => {
    const getConversations = async () => {
      try {
        console.log('fetching conversations');
        const response = await fetch(
          `${import.meta.env.VITE_URL}/chat/${user._id}/conversations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          console.log('conversations', data)
          dispatch(setConversations(data));
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (user && token) {
      getConversations();
    }
  }, [user, token, dispatch]);

  // Join the active conversation room
  useEffect(() => {
    if (socket && activeConversation && !activeConversation.isTemp) {
      console.log("Socket and active conversation present. Emitting join chat");
      socket.emit("join chat", activeConversation._id);
    }
  }, [socket, activeConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !activeConversation) return; // Don't send empty messages
    console.log("Sending Message:", message);
    console.log("Active Conversation:", activeConversation);
  
    // Create a temporary message for immediate display
    const tempMessage = {
      _id: Date.now().toString(), // Temporary ID for UI rendering
      sender: user._id,
      content: message,
      createdAt: new Date().toISOString(),
    };
  
    try {
      if (activeConversation.isTemp) {
        // Handle temporary conversation (new chat)
        console.log("Creating new conversation...");
  
        // Create a new conversation via API
        const response = await fetch(`${import.meta.env.VITE_URL}/chat/conversation`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            firstUserId: user._id,
            secondUserId: activeConversation.participants.find(
              (p) => p._id !== user._id
            )._id,
          }),
        });
  
        if (!response.ok) {
          throw new Error("Failed to create conversation");
        }
  
        const newConversation = await response.json();
        console.log("New Conversation Created:", newConversation);
  
        // Emit the new message to the server
        socket.emit("new message", {
          conversation: newConversation,
          content: message,
          sender: user._id,
        });
  
        // Remove temporary conversation and add the new one
        const updatedConversations = conversations.filter(c => !c.isTemp || c._id !== activeConversation._id);
        
        // Update Redux state with the new conversation
        dispatch(setActiveConversation(newConversation));
        dispatch(setConversations([newConversation, ...updatedConversations]));
  
        // Add the temporary message to the new conversation
        dispatch(
          addMessage({
            conversationId: newConversation._id,
            message: tempMessage,
          })
        );
      } else {
        // Handle existing conversation
        console.log("Adding message to existing conversation...");
  
        // Emit the new message to the server
        socket.emit("new message", {
          conversation: activeConversation,
          content: message,
          sender: user._id,
        });
  
        // Add the temporary message to the Redux state for immediate UI update
        dispatch(
          addMessage({
            conversationId: activeConversation._id,
            message: tempMessage,
          })
        );
      }
  
      // Clear the message input
      setMessage("");
      
      // Clear typing indicator
      if (typingTimeout) {
        clearTimeout(typingTimeout);
        setTypingTimeout(null);
        socket.emit("stop typing", activeConversation._id);
      }
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  
  const handleSetActiveConv =async (friend) =>{
    console.log('looking for conv', friend)
    console.log('conv right now', conversations)
    console.log('active conv', activeConversation)
    let conv = conversations.find(conversation => {
   
      return conversation.participants.some(participant => participant._id === friend._id);
    })
    if (conv){
      console.log('found active conv', conv)
      dispatch(setActiveConversation(conv))
        console.log('active conversation', activeConversation)
    }
    else{
      console.log('couldd find? active conv')
      let name = `${friend.firstName} ${friend.lastName}`;
      let friendID = friend._id
      let pic = friend.userPicturePath 
      dispatch(openChat({ friendId :friendID, name , userPicturePath:pic }));
    }
    setShowConversations(false)
    
  }
useEffect(()=>{
  console.log('friends', friends)
}, [])


  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get other participant in 1:1 chat
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants) {
      return { firstName: "", lastName: "" };
    }
    return (
      conversation.participants.find((p) => p._id !== user._id) || {
        firstName: "",
        lastName: "",
      }
    );
  };

  // Handle typing indicators
  const handleTyping = () => {
    if (!activeConversation) return;

    emitTyping(activeConversation._id);

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      stopTyping(activeConversation._id);
    }, 3000);

    setTypingTimeout(timeout);
  };

  const handlePhoneCallClick = () => {
    console.log('phone call clicked');
  };

  const handleVidCallClick = async (otherUser) => {
    const stream_ = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    console.log('Local stream:', stream_);

    setStream(stream_);
   
    // Initialize PeerJS with ICE servers
    const newPeer = new Peer(undefined, {
      secure: true,
      debug: 3
    });

    newPeer.on('open', (id) => {
      setPeer(newPeer);

      // Register with socket server
      socket.emit('register', {
        userId: user._id,
        peerId: id,
      });
      
      socket.emit('calling', { 
        to: otherUser, 
        from: {
          _id: user._id, 
          firstName: user.firstName, 
          lastName: user.lastName, 
          pic: user.picturePath 
        } 
      });
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
    });

    setVideoCallStatus('calling');
  };

    // Render the minimized chat bar when closed
    const renderMinimizedChat = () => {
      return (
        <Paper
          elevation={3}
          sx={{
            position: "fixed",
            bottom: 0,
            right: { xs: 0, sm: 100 },
            marginLeft: "auto", // Push it to the right
            mx: { xs: 1, sm: 0 }, // margin-x to center on small devices if needed
            width: { xs: '95%', sm: 350 }, // Full width on phones (90%), fixed width on larger screens
            backgroundColor: palette.background.alt,
            color: "white",
            borderRadius: "10px 10px 0 0",
            cursor: "pointer",
            zIndex: 1300, // Ensure it's above other content
            transition: "opacity 0.2s ease-in-out, visibility 0.2s ease-in-out",
            opacity: chatOpen ? 0 : 1,
            visibility: chatOpen ? "hidden" : "visible",
          }}
          onClick={() => dispatch(setChatOpen(true))}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.75rem 1rem",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <ChatBubble color={`${palette.neutral.dark}`} sx={{ marginRight: 1, color: `${palette.neutral.dark}` }} />
              <Typography color={`${palette.neutral.dark}`} variant="h6">Chat</Typography>
            </Box>
            <KeyboardArrowUp />
          </Box>
        </Paper>
      );
    };
    // If chat is closed, render the minimized version
   
    return (
      <>
      {renderMinimizedChat()} {/* Always keep it rendered */}
      <Drawer 
      transitionDuration={{ enter: 200, exit: 200 }}
      anchor="bottom"
      hideBackdrop={true}
      open={chatOpen}
      onClose={() => dispatch(setChatOpen(false))}
      variant="persistent"
      ModalProps={{
        disableEnforceFocus: true,
        disableAutoFocus: true,
        disableScrollLock: true
      }}
      PaperProps={{
        sx: {
 
          height: 450,
          position: "fixed", // Change from "absolute" to "fixed"
          bottom: 0,
          right: 100 ,

          width: { xs: '95%', sm: 350 }, // Full width on phones (90%), fixed width on larger screens
          marginLeft: "auto",
          borderRadius: "10px 10px 0 0",
          backgroundColor: `${palette.background.alt}`,
          zIndex: 1200, // Ensure it stays above other content
        },
      }}
    >
        {/* Chat Header */}
        <FlexBetween
          p="1rem"
          backgroundColor={palette.background.alt}
          borderBottom={`1px solid ${palette.neutral.light}`}
        >
        <FlexBetween>
          {!showConversations && activeConversation && (
            <IconButton
              onClick={() => setShowConversations(true)}
              sx={{ mr: 1 }}
            >
              <ArrowBack />
            </IconButton>
          )}
          <Typography
            color={palette.neutral.dark}
            variant="h5"
            fontWeight="500"
          >
            {showConversations
              ?  (  <Box sx={{ display: "flex", alignItems: "center" }}>
                <ChatBubble color={`${palette.neutral.dark}`} sx={{ marginRight: 1, color: `${palette.neutral.dark}` }} />
               
                
                <Typography
                color={palette.neutral.dark}
                variant="h5"
                fontWeight="500"
              >Chat  </Typography>
                      </Box>)
              : activeConversation
              ?( <Typography
                color={palette.neutral.dark}
                variant="h5"
                fontWeight="500"
              > {`${getOtherParticipant(activeConversation).firstName}  ${getOtherParticipant(activeConversation).lastName}`} </Typography>)
              : ( 
                <Box sx={{ display: "flex", alignItems: "center" }}>
                <ChatBubble color={`${palette.neutral.dark}`} sx={{ marginRight: 1, color: `${palette.neutral.dark}` }} />
               
                <Typography
                color={palette.neutral.dark}
                variant="h5"
                fontWeight="500"
              > Chat </Typography>
              </Box>)}
          </Typography>
        </FlexBetween>
        <FlexBetween>
              {!showConversations && activeConversation && <IconButton
              sx={{
                backgroundColor: "gray",
                color: "white",
                "&:hover": {
                  backgroundColor: "blue",
                },
              }}
              onClick={(event) => {
                event.stopPropagation(); // Prevents triggering ListItem's onClick
                handleVidCallClick(getOtherParticipant(activeConversation));
              }}
            >
              <VideocamRoundedIcon />
            </IconButton>}

        <IconButton onClick={() => dispatch(setChatOpen(false))}>
          <Close />
        </IconButton>

        </FlexBetween>
      </FlexBetween>

      {/* Conversations List or Active Chat */}
      {showConversations ? (
        <List sx={{ width: "100%", bgcolor: palette.background.alt, p: 0 }}>
          { friends && (friends.length === 0) ? (
            <Box p={3} textAlign="center">
              <MessageIcon
                sx={{ fontSize: 40, color: palette.neutral.medium, mb: 1 }}
              />
              <Typography color={palette.neutral.medium}>
                No conversations yet. Start chatting with a friend!
              </Typography>
            </Box>
        ) : 
        ( friends && friends.map((friend, idx) =>{
            return (
              <Box key={idx}>
              <ListItem
                        button
                        alignItems="flex-start"
                        onClick={() => {
                       handleSetActiveConv(friend)
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar
                            alt={`${friend.firstName} ${friend.lastName}`}
                            src={`${import.meta.env.VITE_URL}/assets/${friend.picturePath}`}
                          />
                        </ListItemAvatar>
                        <ListItemText
                      primary={`${friend.firstName} ${friend.lastName}`}
                      secondary={"Start a conversation"                }
                      primaryTypographyProps={{
                        fontWeight: "500",
                        color: palette.neutral.dark,
                      }}
                      secondaryTypographyProps={{
                        noWrap: true,
                        color: palette.neutral.medium,
                      }}
                    />
                    
                              <div className="self-center flex gap-x-4">
                              { /* phone icon
                                 <IconButton
                                  sx={{
                                    backgroundColor: "gray",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "green",
                                    },
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handlePhoneCallClick();
                                  }}
                                >
                                  <PhoneIcon />
                                </IconButton> */}
                          
                                {/* Video Call Icon Button */}
                                <IconButton
                                  sx={{
                                    backgroundColor: "gray",
                                    color: "white",
                                    "&:hover": {
                                      backgroundColor: "blue",
                                    },
                                  }}
                                  onClick={(event) => {
                                    event.stopPropagation(); // Prevents triggering ListItem's onClick
                                    handleVidCallClick(friend);
                                  }}
                                >
                                  <VideocamRoundedIcon />
                                </IconButton>
                              </div>
                    
                    </ListItem>
                    <Divider variant="inset" component="li" />
              </Box>
            )
        }))
        //(
          //   conversations.map((conversation) => {
          //     if (!conversation) return null; // Skip if conversation is null/undefined
          //     const otherUser = getOtherParticipant(conversation);
          //     return (
          //       <Box key={conversation._id}>
          //         <ListItem
          //           button
          //           alignItems="flex-start"
          //           onClick={() => {
          //             dispatch(setActiveConversation(conversation));
          //             setShowConversations(false);
          //           }}
          //         >
          //           <ListItemAvatar>
          //             <Avatar
          //               alt={`${otherUser.firstName} ${otherUser.lastName}`}
          //               src={`${import.meta.env.VITE_URL}/assets/${otherUser.picturePath}`}
          //             />
          //           </ListItemAvatar>
                    
          //           <ListItemText
          //             primary={`${otherUser.firstName} ${otherUser.lastName}`}
          //             secondary={
          //               conversation.messages && conversation.messages.length > 0
          //                 ? conversation.messages[conversation.messages.length - 1].content
          //                 : "Start a conversation"
          //             }
          //             primaryTypographyProps={{
          //               fontWeight: "500",
          //               color: palette.neutral.dark,
          //             }}
          //             secondaryTypographyProps={{
          //               noWrap: true,
          //               color: palette.neutral.medium,
          //             }}
          //           />
          //           <div className="self-center flex gap-x-4">
          //             <IconButton
          //               sx={{
          //                 backgroundColor: "gray",
          //                 color: "white",
          //                 "&:hover": {
          //                   backgroundColor: "green",
          //                 },
          //               }}
          //               onClick={(event) => {
          //                 event.stopPropagation();
          //                 handlePhoneCallClick();
          //               }}
          //             >
          //               <PhoneIcon />
          //             </IconButton>
                
          //             {/* Video Call Icon Button */}
          //             <IconButton
          //               sx={{
          //                 backgroundColor: "gray",
          //                 color: "white",
          //                 "&:hover": {
          //                   backgroundColor: "blue",
          //                 },
          //               }}
          //               onClick={(event) => {
          //                 event.stopPropagation(); // Prevents triggering ListItem's onClick
          //                 handleVidCallClick(otherUser);
          //               }}
          //             >
          //               <VideocamRoundedIcon />
          //             </IconButton>
          //           </div>
          //         </ListItem>
          //         <Divider variant="inset" component="li" />
          //       </Box>
          //     );
          //   })
          // )
          }
        </List>
      ) : (
        // Active Chat Messages
        <Box
          display="flex"
          flexDirection="column"
          height="calc(100% - 130px)"
          bgcolor={palette.background.default}
          p={2}
          sx={{ overflowY: "auto" }}
        >
          {activeConversation && activeConversation.messages ? (
            activeConversation.messages.map((msg) => {
              if (!msg) return null; // Skip if message is null/undefined
              return (
                <Box
                  key={msg._id}
                  alignSelf={msg.sender === user._id ? "flex-end" : "flex-start"}
                  bgcolor={
                    msg.sender === user._id
                      ? palette.primary.main
                      : palette.neutral.light
                  }
                  color={
                    msg.sender === user._id ? "white" : palette.neutral.dark
                  }
                  p="0.5rem 1rem"
                  m="0.5rem 0"
                  borderRadius="1rem"
                  maxWidth="70%"
                >
                  <Typography>{msg.content}</Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {formatTime(msg.createdAt)}
                  </Typography>
                </Box>
              );
            })
          ) : (
            <Box
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              height="100%"
            >
              <Typography color={palette.neutral.medium} textAlign="center">
                No messages yet. Start the conversation!
              </Typography>
            </Box>
          )}
          <div ref={messagesEndRef} />
          {isTyping && (
            <Typography
              variant="body2"
              color={palette.neutral.medium}
              fontStyle="italic"
              mt={1}
            >
              Typing...
            </Typography>
          )}
        </Box>
      )}

      {/* Message Input (only show in active chat) */}
     
       {!showConversations && activeConversation && activeConversation.messages  && ( <Box
          p={2}
          borderTop={`1px solid ${palette.neutral.light}`}
          bgcolor={palette.background.alt}
        >
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type a message..."
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              handleTyping();
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    color="primary"
                    onClick={handleSendMessage}
                    disabled={!message.trim()}
                  >
                    <Send />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ bgcolor: palette.background.default }}
          />
        </Box>)}
     
    </Drawer>
    </>
  );
};

export default ChatWidget;