"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Button, Typography, Alert } from '@mui/joy';
import NavBar from '../nav/page';

const VerifyEmail = () => {
  const [token, setToken] = useState("");
  const [verified, setverified] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const verifyEmail = async () => {
    try {
      setLoading(true);
      const user = await axios.post('http://localhost:8080/api/v1/users/verifyemail', { token }, { withCredentials: true });
      console.log("verified")
      setverified(user.isVerified);
      setLoading(false);
      setTimeout(() => {
        router.push('/components/aboutYou')
      }, 500);
    } catch (error) {
      setLoading(false);
      setError(error.response?.data || 'Verification failed. Please try again.');
    }
  };

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    console.log(urlToken);

    setToken(urlToken || "");
  }, [])
  return (
    <div className="page h-full w-full flex justify-center items-center bg-black">
      <div className="nav absolute top-1 left-1 w-full">
        <NavBar />
      </div>
      <div className='verify bg-black w-3/4 h-3/5 rounded-md flex flex-col gap-5 justify-center items-center text-white'>
        {verified ? (
          <>
            <Alert color="success">Email verified successfully! Redirecting...</Alert>
          </>
        ) : error ? (
          <Alert color="danger">{error}</Alert>
        ) : (
          <>
            <Typography level="h4" color="neutral">Click below to Verify Your Email</Typography>

            {loading ? <Button color='success' loading variant="solid">Solid</Button>
              : <Button color='success' onClick={verifyEmail}>
                Verify Email
              </Button>}
          </>
        )}
      </div>
    </div>

  )
}

export default VerifyEmail
