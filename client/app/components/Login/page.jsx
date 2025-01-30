'use client'
import axios from 'axios';
import React, { useState } from 'react'
// import { Alert } from '@mui/material';
import Image from 'next/image';
import { Input, Button } from '@mui/joy';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { useRouter } from 'next/navigation';
const Login = ({ onShowAlert, onShowError }) => {
  const [user, setUser] = useState({
    email: "",
    username: "",
    password: "",
  })

  // const [msg, setMsg] = useState("");
  // const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const onLogin = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `http://localhost:8080/api/v1/users/login`,
        user,
        { withCredentials: true }
      );
      console.log("login success", response.data);

      const userId = response.data.data.user._id;
      console.log(userId.toString());
      onShowAlert(response.data.message);
      setLoading(false);

      // Use searchParams to create the URL with query parameters
      const url = `/components/feeds?id=${encodeURIComponent(userId.toString())}`;
      router.push(url);
    } catch (error) {
      setLoading(false);

      // Extract backend error message from string-based HTML
      const extractErrorMessage = (htmlString) => {
        try {
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlString, "text/html");
          const preTag = doc.querySelector("pre");
          if (preTag) {
            const errorText = preTag.textContent || "";
            return errorText.split(":")[1]?.trim(); // Extract message after "Error:"
          }
        } catch (err) {
          console.error("Error parsing HTML string:", err);
        }
        return "Sign in failed.";
      };

      // Check if error.response.data is an HTML string
      const errorMessage =
        error.response?.data && typeof error.response.data === "string"
          ? extractErrorMessage(error.response.data)
          : "Sign in failed.";
      console.log("login failed", errorMessage);

      // Display the extracted error message
      onShowError(errorMessage);
    }
  };

  return (
    <div className='bg-black h-auto w-2/5 p-4 rounded-md'>
      {/* {msg.length > 0 ? (
        <>
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}
          </Alert>
        </>
      ) : (
        <></>
      )}

      {error.length > 0 ? (
        <>
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </>
      ) : (
        <></>
      )} */}

      <div className="nav h-auto w-full flex justify-between font-inconsolata">
        <div className="title">
          <p className="text-2xl">Welcome to ...</p>
          <h1 className="text-6xl text-yellow">
            <span className="text-blue-900">Collab</span>Nest
          </h1>
        </div>
        <div className="icon">
          <Image
            src="/assets/icons/icon.svg"
            width={76}
            height={76}
            alt='icon'
          />
        </div>
      </div>

      <div className="form flex justify-between w-full flex-grow">

        <div className="written_form h-full flex flex-col mt-10 gap-6">


          <Input
            placeholder='Email or Username...'
            id='email'
            type='text'
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            variant='solid'
            className='w-full'

          />

          <Input
            placeholder='Password...'
            id='password'
            type='password'
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            variant='solid'
            className='w-full'

          />

          {loading ? <Button color="success" loading variant="solid" className='w-2/5 flex justify-center text-center'>
            Solid
          </Button>
            : <Button color='success' onClick={onLogin} className='w-2/5 flex justify-center text-center' >Log in</Button>
          }
        </div>

        <div className="or flex flex-col justify-center items-center">
          <span className='w-0.5 h-28 bg-white'></span>
          or
          <span className='w-0.5 h-28 bg-white'></span>
        </div>

        <div className="google ml-6 bg-black flex flex-col justify-center items-center gap-6">
          <div className="google w-56 h-10 bg-slate-500 rounded-lg flex justify-center items-center">
            <GoogleIcon />
            Sign in with Google
          </div>

          <div className="linkedin w-56  h-10 bg-slate-500 rounded-lg flex justify-center items-center">
            <LinkedInIcon />
            Sign in with Linkedin
          </div>
        </div>

      </div>
    </div>
  )
}

export default Login
