import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import crglogo from '../assets/crglogo.png';
import { auth, db } from '../Firebase'; 
import { onAuthStateChanged } from 'firebase/auth';
import { ref, get } from 'firebase/database'; 

const ProfilePage = () => {
  const [userData, setUserData] = useState({
    name: "",
    email: "",
    userType: "",
    joinDate: "",
    lastActive: ""
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  useEffect(() => {
    const fetchCurrentUser = async (user) => {
      try {
        if (!user) {
          setError("No user is currently logged in");
          setIsLoading(false);
          return;
        }
        const basicUserData = {
          email: user.email,
          joinDate: user.metadata.creationTime || "Unknown",
          lastActive: user.metadata.lastSignInTime || "Unknown"
        };
        try {
          const userRef = ref(db, 'users/' + user.uid);
          const snapshot = await get(userRef);
          
          if (snapshot.exists()) {
            const dbData = snapshot.val();
            setUserData({
              ...basicUserData,
              name: dbData.fullName || user.displayName || "No name provided",
              userType: dbData.position || "User",
            });
          } else {
            setUserData({
              ...basicUserData,
              name: user.displayName || "Default",
              userType: "User"
            });
          }
        } catch (dbError) {
          console.error("Database error:", dbError);
          setUserData({
            ...basicUserData,
            name: user.displayName || "Default",
            userType: "User"
          });
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load profile data. Please try again later.");
        setIsLoading(false);
      }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchCurrentUser(user);
      } else {
        setError("Please sign in to view your profile");
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg shadow-lg p-6 mb-8 text-white">
          <h1 className="text-3xl font-bold mb-2">Your Profile</h1>
          <p className="opacity-90">View your personal information and account details</p>
        </div>
        {isLoading ? (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100 flex justify-center">
            <div className="text-gray-500">Loading user profile...</div>
          </div>
        ) : error ? (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="text-red-500 text-center">{error}</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="flex flex-col items-center">
                <div className="w-36 h-36 rounded-full overflow-hidden mb-4 border-4 border-indigo-100 shadow-md">
                  <img 
                    src={crglogo} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full">
                  Online
                </span>
              </div>
              <div className="flex-1 w-full">
                <div className="grid grid-cols-1 gap-6">
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800 font-medium">
                      {userData.name}
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
                      {userData.email}
                    </div>
                  </div>
                  <div className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Type
                    </label>
                    <div className="bg-gray-50 px-4 py-3 rounded-lg">
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-medium mr-2 px-2.5 py-0.5 rounded-full">
                        {userData.userType}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;