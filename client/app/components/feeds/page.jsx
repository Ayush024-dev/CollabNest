"use client"
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import NavBar from '../nav/page';
import Image from 'next/image';
import { Button } from '@mui/joy';
import WritingTab from '../writingTab/page';
import CommentSection from '../comments/page';
import CancelIcon from '@mui/icons-material/Cancel';
import { Alert } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ErrorIcon from "@mui/icons-material/Error";
import io from 'socket.io-client'
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';


const Feeds = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [blur, setblur] = useState(false);
  const [feeds, getFeed] = useState([]);
  const [users, getusers] = useState({});
  const [liked, setLiked] = useState(new Map());
  const [userid, setUserid] = useState("");
  const [comment, getComment] = useState(false);
  const [postId, setpostId] = useState("");
  const router = useRouter();

  const openWritingTab = (type) => {
    setType(type);
    setOpen(true);
    setblur(true);
  }

  const closeWritingTab = () => {
    setOpen(false);
    setblur(false);
  }

  const OpenCommentSection = (postId) => {
    setpostId(postId);
    getComment(true);
    setblur(true);
  }

  const closeCommentSection = () => {
    getComment(false);
    setblur(false);
  }
  const handleShowAlert = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleErrorAlert = (message) => {
    setError(message);
    setTimeout(() => setError(""), 4000);
  };

  const getFeeds = async (urlId) => {
    try {
      const response = await axios.get('http://localhost:8080/api/v1/posts/view_content');
      const data = response.data.data;
      console.log("user id type ", urlId)
      getFeed(data);
      const initialLiked = new Map();
      data.forEach((feed) => {
        if (feed.likes) {
          if (Object.keys(feed.likes).includes(urlId)) initialLiked.set(feed._id, true);
        }
      });

      console.log(initialLiked)

      setLiked(initialLiked);

      // console.log(liked);

    } catch (error) {
      console.log(error);
      setError(error.message || "Could not show feeds")
    }


  }

  const getUsersInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/v1/users/allUserInfo');
      getusers(response);
    } catch (error) {
      console.log(error);
      setError(error || "Could not show data")
    }
  }


  useEffect(() => {
    const initialize = async () => {
      const urlid = new URLSearchParams(window.location.search).get('id');
      // Ensure user ID is set before fetching data
      if (urlid) {
        setUserid(urlid);
        await getUsersInfo(); // Assuming this is an async function
        await getFeeds(urlid);
      }

      // Initialize socket connection
      const socket = io('http://localhost:8080');

      socket.on('newPost', (newPost) => {
        getFeed((prevPosts) => [newPost, ...prevPosts]); // Assuming `getFeed` updates the posts
      });

      // Cleanup on component unmount
      return () => {
        socket.off('newPost');
        socket.disconnect();
      };
    };

    initialize();
  }, []);




  const likePosts = async ({ postId }) => {
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



      setMsg(response.data.message);
    } catch (error) {
      console.log(error);
      setError(error.response?.data || "An error occurred while liking the post.");
    }
  };


  const logout = async () => {
    try {
      await axios.post('http://localhost:8080/api/v1/users/logOut', {}, { withCredentials: true });
      console.log("logout successfull");

      alert("logout successfull");

      setTimeout(() => {
        router.push('/')
      }, 2000);
    } catch (error) {
      console.log(error.response.data);
      alert("not able to logout");
    }
  }
  return (
    <div className='min-h-screen w-full flex flex-col bg-DarkBlue relative'>
      {console.log(userid)}
      {msg && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}
          </Alert>
        </div>
      )}
      {error && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
      )}

      {open && (
        <button
          className="h-11 w-11 absolute top-11 right-4 cursor-pointer z-50"
          title="my_close_btn"
          type="button"
          onClick={closeWritingTab}
        >
          <CancelIcon htmlColor='yellow' />
        </button>
      )}

      {open && (
        <div className="absolute inset-0 z-40 flex justify-center items-center">
          <WritingTab type={type} onShowMsg={handleShowAlert} onShowError={handleErrorAlert} />
        </div>
      )}

      {comment && (
        <button
          className="h-11 w-11 absolute top-11 right-4 cursor-pointer z-50"
          title="my_close_btn"
          type="button"
          onClick={closeCommentSection}
        >
          <CancelIcon htmlColor='yellow' />
        </button>
      )}

      {comment && (
        <div className="CS absolute inset-0 z-40 flex justify-center items-center">
          <CommentSection postId={postId} userId={userid} onShowMsg={handleShowAlert} onShowError={handleErrorAlert} users={users} />
        </div>
      )}

      <div className={`sticky top-0 z-20 ${blur ? "blur-md" : ""} bg-background mb-4`}>
        <NavBar />
      </div>

      <div className={`content flex-1 flex gap-4 justify-between ${blur ? "blur-md" : ""}`}>
        {/* Left Side Panel */}
        <div className="w-32 flex flex-col justify-between py-8 sticky top-[64px]">
          <div className="flex flex-col items-center gap-7">
            <Image src="/assets/icons/notification.svg" width={48} height={48} alt='noti' />
            <Image src="/assets/icons/message.svg" width={58} height={58} alt='msg' />
            <Image src="/assets/icons/write.svg" width={58} height={58} alt='write' />
            <Image src="/assets/icons/book.svg" width={58} height={58} alt='book' />
          </div>
          <div className="flex justify-center">
            <Button onClick={logout} variant='plain'>
              <Image src="/assets/img/profile.svg" width={66} height={69} alt='profile' />
            </Button>
          </div>
        </div>

        {/* Main Center Content */}
        <div className="flex-1 max-w-[66.666667%] min-h-0">
          <div className="h-24 rounded-lg bg-lightBlue flex justify-center items-center gap-5 mb-4">
            <Button
              className="rounded-xl w-28 font-inconsolata text-center"
              sx={{ background: '#E8F842', color: 'black' }}
              onClick={() => openWritingTab("Ideate")}
            >
              Ideate...
            </Button>
            <Button
              className="rounded-xl w-28 font-inconsolata text-center"
              sx={{ background: '#E8F842', color: 'black' }}
              onClick={() => openWritingTab("Post")}
            >
              Post...
            </Button>
          </div>

          <div className="h-[calc(100vh-160px)] overflow-y-auto pr-4">
            <div className="flex flex-col gap-5 font-inconsolata">
              {feeds.map((feed) => (
                <div key={feed._id} className="rounded-md bg-lightBlue p-4">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Image
                        src={users.data[feed.postId.toString()].avatar.length > 0
                          ? users.data[feed.postId.toString()].avatar
                          : "/assets/img/profile.svg"}
                        height={48}
                        width={48}
                        alt="profile"
                      />
                      <div className="flex flex-col">
                        <p className='text-black text-xl font-bold'>{users.data[feed.postId.toString()].name}</p>
                        <p className="text-black">{users.data[feed.postId.toString()].institute}</p>
                      </div>
                    </div>
                    <div className="text-black flex flex-col items-end">
                      <p className='text-center'>{feed.type}</p>
                      <p>{feed.field}</p>
                    </div>
                  </div>
                  <div className="text-black">{feed.content}</div>

                  <div className="post_footer w-full mt-3">
                    <Button
                      onClick={() => likePosts({ postId: feed._id })}
                      variant="plain"
                      sx={{ color: "black" }}
                    >
                      {(liked.has(feed._id)) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                    </Button>

                    <Button onClick={() => OpenCommentSection(feed._id)} variant="plain" sx={{ color: "black" }}>
                      <CommentIcon />
                    </Button>


                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side Panel */}
        <div className="w-32 sticky top-[64px]"></div>
      </div>
    </div>
  );
}

export default Feeds
