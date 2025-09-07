"use client"
import axios from 'axios';
import React, { useState } from 'react'
import Image from 'next/image';
import { Input, Button } from '@mui/joy';
import { useRouter } from 'next/navigation';
import LoadingPage from '../loading/page';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const ForgetPassword = ({ onShowAlert, onShowError, setShowForgetPassword }) => {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleForgetPassword = async () => {
        try {
            if (!email.trim()) {
                onShowError("Please enter your email address");
                return;
            }

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                onShowError("Please enter a valid email address");
                return;
            }

            setLoading(true);
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/v1/users/forgetPassword`,
                { email },
                { withCredentials: true }
            );

            console.log("Password reset email sent", response.data);
            onShowAlert(response.data.data.message || "Password reset link sent to your email");
            setLoading(false);
            // Redirect back to login after successful email send
            setTimeout(() => {
                setShowForgetPassword(false);
            }, 1500);
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
                return "Failed to send password reset email.";
            };

            // Check if error.response.data is an HTML string
            const errorMessage =
                error.response?.data && typeof error.response.data === "string"
                    ? extractErrorMessage(error.response.data)
                    : error.response?.data?.message || "Failed to send password reset email.";

            console.log("Password reset failed", errorMessage);
            onShowError(errorMessage);
        }
    };

    const handleBackToLogin = () => {
        setShowForgetPassword(false);
    };

    return (
        <>
            {loading && <LoadingPage message="Sending password reset email..." />}
            <div className='bg-black h-auto w-2/5 p-4 rounded-md'>
                <div className="nav h-auto w-full flex justify-between font-inconsolata">
                    <div className="title">
                        
                        <h1 className="text-6xl text-yellow">
                            <span className="text-blue-900">Collab</span>Nest
                        </h1>
                        <p className="text-2xl">Forgot your password?</p>
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
                    <div className="written_form h-full flex flex-col gap-6">
                        <div className="text-center mb-4">
                            <p className="text-gray-300 text-lg">
                                Enter your email address and we'll send you a link to reset your password.
                            </p>
                        </div>

                        <Input
                            placeholder='Enter your email address...'
                            id='email'
                            type='email'
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            variant='solid'
                            className='w-full'
                        />

                        {loading ? (
                            <Button
                                color="success"
                                loading
                                variant="solid"
                                className='w-full flex justify-center text-center'
                            >
                                Sending...
                            </Button>
                        ) : (
                            <Button
                                color='success'
                                onClick={handleForgetPassword}
                                className='w-full flex justify-center text-center'
                            >
                                Send Reset Link
                            </Button>
                        )}

                        <div className="flex justify-center mt-4">
                            <Button
                                variant="outlined"
                                color="neutral"
                                onClick={handleBackToLogin}
                                startDecorator={<ArrowBackIcon />}
                                className='flex items-center gap-2'
                            >
                                Back to Login
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}

export default ForgetPassword
