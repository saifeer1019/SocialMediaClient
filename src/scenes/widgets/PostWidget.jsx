import {
  ChatBubbleOutlineOutlined,
  FavoriteBorderOutlined,
  FavoriteOutlined,
  ShareOutlined,
} from "@mui/icons-material";
import {
  Box,
  Divider,
  IconButton,
  Typography,
  useTheme,
  Grid,
  InputBase,
  Button,
  Dialog,
  DialogActions,
  DialogTitle,
  DialogContent,
} from "@mui/material";

import FlexBetween from "../../../components/FlexBetween";
import Friend from "../../../components/Friend";
import WidgetWrapper from "../../../components/WidgetWrapper";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setPost } from "../../state";
import Slider from "react-slick"; // Carousel for images
import ImageModal from "./ImageModal";








const PostWidget = ({
  postId,
  postUserId,
  name,
  description,
  location,
  picturePath,
  picturePaths,
  userPicturePath,
  likes,
  comments,
  newComments
}) => {
  const [isComments, setIsComments] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const dispatch = useDispatch();
  const token = useSelector((state) => state.token);
  const loggedInUserId = useSelector((state) => state.user._id);
  const firstName = useSelector((state) => state.user.firstName);
  const lastName = useSelector((state) => state.user.lastName);
  const isLiked = Boolean(likes[loggedInUserId]);
  const likeCount = Object.keys(likes).length;
  const [commentText, setCommentText] = useState("");

  const { palette } = useTheme();
  const main = palette.neutral.main;
  const primary = palette.primary.main;

  const patchLike = async () => {
    const response = await fetch(`${import.meta.env.VITE_URL}/posts/${postId}/like`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: loggedInUserId }),
    });
    const updatedPost = await response.json();
    dispatch(setPost({ post: updatedPost }));
  };

  const handleAddComment = async () => {
    if (!commentText) return;

    try {
      console.log('trying')
      const response = await fetch(`${import.meta.env.VITE_URL}/posts/comment`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: loggedInUserId,
          postId: postId,
          firstName: firstName,
          lastName: lastName,
          description: commentText,
        }),
      });

      const updatedPost = await response.json();
      console.log('comment,', updatedPost)
      dispatch(setPost({ post: updatedPost }));
      setCommentText(""); // Clear the input after posting
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };
  // Use picturePaths if available, otherwise fall back to single picturePath

    const imagesToDisplay = picturePaths && picturePaths.length > 0 
    ? picturePaths 
    : picturePath
    ? [picturePath]
    : [];

  const handleImageClick = (index) => {
    setSelectedImageIndex(index);
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <WidgetWrapper m="2rem 0">
      <Friend
        friendId={postUserId}
        name={name}
        subtitle={location}
        userPicturePath={userPicturePath}
        isFeed={true}
        isUser={(postUserId !== loggedInUserId)}
        postId= {postId}
      />
      <Typography color={main} sx={{ mt: "1rem" }}>
        {description}
      </Typography>
        {/* Display images in a Facebook-style grid layout */}
        {imagesToDisplay.length > 0 && (
          <div className="mt-3">
            <div 
              className="grid gap-1 cursor-pointer"
              style={{
                gridTemplateAreas: imagesToDisplay.length === 1
                  ? '"main"'
                  : imagesToDisplay.length === 2
                    ? '"main main" "main main"'
                    : imagesToDisplay.length === 3
                      ? '"main main" "small1 small2"'
                      : imagesToDisplay.length === 4
                        ? '"main small1" "main small2"'
                        : '"main small1" "main small2" "small3 small4"',
                gridTemplateColumns: imagesToDisplay.length <= 2 ? '1fr' : 'auto auto',
                gridTemplateRows: imagesToDisplay.length === 1 
                  ? 'auto' 
                  : imagesToDisplay.length <= 4 
                    ? 'auto auto'
                    : 'auto auto auto'
              }}
              onClick={() => setIsModalOpen(true)}
            >
              {/* First/Main Image */}
              <div
                style={{
                  gridArea: 'main',
                  position: 'relative',
                  height: imagesToDisplay.length === 1 ? '400px' : '300px',
                  borderRadius: '0.75rem',
                  overflow: 'hidden'
                }}
              >
                <img
                  className="w-full h-full object-cover rounded-xl"
                  alt="post-0"
                  src={`${import.meta.env.VITE_URL}/assets/${imagesToDisplay[0]}`}
                />
              </div>
              
              {/* Second Image (if available) */}
              {imagesToDisplay.length > 1 && (
                <div
                  style={{
                    gridArea: 'small1',
                    position: 'relative',
                    height: '145px',
                    borderRadius: '0.75rem',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    className="w-full h-full object-cover rounded-xl"
                    alt="post-1"
                    src={`${import.meta.env.VITE_URL}/assets/${imagesToDisplay[1]}`}
                  />
                </div>
              )}
              
              {/* Third Image (if available) */}
              {imagesToDisplay.length > 2 && (
                <div
                  style={{
                    gridArea: 'small2',
                    position: 'relative',
                    height: '145px',
                    borderRadius: '0.75rem',
                    overflow: 'hidden'
                  }}
                >
                  <img
                    className="w-full h-full object-cover rounded-xl"
                    alt="post-2"
                    src={`${import.meta.env.VITE_URL}/assets/${imagesToDisplay[2]}`}
                    style={{
                      filter: imagesToDisplay.length > 3 ? 'brightness(50%)' : 'none'
                    }}
                  />
                  
                  {/* Show +X overlay if more than 3 images but only 4 slots */}
                  {imagesToDisplay.length > 3  && (
                    <div
                      className="absolute inset-0 flex items-center justify-center text-white text-2xl font-bold"
                    >
                      +{imagesToDisplay.length - 3}
                    </div>
                  )}
                </div>
              )}
              
             
            </div>
          </div>
        )}
      <FlexBetween mt="0.25rem">
        <FlexBetween gap="1rem">
          <FlexBetween gap="0.3rem">
            <IconButton onClick={patchLike}>
              {isLiked ? (
                <FavoriteOutlined sx={{ color: primary }} />
              ) : (
                <FavoriteBorderOutlined />
              )}
            </IconButton>
            <Typography>{likeCount}</Typography>
          </FlexBetween>

          <FlexBetween gap="0.3rem">
            <IconButton onClick={() => setIsComments(!isComments)}>
              <ChatBubbleOutlineOutlined />
            </IconButton>
            <Typography>{newComments.length}</Typography>
          </FlexBetween>
        </FlexBetween>

        <IconButton>
          <ShareOutlined />
        </IconButton>
      </FlexBetween>
      {isComments && (
        <Box mt="0.5rem">
          {newComments && newComments.map((comment, i) => (
            <Box key={`${name}-${i}`}>
              <Divider />
              <Typography sx={{ color: main, m: "0.5rem 0", pl: "1rem" }}>
                {comment.description}
              </Typography>
            </Box>
          ))}
          <Divider />
          <FlexBetween >
          <InputBase
            placeholder="Write a comment..."
            onChange={(e) => setCommentText(e.target.value)}
            value={commentText}
            sx={{
              width: "90%",
              backgroundColor: palette.neutral.light,
              borderRadius: "0.5rem",
              padding: "0.2rem 2rem",
              m: "1rem 0",
              overflowY: "auto",
              wordWrap: "break-word",
              '& .MuiInputBase-input': {
                overflowY: "auto",
                maxHeight: "5rem",
                wordWrap: "break-word",
                whiteSpace: "pre-wrap"
              }
            }}
          />
          <Button
            disabled={!commentText}
            onClick={handleAddComment}
            sx={{
              color: palette.background.alt,
              backgroundColor: palette.primary.main,
              borderRadius: "0.5rem",
              ml: "1rem",
            }}
          >
            Add
          </Button>
        </FlexBetween>
      </Box>
      )}

      
           <ImageModal images={imagesToDisplay}
           isOpen={isModalOpen} 
           onClose={() => setIsModalOpen(false)}  />
    
    </WidgetWrapper>
  );
};

export default PostWidget;
