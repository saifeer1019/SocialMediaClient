import { Box, useMediaQuery } from "@mui/material";
import {useState} from 'react'
import { useSelector } from "react-redux";
import Navbar from "../navbar";
import UserWidget from "../widgets/UserWidget";
import MyPostWidget from "../widgets/MyPostWidget";
import PostsWidget from "../widgets/PostsWidget";
import AdvertWidget from "../widgets/AdvertWidget";
import FriendListWidget from "../widgets/FriendListWidget";
import ChatWidget from '../../../components/ChatWidget'
import Test from "../../../components/Test";
import { useSocket } from "../../context/SocketContext";
import VideoChatWidget from "../../../components/VideoChatWidget";
import VideoCallNotification from "../widgets/VideoCallNotification";

const HomePage = () => {
  const {videoCallStatus, setVideoCallStatus} = useSocket()
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");
  const { _id, picturePath } = useSelector((state) => state.user);
  const [open, setOpen] = useState(false)

  const handleOpen = ()=>{
    setOpen(true)
  }
  return (
    <Box>
    <ChatWidget />
      <Navbar />


      <Box
        width="100%"
        padding="2rem 6%"
        display={isNonMobileScreens ? "flex" : "block"}
        gap="0.5rem"
        justifyContent="space-between"
      >
        <Box flexBasis={isNonMobileScreens ? "26%" : undefined}>
          <UserWidget userId={_id} picturePath={picturePath} />
       







       
       
       
          {  (videoCallStatus == 'calling' || videoCallStatus == 'accepted') && <VideoChatWidget />}
   
          { videoCallStatus == 'beingCalled' && <VideoCallNotification />}
        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
        >
          <MyPostWidget picturePath={picturePath} />
         
          <PostsWidget userId={_id} />
        </Box>
        {isNonMobileScreens && (
          <Box flexBasis="26%">
            <AdvertWidget />
            <Box m="2rem 0" />
            <FriendListWidget userId={_id} />
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default HomePage;
