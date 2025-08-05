"use client"
import { useState, useEffect } from "react"
import axios from 'axios';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import socket from '@/app/lib/socket'

import { LikePosts } from '../likePosts/page';
import ImageModal from '../ImageModel/page';

import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CommentIcon from '@mui/icons-material/Comment';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import Link from "next/link";

const Posts = ({ users, OpenCommentSection, Feed, likedMap, fromProfile, onShowError }) => {
    const [feeds, getFeed] = useState([]);
    const [liked, setLiked] = useState(new Map());
    const [currentImageIndex, setCurrentImageIndex] = useState({});

    const previousImage = (postId, totalImages) => {
        setCurrentImageIndex(prev => ({
            ...prev,
            [postId]: prev[postId] > 0 ? prev[postId] - 1 : totalImages - 1
        }))
    }

    const nextImage = (postId, totalImages) => {
        setCurrentImageIndex(prev => ({
            ...prev,
            [postId]: prev[postId] < totalImages - 1 ? prev[postId] + 1 : 0
        }))
    }

    const [imageModal, setImageModal] = useState({
        isOpen: false,
        images: [],
        initialIndex: 0
    });

    const closeImageModal = () => {
        setImageModal({
            isOpen: false,
            images: [],
            initialIndex: 0
        });
    }

    const getFeeds = async () => {
        try {

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/posts/view_content`, {
                withCredentials: true,
            });
            const data = response?.data?.data;
            getFeed(data.encryptedPost);
            //   console.log(data)
            // console.log("type of likes: ", typeof(data.initialLikes))
            setLiked(new Map(Object.entries(data.initialLikes)));

            // console.log(liked);

        } catch (error) {
            console.log(error);
            onShowError(error.message || "Could not show feeds")
        }


    }

    useEffect(() => {
        const initialize = async () => {

            if (Feed) {
                getFeed(Feed);
                setLiked(likedMap);
            }
            else await getFeeds();


            socket.on('newPost', (newPost) => {
                getFeed((prevPosts) => {
                    // Only add if not already present
                    if (prevPosts.some(post => post._id === newPost._id)) {
                        return prevPosts;
                    }
                    return [newPost, ...prevPosts];
                });
            });

            // Cleanup on component unmount
            return () => {
                socket.off('newPost');
            };
        };

        initialize();
    }, [Feed, likedMap]);




    const likePosts = async ({ postId }) => {
        await LikePosts({ postId, setLiked, onShowError });
    };
    return (
        <div className="h-[calc(100vh-160px)] overflow-y-auto custom-scrollbar pr-4">
            {console.log(feeds)}
            <div className="flex flex-col gap-5 font-inconsolata">
                {feeds.map((feed) => (
                    <div key={feed._id} className="rounded-md bg-lightBlue p-4 shadow-2xl">
                        <div className="flex justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Image
                                    src={
                                        fromProfile
                                            ? users?.avatar?.length > 0
                                                ? users.avatar
                                                : "/assets/img/profile.svg"
                                            : users?.data?.[feed.postId]?.avatar?.length > 0
                                                ? users.data[feed.postId].avatar
                                                : "/assets/img/profile.svg"
                                    }
                                    height={48}
                                    width={48}
                                    alt="profile"
                                    className="rounded-full"
                                />

                                <div className="flex flex-col">
                                    <p className="text-black text-xl font-bold">
                                        {fromProfile ? (
                                            users?.name || "Unknown User"
                                        ) : (
                                            users?.data?.[feed.postId?.toString()]?._id ? (
                                                <Link href={`/components/UserProfile?user=${users.data[feed.postId]._id}`}>
                                                    {users.data[feed.postId]?.name || "Unknown User"}
                                                </Link>
                                            ) : (
                                                "Unknown User"
                                            )
                                        )}
                                    </p>


                                    <p className="text-black">
                                        {fromProfile
                                            ? users?.institute || ""
                                            : users?.data?.[feed.postId?.toString()]?.institute || ""}
                                    </p>
                                </div>

                            </div>
                            <div className="text-black flex flex-col items-end">
                                <p className='text-center'>{feed.type}</p>
                                <p>{feed.field}</p>
                            </div>
                        </div>

                        <div className="text-black mb-4">{feed.content}</div>

                        {/* Always Visible Images Section - Only show if feed.image array is not empty */}
                        {feed.image && Array.isArray(feed.image) && feed.image.length > 0 && (
                            <div className="mb-4">
                                <div className="relative">
                                    {/* Current Image Display */}
                                    <div className="relative group">
                                        <div className="w-full max-w-full max-h-96 overflow-hidden rounded-lg shadow-md">
                                            <img
                                                src={feed.image[currentImageIndex[feed._id] || 0]}
                                                alt={`Post image ${(currentImageIndex[feed._id] || 0) + 1}`}
                                                className="w-full h-full object-contain bg-gray-100 cursor-pointer hover:opacity-90 transition-opacity duration-200"
                                                loading="lazy"
                                                onClick={() => {
                                                    window.open(feed.image[currentImageIndex[feed._id] || 0], '_blank')
                                                }}
                                                onLoad={(e) => {
                                                    // Initialize image index if not set
                                                    if (!(feed._id in currentImageIndex)) {
                                                        setCurrentImageIndex(prev => ({
                                                            ...prev,
                                                            [feed._id]: 0
                                                        }));
                                                    }
                                                }}
                                            />
                                        </div>

                                        {/* Image Counter */}
                                        {feed.image.length > 1 && (
                                            <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full">
                                                {(currentImageIndex[feed._id] || 0) + 1} / {feed.image.length}
                                            </div>
                                        )}

                                        {/* Navigation Arrows - Always visible if multiple images */}
                                        {feed.image.length > 1 && (
                                            <>
                                                {/* Previous Button */}
                                                <Button
                                                    onClick={() => previousImage(feed._id, feed.image.length)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 transition-all duration-200 z-10"
                                                >
                                                    <ChevronLeft className="w-4 h-4" />
                                                </Button>

                                                {/* Next Button */}
                                                <Button
                                                    onClick={() => nextImage(feed._id, feed.image.length)}
                                                    variant="ghost"
                                                    size="sm"
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-70 hover:bg-opacity-90 text-white rounded-full p-2 transition-all duration-200 z-10"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Button>
                                            </>
                                        )}
                                    </div>

                                    {/* Image Dots Indicator - Only show if multiple images */}
                                    {feed.image.length > 1 && (
                                        <div className="flex justify-center mt-3 space-x-2">
                                            {feed.image.map((_, index) => (
                                                <button
                                                    key={index}
                                                    onClick={() => setCurrentImageIndex(prev => ({
                                                        ...prev,
                                                        [feed._id]: index
                                                    }))}
                                                    className={`w-2 h-2 rounded-full transition-colors duration-200 ${index === (currentImageIndex[feed._id] || 0)
                                                        ? 'bg-blue-500'
                                                        : 'bg-gray-300 hover:bg-gray-400'
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="post_footer w-full mt-3">
                            <Button
                                onClick={() => likePosts({ postId: feed._id })}
                                variant="ghost"
                                className="text-black hover:bg-gray-200"
                            >
                                {liked.has(feed._id) ? <ThumbUpIcon /> : <ThumbUpOutlinedIcon />}
                            </Button>

                            <Button
                                onClick={() => OpenCommentSection(feed._id)}
                                variant="ghost"
                                className="text-black hover:bg-gray-200"
                            >
                                <CommentIcon />
                            </Button>
                        </div>
                    </div>
                ))}

                {/* Image Modal */}
                <ImageModal
                    images={imageModal.images}
                    isOpen={imageModal.isOpen}
                    onClose={closeImageModal}
                    initialIndex={imageModal.initialIndex}
                />
            </div>
        </div>
    )
}

export default Posts
