'use client';

import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Input, Button } from '@mui/joy';
import Image from 'next/image';
import ReplyIcon from '@mui/icons-material/Reply';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import io from 'socket.io-client';

const CommentSection = ({ postId, userId, onShowMsg, onShowError, users }) => {
  const [comment, setcomment] = useState({ postId, comment: "" });
  const [sortedComments, getSortedComments] = useState([]);
  const [liked, setLiked] = useState(new Map());
  const [likedReply, setLikedReply] = useState(new Map());
  const [replies, setreplies] = useState("");
  // const [sortedReplies, getSortedReplies] = useState([]);
  const [openReplies, setOpenReplies] = useState({});

  const postComment = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/v1/posts/post_comment", comment, { withCredentials: true });
      onShowMsg(response.data.message);
      console.log("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      onShowError("Failed to post comment. Please try again.");
    }
  };

  const getComments = async () => {
    try {
      const response = await axios.post("http://localhost:8080/api/v1/posts/view_comment", { postId });
      const comments = response.data?.data || [];
      getSortedComments(comments);
      //to stored initial liked comments

      const initialLiked = new Map();
      const initiallikedReply = new Map();
      comments.forEach((feed) => {
        if (feed.likes) {
          if (Object.keys(feed.likes).includes(userId)) initialLiked.set(feed._id, true);
        }

        if (feed.replies) {
          feed.replies.forEach(rpy => {
            if (rpy.likes && Object.keys(rpy.likes).includes(userId)) {
              initiallikedReply.set(rpy._id, true);
            }
          });
        }


      });

      console.log(initialLiked)

      setLiked(initialLiked);
      setLikedReply(initiallikedReply)
      console.log(comments);
    } catch (error) {
      console.error("Failed to fetch comments:", error);
      onShowError("Failed to fetch comments. Please try again.");
    }
  };

  const likeComment = async ({ commentId }) => {
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

  const postReplies = async ({ comment_id }) => {
    try {
      // console.log("my reply: ", replies)
      const response = await axios.post("http://localhost:8080/api/v1/posts/reply_comment", { commentId: comment_id, reply: replies }, { withCredentials: true });

      onShowMsg(response.data.message)

    } catch (error) {
      console.log("Failed to post replies: ", error);
      onShowError(error.response.data)
    }
  }

  // const getReply = async ({ comment_id }) => {
  //   try {
  //     const response = await axios.post(
  //       "http://localhost:8080/api/v1/posts/show_reply",
  //       { commentId: comment_id }
  //     );
  //     const data = response.data.data;

  //     console.log("Fetched replies:", data); // Debugging
  //     if (Array.isArray(data)) {

  //       getSortedReplies(data); // Update state only if data is an array
  //     } else {
  //       console.error("Replies data is not an array:", data);
  //     }
  //   } catch (error) {
  //     console.log("Failed to fetch replies:", error);
  //     onShowError(error.response?.data || "An error occurred");
  //   }
  // };

  const toggleReplyWindow = (commentId) => {
    setOpenReplies((prevState) => ({
      ...prevState,
      [commentId]: !prevState[commentId], // Toggle the specific comment's reply window
    }));
  };

  const likeReply = async ({ replyId, commentId }) => {
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

  useEffect(() => {
    const socket = io('http://localhost:8080');
    getComments();

    socket.on('newComment', (newcomment) => {
      getSortedComments((prevcomments) => [newcomment, ...prevcomments]);
    });

    socket.on("newReply", ({ commentId, reply }) => {
      // console.log("my comment Id in socket: ", commentId);
      // console.log("my reply in socket: ", reply);
      getSortedComments((prevComments) =>
        prevComments.map((cmt) =>
          cmt._id === commentId
            ? { ...cmt, replies: [...cmt.replies, reply] }
            : cmt
        )
      );
    });

    return () => {
      socket.off('newComment');
      socket.off('newReply');
      socket.disconnect();
    };
  }, [postId]);

  return (
    <div className="font-inconsolata w-2/3 h-[600px] flex flex-col bg-transparent rounded-lg shadow-lg">
      <div className="topPart sticky top-0 bg-transparent p-4 border-b border-gray-200 z-10">
        <div className="flex gap-4">
          <Input
            placeholder="Share your thoughts..."
            value={comment.comment}
            onChange={(e) => setcomment({ ...comment, comment: e.target.value })}
            name="comment"
            className="flex-grow rounded-md"
          />
          <Button
            onClick={postComment}
            sx={{
              bgcolor: "yellow",
              '&:hover': {
                bgcolor: "#e6c700"
              }
            }}
            className="px-6 rounded-md text-black font-medium"
          >
            Post
          </Button>
        </div>
      </div>

      <div className="comments flex-1 overflow-y-auto p-4 space-y-4">
        {sortedComments.map((cmt) => (
          <div key={cmt._id} className="bg-lightBlue rounded-lg p-4 transition-all hover:shadow-md">
            <div className="flex justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="relative h-12 w-12 rounded-full overflow-hidden">
                  <Image
                    src={users.data[cmt.personId.toString()].avatar.length > 0
                      ? users.data[cmt.personId.toString()].avatar
                      : "/assets/img/profile.svg"}
                    layout="fill"
                    objectFit="cover"
                    alt="profile"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="text-black text-lg font-semibold">
                    {users.data[cmt.personId.toString()].name}
                  </p>
                  <p className="text-gray-600 text-sm">
                    {users.data[cmt.personId.toString()].institute}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-black text-base pl-[60px]">{cmt.comment}</div>
            <div className="post_footer w-full mt-3 pl-[60px] flex gap-2">
              <Button
                variant="plain"
                sx={{
                  color: "black",
                  '&:hover': {
                    bgcolor: "rgba(0,0,0,0.04)"
                  }
                }}
                className="flex items-center gap-1"
                onClick={() => likeComment({ commentId: cmt._id })}
              >
                {(liked.has(cmt._id)) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                <span className="text-sm">Like</span>
              </Button>
              <Button //This is the reply button for a comment section
                variant="plain"
                sx={{
                  color: "black",
                  '&:hover': {
                    bgcolor: "rgba(0,0,0,0.04)"
                  }
                }}
                className="flex items-center gap-1"
                onClick={() => {

                  toggleReplyWindow(cmt._id);
                }}
              >
                <ReplyIcon fontSize="small" />
                <span className="text-sm">Reply</span>
              </Button>

            </div>
            <div className="replySection w-full">
              {openReplies[cmt._id] && (
                <div
                  className={`
      reply_window bg-lightBlue w-full font-inconsolata text-black
      overflow-hidden transition-all duration-300 ease-in-out
      ${openReplies[cmt._id] ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
    `}
                >
                  <div className="reply_nav flex justify-center p-4 gap-3 text-black">
                    <Input
                      placeholder='Enter your replies...'
                      value={replies}
                      onChange={(e) => setreplies(e.target.value)}
                      className='flex-grow rounded-md'
                    />
                    <Button
                      sx={{
                        bgcolor: "yellow",
                        '&:hover': {
                          bgcolor: "#e6c700"
                        }
                      }}
                      className="px-6 rounded-md text-black font-medium ml-2"
                      onClick={() => postReplies({ comment_id: cmt._id })}
                    >
                      Post
                    </Button>
                  </div>

                  <div className="reply_content flex-1 overflow-y-auto p-4 space-y-4">
                    {Object.values(cmt.replies).map((rpy) => (
                      <div key={rpy._id} className='bg-lightBlue rounded-lg p-4 transition-all hover:shadow-md'>
                        <div className="flex justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="relative h-12 w-12 rounded-full overflow-hidden">
                              <Image
                                src={users.data[rpy.replyingId.toString()].avatar.length > 0
                                  ? users.data[rpy.replyingId.toString()].avatar
                                  : "/assets/img/profile.svg"}
                                layout="fill"
                                objectFit="cover"
                                alt="profile"
                              />
                            </div>
                            <div className="flex flex-col">
                              <p className="text-black text-lg font-semibold">
                                {users.data[rpy.replyingId.toString()].name}
                              </p>
                              <p className="text-gray-600 text-sm">
                                {users.data[rpy.replyingId.toString()].institute}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="text-black text-base pl-[60px]">{rpy.reply}</div>
                        <div className="reply_footer w-full mt-3 pl-[60px] flex gap-2">
                          <Button
                            variant="plain"
                            sx={{
                              color: "black",
                              '&:hover': {
                                bgcolor: "rgba(0,0,0,0.04)"
                              }
                            }}
                            className="flex items-center gap-1"

                            onClick={() => likeReply({ replyId: rpy._id, commentId: cmt._id })}
                          >
                            {(likedReply.has(rpy._id)) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                            <span className="text-sm">Like</span>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;