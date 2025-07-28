"use client"
import React, { useState } from 'react';
import NavBar from '../nav/page';
import { Input, Button, Textarea } from '@mui/joy';
import Image from 'next/image';
import axios from 'axios';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { Alert } from '@mui/material';
import ErrorIcon from "@mui/icons-material/Error";
import { useRouter } from 'next/navigation'
const AboutYou = () => {
  const [user, setuser]=useState({
    username:"",
    designation:"",
    institute: "",
    Bio: ""
  })
  const [error, setError]=useState("");
  const [msg, setMsg]=useState("");
  const router=useRouter();

  const onSubmitData= async()=>{
    try {
      const response=await axios.post("http://localhost:8080/api/v1/users/aboutYou",user, {withCredentials:true})

      console.log("data submitted")

      setMsg(response.data.message);

      setTimeout(() => {
        router.push('/')
    }, 2000);
    } catch (error) {
      console.log("Error while submitting ", error);

      setError(error.response.data || "Something went wrong");
    }
  }
  return (
    <div className="page h-screen w-screen flex flex-col">
      {msg.length > 0 ? (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}... Redirecting to login page
          </Alert>
        </div>
      ) : (
        <></>
      )}

      {error.length > 0 ? (
        <div className="absolute z-50 top-4 right-4">
          <Alert icon={<ErrorIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
      ) : (
        <></>
      )}
      <div className="nav">
        <NavBar />
      </div>

      <div className="relative flex-grow flex justify-center items-center"> {/* Flexbox added */}
        <Image
          src="/assets/img/sidelanding.svg"
          layout="fill"
          objectFit="cover"
          alt="bg_img"
          className="blur-sm"
        />

        {/* Form positioned above image */}
        <div className="form absolute z-10 h-3/5 w-3/5 bg-black flex items-center justify-center rounded-md flex-col">
          <div className="title text-white font-inconsolata text-center w-full">
            <h1>Let us know something about yourself...</h1>
            <h1>Fields with mark * are compulsory</h1>
          </div>

          <div className="fields flex flex-col flex-grow justify-center items-center gap-7 w-full">
            <Input
              placeholder='Username..*.'
              id='username'
              type='text'
              value={user.username}
              onChange={(e) => setuser({ ...user, username: e.target.value })}
              variant='solid'
              className='w-5/6'

            />
            <Input
              placeholder='designation...*(if student write student)'
              id='designation'
              type='text'
              value={user.designation}
              onChange={(e) => setuser({ ...user, designation: e.target.value })}
              variant='solid'
              className='w-5/6'

            />
            <Input
              placeholder='Institute/organisation...*'
              id='institue'
              type='text'
              value={user.institute}
              onChange={(e) => setuser({ ...user, institute: e.target.value })}
              variant='solid'
              className='w-5/6'

            />
            <Textarea
              placeholder='Bio...'
              id='bio'
              value={user.Bio}
              onChange={(e) => setuser({ ...user, Bio: e.target.value })}
              variant='solid'
              className='w-5/6'
            />
            <Button color='success' onClick={onSubmitData} className='w-2/5 text-center' >Go Ahead</Button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AboutYou;
