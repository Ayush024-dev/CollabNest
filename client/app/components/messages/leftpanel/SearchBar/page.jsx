"use client"
import React, { useState, useMemo } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

const SearchBar = ({ users, onShowError, reqUserId }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);

  const router= useRouter();

  // Build a name -> [{ user_id, avatar }] map for duplicate names
  const nameMap = useMemo(() => {
    const map = {};
    Object.entries(users.data || {}).forEach(([user_id, user]) => {
      if (!user || user_id === reqUserId) return; // skip self
      if (!map[user.name]) map[user.name] = [];
      map[user.name].push({ user_id, avatar: user.avatar });
    });
    return map;
  }, [users, reqUserId]);

  // Filter suggestions as user types
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }
    // Find all users whose name includes the search term (case-insensitive)
    const matches = Object.keys(nameMap)
      .filter((name) => name.toLowerCase().includes(value.toLowerCase()))
      .flatMap((name) => nameMap[name].map(({ user_id, avatar }) => ({ name, user_id, avatar })));
    setSuggestions(matches);
  };

  // Handle click on suggestion
  const handleSuggestionClick = async (suggestion) => {
    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:8080/api/v1/users/getUserConnectionStatus",
        { encryptedUserId: suggestion.user_id },
        { withCredentials: true }
      );
      if (response.data?.Connection_status === "Connection") {
        // Set URL to open chat
        router.push(`/components/messages?user=${reqUserId}&target=${suggestion.user_id}`);
      } else {
        onShowError("User is not a connection");
      }
    } catch (error) {
      onShowError(error?.response?.data?.message || "Error checking connection status");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full mb-4">
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search contacts..."
        className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all duration-200 text-sm sm:text-base placeholder-slate-400 bg-white shadow-sm hover:shadow-md"
        disabled={loading}
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border border-slate-200 rounded-xl shadow-lg z-10 mt-2 max-h-60 overflow-y-auto custom-scrollbar">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.user_id}
              className="flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-3 cursor-pointer hover:bg-slate-50 transition-colors duration-200 first:rounded-t-xl last:rounded-b-xl border-b border-slate-100 last:border-b-0"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <img
                src={suggestion.avatar || "/assets/img/profile-user.png"}
                alt={suggestion.name}
                className="w-8 h-8 sm:w-10 sm:h-10 rounded-full object-cover ring-2 ring-slate-200"
              />
              <span className="text-sm sm:text-base text-slate-700 font-medium">{suggestion.name}</span>
              {loading && (
                <div className="ml-auto">
                  <svg className="animate-spin h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
                  </svg>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;