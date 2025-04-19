import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux"; import { useNavigate } from "react-router-dom";
import { setPosts } from "../../state";
import PostWidget from "./PostWidget";

const PostsWidget = ({ userId, isProfile = false }) => {
  const dispatch = useDispatch();
  const posts = useSelector((state) => state.posts);
  const token = useSelector((state) => state.token);
  const navigate = useNavigate()

  const getPosts = async () => {
    const response = await fetch(`${import.meta.env.VITE_URL}/posts`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await response.json();
    console.log(data)
    if(!data.error){
      dispatch(setPosts({ posts: data }));
    }
    else{ navigate('/')

    }

  };

  const getUserPosts = async () => {
    const response = await fetch(
      `${import.meta.env.VITE_URL}/posts/user/${userId}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    const data = await response.json();
    dispatch(setPosts({ posts: data }));
  };

  useEffect(() => {
    if (isProfile) {
      console.log('is fklvnlk')
      getUserPosts();
    } else {
      getPosts();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {posts.map(
        ({
          _id,
          userId,
          firstName,
          lastName,
          description,
          location,
          picturePath,
          picturePaths,
          userPicturePath,
          likes,
          comments,
          newComments
        }) => (
          <PostWidget
            key={_id}
            postId={_id}
            postUserId={userId}
            name={`${firstName} ${lastName}`}
            description={description}
            location={location}
            picturePath={picturePath}
            picturePaths={picturePaths}
            userPicturePath={userPicturePath}
            likes={likes}
            comments={comments}
            newComments={newComments}
          />
        )
      )}
    </>
  );
};

export default PostsWidget;
