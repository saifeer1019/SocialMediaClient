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
// New chat reducers
setConversations: (state, action) => {
  state.conversations = action.payload;
},
setActiveConversation: (state, action) => {
  console.log('setActive Conversations hit', 'conversations', state.conversations)
  state.activeConversation = action.payload;
  console.log('active conversation after setting', state.activeConversation, 'conversations', state.conversations)
  state.chatOpen = true;
},
setChatOpen: (state, action) => {
  state.chatOpen = action.payload;
},
addMessage: (state, action) => {
  const { conversationId, message } = action.payload;
  console.log('Add message activated', 'conversations-', state.conversations, 'id-', conversationId)
  // Find and update the conversation
  const conversationIndex = state.conversations.findIndex(
    (c) => c._id === conversationId
  );
  
  if (conversationIndex >= 0) {
    // Add message to the conversation
    state.conversations[conversationIndex].messages.push(message);
    
    
    // If this is the active conversation, add to it as well
    if (state.activeConversation && state.activeConversation._id === conversationId) {
      state.activeConversation.messages.push(message);
    }
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
    state.activeConversation = {
      _id: "temp_" + Date.now(),
      participants: [
        { _id: state.user._id, firstName: state.user.firstName, lastName: state.user.lastName, picturePath: state.user.picturePath },
        { _id: friendId, firstName: name.split(' ')[0], lastName: name.split(' ')[1] || "", picturePath: userPicturePath }
      ],
      messages: [],
      isGroup: false,
      isTemp: true // Flag to indicate this is temporary
    };
    console.log('added temporary conv', state.activeConversation)
    console.log('conversation-', state.conversations)
    state.conversations.push(state.activeConversation)
  }
  
  state.chatOpen = true;
 
  
}
},
});

export const { setMode, setLogin, setLogout, setFriends, setPosts, setPost,
   setConversations, 
  setActiveConversation,
  setChatOpen,
  addMessage,
  openChat } =
  authSlice.actions;
export default authSlice.reducer;
