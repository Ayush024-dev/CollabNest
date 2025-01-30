"use client"
import axios from 'axios';
import React, { useState } from 'react'
// import { Alert } from '@mui/material';
import Image from 'next/image';
import { Input, Button } from '@mui/joy';
import GoogleIcon from '@mui/icons-material/Google';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
// import CheckBoxIcon from '@mui/icons-material/CheckBox';

const Signup = ({ onShowAlert, onShowError }) => {
  const [user, setUser] = useState({
    name: "",
    email: "",
    password: "",
    confirm_password: "",
    avatar: null
  })

  const [loading, setLoading] = useState(false);

  // const [msg, setMsg] = useState("");
  // const [error, setError] = useState("");

  const onSignup = async () => {
    try {
      setLoading(true);
      const formdata = new FormData();
      formdata.append("avatar", user.avatar)
      formdata.append("name", user.name)
      formdata.append("email", user.email);
      formdata.append("password", user.password);
      formdata.append("confirm_password", user.confirm_password)

      const response = await axios.post(`http://localhost:8080/api/v1/users/register`, formdata,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          }
        }
      );
      setLoading(false);
      console.log("Signup success", response.data);

      // setMsg(response.data.message)
      onShowAlert(response.data.message)
    } catch (error) {
      console.log("signup failed", error);
      setLoading(false)
      // setError(error);
      onShowError(error.response.data || "Sign up failed")
    }
  }
  return (

    <div className='bg-black h-auto w-1/2 p-4 rounded-md'>
      {/* {msg.length > 0 ? (
        <div classname="absolute z-30 top-4 right-4 h-auto w-auto rounded-sm">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="success">
            {msg}
          </Alert>
        </div>
      ) : (
        <></>
      )}

      {error.length > 0 ? (
        <div classname="absolute z-30 top-4 right-4 h-auto w-auto rounded-sm">
          <Alert icon={<CheckBoxIcon fontSize="inherit" />} severity="error">
            {error}
          </Alert>
        </div>
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

      <div className="form flex w-full flex-grow">

        <div className="written_form h-full flex flex-col m-6 gap-6">
          <Input
            placeholder='Upload avatar...'
            id='avatar'
            type='file'
            // value={user.avatar}
            onChange={(e) => setUser({ ...user, avatar: e.target.files[0] })}
            variant='solid'
            className='w-5/6'

          />
          <Input
            placeholder='Name...'
            id='name'
            type='text'
            value={user.name}
            onChange={(e) => setUser({ ...user, name: e.target.value })}
            variant='solid'
            className='w-5/6'

          />

          <Input
            placeholder='Email...'
            id='email'
            type='text'
            value={user.email}
            onChange={(e) => setUser({ ...user, email: e.target.value })}
            variant='solid'
            className='w-5/6'

          />

          <Input
            placeholder='Password...'
            id='password'
            type='password'
            value={user.password}
            onChange={(e) => setUser({ ...user, password: e.target.value })}
            variant='solid'
            className='w-5/6'

          />

          <Input
            placeholder='Confirm Password...'
            id='confirm_password'
            type='password'
            value={user.confirm_password}
            onChange={(e) => setUser({ ...user, confirm_password: e.target.value })}
            variant='solid'
            className='w-5/6'

          />
          {loading ? <Button color="success" loading variant="solid" className='w-2/5 flex justify-center text-center'>
            Solid
          </Button>
            : <Button color='success' onClick={onSignup} className='w-2/5 flex justify-center text-center' >Sign up</Button>
          }
        </div>

        <div className="or flex flex-col justify-center items-center">
          <span className='w-0.5 h-28 bg-white'></span>
          or
          <span className='w-0.5 h-28 bg-white'></span>
        </div>

        <div className="google ml-16 bg-black flex flex-col justify-center items-center gap-6">
          <div className="google w-56 h-8 bg-slate-500 rounded-lg flex justify-center items-center">
            <GoogleIcon />
            Sign in with Google
          </div>

          <div className="linkedin w-56  h-8 bg-slate-500 rounded-lg flex justify-center items-center">
            <LinkedInIcon />
            Sign in with Linkedin
          </div>
        </div>

      </div>
    </div>
  )
}

export default Signup
