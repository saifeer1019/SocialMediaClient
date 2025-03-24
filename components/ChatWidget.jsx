// components/ChatWidget.jsx
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
} from "@mui/material";
import {
  Send,
  Close,
  ArrowBack,
  Message as MessageIcon,
} from "@mui/icons-material";
import { useDispatch, useSelector } from "react-redux";
import {
  setConversations,
  setActiveConversation,
  setChatOpen,
  addMessage,
} from "../src/state";
import FlexBetween from "./FlexBetween";
import io from "socket.io-client";

const ChatWidget = () => {
  const dispatch = useDispatch();
  const { palette } = useTheme();
  const token = useSelector((state) => state.token);
  const user = useSelector((state) => state.user);
  const conversations = useSelector((state) => state.conversations) || []; // Ensure conversations is an array
  const activeConversation = useSelector((state) => state.activeConversation);
  const chatOpen = useSelector((state) => state.chatOpen);

  const [message, setMessage] = useState("");
  const [socket, setSocket] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showConversations, setShowConversations] = useState(true);

  const messagesEndRef = useRef(null);

  // Socket.io connection
  useEffect(() => {
    const newSocket = io(`${import.meta.env.VITE_URL}`);
    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Socket event handlers
  useEffect(() => {
    if (socket) {
      // Set up event listeners
      socket.emit("setup", user._id);
  
      socket.on("connected", () => {
        setSocketConnected(true);
      });
  
      socket.on("typing", () => {
        setIsTyping(true);
      });
  
      socket.on("stop typing", () => {
        setIsTyping(false);
      });
  
      const handleMessageReceived = ({ messageToSend }) => {
        console.log("Received message data:", messageToSend); // Log the entire payload
        const { conversationId, newMessage } = messageToSend;
        console.log("Destructured newMessage:", newMessage); // Log the destructured newMessage
    
        if (!newMessage) {
          console.error("newMessage is undefined. Check the payload structure.");
          return;
        }
 
        dispatch(
          addMessage({
            conversationId,
            message: newMessage,
          })
        );
   
      };
  
      socket.on("message received", handleMessageReceived);
  
      socket.on("update conversation", (updatedConversation) => {
        // Update the conversation in our list
        const updatedConversations = conversations.map((c) =>
          c._id === updatedConversation._id ? updatedConversation : c
        );
        dispatch(setConversations(updatedConversations));
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
  }, [socket]); // Empty dependency array ensures this runs only once

  // Fetch all conversations for the user
  useEffect(() => {
    const getConversations = async () => {
      try {
        console.log('fetching')
        const response = await fetch(
          `http://localhost:3001/chat/${user._id}/conversations`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          dispatch(setConversations(data));
        }
      } catch (error) {
        console.error("Error fetching conversations:", error);
      }
    };

    if (user) {
      getConversations();
    }
  }, [user, token, dispatch]);

  // Join the active conversation room
  useEffect(() => {
    if (socket && activeConversation) {
      console.log("socket and active Conversations present. Emiting join Chat");
      socket.emit("join chat", activeConversation._id);
    }
  }, [socket, activeConversation]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim()) return; // Don't send empty messages
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
        const response = await fetch("http://localhost:3001/chat/conversation", {
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
  
        // Update Redux state with the new conversation
        dispatch(setActiveConversation(newConversation));
        dispatch(setConversations([newConversation, ...conversations]));
  
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
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  useEffect(()=>{
    console.log('conversations changed', conversations)
  
  }, [conversations])
  // Format timestamp
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Get other participant in 1:1 chat
  const getOtherParticipant = (conversation) => {
    if (!conversation || !conversation.participants)
      return { firstName: "", lastName: "" };
    return (
      conversation.participants.find((p) => p._id !== user._id) || {
        firstName: "",
        lastName: "",
      }
    );
  };

  return (
    <Drawer
      anchor="right"
      open={chatOpen}
      onClose={() => dispatch(setChatOpen(false))}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 320 },
          backgroundColor: palette.background.alt,
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
              ? "Messages"
              : activeConversation
              ? `${getOtherParticipant(activeConversation).firstName} ${getOtherParticipant(activeConversation).lastName}`
              : "Chat"}
          </Typography>
        </FlexBetween>
        <IconButton onClick={() => dispatch(setChatOpen(false))}>
          <Close />
        </IconButton>
      </FlexBetween>

      {/* Conversations List or Active Chat */}
      {showConversations ? (
        <List sx={{ width: "100%", bgcolor: palette.background.alt, p: 0 }}>
          {conversations.length === 0 ? (
            <Box p={3} textAlign="center">
              <MessageIcon
                sx={{ fontSize: 40, color: palette.neutral.medium, mb: 1 }}
              />
              <Typography color={palette.neutral.medium}>
                No conversations yet. Start chatting with a friend!
              </Typography>
            </Box>
          ) : (
            conversations.map((conversation) => {
              const otherUser = getOtherParticipant(conversation);
              return (
                <Box key={conversation._id}>
                  <ListItem
                    button
                    alignItems="flex-start"
                    onClick={() => {
                      dispatch(setActiveConversation(conversation));
                      setShowConversations(false);
                    }}
                  >
                    <ListItemAvatar>
                      <Avatar
                        alt={`${otherUser.firstName} ${otherUser.lastName}`}
                        src={`http://localhost:3001/assets/${otherUser.picturePath}`}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${otherUser.firstName} ${otherUser.lastName}`}
                      secondary={
                        conversation.messages && conversation.messages.length > 0
                          ? conversation.messages[conversation.messages.length - 1].content
                          : "Start a conversation"
                      }
                      primaryTypographyProps={{
                        fontWeight: "500",
                        color: palette.neutral.dark,
                      }}
                      secondaryTypographyProps={{
                        noWrap: true,
                        color: palette.neutral.medium,
                      }}
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </Box>
              );
            })
          )}
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
          {activeConversation && activeConversation.messages && activeConversation.messages.length > 0 ? (
            activeConversation.messages.map((msg) => (
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
            ))
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
      {!showConversations && (
        <Box
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
              if (socket && activeConversation) {
                // Handle typing indicators
                if (!isTyping) {
                  socket.emit("typing", activeConversation._id);
                }

                // Clear typing indicator after 3 seconds of inactivity
                const lastTypingTime = new Date().getTime();
                setTimeout(() => {
                  const timeNow = new Date().getTime();
                  const timeDiff = timeNow - lastTypingTime;
                  if (timeDiff >= 3000) {
                    socket.emit("stop typing", activeConversation._id);
                  }
                }, 3000);
              }
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
        </Box>
      )}
    </Drawer>
  );
};

export default ChatWidget;