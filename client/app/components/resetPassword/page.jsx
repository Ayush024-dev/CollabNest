"use client"
import axios from 'axios';
import { useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import { Button, Typography, Alert, Input } from '@mui/joy';
import Image from 'next/image';
import LoadingPage from '../loading/page';

const ResetPassword = () => {
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reset, setReset] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const router = useRouter();

  const resetPassword = async () => {
    try {
      // Validate passwords match
      if (password !== confirmPassword) {
        setPasswordError("Passwords do not match");
        return;
      }

      // Validate password length
      if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters long");
        return;
      }

      setPasswordError("");
      setLoading(true);
      
      // Decode the token to remove URL encoding
      const decodedToken = decodeURIComponent(token);
      
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/resetPassword`, 
        { 
          token: decodedToken, 
          password 
        }, 
        { withCredentials: true }
      );
      
      console.log("Password reset successful", response.data);
      setReset(true);
      setLoading(false);
      
             // Redirect to loading page after successful reset
       setTimeout(() => {
         router.push('/');
       }, 1000);
    } catch (error) {
      setLoading(false);
      const errorMessage = error.response?.data?.message || 'Password reset failed. Please try again.';
      setError(errorMessage);
    }
  };

  useEffect(() => {
    const urlToken = new URLSearchParams(window.location.search).get('token');
    console.log("Token from URL:", urlToken);

    if (!urlToken) {
      setError("Invalid reset link. Please request a new password reset.");
      return;
    }

    setToken(urlToken);
  }, []);

  return (
    <>
      {loading && <LoadingPage message="Resetting your password..." />}
      <div className="page h-full w-full flex justify-center items-center bg-black">
        <div className='reset-password bg-black w-2/5 h-auto p-4 rounded-md flex flex-col gap-6'>
          <div className="nav h-auto w-full flex justify-between font-inconsolata">
            <div className="title">
              <p className="text-2xl">Reset your password</p>
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

          <div className="form flex flex-col w-full flex-grow mt-10">
            {reset ? (
              <div className="text-center">
                <Alert color="success" className="mb-4">
                  Password reset successfully! Redirecting to login...
                </Alert>
              </div>
            ) : error ? (
              <div className="text-center">
                <Alert color="danger" className="mb-4">
                  {error}
                </Alert>
                <Button 
                  color="neutral" 
                  variant="outlined" 
                  onClick={() => router.push('/')}
                  className="mt-4"
                >
                  Back to Login
                </Button>
              </div>
            ) : (
              <div className="written_form h-full flex flex-col gap-6">
                <div className="text-center mb-4">
                  <Typography level="h4" color="neutral" className="mb-2">
                    Create New Password
                  </Typography>
                  <p className="text-gray-300 text-lg">
                    Enter your new password below. Make sure it's secure and memorable.
                  </p>
                </div>

                <Input
                  placeholder='New Password...'
                  id='password'
                  type='password'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  variant='solid'
                  className='w-full'
                />

                <Input
                  placeholder='Confirm New Password...'
                  id='confirmPassword'
                  type='password'
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  variant='solid'
                  className='w-full'
                />

                {passwordError && (
                  <Alert color="danger" className="text-sm">
                    {passwordError}
                  </Alert>
                )}

                {loading ? (
                  <Button 
                    color="success" 
                    loading 
                    variant="solid" 
                    className='w-full flex justify-center text-center'
                  >
                    Resetting...
                  </Button>
                ) : (
                  <Button 
                    color='success' 
                    onClick={resetPassword} 
                    className='w-full flex justify-center text-center'
                    disabled={!password || !confirmPassword}
                  >
                    Reset Password
                  </Button>
                )}

                <div className="flex justify-center mt-4">
                  <Button
                    variant="outlined"
                    color="neutral"
                    onClick={() => router.push('/')}
                    className='flex items-center gap-2'
                  >
                    Back to Login
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default ResetPassword
