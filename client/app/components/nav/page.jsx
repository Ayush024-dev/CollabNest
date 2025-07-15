"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Typography, Button } from '@mui/joy'
import axios from 'axios'
import Link from 'next/link'
import { useRouter } from 'next/navigation'


const NavBar = ({ profileLink }) => {
    const [isloggedin, setLoggedIn] = useState(false);
    const [userid, setUserid]=useState("");

    const router=useRouter();
    const check = async () => {
        try {
            const data = await axios.get("http://localhost:8080/api/v1/users/isLoggedIn",{withCredentials:true});

            console.log(data);
            if(data.data.message==true){
                setLoggedIn(data.data.message);
            }

            setUserid(data.data.user_id);
            localStorage.setItem("user",data.data.user_id);
            
        } catch (error) {
            console.error(error);
        }
    }

    

    useEffect(() => {
        check();
    }, [])
    return (
        <div className='h-auto w-full flex justify-between bg-black'>
            <div className="logo flex gap-2 items-center">
                <div className="img">
                    <Image
                        src="/assets/icons/icon.svg"
                        width={76}
                        height={76}
                        alt='icon'
                    />
                </div>
                <div className="title font-inconsolata">
                    <Typography level='h3'><span className='text-yellow font-inconsolata'>Collab</span><span className='text-blue-800 font-inconsolata'>Nest</span></Typography>
                </div>
            </div>

            <div className="btn flex items-center p-4">
                {!isloggedin ? <Button color='success' variant='solid'>login</Button> :
                    <div className="navbar flex gap-4 justify-center">
                        <button
                            className="text-white font-inconsolata px-3 py-1 rounded transition duration-150 hover:bg-white hover:text-black"
                            onClick={() => { window.location.href = '/components/feeds'; }}
                        >
                            About Us
                        </button>
                        <button
                            className="text-white font-inconsolata px-3 py-1 rounded transition duration-150 hover:bg-white hover:text-black"
                            onClick={() => { window.location.href = `/components/messages?user=${userid}`; }}
                        >
                            Messages
                        </button>
                        <button
                            className="text-white font-inconsolata px-3 py-1 rounded transition duration-150 hover:bg-white hover:text-black"
                            onClick={() => { window.location.href = `/components/UserProfile?user=${userid}`; }}
                        >
                            Profile
                        </button>
                    </div>
                }
            </div>

        </div>
    )
}

export default NavBar
