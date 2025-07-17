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
    <div className="relative w-full">
      <input
        type="text"
        value={searchTerm}
        onChange={handleInputChange}
        placeholder="Search contacts..."
        className="w-full px-3 py-2 border rounded focus:outline-none"
        disabled={loading}
      />
      {suggestions.length > 0 && (
        <ul className="absolute left-0 right-0 bg-white border rounded shadow z-10 mt-1 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.user_id}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-100"
              onClick={() => handleSuggestionClick(suggestion)}
            >
              <img
                src={suggestion.avatar || "/assets/img/profile-user.png"}
                alt={suggestion.name}
                className="w-8 h-8 rounded-full object-cover"
              />
              <span>{suggestion.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;