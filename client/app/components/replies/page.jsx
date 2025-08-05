"use client"
import React, { useState } from "react"



const Reply = ({ commentId, ReplyMsg, ReplyError }) => {
    const [replies, setreplies] = useState({commentId, reply:""});
    const [sortedReplies, getSortedReplies] = useState([]);
    const [likedReply, setLikedReply] = useState(new Map());

    const postReplies = async ({ comment_id }) => {
        try {
          // console.log("my reply: ", replies)
          const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/reply_comment`, replies, { withCredentials: true });
    
          ReplyMsg(response.data.message)
    
        } catch (error) {
          console.log("Failed to post replies: ", error);
          ReplyError(error.response.data)
        }
      }
  return (
    <div>
      
    </div>
  )
}

export default Reply
