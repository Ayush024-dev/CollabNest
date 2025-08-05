"use client";
import React, { useState, useRef } from "react";
import axios from "axios";
import { X, Upload, User } from "lucide-react";

// You may need to install dotenv for client-side use, or pass public_url via NEXT_PUBLIC_PUBLIC_URL
const API_BASE = process.env.NEXT_PUBLIC_API_URL

const UpdateProfile = ({ user, onShowMsg, onShowError, onClose }) => {
  const [form, setForm] = useState({
    name: user?.name || "",
    username: user?.username || "",
    email: user?.email || "",
    highlights: user?.highlights || "",
    designation: user?.designation || "",
    institute: user?.institute || "",
    Bio: user?.Bio || "",
    avatar: user?.avatar || null,
  });
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef();

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle avatar file selection
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setAvatar(file);
    if (file) {
      setAvatarPreview(URL.createObjectURL(file));
    } else {
      setAvatarPreview(null);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        formData.append(key, value);
      });
      if (avatar) {
        formData.append("avatar", avatar);
      }

      const res = await axios.patch(`${API_BASE}/api/v1/users/updateProfile`, formData, {
        withCredentials: true,
      });

      onShowMsg(res.data.message);
      setForm(res.data.user);
      setAvatarPreview(res.data.user.avatar);
    } catch (err) {
      onShowError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Optionally, fetch current user data to prefill the form (not shown here)

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-2xl max-h-[80vh] overflow-y-auto custom-scroll transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-600/20 rounded-lg">
            <User className="w-5 h-5 text-blue-400" />
          </div>
          <h2 className="text-xl font-semibold text-white">Update Profile</h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            disabled={loading}
            className="p-2 hover:bg-gray-700/50 rounded-lg transition-colors duration-200 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* Avatar Section */}
        <div className="flex flex-col items-center gap-4 p-4 rounded-lg border border-gray-700 bg-gray-800 transition-all duration-200 hover:bg-gray-700">
          <div className="relative">
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar Preview"
                className="w-24 h-24 rounded-full object-cover border-4 border-gray-600"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gray-700 border-4 border-gray-600 flex items-center justify-center">
                <User className="w-10 h-10 text-gray-400" />
              </div>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors duration-200 text-white"
            >
              <Upload className="w-4 h-4" />
            </button>
          </div>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleAvatarChange}
            className="hidden"
          />
          <p className="text-sm text-gray-400 text-center">Click the upload button to change your avatar</p>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Name *</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Enter your full name"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Username *</label>
            <input
              name="username"
              value={form.username}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Enter your username"
            />
          </div>

          {/* Email */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Email *</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Enter your email address"
            />
          </div>

          {/* Designation */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Designation</label>
            <input
              name="designation"
              value={form.designation}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Your job title"
            />
          </div>

          {/* Institute */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Institute</label>
            <input
              name="institute"
              value={form.institute}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Your organization"
            />
          </div>

          {/* Highlights */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Highlights</label>
            <input
              name="highlights"
              value={form.highlights}
              onChange={handleChange}
              disabled={loading}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 disabled:opacity-50"
              placeholder="Your key achievements"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2 md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">Bio</label>
            <textarea
              name="Bio"
              value={form.Bio}
              onChange={handleChange}
              disabled={loading}
              rows={4}
              className="w-full p-3 rounded-lg border border-gray-600 bg-gray-800 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none disabled:opacity-50"
              placeholder="Tell us about yourself..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-700">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-6 py-3 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-all duration-200 font-medium disabled:opacity-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Updating...
              </>
            ) : (
              "Update Profile"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};


export default UpdateProfile;