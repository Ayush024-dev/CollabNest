"use client"
import React, { useEffect, useState } from 'react'
import Textarea from '@mui/joy/Textarea';
import { Input, Button } from '@mui/joy';
import Image from 'next/image';
import { CloudUpload } from '@mui/icons-material';
import axios from 'axios';
// import io from 'socket.io-client'




const WritingTab = ({ type, onShowMsg, onShowError }) => {
    const [post, setPost] = useState({
        type: type,
        field: "",
        content: "",
        image: [],
    })
    const postContent = async () => {
        try {
            const formdata = new FormData();
            formdata.append("type", post.type)
            formdata.append("field", post.field)
            formdata.append("content", post.content)
            post.image.forEach((file) => {
                formdata.append("image", file);
            });
            const response = await axios.post("http://localhost:8080/api/v1/posts/posting_content", formdata, { withCredentials: true }, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            console.log("post made");

            onShowMsg(response.data.message);

        } catch (error) {
            console.log(error);
            onShowError(error.response.data);
        }
    }

    // useEffect(() => {
    //     const socket = io('http://localhost:8080');
    
    //     socket.on('newPost', (newPost) => {
    //         setPost((prevPosts) => [newPost, ...prevPosts]); 
    //     });
    
    //     return () => {
    //         socket.off('newPost');
    //         socket.disconnect();
    //     };
    // }, []);
    return (
        <div className='bg-black h-auto w-1/2 p-4 rounded-md flex flex-col gap-5'>

            <div className="top w-full h-auto flex justify-between">
                <Image
                    src="/assets/icons/icon.svg"
                    width={48}
                    height={48}
                    alt='icon'
                />
                {type === "Post" ? <h1 className='text-white font-inconsolata'>Post...</h1> : <h1 className='text-white font-inconsolata'>Ideate...</h1>}
                <Image
                    src="/assets/img/profile_blue.svg"
                    width={48}
                    height={48}
                    alt='proB'
                />
            </div>
            <div className="post flex flex-grow flex-col gap-5">
                <Input
                    placeholder='Field..'
                    variant='solid'
                    className='w-1/3'
                    id='field'
                    type='text'
                    value={post.field}
                    onChange={(e) => setPost({ ...post, field: e.target.value })}
                />

                <Textarea
                    placeholder='Trust your Thoughts...'
                    variant="solid"
                    className='h-56 w-full'
                    id='inscribe'
                    value={post.content}
                    onChange={(e) => setPost({ ...post, content: e.target.value })}
                />
                <div className="footer w-full h-auto flex justify-between">
                    <input
                        type="file"
                        name="image"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: 'none' }}
                        id="upload-media"
                        onChange={(e) => setPost({ ...post, image: Array.from(e.target.files)})}
                    />
                    {/* Label styled as an icon */}
                    <label htmlFor="upload-media" style={{ cursor: 'pointer', display: 'inline-block', marginTop: '10px' }}>
                        <CloudUpload style={{ fontSize: '48px', color: '#1976d2' }} />
                    </label>

                    <Button color='success' className='w-2/5 text-center' onClick={postContent} disabled={!post.content || post.content.trim().length === 0}>Post</Button>
                </div>
            </div>
        </div>
    )
}

export default WritingTab