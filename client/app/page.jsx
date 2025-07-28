"use client";
import React, { useState } from "react";
import "./globals.css";
import Image from "next/image";
import Signup from "./components/Signup/page.jsx";
import Login from "./components/Login/page";
import { Alert } from "@mui/material";
import CheckBoxIcon from "@mui/icons-material/CheckBox";
import ErrorIcon from "@mui/icons-material/Error";
import CancelIcon from "@mui/icons-material/Cancel";


const Home = () => {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [blur, setBlur] = useState(false);

  const handleShowAlert = (message) => {
    setMsg(message);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleErrorAlert = (message) => {
    setError(message);
    setTimeout(() => setError(""), 4000);
  };

  const handleBlurBackground = (state) => {
    setBlur(state);
  };

  const handleLoginClick = () => {
    setShowSignup(false);
    setShowLogin(true);
    handleBlurBackground(true);
  };

  const handleSignupClick = () => {
    setShowLogin(false);
    setShowSignup(true);
    handleBlurBackground(true);
  };

  const handleClose = () => {
    setShowLogin(false);
    setShowSignup(false);
    handleBlurBackground(false);
  };

  return (
    <main
      className={`flex flex-row h-full w-full relative text-white bg-black`}
    >
      {/* Alerts */}
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

      {/* close icon */}

      {(showSignup || showLogin) && (
        <button className="close_btn h-auto w-auto absolute top-4 right-4 cursor-pointer z-50" title="my_close_btn" type="button" onClick={handleClose}><CancelIcon 
        /></button>
          
        
      )}

      {/* Signup Component */}
      {showSignup && (
        <div className={`signup z-40 absolute flex justify-center items-center inset-0 transition-opacity duration-500 ease-in-out 
        ${showSignup ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
            
            <Signup onShowError={handleErrorAlert} onShowAlert={handleShowAlert} closeSignup={handleClose} />
          
        </div>
      )}

      {/* Login Component */}
      {showLogin && (
        <div className="login z-40 absolute flex justify-center items-center inset-0">
          
            <Login onShowError={handleErrorAlert} onShowAlert={handleShowAlert} />

        </div>
      )}

      {/* Left Section */}
      <div className={`left h-full w-1/2 flex flex-col font-inconsolata ${blur ? "blur-md" : ""
        }`}>
        <div className="nav w-full h-auto flex justify-end">
          <Image
            src="/assets/icons/icon.svg"
            width={76}
            height={76}
            alt="logo"
            className="object-contain"
          />
        </div>
        <div>
          <h1 className="title text-9xl pl-5">
            <span className="text-blue-800">Collab</span>
            <span className="text-yellow">Nest</span>
          </h1>
        </div>
        <div className="pl-10 flex flex-col flex-grow justify-between">
          <div className="description">
            <h2 className="text-4xl">
              Where ideas hatch <br /> into startups...
            </h2>
          </div>
          <div className="bttn flex gap-8">
            <button
              className="w-28 h-12 rounded-xl bg-blue-700"
              onClick={handleLoginClick}
            >
              Log in
            </button>
            <button
              className="w-28 h-12 rounded-xl bg-blue-700"
              onClick={handleSignupClick}
            >
              Sign up
            </button>
          </div>
          <div className="last pb-4">
            <h1 className="text-yellow text-3xl">Welcome ideator!!</h1>
            <p className="flex flex-wrap text-3xl">
              Your journey starts here. Discover co-founders, share ideas, and
              build the future. Together, let’s create something amazing.
            </p>
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className={`right h-full w-1/2 relative ${blur ? "blur-md" : ""
        }`}>
        <Image
          src="/assets/img/sidelanding.svg"
          layout="fill"
          objectFit="cover"
          alt="img"
        />
      </div>
    </main>
  );
};

export default Home;
