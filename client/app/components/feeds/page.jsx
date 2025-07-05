"use client"
// Package import
import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

// Components import
import NavBar from '../nav/page';
import WritingTab from '../writingTab/page';
import CommentSection from '../comments/page';
import Posts from '../Posts/page';

import CancelIcon from '@mui/icons-material/Cancel';
import { Alert } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ErrorIcon from "@mui/icons-material/Error";
import LogoutIcon from '@mui/icons-material/Logout';



const Feeds = () => {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState("");
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [blur, setblur] = useState(false);

  const [users, getusers] = useState({});

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
    setTimeout(() => setError(""), 2000);
  };



  const getUsersInfo = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/v1/users/allUserInfo');
      console.log("This one:", typeof (response.data))
      getusers(response);
    } catch (error) {
      console.log(error);
      setError(error || "Could not show data")
    }
  }



  useEffect(() => {
    const initialize = async () => {
      const userResponse = await axios.get('http://localhost:8080/api/v1/users/isLoggedIn', {
        withCredentials: true,
      });

      const userId = userResponse.data.user_id;
      if (userId) {
        setUserid(userId);
      }
      await getUsersInfo();
    }
    initialize();
  }, [])


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
  if (Object.keys(users).length === 0) {
    return <div>Loading users...</div>;
  }
  return (
    <div className='min-h-screen w-full flex flex-col bg-slate-600 relative'>
      {/* to get messages */}
      {msg && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}
          </Alert>
        </div>
      )}
      {/* To get errors */}
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
        <NavBar profileLink={userid} />
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
          <div className="fixed left-4 bottom-8 z-30">
          <Button onClick={logout} variant='ghost' className="relative flex items-center justify-center p-0 hover:bg-transparent">
            {/* Yellow Profile Image as Base */}
            <Image src="/assets/img/profile.svg" width={66} height={69} alt='profile' className="relative" />
            {/* Logout Icon Positioned Over the Image */}
            <LogoutIcon 
              style={{ 
                width: "32px", 
                height: "32px",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                color: "#000000",
                zIndex: 10
              }} 
            />
          </Button>
        </div>
        </div>

        {/* Main Center Content */}
        <div className="flex-1 max-w-[66.666667%] min-h-0">
          <div className="h-24 rounded-lg bg-lightBlue flex justify-center items-center gap-5 mb-4 shadow-2xl">
            <Button
              className="rounded-xl w-28 font-inconsolata text-center text-black font-bold"
              style={{ background: '#E8F842' }}
              onClick={() => openWritingTab("Ideate")}
            >
              Ideate...
            </Button>
            <Button
              className="rounded-xl w-28 font-inconsolata text-center text-black font-bold"
              style={{ background: '#E8F842' }}
              onClick={() => openWritingTab("Post")}
            >
              Post...
            </Button>
          </div>

          <Posts users={users} OpenCommentSection={OpenCommentSection} fromProfile={false} onShowError={handleErrorAlert}/>

        </div>

        {/* Right Side Panel */}
        <div className="w-32 sticky top-[64px]"></div>
      </div>
    </div>
  );
}

export default Feeds
