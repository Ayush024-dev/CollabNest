"use client"
import { useState, useEffect } from 'react'
import CommentSection from '../comments/page';
import NavBar from '../nav/page';
import Image from 'next/image';
import axios from 'axios';
import { Button } from '@/components/ui/button';
import LogoutIcon from '@mui/icons-material/Logout';
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from '@mui/icons-material/Cancel';
import { Alert } from "@mui/material";
import Posts from '../Posts/page';
import { useRouter } from 'next/navigation';
import LoadingPage from '../loading/page';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

const ProfilePage = () => {
  const [user, getUser] = useState({});
  const [feeds, getFeed] = useState([]);
  const [liked, setLiked] = useState(new Map());
  const [userid, setUserid] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [postId, setpostId] = useState("");
  const [comment, getComment] = useState(false);
  const [blur, setblur] = useState(false);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, getConnectionStatus] = useState("");
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [loadingLogout, setLoadingLogout] = useState(false);

  const router = useRouter();

  const getUserFeeds = async ({ userId }) => {
    try {
      setLoading(true);
      setError("");
      console.log(userId)
      const response = await axios.post("http://localhost:8080/api/v1/posts/view_content", { encryptedId: userId }, {
        withCredentials: true,
      });
      const data = response?.data?.data;
      console.log(data)
      getUser(data.user);
      setLoggedIn(data.isLoggedInUser);
      getFeed(data.encryptedPost);
      setLiked(new Map(Object.entries(data.initialLikes)));
    } catch (error) {
      console.log(error);
      // Properly extract error message from axios error response
      const errorMessage = error.response?.data?.message || error.message || "Could not show feeds";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {

    const initialize = async () => {
      setLoading(true);

      const params = new URLSearchParams(window.location.search);
      const encryptedId = params.get("user");

      if (encryptedId) {
        try {
          // Handle URL encoding properly
          const decodedId = decodeURIComponent(encryptedId).replace(/ /g, '+');
          setUserid(decodedId);
          console.log("✅ Final userId sent:", decodedId);
          await getUserFeeds({ userId: decodedId });

          const getStatus = await axios.post(
            "http://localhost:8080/api/v1/users/getUserConnectionStatus",
            { encryptedUserId: decodedId },
            { withCredentials: true }
          );

          console.log("🔁 Connection Status Response:", getStatus.data);
          getConnectionStatus(getStatus.data.Connection_status);

        } catch (error) {
          console.error("Error decoding user ID:", error);
          setError("Invalid user profile link");
          setLoading(false);
        }
      } else {
        setError("No user ID provided");
        setLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const userName = (user && user.name) || 'CollabNest - Profile';
    document.title = userName;
  }, [user]);


  const handleShowAlert = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(""), 2000);
  };

  const handleErrorAlert = (message) => {
    setError(message);
    setTimeout(() => setError(""), 2000);
  };

  const OpenCommentSection = (postId) => {
    setpostId(postId);
    getComment(true);
    setblur(true);
  }

  const closeCommentSection = () => {
    getComment(false);
    setblur(false);
  }

  const handleConnect = async ({ userId }) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/v1/users/sendConnectionReq",
        { decryptedreceiverId: userId },  // userId should already be decrypted in the backend
        { withCredentials: true }
      );

      getConnectionStatus("pending");
      console.log(response)
      handleShowAlert(response.data.message)
    } catch (error) {
      console.log(error);
      const errorMessage = error.response?.data?.message || error.message || "Could not send connection request";
      handleErrorAlert(errorMessage);
    }
  }

  const handleRemoveOrWithdraw = async ({ userId }) => {
    try {
      const response = await axios.post(
        "http://localhost:8080/api/v1/users/RemoveOrWithdrawRequest",
        { encryptedUserId: userId },
        { withCredentials: true }
      );

      // Reset to initial state: show connect button
      getConnectionStatus("No_Connection");

      console.log("✅ Connection removed or withdrawn:", response.data.message);
      // handleRemoveOrWithdraw(response.data.message)
    } catch (error) {
      console.error(error);
      const errorMessage = error.response?.data?.message || error.message || "Could not send connection request";
      handleErrorAlert(errorMessage);
    }
  };


  const handleMessage = () => {
    // Get logged-in user's id from localStorage
    const loggedInUser = localStorage.getItem("user");
    // decodedId is the profile being viewed (userid state)
    if (loggedInUser && userid) {
      // Navigate to messages page with both user and target parameters
      router.push(`/components/messages?user=${loggedInUser}&target=${userid}`);
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = async () => {
    setShowLogoutDialog(false);
    setLoadingLogout(true);
    try {
      await axios.post('http://localhost:8080/api/v1/users/logOut', {}, { withCredentials: true });
      localStorage.removeItem('user');
      setMsg('logout successful');
      setTimeout(() => {
        setLoadingLogout(false);
        router.push('/');
      }, 1500);
    } catch (error) {
      setLoadingLogout(false);
      setError('not able to logout');
    }
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };


  return (
    <div className='min-h-screen w-full flex flex-col bg-slate-600 relative'>
      {/* {console.log(user)} */}
      {/* {console.log(connectionStatus)} */}

      {/* Loading State */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-600 bg-opacity-50">
          <div className="text-white text-xl">Loading profile...</div>
        </div>
      )}

      {/* Success Alert */}
      {msg && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}
          </Alert>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
      )}

      {loadingLogout && <LoadingPage message="Logging you out..." />}
      <Dialog open={showLogoutDialog} onClose={handleLogoutCancel}>
        <DialogTitle>Confirm Logout</DialogTitle>
        <DialogContent>Are you sure you want to logout?</DialogContent>
        <DialogActions>
          <Button onClick={handleLogoutCancel} variant="outline">Cancel</Button>
          <Button onClick={handleLogoutConfirm} variant="destructive">Logout</Button>
        </DialogActions>
      </Dialog>

      {/* Close Comment Button */}
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

      {/* Comment Section Overlay */}
      {comment && user && Object.keys(user).length > 0 && (
        <div className="CS absolute inset-0 z-40 flex justify-center items-center">
          <CommentSection postId={postId} userId={userid} onShowMsg={handleShowAlert} onShowError={handleErrorAlert} users={user} />
        </div>
      )}

      {/* Navigation Bar */}
      <div className={`sticky top-0 z-20 ${blur ? "blur-md" : ""} bg-background`}>
        <NavBar profileLink={userid} />
      </div>

      {/* Main Layout Container */}
      <div className={`flex-1 relative ${blur ? "blur-md" : ""}`}>

        {/* Left Sidebar - Fixed Position */}
        <div className="fixed left-4 bottom-8 z-30">
          <Button onClick={handleLogoutClick} variant='ghost' className="relative flex items-center justify-center p-0 hover:bg-transparent">
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

        {/* Centered Main Content */}
        <div className="flex justify-center px-4 py-6">
          <div className="w-full max-w-4xl">

            {/* Profile Header Card */}
            <div className='h-72 rounded-lg bg-lightBlue flex shadow-2xl mb-6 overflow-hidden'>

              {/* Avatar and Info Section */}
              <div className="flex items-center p-6 flex-1">
                <div className="avatar flex items-center gap-8">
                  <div className="icon h-32 w-32 bg-white rounded-full flex items-center justify-center overflow-hidden">
                    <Image
                      src={user?.avatar && user.avatar.length > 0 ? user.avatar : "/assets/img/profile-user.png"}
                      width={96}
                      height={96}
                      alt='profile'
                      className="object-cover"
                      onError={(e) => {
                        e.target.src = "/assets/img/profile-user.png";
                      }}
                    />
                  </div>

                  <div className="info flex flex-col gap-2">
                    <p className='text-black font-bold text-2xl'>{user?.name || 'Loading...'}</p>
                    <p className='text-black font-bold text-xl'>{user?.username || ''}</p>
                    <p className='text-black font-bold text-lg'>{user?.highlights || ''}</p>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {user?.institute && (
                        <span className='bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded-full'>
                          {user.institute}
                        </span>
                      )}
                      {user?.designation && (
                        <span className='bg-yellow-500 text-black font-bold text-sm px-3 py-1 rounded-full'>
                          {user.designation}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Bio and Action Section */}
              <div className="bio flex flex-col justify-between p-6 w-80">
                <div className="btn flex justify-end">
                  {loggedIn && <button
                    className='font-bold text-sm px-6 py-3 rounded-2xl shadow-md bg-green-500 text-black hover:bg-green-600 transition-colors'
                  >
                    Update
                  </button>}

                  {!loggedIn && connectionStatus === "pending" && (
                    <button
                      className="font-bold text-sm px-6 py-3 rounded-2xl shadow-md bg-yellow text-black hover:bg-orange-600 transition-colors"
                      onClick={() => handleRemoveOrWithdraw({ userId: userid })}
                    >
                      Pending
                    </button>
                  )}

                  {!loggedIn && connectionStatus === "No_Connection" && (
                    <button
                      className="font-bold text-sm px-6 py-3 rounded-2xl shadow-md bg-orange-500 text-black hover:bg-orange-600 transition-colors"
                      onClick={() => handleConnect({ userId: userid })}
                    >
                      Connect
                    </button>
                  )}

                  {!loggedIn && connectionStatus === "Connection" && (
                    <div className="flex gap-2">
                      <button
                        className="font-bold text-sm px-6 py-3 rounded-2xl shadow-md bg-red-500 text-white hover:bg-red-600 transition-colors"
                        onClick={() => handleRemoveOrWithdraw({ userId: userid })}
                      >
                        Remove
                      </button>
                      <button
                        className="font-bold text-sm px-6 py-3 rounded-2xl shadow-md bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                        onClick={handleMessage}
                      >
                        Message
                      </button>
                    </div>
                  )}
                </div>

                <div className="bio-text flex-1 flex items-center">
                  <p className='text-black font-medium text-sm leading-relaxed'>
                    {user?.Bio || 'No bio available'}
                  </p>
                </div>
              </div>
            </div>

            {/* Posts Section */}
            {!loading && user && Object.keys(user).length > 0 && (
              <Posts
                users={user}
                OpenCommentSection={OpenCommentSection}
                Feed={feeds}
                likedMap={liked}
                fromProfile={true}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage