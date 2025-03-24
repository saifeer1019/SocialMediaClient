import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  mode: "light",
  user: null,
  token: null,
  posts: [],
  // Chat-related initial state
  conversations: [], // Default to an empty array
  activeConversation: null, // Default to null
  chatOpen: false, // Default to false
};

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setMode: (state) => {
      state.mode = state.mode === "light" ? "dark" : "light";
    },
    setLogin: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    setLogout: (state) => {
      state.user = null;
      state.token = null;
      state.conversations = [];
      state.activeConversation = null;
      state.chatOpen = false;
      const clearPersistedData = () => {
        localStorage.removeItem("persist:root"); // Clear local storage
        sessionStorage.removeItem("persist:root"); // Clear session storage
        console.log("Persisted data cleared.");
      };
      
      // Call this function whenever needed
      clearPersistedData();
    },
    setFriends: (state, action) => {
      if (state.user) {
        state.user.friends = action.payload.friends;
      } else {
        console.error("user friends non-existent :(");
      }
    },
    setPosts: (state, action) => {
      state.posts = action.payload.posts;
    },
    setPost: (state, action) => {
      const updatedPosts = state.posts.map((post) => {
        if (post._id === action.payload.post._id) return action.payload.post;
        return post;
      });
      state.posts = updatedPosts;
    },
    // Chat reducers with fixes
    setConversations: (state, action) => {
      // Ensure we never set conversations to null or undefined
      state.conversations = action.payload || [];
      
      // Log if we're setting to an empty array when we shouldn't be
      if (action.payload && action.payload.length === 0) {
        console.log("Warning: Setting conversations to empty array", new Error().stack);
      }
    },
    setActiveConversation: (state, action) => {
      console.log('setActiveConversation called with:', action.payload);
      state.activeConversation = action.payload;
      
      // Ensure we actually have the active conversation in our conversations list
      if (action.payload && !action.payload.isTemp) {
        const exists = state.conversations.some(c => c._id === action.payload._id);
        
        if (!exists) {
          console.log('Adding active conversation to conversations list');
          state.conversations = [...state.conversations, action.payload];
        }
      }
      
      state.chatOpen = true;
    },
    setChatOpen: (state, action) => {
      state.chatOpen = action.payload;
    },
    addMessage: (state, action) => {
      const { conversationId, message } = action.payload;
      console.log('Add message called with:', { conversationId, message });
      
      // Find the conversation
      const conversationIndex = state.conversations.findIndex(
        (c) => c._id === conversationId
      );
      
      if (conversationIndex >= 0) {
        // Ensure messages array exists
        if (!state.conversations[conversationIndex].messages) {
          state.conversations[conversationIndex].messages = [];
        }
        
        // Check for duplicate messages (by ID if available, or by content+timestamp)
        const isDuplicate = state.conversations[conversationIndex].messages.some(m => 
          (m._id && message._id && m._id === message._id) || 
          (m.content === message.content && m.createdAt === message.createdAt)
        );
        
        if (!isDuplicate) {
          // Add message to the conversation
          state.conversations[conversationIndex].messages.push(message);
          
          // Update latestMessage reference
          state.conversations[conversationIndex].latestMessage = message;
        } else {
          console.log('Duplicate message detected, not adding:', message);
        }
        
        // If this is the active conversation, update its messages too
        if (state.activeConversation && state.activeConversation._id === conversationId) {
          if (!state.activeConversation.messages) {
            state.activeConversation.messages = [];
          }
          
          const isActiveDuplicate = state.activeConversation.messages.some(m => 
            (m._id && message._id && m._id === message._id) || 
            (m.content === message.content && m.createdAt === message.createdAt)
          );
          
          if (!isActiveDuplicate) {
            state.activeConversation.messages.push(message);
            state.activeConversation.latestMessage = message;
          }
        }
      } else {
        console.warn(`Conversation with ID ${conversationId} not found in state`);
      }
    },
    updateConversation: (state, action) => {
      const updatedConversation = action.payload;
      
      if (!updatedConversation || !updatedConversation._id) {
        console.error("Invalid conversation data received in updateConversation");
        return;
      }
      
      // Find and update the conversation in the list
      const index = state.conversations.findIndex(c => c._id === updatedConversation._id);
      
      if (index >= 0) {
        state.conversations[index] = updatedConversation;
      } else {
        // If conversation doesn't exist, add it
        state.conversations.push(updatedConversation);
      }
      
      // If this is the active conversation, update it as well
      if (state.activeConversation && state.activeConversation._id === updatedConversation._id) {
        state.activeConversation = updatedConversation;
      }
    },
    removeTemporaryConversations: (state) => {
      // Remove any temporary conversations
      state.conversations = state.conversations.filter(c => !c.isTemp);
      
      // If active conversation is temporary, clear it
      if (state.activeConversation && state.activeConversation.isTemp) {
        state.activeConversation = null;
      }
    },
    openChat: (state, action) => {
      const { friendId, name, userPicturePath } = action.payload;
      
      // Find if conversation exists
      const existingConversation = state.conversations.find(
        (c) => 
          c.isGroup === false && 
          c.participants.some(p => p._id === friendId)
      );
      
      if (existingConversation) {
        state.activeConversation = existingConversation;
      } else {
        // We'll create a temporary conversation object until the API responds
        const tempConversation = {
          _id: "temp_" + Date.now(),
          participants: [
            { 
              _id: state.user._id, 
              firstName: state.user.firstName, 
              lastName: state.user.lastName, 
              picturePath: state.user.picturePath 
            },
            { 
              _id: friendId, 
              firstName: name.split(' ')[0], 
              lastName: name.split(' ')[1] || "", 
              picturePath: userPicturePath 
            }
          ],
          messages: [],
          isGroup: false,
          isTemp: true // Flag to indicate this is temporary
        };
        
        state.activeConversation = tempConversation;
        
        // Add the temporary conversation to the list
        state.conversations = [...state.conversations, tempConversation];
        console.log('Added temporary conversation:', tempConversation);
      }
      
      state.chatOpen = true;
    },
    replaceTemporaryConversation: (state, action) => {
      const { tempId, realConversation } = action.payload;
      
      // Replace the temporary conversation with the real one
      state.conversations = state.conversations.map(c => 
        c._id === tempId ? realConversation : c
      );
      
      // If the active conversation is the temporary one, update it
      if (state.activeConversation && state.activeConversation._id === tempId) {
        state.activeConversation = realConversation;
      }
    }
  },
});

export const { 
  setMode, 
  setLogin, 
  setLogout, 
  setFriends, 
  setPosts, 
  setPost,
  setConversations, 
  setActiveConversation,
  setChatOpen,
  addMessage,
  updateConversation,
  removeTemporaryConversations,
  openChat,
  replaceTemporaryConversation 
} = authSlice.actions;

export default authSlice.reducer;