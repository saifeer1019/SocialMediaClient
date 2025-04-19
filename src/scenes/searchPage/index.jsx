import { Box, useMediaQuery } from "@mui/material";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams } from "react-router-dom";
import Navbar from "../navbar";
import FriendListWidget from "../widgets/FriendListWidget";
import MyPostWidget from "../widgets/MyPostWidget";
import PostsWidget from "../widgets/PostsWidget";
import UserWidget from "../widgets/UserWidget";
import SearchSide from "../widgets/SearchSide";

const SearchPage = () => {
  const user = useSelector((state) => state.user);

  const token = useSelector((state) => state.token);
  const isNonMobileScreens = useMediaQuery("(min-width:1000px)");

 



  return (
    <Box width="100vw">
      <Navbar />
      <Box
        width="100%"
        padding="2rem "
        display={isNonMobileScreens ? "flex" : "block"}
        gap="2rem"
        justifyContent="start"
      >
        <Box flexBasis={isNonMobileScreens ? "18%" : undefined}
     >
          <SearchSide userId={user._id} picturePath={user.picturePath} />
          <Box m="2rem 0" />

        </Box>
        <Box
          flexBasis={isNonMobileScreens ? "42%" : undefined}
          mt={isNonMobileScreens ? undefined : "2rem"}
         
        >
          <MyPostWidget picturePath={user.picturePath} />
          <Box m="2rem 0" />
          <PostsWidget userId={user._id} isProfile />
        </Box>
      </Box>
    </Box>
  );
};

export default SearchPage;
