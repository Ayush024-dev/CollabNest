"use client"
import React, { useEffect, useState, useRef } from 'react'
import Textarea from '@mui/joy/Textarea';
import { Input, Button, IconButton, Typography, Sheet } from '@mui/joy';
import Image from 'next/image';
import { AttachFile, EmojiEmotions, Close } from '@mui/icons-material';
import axios from 'axios';
import EmojiPicker from 'emoji-picker-react';

const WritingTab = ({ type, onShowMsg, onShowError }) => {
    const [post, setPost] = useState({
        type: type,
        field: "",
        content: "",
        image: [],
    })
    
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [imagePreviews, setImagePreviews] = useState([]);
    const emojiPickerRef = useRef(null);
    
    // Handle emoji selection
    const handleEmojiSelect = (emojiData) => {
        setPost({ ...post, content: post.content + emojiData.emoji });
        setShowEmojiPicker(false);
    };

    // Handle image selection and preview
    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        
        // Append new files to existing ones
        const updatedImages = [...post.image, ...files];
        setPost({ ...post, image: updatedImages });
        
        // Create previews for new files and append to existing previews
        const newPreviews = files.map(file => {
            if (file.type.startsWith('image/')) {
                return {
                    name: file.name,
                    url: URL.createObjectURL(file),
                    type: 'image'
                };
            } else {
                return {
                    name: file.name,
                    url: null,
                    type: 'file'
                };
            }
        });
        
        setImagePreviews(prev => [...prev, ...newPreviews]);
    };

    // Remove image preview
    const removeImage = (index) => {
        const newImages = post.image.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);
        
        // Revoke URL to prevent memory leaks
        if (imagePreviews[index].url) {
            URL.revokeObjectURL(imagePreviews[index].url);
        }
        
        setPost({ ...post, image: newImages });
        setImagePreviews(newPreviews);
    };

    // Clear all previews
    const clearAllPreviews = () => {
        imagePreviews.forEach(preview => {
            if (preview.url) {
                URL.revokeObjectURL(preview.url);
            }
        });
        setPost({ ...post, image: [] });
        setImagePreviews([]);
    };

    // Close emoji picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target)) {
                setShowEmojiPicker(false);
            }
        };

        if (showEmojiPicker) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [showEmojiPicker]);

    // Cleanup image URLs on unmount
    useEffect(() => {
        return () => {
            imagePreviews.forEach(preview => {
                if (preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
        };
    }, []);

    const postContent = async () => {
        try {
            const formdata = new FormData();
            formdata.append("type", post.type)
            formdata.append("field", post.field)
            formdata.append("content", post.content)
            post.image.forEach((file) => {
                formdata.append("image", file);
            });
            const response = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/posting_content`, formdata, { withCredentials: true }, {
                headers: {
                    "Content-Type": "multipart/form-data",
                }
            })

            console.log("post made");

            onShowMsg(response.data.message);
            
            // Clear the post content after successful submission
            setPost({
                type: post.type,
                field: "",
                content: "",
                image: [],
            });
            
            // Clear previews
            imagePreviews.forEach(preview => {
                if (preview.url) {
                    URL.revokeObjectURL(preview.url);
                }
            });
            setImagePreviews([]);

        } catch (error) {
            console.log(error);
            onShowError(error.response.data);
        }
    }

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

                {/* Emoji Picker */}
                <div className="emoji-section flex justify-start">
                    <div className="relative">
                        <IconButton
                            size="sm"
                            variant="soft"
                            color="neutral"
                            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                            title="Add Emoji"
                        >
                            <EmojiEmotions />
                        </IconButton>
                        
                        {/* Emoji Picker Dropdown */}
                        {showEmojiPicker && (
                            <div
                                ref={emojiPickerRef}
                                className="absolute top-full left-0 z-50 rounded-lg shadow-lg"
                                style={{ marginTop: '5px' }}
                            >
                                <EmojiPicker
                                    onEmojiClick={handleEmojiSelect}
                                    width={350}
                                    height={400}
                                    theme="auto"
                                    searchDisabled={false}
                                    skinTonesDisabled={false}
                                    previewConfig={{
                                        showPreview: true
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <Textarea
                    placeholder='Trust your Thoughts...'
                    variant="solid"
                    className='h-56 w-full'
                    id='inscribe'
                    value={post.content}
                    onChange={(e) => setPost({ ...post, content: e.target.value })}
                />
                
                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                    <Sheet className="image-previews bg-gray-800 p-4 rounded-md">
                        <div className="flex justify-between items-center mb-3">
                            <Typography level="body-sm" className="text-white">
                                Attached Files ({imagePreviews.length})
                            </Typography>
                            <Button
                                size="sm"
                                variant="soft"
                                color="danger"
                                onClick={clearAllPreviews}
                            >
                                Clear All
                            </Button>
                        </div>
                        <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto">
                            {imagePreviews.map((preview, index) => (
                                <div key={index} className="relative group">
                                    {preview.type === 'image' ? (
                                        <div className="relative overflow-hidden rounded-md">
                                            <img
                                                src={preview.url}
                                                alt={preview.name}
                                                className="w-12 h-12 object-cover transition-transform group-hover:scale-110"
                                            />
                                            <IconButton
                                                size="sm"
                                                color="danger"
                                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4"
                                                onClick={() => removeImage(index)}
                                            >
                                                <Close style={{ fontSize: '12px' }} />
                                            </IconButton>
                                            <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 truncate opacity-0 group-hover:opacity-100 transition-opacity">
                                                {preview.name}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="bg-gray-700 p-1 rounded-md w-12 h-12 flex flex-col items-center justify-center relative group-hover:bg-gray-600 transition-colors">
                                            <AttachFile className="text-blue-400 mb-1" fontSize="small" />
                                            <Typography level="body-xs" className="text-white text-center truncate w-full" style={{ fontSize: '8px' }}>
                                                {preview.name}
                                            </Typography>
                                            <IconButton
                                                size="sm"
                                                color="danger"
                                                className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity w-4 h-4"
                                                onClick={() => removeImage(index)}
                                            >
                                                <Close style={{ fontSize: '12px' }} />
                                            </IconButton>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </Sheet>
                )}
                
                <div className="footer w-full h-auto flex justify-between">
                    <input
                        type="file"
                        name="image"
                        accept="image/*,video/*"
                        multiple
                        style={{ display: 'none' }}
                        id="upload-media"
                        onChange={handleImageChange}
                    />
                    {/* Label styled as an icon */}
                    <label htmlFor="upload-media" style={{ cursor: 'pointer', display: 'inline-block', marginTop: '10px' }}>
                        <AttachFile style={{ fontSize: '48px', color: '#1976d2' }} />
                    </label>

                    <Button color='success' className='w-2/5 text-center' onClick={postContent} disabled={!post.content || post.content.trim().length === 0}>Post</Button>
                </div>
            </div>
        </div>
    )
}

export default WritingTab