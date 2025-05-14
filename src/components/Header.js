import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut, onAuthStateChanged } from "firebase/auth";
import crglogo from "../assets/crglogo.png";

const Header = () => {
  const navigate = useNavigate();
  const auth = getAuth();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [userName, setUserName] = useState("Admin User");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Effect to get the current user when component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User is signed in
        // If user has display name, use it, otherwise use email or default
        setUserName(user.displayName || user.email || "Admin User");
      } else {
        // No user is signed in
        setUserName("Admin User");
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const navigateToProfile = () => {
    setDropdownOpen(false);
    navigate("/Profile");
  };  

  const initiateLogout = () => {
    setDropdownOpen(false);
    setShowConfirmation(true);
  };

  const cancelLogout = () => {
    setShowConfirmation(false);
  };

  const confirmLogout = async () => {
    try {
      await signOut(auth); // Firebase logout
      setShowConfirmation(false);
      navigate("/login"); // Redirect to login page
    } catch (error) {
      console.error("Error signing out:", error);
      setShowConfirmation(false);
    }
  };

  return (
    <header className="bg-navy-900 text-white p-4 fixed w-full z-10 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center group">
          <img 
            src={crglogo} 
            alt="5th Civil Relations Group" 
            className="h-10 transition-transform duration-300 transform group-hover:scale-105" 
          />
          <h1 className="text-xl font-bold ml-4 transition-all duration-300 group-hover:text-indigo-300">
            5th Civil Relations Group
          </h1>
        </div>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center px-3 py-1 bg-navy-800 rounded-md shadow-sm transition-all duration-300 hover:bg-navy-700 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <span className="truncate max-w-xs mr-2">{userName}</span>
            <svg 
              className={`w-4 h-4 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          {/* Dropdown Menu */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-20">
              <button
                onClick={navigateToProfile}
                className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-indigo-100 transition-colors duration-200"
              >
                Profile
              </button>
              <button
                onClick={initiateLogout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white text-navy-900 p-6 rounded-lg shadow-xl max-w-md transform transition-all duration-300 scale-100 opacity-100">
            <h2 className="text-xl font-bold mb-4 text-indigo-800">Confirm Logout</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to log out?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={cancelLogout}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded-md transition-all duration-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={confirmLogout}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-md transition-all duration-300 transform hover:scale-105 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-400"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;