import { PersonAddOutlined, PersonRemoveOutlined, ChatBubbleOutlineOutlined } from "@mui/icons-material";
import { Box, IconButton, Typography, useTheme } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setFriends, openChat } from "../src/state";
import FlexBetween from "./FlexBetween";
import DeleteIcon from '@mui/icons-material/Delete';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import {useState} from 'react'
import UserImage from "./UserImage";
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { deletePost } from "../src/state"
import {useEffect} from 'react'


const Friend = ({ friendId, name, subtitle, userPicturePath, showChat = true, isFeed= false, isUser=  false, postId='' }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { _id } = useSelector((state) => state.user);
  const token = useSelector((state) => state.token);
  const friends = useSelector((state) => state.user.friends);
  const { palette } = useTheme();
  const primaryLight = palette.primary.light;
  const primaryDark = palette.primary.dark;
  const main = palette.neutral.main;
  const medium = palette.neutral.medium;
  const [isFriend, setIsFriend] = useState(false)

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  useEffect(()=>{
    if (friends){
      setIsFriend(friends.find((friend) => friend._id === friendId))
    }
    console.log('dfjgn')
  },[friends])
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleSendMessage = () => {
    startChat();
    handleClose();
  };
  
  const handleDeletePost = async() => {
    const response = await fetch(`${import.meta.env.VITE_URL}/posts/${postId}/delete`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: _id }),
      }
    );
    console.log('sent delete post')
    const updatedPost = await response.json();
    console.log('response',updatedPost)
    dispatch(deletePost({ post: updatedPost }));
  };

  const patchFriend = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_URL}/users/${_id}/${friendId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    const data = await response.json();
    dispatch(setFriends({ friends: data }));
  };

  const startChat = () => {
    // We'll implement this later with Redux
    dispatch(openChat({ friendId, name, userPicturePath }));
  };

  return (
    <FlexBetween>
      <FlexBetween gap="1rem">
        <UserImage image={userPicturePath} size="55px" />
        <Box
          onClick={() => {
            navigate(`/profile/${friendId}`);
            navigate(0);
          }}
        >
          <Typography
            color={main}
            variant="h5"
            fontWeight="500"
            sx={{
              "&:hover": {
                color: palette.primary.light,
                cursor: "pointer",
              },
            }}
          >
            {name}
          </Typography>
          <Typography color={medium} fontSize="0.75rem">
            {subtitle}
          </Typography>
        </Box>
      </FlexBetween>
      <div className='flex justify-end gap-2 relative'>
 {      isFriend  && (
          <IconButton
            onClick={startChat}
            sx={{ 
              backgroundColor: palette.primary.main, 
              p: "0.6rem",
              mr: "0.5rem"
            }}
          >
            <ChatBubbleOutlineOutlined sx={{ color: palette.background.alt }} />
          </IconButton>
        )}





      { isUser ?
        <IconButton
          onClick={() => patchFriend()}
          sx={{ backgroundColor: primaryLight, p: "0.6rem" }}
        >
          { isFriend ? (
            <PersonRemoveOutlined sx={{ color: primaryDark }} />
          ) : (
            <PersonAddOutlined sx={{ color: primaryDark }} />
          ) }
        </IconButton> : null}
        {  isFeed &&    <>
          <IconButton
            onClick={handleClick}
            sx={{ 
              p: '0rem', 
              m: '0rem',
              '&:hover': {
                backgroundColor: 'transparent', 
              }
            }}
          >
            <MoreVertIcon sx={{ color: palette.neutral.alt }} />
          </IconButton>
          
          <Menu
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
            PaperProps={{
              sx: {
                boxShadow: '0px 2px 8px rgba(0,0,0,0.15)',
              }
            }}
          >
           { isFriend && <MenuItem onClick={handleSendMessage}><Typography>Send Message</Typography></MenuItem>}
            {!isUser && <MenuItem onClick={handleDeletePost}>Delete Post</MenuItem>}
          </Menu>
        </>}
      </div>
    </FlexBetween>
  );
};

export default Friend;