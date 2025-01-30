"use client"
import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import { Typography, Button } from '@mui/joy'
import axios from 'axios'
import Link from 'next/link'
const NavBar = () => {
    const [isloggedin, setLoggedIn] = useState(false);
    const check = async () => {
        try {
            const data = await axios.get("http://localhost:8080/api/v1/users/isLoggedIn",{withCredentials:true});

            console.log(data);
            if(data.data.message==true){
                setLoggedIn(data.data.message);
            }
            
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
                    <div className="navbar text-white font-inconsolata flex gap-4 justify-center">
                        <Link href="/components/feeds">About Us</Link>
                        <Link href="/components/feeds">Messages</Link>
                        <Link href="/components/feeds">Profile</Link>
                    </div>
                }
            </div>

        </div>
    )
}

export default NavBar
