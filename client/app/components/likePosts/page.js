import axios from 'axios';

export const LikePosts = async ({ postId, setLiked, setError }) => {
  try {
    const response = await axios.patch(
      "http://localhost:8080/api/v1/posts/like_content",
      { postId },
      { withCredentials: true }
    );

    setLiked((prevLiked) => {
      const updatedLiked = new Map(prevLiked);

      if (updatedLiked.has(postId)) {
        updatedLiked.delete(postId); // Unlike
      } else {
        updatedLiked.set(postId, true); // Like
      }

      return updatedLiked;
    });

    
  } catch (error) {
    console.log(error);
    setError(error.response?.data || "An error occurred while liking the post.");
  }
};

export const likeComments = async({ commentId, setLiked, onShowError})=>{
  try {
      await axios.patch("http://localhost:8080/api/v1/posts/like_comment", { commentId }, { withCredentials: true });

      setLiked((prevLiked) => {
        const updatedLiked = new Map(prevLiked);

        if (updatedLiked.has(commentId)) {
          updatedLiked.delete(commentId); // Unlike
        } else {
          updatedLiked.set(commentId, true); // Like
        }

        return updatedLiked;
      });

    } catch (error) {
      console.error("Failed to like comment: ", error);
      onShowError(error.response.data);
    }
}

export const likeReplies = async({ replyId, commentId, setLikedReply, onShowError})=>{
  try {
      await axios.patch("http://localhost:8080/api/v1/posts/like_reply", { replyId, commentId }, { withCredentials: true });

      setLikedReply((prevLiked) => {
        const updatedLiked = new Map(prevLiked);

        if (updatedLiked.has(replyId)) {
          updatedLiked.delete(replyId); // Unlike
        } else {
          updatedLiked.set(replyId, true); // Like
        }

        return updatedLiked;
      });

    } catch (error) {
      console.error("Failed to like reply: ", error);
      onShowError(error.response.data);
    }
}
